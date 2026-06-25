'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, QrCode, ShieldCheck, ArrowRight, ChevronLeft, Wifi, RefreshCw, AlertCircle, KeyRound, Delete } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { QRCodeSVG } from 'qrcode.react'
import { sendToRawBT } from '@/lib/rawbt-client'
import { toast } from 'sonner'
import { playNotificationSound } from '@/lib/audio'
import { checkPaymentStatus, confirmCashPayment, reprintReceipt } from '@/actions/payment'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

function PinPad({
  onKeyPress,
  onDelete,
  onClear,
  disabled
}: {
  onKeyPress: (key: string) => void
  onDelete: () => void
  onClear: () => void
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6 w-full max-w-xs mx-auto">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <Button
          key={num}
          variant="outline"
          disabled={disabled}
          className="h-14 text-lg font-black rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
          onClick={() => onKeyPress(num.toString())}
        >
          {num}
        </Button>
      ))}
      <Button variant="outline" disabled={disabled} className="h-14 font-bold text-red-400 rounded-xl bg-red-500/10 border-red-500/20 hover:bg-red-500/20" onClick={onClear}>C</Button>
      <Button variant="outline" disabled={disabled} className="h-14 text-lg font-black rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={() => onKeyPress('0')}>0</Button>
      <Button variant="outline" disabled={disabled} className="h-14 flex justify-center items-center rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={onDelete}><Delete size={20} /></Button>
    </div>
  )
}

interface QRISScreenProps {
  orderId: string
  qrContent: string
  totalPrice?: number
  onCancel: () => void
}

export function QRISScreen({ orderId, qrContent, totalPrice, onCancel }: QRISScreenProps) {
  const router = useRouter()
  const supabase = createClient()
  const clearCart = useCartStore(state => state.clearCart)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [nextCheckTime, setNextCheckTime] = useState(0)
  

  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [isConfirmingPin, setIsConfirmingPin] = useState(false)
  const isRedirectingRef = useRef(false)

  const handleSuccess = useCallback(async (shouldPrint = true) => {
    if (isRedirectingRef.current) return
    isRedirectingRef.current = true
    
    clearCart()
    if (shouldPrint) {
      try {
        const printRes = await reprintReceipt(orderId);
        if (printRes?.rawbtUrl) {
          sendToRawBT(printRes.rawbtUrl);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      } catch (e) { console.error('Auto print failed', e) }
    }
    router.push(`/success?id=${orderId}`)
  }, [clearCart, router, orderId])

  useEffect(() => {
    playNotificationSound()

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

    // Polling dengan Rate limiting awareness
    const pollingTimer = setInterval(async () => {
       if (isRedirecting) return
       try {
         const result = await checkPaymentStatus(orderId)
         
         if (result.status === 'rate_limited') {
           console.log('⏱️ Rate limited, backing off polling')
           return
         }
         
         if (result.status === 'paid' && !isRedirecting) {
            isRedirecting = true
            clearInterval(pollingTimer)
            handleSuccess(true)
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
            handleSuccess(true)
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

  const checkStatusManual = async () => {
    const now = Date.now()
    
    if (now < nextCheckTime) {
      const waitMs = Math.ceil((nextCheckTime - now) / 1000)
      toast.warning(`Tunggu ${waitMs} detik sebelum cek lagi`)
      return
    }
    
    setIsChecking(true)
    try {
      const result = await checkPaymentStatus(orderId)
      
      if (result.status === 'rate_limited') {
        toast.warning(`Terlalu sering. Coba lagi dalam ${result.retryAfterMs ? Math.ceil(result.retryAfterMs / 1000) : 2}s`)
        setNextCheckTime(now + (result.retryAfterMs || 2000))
        return
      }
      
      if (result.status === 'paid') {
        toast.success("Pembayaran Berhasil Terdeteksi!")
        handleSuccess(true)
      } else if (result.message) {
        toast.info(result.message)
      } else {
        toast.info("Belum ada pembayaran lunas. Silakan scan & bayar terlebih dahulu.")
      }
    } catch (e) {
      toast.error("Gagal mengecek status ke bank. Coba lagi nanti.")
    } finally {
      setIsChecking(false)
      setNextCheckTime(now + 2000)
    }
  }

  const handleCashierConfirm = async () => {
    if (pin.length < 4) {
      toast.error('PIN minimal 4 digit')
      return
    }
    setIsConfirmingPin(true)
    try {
      const result = await confirmCashPayment(orderId, pin)
      if (result.error) {
        toast.error('PIN Salah!')
        setPin('')
      } else {
        toast.success('Pembayaran Dikonfirmasi Kasir!')
        setIsPinModalOpen(false)
        handleSuccess()
      }
    } catch (e) {
      toast.error('Gagal mengonfirmasi pembayaran')
    } finally {
      setIsConfirmingPin(false)
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
              <Image src="/logo-kalintang.png" alt="Logo" width={160} height={64} priority className="h-12 md:h-16 w-auto object-contain drop-shadow-md" />
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
                    <Image src="/mybca.webp" alt="myBCA" width={96} height={96} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">myBCA</span>
                </div>
                <ArrowRight className="text-zinc-200" size={32} />
                <div className="flex flex-col items-center gap-3">
                  <div className="h-24 w-24 bg-white rounded-[1.8rem] shadow-md flex items-center justify-center overflow-hidden border border-zinc-50">
                    <Image src="/bcamobile.webp" alt="BCA Mobile" width={96} height={96} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">BCA Mobile</span>
                </div>
              </div>
            </div>

            {/* Right Side: QR Container */}
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-right duration-700 h-full justify-center">
              <p className="lg:hidden text-sm font-black text-zinc-400 uppercase tracking-widest mb-4 text-center">
                Scan via <span className="text-brand-primary">myBCA / BCA Mobile</span>
              </p>

              <div className="relative p-6 bg-white rounded-3xl shadow-[0_20px_60px_rgba(6,103,172,0.15)] flex flex-col items-center">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-primary text-white px-8 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-xl whitespace-nowrap">
                  Pindai QRIS
                </div>
                
                {totalPrice && (
                  <div className="mt-4 mb-2 text-center w-full">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Pembayaran</p>
                    <p className="text-2xl font-black text-[#3d2b1f] tracking-tighter">Rp {new Intl.NumberFormat('id-ID').format(totalPrice)}</p>
                  </div>
                )}

                <div className="bg-white flex items-center justify-center aspect-square overflow-hidden rounded-xl mt-1">
                  {qrContent ? (
                    qrContent.startsWith('http') || qrContent.startsWith('/') ? (
                      <img src={qrContent} alt="QRIS" className="w-[320px] h-[320px] md:w-[400px] md:h-[400px] object-cover scale-[1.15]" />
                    ) : (
                      <QRCodeSVG 
                        value={qrContent} 
                        size={400}
                        level="H"
                        includeMargin={false}
                        className="w-[320px] h-[320px] md:w-[400px] md:h-[400px] max-w-full h-auto"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 text-zinc-300 w-[320px] h-[320px] md:w-[400px] md:h-[400px]">
                      <AlertCircle size={48} />
                      <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-center px-8">Gagal memuat QRIS. Silakan coba lagi.</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 opacity-40">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Merchant ID: BC001293</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Trust Footer & Action Buttons */}
      <footer className="px-6 py-4 bg-zinc-50 border-t flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        
        {/* Left: Cancel Button */}
        <Button 
          variant="ghost" 
          className="w-full md:w-auto h-12 md:h-14 px-6 text-zinc-500 font-bold uppercase tracking-[0.15em] text-[10px] md:text-xs hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
          onClick={onCancel}
        >
          <ChevronLeft className="mr-2 h-4 w-4 md:h-5 md:w-5" />
          Ganti Metode
        </Button>

        {/* Center: Trust Info */}
        <div className="hidden md:flex flex-col items-center gap-1 opacity-70">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-green-600" />
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Aman & Terenkripsi BCA</span>
          </div>
          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest text-center">Verified by BI-SNAP • Anti Double Payment</p>
        </div>

        {/* Right: Check Status Button */}
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            variant="outline"
            className="w-full md:w-auto h-12 md:h-14 px-4 border-brand-primary text-brand-primary font-black uppercase tracking-widest text-[10px] md:text-xs rounded-2xl hover:bg-brand-primary/10 transition-all bg-white"
            onClick={() => setIsPinModalOpen(true)}
          >
            <KeyRound className="mr-2 h-4 w-4 md:h-5 md:w-5" />
            Kasir
          </Button>
          <Button 
            className="w-full md:w-auto h-12 md:h-14 px-8 bg-brand-primary text-white font-black uppercase tracking-widest text-[10px] md:text-xs rounded-2xl shadow-lg shadow-brand-primary/20 hover:bg-blue-700 active:scale-95 transition-all group"
            onClick={checkStatusManual}
            disabled={isChecking}
          >
            {isChecking ? <Loader2 className="animate-spin mr-2 h-4 w-4 md:h-5 md:w-5" /> : <RefreshCw className="mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-180 transition-transform duration-500" />}
            Cek Status
          </Button>
        </div>
      </footer>

      <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] p-8 text-center bg-[#1a1a2e] text-white border-none shadow-2xl outline-none">
          <DialogHeader>
            <div className="mx-auto h-16 w-16 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-secondary mb-4">
              <KeyRound size={32} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white mb-2">Otoritas Kasir</DialogTitle>
            <p className="text-sm text-zinc-400 font-medium">Masukkan PIN rahasia untuk mengonfirmasi pembayaran QRIS statis.</p>
          </DialogHeader>

          <div className="mt-6">
            <Input readOnly type="password" inputMode="numeric" maxLength={4} placeholder="••••" className="h-20 text-center text-5xl tracking-[0.5em] rounded-2xl border-2 border-white/10 bg-black/40 font-black text-white focus:border-brand-primary focus:ring-0 mx-auto w-full max-w-xs placeholder:text-zinc-700" value={pin} onChange={(e) => setPin(e.target.value)} />
            <PinPad disabled={isConfirmingPin} onKeyPress={(key) => { if (pin.length < 4) setPin(p => p + key) }} onDelete={() => setPin(p => p.slice(0, -1))} onClear={() => setPin('')} />
            <Button className="w-full h-16 mt-8 rounded-2xl bg-brand-primary text-white text-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-[0_10px_40px_rgba(6,103,172,0.4)] disabled:bg-white/10 disabled:text-white/30" onClick={handleCashierConfirm} disabled={isConfirmingPin || pin.length < 4}>
              {isConfirmingPin ? <Loader2 className="animate-spin h-6 w-6 text-white" /> : 'Konfirmasi'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
