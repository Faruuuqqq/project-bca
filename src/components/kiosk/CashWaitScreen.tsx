'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Banknote, Clock, ArrowRight, KeyRound, Loader2 } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { confirmCashPayment } from '@/actions/payment'
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

  useEffect(() => {
    // Realtime subscription for status update from Cashier
    const channel = supabase
      .channel(`order-cash-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          if (payload.new.payment_status === 'paid') {
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
  }, [orderId, supabase, onCancel])

  const handleSuccess = () => {
    clearCart()
    router.push(`/success?id=${orderId}`)
  }

  const handleCashierConfirm = async () => {
    if (pin.length < 4) {
      toast.error('PIN minimal 4 digit')
      return
    }

    setIsConfirming(true)
    try {
      const result = await confirmCashPayment(orderId, pin)
      if (result.error) {
        toast.error(result.error)
        setPin('')
      } else {
        toast.success('Pembayaran Tunai Dikonfirmasi!')
        handleSuccess()
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengonfirmasi pembayaran')
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f8f1e7] md:flex-row overflow-y-auto md:overflow-hidden">
      {/* Left Side: Customer Info */}
      <div className="flex-1 flex flex-col overflow-y-auto border-b md:border-b-0 md:border-r border-zinc-100">
        <div className="bg-[#d42c2c] p-6 text-white text-center shrink-0">
          <h2 className="text-2xl font-bold italic tracking-wider uppercase">Pembayaran Tunai</h2>
          <p className="text-sm opacity-80">Silakan ke kasir untuk membayar</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[600px] md:min-h-0">
          <div className="mb-6 p-6 bg-white rounded-full shadow-lg">
            <Banknote size={64} className="text-[#d42c2c]" />
          </div>

          <div className="space-y-1 mb-8">
            <p className="text-[#7a5c48] font-medium uppercase tracking-widest text-xs">Nomor Antrean Anda</p>
            <h3 className="text-[120px] font-black text-[#d42c2c] leading-none tracking-tighter">
              {queueNumber}
            </h3>
            {customerName && (
              <p className="text-2xl font-bold text-[#3d2b1f] pt-4">a.n. {customerName}</p>
            )}
          </div>

          <div className="w-full max-w-sm p-6 bg-white rounded-[2rem] shadow-xl space-y-6">
            <div className="flex items-center gap-4 text-left">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-[#d42c2c]/10 flex items-center justify-center text-[#d42c2c]">
                <Clock size={24} />
              </div>
              <div>
                <p className="font-bold text-[#3d2b1f]">Menunggu Kasir</p>
                <p className="text-[11px] text-zinc-500 leading-tight">Berikan nomor antrean di atas kepada petugas kasir.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-left border-t pt-6">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-green-100 flex items-center justify-center text-green-600">
                <ArrowRight size={24} />
              </div>
              <div>
                <p className="font-bold text-[#3d2b1f]">Otomatis Berlanjut</p>
                <p className="text-[11px] text-zinc-500 leading-tight">Layar ini akan berubah otomatis setelah pembayaran lunas.</p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="mt-12 text-zinc-400 text-xs font-medium hover:bg-transparent hover:text-red-500 transition-colors"
            onClick={onCancel}
          >
            Batalkan Pesanan
          </Button>
        </div>
      </div>

      {/* Right Side: Cashier PIN Box */}
      <div className="w-full md:w-[350px] lg:w-[450px] bg-white shadow-2xl p-8 flex flex-col justify-center shrink-0">
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <div className="mx-auto h-16 w-16 rounded-[1.5rem] bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
              <KeyRound size={32} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-black text-[#3d2b1f] uppercase tracking-tight">Otoritas Kasir</h4>
              <p className="text-xs text-zinc-400 max-w-[200px] mx-auto">Masukkan PIN rahasia untuk konfirmasi pembayaran tunai</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="cashier-pin" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Pin Keamanan</Label>
              <Input
                id="cashier-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                className="h-20 text-center text-4xl tracking-[0.8em] rounded-[1.5rem] border-2 border-zinc-100 focus:border-[#d42c2c] focus:ring-0 transition-all bg-zinc-50/50"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={isConfirming}
              />
            </div>

            <Button 
              className="w-full h-20 rounded-[1.5rem] bg-[#3d2b1f] text-white text-xl font-black hover:bg-black transition-all shadow-xl active:scale-[0.98]"
              onClick={handleCashierConfirm}
              disabled={isConfirming || pin.length < 4}
            >
              {isConfirming ? <Loader2 className="animate-spin h-8 w-8" /> : 'KONFIRMASI LUNAS'}
            </Button>
          </div>
          
          <div className="pt-4">
            <div className="flex items-center gap-2 justify-center text-[10px] text-zinc-300 font-bold uppercase tracking-widest">
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
