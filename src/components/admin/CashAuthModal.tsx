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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Konfirmasi Pembayaran Tunai</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="rounded-xl bg-zinc-50 p-4 border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Nomor Antrean:</span>
              <span className="font-bold text-[#d42c2c]">{order.queue_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Nama Pelanggan:</span>
              <span className="font-bold">{order.customer_name || '-'}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2 mt-2">
              <span className="text-zinc-500 font-medium">Total Tagihan:</span>
              <span className="font-black text-lg">
                Rp {new Intl.NumberFormat('id-ID').format(order.total_price)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin" className="text-sm font-medium">Masukkan PIN Kasir</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="****"
                className="pl-10 text-xl tracking-[1em] h-12"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button 
            className="bg-[#d42c2c] hover:bg-[#b02424]"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Konfirmasi Lunas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
