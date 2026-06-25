'use client'

import { useEffect, useState, useCallback, startTransition, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendToRawBT } from '@/lib/rawbt-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Banknote, Clock, ArrowRight, KeyRound, Loader2, AlertTriangle, Lock, ShieldAlert, CheckCircle2, ChevronLeft, Delete } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { confirmCashPayment, verifyRecoveryCode } from '@/actions/payment'
import { toast } from 'sonner'
import { playNotificationSound } from '@/lib/audio'

interface CashWaitScreenProps {
  orderId: string
  queueNumber: string
  customerName?: string
  onCancel: () => void
}

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
          className="h-14 lg:h-16 text-xl lg:text-2xl font-black rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white active:bg-white/20 touch-manipulation"
          onClick={() => onKeyPress(num.toString())}
        >
          {num}
        </Button>
      ))}
      <Button
        variant="outline"
        disabled={disabled}
        className="h-14 lg:h-16 text-sm lg:text-base font-bold rounded-2xl bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-400 active:bg-red-500/30 touch-manipulation"
        onClick={onClear}
      >
        C
      </Button>
      <Button
        variant="outline"
        disabled={disabled}
        className="h-14 lg:h-16 text-xl lg:text-2xl font-black rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white active:bg-white/20 touch-manipulation"
        onClick={() => onKeyPress('0')}
      >
        0
      </Button>
      <Button
        variant="outline"
        disabled={disabled}
        className="h-14 lg:h-16 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white active:bg-white/20 touch-manipulation flex items-center justify-center"
        onClick={onDelete}
      >
        <Delete size={24} />
      </Button>
    </div>
  )
}

export function CashWaitScreen({ orderId, queueNumber, customerName, onCancel }: CashWaitScreenProps) {
  const router = useRouter()
  const supabase = createClient()
  const clearCart = useCartStore(state => state.clearCart)
  
  
  const [pin, setPin] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const isConfirmingRef = useRef(false)
  const [isVerifyingRecovery, setIsVerifyingVercovery] = useState(false)
  
  // PERSISTENCE: Gunakan localStorage agar sisa percobaan tidak reset saat di-refresh
  const [attempts, setAttempts] = useState(10)
  const [isLocked, setIsLocked] = useState(false)
  const [backupCode, setBackupCode] = useState('')
  const pinInputRef = useRef<HTMLInputElement>(null)

  // Play notification sound when screen mounts (order is placed)
  useEffect(() => {
    playNotificationSound()
  }, [])

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
    if (isConfirmingRef.current) return;
    isConfirmingRef.current = true;
    if (isLocked) return
    if (pin.length < 4) {
      toast.error('PIN minimal 4 digit')
      return
    }

    setIsConfirming(true)
    try {
      const result = await confirmCashPayment(orderId, pin)
      if (result.rawbtUrl) {
          sendToRawBT(result.rawbtUrl) // Struk Konsumen
          
          if (result.rawbtKitchenUrl) {
            // Jeda 3 detik untuk cetak struk dapur
            setTimeout(() => {
              sendToRawBT(result.rawbtKitchenUrl)
            }, 3000)
          }
        }
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
          // Auto focus back on error for better iPad experience
          setTimeout(() => pinInputRef.current?.focus(), 100)
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
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-[#EEF6FF] overflow-hidden animate-in fade-in duration-300">
      
      
      {/* ─── LEFT SIDE: CUSTOMER INFO ─── */}
      <div className="flex-1 flex flex-col relative bg-white shadow-2xl z-10 rounded-b-[2rem] md:rounded-r-[3rem] md:rounded-bl-none overflow-hidden border-r border-blue-50">
        
        {/* Header Action */}
        <div className="absolute top-6 left-6 z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-12 w-12 rounded-2xl bg-white shadow-md text-zinc-400 hover:text-brand-primary active:scale-90 transition-all border border-zinc-100 touch-manipulation"
          >
            <ChevronLeft size={24} />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 lg:p-12 text-center touch-scroll overflow-hidden">
          
          <div className="mb-4 lg:mb-6 relative">
            <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-xl animate-pulse" />
            <div className="relative p-5 lg:p-6 bg-white rounded-full shadow-xl shadow-brand-primary/10 border border-blue-50">
              <Banknote className="w-14 h-14 lg:w-16 lg:h-16 text-brand-primary" />
            </div>
          </div>

          <div className="space-y-1 mb-6 lg:mb-8">
            <p className="text-brand-neutral font-black uppercase tracking-[0.25em] text-xs lg:text-sm">Nomor Antrean Anda</p>
            <h3 className="text-7xl lg:text-[120px] font-black text-[#1a1a2e] leading-none tracking-tighter drop-shadow-sm">
              {queueNumber}
            </h3>
            {customerName && (
              <p className="text-xl font-bold text-brand-primary mt-4">{customerName}</p>
            )}
          </div>

          {/* Info Cards */}
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-lg shadow-blue-900/5 p-6 lg:p-8 space-y-6 lg:space-y-8 border border-blue-50">
            <div className="flex items-start gap-5 lg:gap-6 text-left">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mt-1">
                <Clock size={28} />
              </div>
              <div>
                <p className="font-black text-lg lg:text-xl text-[#1a1a2e] mb-1">Menunggu Kasir</p>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">Tunjukkan nomor antrean Anda kepada petugas kasir untuk menyelesaikan pembayaran.</p>
              </div>
            </div>
            
            <div className="h-px bg-zinc-100 w-full" />
            
            <div className="flex items-start gap-5 lg:gap-6 text-left">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 mt-1">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p className="font-black text-lg lg:text-xl text-[#1a1a2e] mb-1">Otomatis Berlanjut</p>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">Layar ini akan berpindah secara otomatis setelah pembayaran dikonfirmasi oleh sistem.</p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="mt-6 lg:mt-8 h-12 lg:h-14 px-8 rounded-2xl text-zinc-400 font-bold uppercase tracking-widest text-xs hover:bg-red-50 hover:text-red-500 transition-all touch-manipulation"
            onClick={onCancel}
          >
            Batalkan Pesanan
          </Button>
        </div>
      </div>

      {/* ─── RIGHT SIDE: CASHIER PIN BOX ─── */}
      <div className="w-full md:w-[480px] lg:w-[560px] bg-[#1a1a2e] text-white flex flex-col justify-center shrink-0 relative overflow-hidden touch-scroll">
        
        {/* Ambient background styling */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-secondary/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />

        {isLocked && (
          <div className="absolute inset-0 z-40 bg-[#1a1a2e]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="h-24 w-24 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-8 shadow-[0_0_60px_rgba(239,68,68,0.3)] animate-pulse">
              <Lock size={48} />
            </div>
            <h4 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tight mb-4">Sistem Terkunci</h4>
            <p className="text-base text-zinc-400 leading-relaxed mb-10 max-w-sm">Keamanan aktif karena 10x kesalahan berturut-turut. Hubungi Supervisor untuk memasukkan kode pemulihan.</p>
            
            <div className="w-full max-w-sm space-y-5">
              <Input
                readOnly
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="RECOVERY"
                className="h-16 lg:h-20 text-center text-3xl lg:text-4xl tracking-[0.5em] rounded-2xl border-2 border-red-500/50 bg-black/40 focus:border-red-500 focus:ring-0 text-white placeholder:text-zinc-700 uppercase font-black"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                disabled={isVerifyingRecovery}
              />
              <PinPad
                disabled={isVerifyingRecovery}
                onKeyPress={(key) => {
                  if (backupCode.length < 4) setBackupCode((prev) => prev + key)
                }}
                onDelete={() => setBackupCode((prev) => prev.slice(0, -1))}
                onClear={() => setBackupCode('')}
              />
              <Button 
                className="w-full h-16 lg:h-18 rounded-2xl bg-red-600 text-white text-lg font-black hover:bg-red-700 shadow-xl shadow-red-900/50 active:scale-[0.98] transition-all touch-manipulation uppercase tracking-widest"
                onClick={handleBackupUnlock}
                disabled={isVerifyingRecovery || backupCode.length < 4}
              >
                {isVerifyingRecovery ? <Loader2 className="animate-spin h-6 w-6" /> : 'Buka Kunci'}
              </Button>
            </div>
          </div>
        )}

        <div className="p-8 md:p-12 lg:p-16 space-y-10 lg:space-y-12 relative z-10 w-full max-w-[500px] mx-auto">
          <div className="text-center space-y-5">
            <div className="mx-auto h-20 w-20 lg:h-24 lg:w-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-secondary shadow-lg">
              <KeyRound size={40} className="lg:w-12 lg:h-12" />
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tight">Otoritas Kasir</h4>
              <p className="text-sm lg:text-base text-zinc-400 font-medium">Masukkan PIN rahasia untuk otorisasi pembayaran</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <Label htmlFor="cashier-pin" className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">PIN Keamanan</Label>
                {attempts < 10 && (
                  <span className={`text-xs font-black uppercase tracking-wider ${attempts <= 3 ? 'text-red-400 animate-pulse' : 'text-brand-secondary'}`}>
                    Sisa {attempts}x
                  </span>
                )}
              </div>
              
              <div className="relative group">
                <Input
                  ref={pinInputRef}
                  readOnly
                  id="cashier-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  className={`h-24 lg:h-28 text-center text-5xl lg:text-6xl tracking-[0.6em] lg:tracking-[0.8em] rounded-3xl border-2 transition-all bg-black/40 font-black text-white placeholder:text-zinc-800 ${
                    attempts <= 3 
                      ? 'border-red-500/50 focus:border-red-500' 
                      : 'border-white/10 focus:border-brand-primary'
                  } focus:ring-0 shadow-inner`}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} // Ensure numeric only visually
                  disabled={isConfirming || isLocked}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && pin.length >= 4) {
                      handleCashierConfirm()
                    }
                  }}
                />
                <div className="absolute inset-0 rounded-3xl ring-4 ring-brand-primary/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>

            <PinPad
              disabled={isConfirming || isLocked}
              onKeyPress={(key) => {
                if (pin.length < 4) setPin((prev) => prev + key)
              }}
              onDelete={() => setPin((prev) => prev.slice(0, -1))}
              onClear={() => setPin('')}
            />

            <Button 
              className="w-full h-20 lg:h-24 rounded-3xl bg-brand-primary text-white text-xl lg:text-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-[0_10px_40px_rgba(6,103,172,0.4)] active:scale-[0.98] disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none touch-manipulation"
              onClick={handleCashierConfirm}
              disabled={isConfirming || pin.length < 4 || isLocked}
            >
              {isConfirming ? <Loader2 className="animate-spin h-8 w-8 text-white" /> : 'Konfirmasi Lunas'}
            </Button>
            
            {attempts <= 3 && !isLocked && (
              <div className="flex items-center gap-3 justify-center text-red-400 bg-red-500/10 py-4 px-6 rounded-2xl border border-red-500/20">
                <ShieldAlert size={20} className="shrink-0" />
                <span className="text-xs font-black uppercase tracking-widest leading-tight">Peringatan Keamanan Aktif</span>
              </div>
            )}
          </div>
          
          <div className="pt-6 lg:pt-10">
            <div className="flex items-center gap-4 justify-center text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">
              <div className="h-px w-12 bg-white/10" />
              Staf Internal
              <div className="h-px w-12 bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
