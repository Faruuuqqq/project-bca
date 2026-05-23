'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, QrCode, ShieldCheck, ArrowRight, ChevronLeft, Wifi, RefreshCw, AlertCircle } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { checkPaymentStatus } from '@/actions/payment'

interface QRISScreenProps {
  orderId: string
  qrContent: string
  onCancel: () => void
}

export function QRISScreen({ orderId, qrContent, onCancel }: QRISScreenProps) {
  const router = useRouter()
  const supabase = createClient()
  const clearCart = useCartStore(state => state.clearCart)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [nextCheckTime, setNextCheckTime] = useState(0) // FIX #2: Track cooldown

  const handleSuccess = useCallback(() => {
    clearCart()
    router.push(`/success?id=${orderId}`)
  }, [clearCart, router, orderId])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 800)
    let isRedirecting = false
    
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }))
    }
    updateTime()
    const timeTimer = setInterval(updateTime, 1000)

    // Polling dengan FIX #2: Rate limiting awareness
    const pollingTimer = setInterval(async () => {
       if (isRedirecting) return
       try {
         const result = await checkPaymentStatus(orderId)
         
         // FIX #2: Handle rate limiting response
         if (result.status === 'rate_limited') {
           console.log('⏱️ Rate limited, backing off polling')
           return
         }
         
         if (result.status === 'paid' && !isRedirecting) {
            isRedirecting = true
            clearInterval(pollingTimer)
            handleSuccess()
          }
       } catch (e) {
         console.error('Polling error:', e)
       }
    }, 3000)

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          if (payload.new.payment_status === 'paid' && !isRedirecting) {
            isRedirecting = true
            clearInterval(pollingTimer)
            handleSuccess()
          }
        }
      )
      .subscribe()

    return () => {
      clearTimeout(timer)
      clearInterval(timeTimer)
      clearInterval(pollingTimer)
      supabase.removeChannel(channel)
    }
  }, [orderId, supabase, handleSuccess])

  // FIX #2 & #4: Add cooldown to manual check button + better error handling
  const checkStatusManual = async () => {
    const now = Date.now()
    
    // Enforce 2-second cooldown on client side
    if (now < nextCheckTime) {
      const waitMs = Math.ceil((nextCheckTime - now) / 1000)
      toast.warning(`Tunggu ${waitMs} detik sebelum cek lagi`)
      return
    }
    
    setIsChecking(true)
    try {
      const result = await checkPaymentStatus(orderId)
      
      // FIX #2: Handle rate limiting on manual check
      if (result.status === 'rate_limited') {
        toast.warning(`Terlalu sering. Coba lagi dalam ${result.retryAfterMs ? Math.ceil(result.retryAfterMs / 1000) : 2}s`)
        setNextCheckTime(now + (result.retryAfterMs || 2000))
        return
      }
      
      // FIX #4: Better error messaging for different scenarios
      if (result.status === 'paid') {
        toast.success("Pembayaran Berhasil Terdeteksi!")
        handleSuccess()
      } else if (result.message) {
        // This is a retry failure with helpful message
        toast.info(result.message)
      } else {
        // Payment still pending
        toast.info("Belum ada pembayaran lunas. Silakan scan & bayar terlebih dahulu.")
      }
    } catch (e) {
      toast.error("Gagal mengecek status ke bank. Coba lagi nanti.")
    } finally {
      setIsChecking(false)
      // Set next allowed check time (2 seconds from now)
      setNextCheckTime(now + 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-in fade-in duration-300">
      {/* COMPACT UNIFIED HEADER */}
      <header className="sticky top-0 z-30 bg-brand-primary px-4 md:px-8 py-3 shrink-0 shadow-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-8">
            <Button variant="ghost" size="icon" onClick={onCancel} className="h-9 w-9 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90 border border-white/10">
              <ChevronLeft size={20} />
            </Button>
            <div className="flex items-center gap-4">
              <img src="/logo-kalintang.png" alt="Logo" className="h-12 md:h-16 w-auto object-contain drop-shadow-md" />
              <div className="flex items-center gap-1.5 text-blue-100/60 font-bold uppercase tracking-widest text-[8px]">
                <Wifi size={10} className="text-brand-secondary animate-pulse" />
                <span>Kiosk Terminal #01</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-lg md:text-xl font-black text-brand-secondary tracking-tighter tabular-nums leading-none">
              {currentTime || '--:--'}
            </p>
            <p className="text-[8px] font-black text-blue-100/40 uppercase tracking-widest pt-0.5">WIB</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden bg-[#f0f7ff]/50">
        {!isLoaded ? (
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="h-16 w-16 animate-spin text-brand-primary" />
            <p className="text-lg font-black text-[#3d2b1f] uppercase tracking-tight">Menyiapkan QRIS Aman...</p>
          </div>
        ) : (
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center px-4">
            
            {/* Left Side: Persuasive Branding */}
            <div className="hidden lg:flex flex-col text-left space-y-8 animate-in fade-in slide-in-from-left duration-700">
              <div className="space-y-4">
                <h3 className="text-5xl font-black text-[#3d2b1f] leading-tight tracking-tighter uppercase">
                  Scan lebih cepat <br/> 
                  <span className="text-brand-primary">& praktis</span>
                </h3>
                <p className="text-xl text-zinc-500 font-medium leading-relaxed max-w-md">
                  Gunakan aplikasi <span className="font-black text-brand-primary underline decoration-4 underline-offset-4 decoration-brand-secondary/40">myBCA</span> atau <span className="font-black text-brand-primary">BCA mobile</span> untuk konfirmasi pembayaran instan.
                </p>
              </div>

              <div className="flex items-center gap-8 bg-white/80 backdrop-blur-sm p-8 rounded-[3rem] border-2 border-white shadow-xl shadow-blue-100/50">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-24 w-24 bg-white rounded-[1.8rem] shadow-md flex items-center justify-center overflow-hidden border border-zinc-50">
                    <img src="https://play-lh.googleusercontent.com/ckrnc0pzN0oZgSaMQMnOYrICdBLwFTuI17MlTUp9ftyZPJ-m4K1pA3_Dz1B-1dCFVZbv" alt="myBCA" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">myBCA</span>
                </div>
                <ArrowRight className="text-zinc-200" size={32} />
                <div className="flex flex-col items-center gap-3">
                  <div className="h-24 w-24 bg-white rounded-[1.8rem] shadow-md flex items-center justify-center overflow-hidden border border-zinc-50">
                    <img src="https://play-lh.googleusercontent.com/ggZzVVDWsTm7gSnVl8m3cNFgoeUN2r7dhAZdB8lz0d_s6ZcYOkvUQdbG3dPU5LHZnWvc" alt="BCA Mobile" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">BCA Mobile</span>
                </div>
              </div>
            </div>

            {/* Right Side: QR Container */}
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-right duration-700 h-full justify-center">
              <p className="lg:hidden text-sm font-black text-zinc-400 uppercase tracking-widest mb-6 text-center">
                Scan via <span className="text-brand-primary">myBCA / BCA Mobile</span>
              </p>

              <div className="relative p-6 md:p-10 bg-white rounded-[3.5rem] shadow-[0_40px_100px_rgba(6,103,172,0.15)] border-8 border-white">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-brand-primary text-white px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                  Pindai QRIS
                </div>
                
                <div className="bg-white p-3 rounded-[2rem] border-4 border-zinc-50 shadow-inner overflow-hidden flex items-center justify-center min-h-[300px] min-w-[300px]">
                  {qrContent ? (
                    qrContent.startsWith('http') ? (
                      <img src={qrContent} alt="QRIS" className="w-full h-full object-contain" />
                    ) : (
                      <QRCodeSVG 
                        value={qrContent} 
                        size={280}
                        level="H"
                        includeMargin={false}
                        className="max-w-full h-auto"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-zinc-300">
                      <AlertCircle size={48} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-center px-8">Gagal memuat QRIS. Silakan coba lagi.</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex flex-col items-center gap-2 opacity-40">
                  <div className="h-1 w-12 bg-zinc-100 rounded-full" />
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em]">Merchant ID: BC001293</p>
                </div>
              </div>

              <div className="mt-10 w-full max-w-sm flex flex-col gap-4">
                <Button 
                  variant="outline"
                  className="w-full h-14 border-2 border-brand-primary/20 text-brand-primary font-black uppercase tracking-widest text-[11px] rounded-2xl bg-white shadow-lg shadow-blue-50 hover:bg-brand-primary hover:text-white transition-all group"
                  onClick={checkStatusManual}
                  disabled={isChecking}
                >
                  {isChecking ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />}
                  Cek Status Pembayaran
                </Button>

                <Button 
                  variant="ghost" 
                  className="w-full h-10 text-zinc-300 font-bold uppercase tracking-[0.2em] text-[10px] hover:text-red-500 hover:bg-transparent transition-all"
                  onClick={onCancel}
                >
                  Ganti Metode Pembayaran
                </Button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Trust Footer */}
      <footer className="p-5 bg-zinc-50 border-t flex items-center justify-center gap-6 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-green-600" />
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Aman & Terenkripsi BCA</span>
        </div>
        <div className="h-4 w-px bg-zinc-200" />
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Verified by BI-SNAP • Anti Double Payment Protection</p>
      </footer>
    </div>
  )
}
