'use client'

import { useEffect, useState, useCallback, startTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Banknote, Clock, ArrowRight, KeyRound, Loader2, AlertTriangle, Lock } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { confirmCashPayment, verifyRecoveryCode } from '@/actions/payment'
import { toast } from 'sonner'

interface CashWaitScreenProps {
  orderId: string
  queueNumber: string
  customerName?: string
  onCancel: () => void
}

export function CashWaitScreen({ orderId, queueNumber, customerName, onCancel }: CashWaitScreenProps) {
  const router = useRouter()
  const supabase = createClient()
  const clearCart = useCartStore(state => state.clearCart)
  
  const [pin, setPin] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [isVerifyingRecovery, setIsVerifyingVercovery] = useState(false)
  
  // PERSISTENCE: Gunakan localStorage agar sisa percobaan tidak reset saat di-refresh
  const [attempts, setAttempts] = useState(10)
  const [isLocked, setIsLocked] = useState(false)
  const [backupCode, setBackupCode] = useState('')

  const handleSuccess = useCallback(() => {
    clearCart()
    router.push(`/success?id=${orderId}`)
  }, [clearCart, router, orderId])

  useEffect(() => {
    // Load security state from local storage
    const savedAttempts = localStorage.getItem('kiosk_pin_attempts')
    const savedLocked = localStorage.getItem('kiosk_pin_locked')
    
    if (savedAttempts) startTransition(() => setAttempts(parseInt(savedAttempts)))
    if (savedLocked === 'true') startTransition(() => setIsLocked(true))

    // Realtime subscription
    const channel = supabase
      .channel(`order-cash-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          if (payload.new.payment_status === 'paid') {
            localStorage.removeItem('kiosk_pin_attempts')
            localStorage.removeItem('kiosk_pin_locked')
            handleSuccess()
          } else if (payload.new.payment_status === 'void') {
            onCancel()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, supabase, onCancel, handleSuccess])

  const handleBackupUnlock = async () => {
    if (backupCode.length < 4) return
    
    setIsVerifyingVercovery(true)
    try {
      const result = await verifyRecoveryCode(backupCode)
      if (result.success) {
        setAttempts(10)
        setIsLocked(false)
        setBackupCode('')
        setPin('')
        localStorage.setItem('kiosk_pin_attempts', '10')
        localStorage.setItem('kiosk_pin_locked', 'false')
        toast.success('Akses Berhasil Dipulihkan!')
      } else {
        toast.error('Kode Recovery Salah!')
        setBackupCode('')
      }
    } catch (e) {
      toast.error('Terjadi kesalahan teknis')
    } finally {
      setIsVerifyingVercovery(false)
    }
  }

  const handleCashierConfirm = async () => {
    if (isLocked) return
    if (pin.length < 4) {
      toast.error('PIN minimal 4 digit')
      return
    }

    setIsConfirming(true)
    try {
      const result = await confirmCashPayment(orderId, pin)
      if (result.error) {
        const remaining = attempts - 1
        setAttempts(remaining)
        setPin('')
        
        // Save to localStorage
        localStorage.setItem('kiosk_pin_attempts', remaining.toString())
        
        if (remaining <= 0) {
          setIsLocked(true)
          localStorage.setItem('kiosk_pin_locked', 'true')
          toast.error('Akses Terkunci! Masukkan kode recovery.')
        } else {
          toast.error(`PIN Salah! Sisa ${remaining} percobaan.`)
        }
      } else {
        toast.success('Pembayaran Tunai Dikonfirmasi!')
        localStorage.removeItem('kiosk_pin_attempts')
        localStorage.removeItem('kiosk_pin_locked')
        handleSuccess()
      }
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Gagal mengonfirmasi pembayaran')
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-50 lg:flex-row overflow-hidden animate-in fade-in duration-300">
      {/* Left Side: Customer Info */}
      <div className="flex-1 flex flex-col overflow-y-auto border-b lg:border-b-0 lg:border-r border-zinc-100">
        <div className="bg-brand-primary p-6 lg:p-8 text-white text-center shrink-0 shadow-lg">
          <h2 className="text-2xl lg:text-3xl font-bold italic tracking-wider uppercase">Pembayaran Tunai</h2>
          <p className="text-sm lg:text-base opacity-80">Silakan ke kasir untuk membayar</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 text-center min-h-[500px] lg:min-h-0">
          <div className="mb-6 p-6 lg:p-8 bg-white rounded-full shadow-lg border border-zinc-50">
            <Banknote size={64} className="lg:w-24 lg:h-24 text-brand-primary" />
          </div>

          <div className="space-y-1 mb-8 lg:mb-12">
            <p className="text-brand-neutral font-black uppercase tracking-widest text-[10px] lg:text-xs">Nomor Antrean Anda</p>
            <h3 className="text-[120px] lg:text-[160px] font-black text-brand-primary leading-none tracking-tighter">
              {queueNumber}
            </h3>
          </div>

          <div className="w-full max-w-sm lg:max-w-md p-6 lg:p-8 bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-xl space-y-6 lg:space-y-8 border border-zinc-100">
            <div className="flex items-center gap-4 lg:gap-6 text-left">
              <div className="h-12 lg:h-14 w-12 lg:w-14 shrink-0 rounded-2xl lg:rounded-3xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <Clock size={24} className="lg:w-7 lg:h-7" />
              </div>
              <div>
                <p className="font-bold text-sm lg:text-base text-[#3d2b1f]">Menunggu Kasir</p>
                <p className="text-[11px] lg:text-xs text-zinc-500 leading-tight">Berikan nomor antrean di atas kepada petugas kasir.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 lg:gap-6 text-left border-t pt-6">
              <div className="h-12 lg:h-14 w-12 lg:w-14 shrink-0 rounded-2xl lg:rounded-3xl bg-green-100 flex items-center justify-center text-green-600">
                <ArrowRight size={24} className="lg:w-7 lg:h-7" />
              </div>
              <div>
                <p className="font-bold text-sm lg:text-base text-[#3d2b1f]">Otomatis Berlanjut</p>
                <p className="text-[11px] lg:text-xs text-zinc-500 leading-tight">Layar ini akan berubah otomatis setelah pembayaran lunas.</p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="mt-12 lg:mt-16 text-zinc-400 text-xs lg:text-sm font-medium hover:bg-transparent hover:text-red-500 transition-colors"
            onClick={onCancel}
          >
            Batalkan Pesanan
          </Button>
        </div>
      </div>

      {/* Right Side: Cashier PIN Box */}
      <div className="w-full lg:w-[450px] xl:w-[520px] bg-white lg:border-l shadow-2xl p-8 lg:p-10 xl:p-12 flex flex-col justify-center shrink-0 relative overflow-hidden">
        {isLocked && (
          <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="h-20 lg:h-24 w-20 lg:w-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 shadow-lg shadow-red-100 animate-bounce">
              <Lock size={40} className="lg:w-12 lg:h-12" />
            </div>
            <h4 className="text-2xl lg:text-3xl font-black text-[#3d2b1f] uppercase tracking-tight mb-2">Sistem Terkunci</h4>
            <p className="text-xs lg:text-sm text-zinc-400 leading-relaxed mb-8 max-w-[250px]">Keamanan aktif karena 10x kesalahan. Hubungi Supervisor untuk memasukkan kode pemulihan.</p>
            
            <div className="w-full space-y-4 lg:space-y-5">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="Recovery Code"
                className="h-14 lg:h-16 text-center text-2xl lg:text-3xl tracking-[0.5em] rounded-2xl border-2 border-brand-primary focus:ring-0 bg-white"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                disabled={isVerifyingRecovery}
              />
              <Button 
                className="w-full h-14 lg:h-16 rounded-2xl lg:rounded-3xl bg-brand-primary text-white text-lg lg:text-xl font-black hover:bg-blue-900 shadow-lg active:scale-95 transition-all"
                onClick={handleBackupUnlock}
                disabled={isVerifyingRecovery || backupCode.length < 4}
              >
                {isVerifyingRecovery ? <Loader2 className="animate-spin" /> : 'BUKA KUNCI'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-8 lg:space-y-10">
          <div className="text-center space-y-3 lg:space-y-4">
            <div className="mx-auto h-16 lg:h-20 w-16 lg:w-20 rounded-[1.5rem] lg:rounded-[2rem] bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
              <KeyRound size={32} className="lg:w-10 lg:h-10" />
            </div>
            <div className="space-y-1 lg:space-y-2">
              <h4 className="text-xl lg:text-2xl font-black text-[#3d2b1f] uppercase tracking-tight">Otoritas Kasir</h4>
              <p className="text-xs lg:text-sm text-zinc-400 max-w-[200px] mx-auto">Masukkan PIN rahasia untuk konfirmasi pembayaran tunai</p>
            </div>
          </div>

          <div className="space-y-6 lg:space-y-7">
            <div className="space-y-3 lg:space-y-4 text-center">
              <div className="flex items-center justify-between px-1 mb-1 lg:mb-2">
                <Label htmlFor="cashier-pin" className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Pin Keamanan</Label>
                {attempts < 10 && (
                  <span className={`text-[10px] lg:text-xs font-black uppercase ${attempts <= 3 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                    Sisa {attempts}x Percobaan
                  </span>
                )}
              </div>
              <Input
                id="cashier-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                className={`h-20 lg:h-24 text-center text-4xl lg:text-5xl tracking-[0.8em] rounded-[1.5rem] lg:rounded-[2rem] border-2 transition-all bg-zinc-50/50 ${attempts <= 3 ? 'border-red-100 focus:border-red-500' : 'border-zinc-100 focus:border-brand-primary'} focus:ring-0`}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={isConfirming || isLocked}
              />
            </div>

            <Button 
              className="w-full h-20 lg:h-24 rounded-[1.5rem] lg:rounded-[2rem] bg-brand-primary text-white text-xl lg:text-2xl font-black hover:bg-blue-900 transition-all shadow-xl active:scale-[0.98] disabled:bg-zinc-200"
              onClick={handleCashierConfirm}
              disabled={isConfirming || pin.length < 4 || isLocked}
            >
              {isConfirming ? <Loader2 className="animate-spin h-8 w-8 lg:h-10 lg:w-10 text-white" /> : 'KONFIRMASI LUNAS'}
            </Button>
            
            {attempts <= 3 && !isLocked && (
              <div className="flex items-center gap-2 justify-center text-red-500 bg-red-50 py-3 lg:py-4 rounded-xl lg:rounded-2xl border border-red-100 animate-bounce">
                <AlertTriangle size={16} className="lg:w-5 lg:h-5" />
                <span className="text-[10px] lg:text-xs font-black uppercase">Peringatan Keamanan Aktif</span>
              </div>
            )}
          </div>
          
          <div className="pt-4 lg:pt-6">
            <div className="flex items-center gap-2 justify-center text-[10px] lg:text-xs text-zinc-300 font-bold uppercase tracking-widest">
              <div className="h-px w-8 bg-zinc-100"></div>
              Staf Ayam Kalintang
              <div className="h-px w-8 bg-zinc-100"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
