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
    if (isLocked) return
    if (pin.length < 4) {
      toast.error('PIN minimal 4 digit')
      return
    }

    setIsConfirming(true)
    try {
      const result = await confirmCashPayment(orderId, pin)
      if (result.rawbtUrl) {
          sendToRawBT(result.rawbtUrl)
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
