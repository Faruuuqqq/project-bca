'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { confirmCashPayment } from '@/actions/payment'
import { toast } from 'sonner'
import { Loader2, KeyRound } from 'lucide-react'

interface CashAuthModalProps {
  order: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CashAuthModal({ order, open, onOpenChange, onSuccess }: CashAuthModalProps) {
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    if (pin.length < 4) {
      toast.error('PIN minimal 4 digit')
      return
    }

    setIsLoading(true)
    try {
      const result = await confirmCashPayment(order.id, pin)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Pembayaran tunai dikonfirmasi')
        onSuccess()
        onOpenChange(false)
        setPin('')
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl rounded-[2rem] p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-black text-[#3d2b1f] uppercase tracking-tight">Konfirmasi Pembayaran</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="rounded-2xl bg-zinc-50 p-6 border-2 border-zinc-100 space-y-3">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-400">
              <span>Nomor Antrean</span>
              <span className="text-brand-primary">#{order.queue_number}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-[#3d2b1f]">
              <span>Nama Pelanggan</span>
              <span>{order.customer_name || '-'}</span>
            </div>
            <div className="border-t-2 border-dashed border-zinc-200 pt-3 flex justify-between items-end">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Tagihan</span>
              <span className="font-black text-2xl text-brand-primary leading-none">
                Rp {new Intl.NumberFormat('id-ID').format(order.total_price)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="pin" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Masukkan PIN Kasir</Label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={20} />
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••"
                className="pl-12 text-2xl tracking-[0.8em] h-16 rounded-2xl bg-zinc-50 border-zinc-100 focus:bg-white focus:border-brand-primary"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-xl font-bold text-zinc-400 order-2 sm:order-1"
          >
            BATALKAN
          </Button>
          <Button 
            className="bg-brand-primary hover:bg-blue-900 rounded-xl font-black text-lg h-14 px-8 shadow-xl shadow-blue-100 order-1 sm:order-2 flex-1"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'KONFIRMASI LUNAS'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
