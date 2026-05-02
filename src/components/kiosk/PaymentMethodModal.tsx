'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QrCode, Banknote, User } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PaymentMethodModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (method: 'QRIS' | 'CASH', customerName: string) => void
}

export function PaymentMethodModal({ open, onOpenChange, onSelect }: PaymentMethodModalProps) {
  const [step, setStep] = useState<'method' | 'name'>('method')
  const [selectedMethod, setSelectedMethod] = useState<'QRIS' | 'CASH' | null>(null)
  const [customerName, setCustomerName] = useState('')

  const handleSelectMethod = (method: 'QRIS' | 'CASH') => {
    setSelectedMethod(method)
    setStep('name')
  }

  const handleConfirm = () => {
    if (selectedMethod) {
      onSelect(selectedMethod, customerName)
    }
  }

  const reset = () => {
    setStep('method')
    setSelectedMethod(null)
    setCustomerName('')
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val)
      if (!val) reset()
    }}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {step === 'method' ? 'Pilih Metode Pembayaran' : 'Data Pelanggan'}
          </DialogTitle>
        </DialogHeader>

        {step === 'method' ? (
          <div className="grid gap-4 py-4">
            <Button
              variant="outline"
              className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 hover:border-[#d42c2c] hover:bg-[#d42c2c]/5 transition-all"
              onClick={() => handleSelectMethod('QRIS')}
            >
              <QrCode size={40} className="text-[#d42c2c]" />
              <div className="text-center">
                <p className="font-bold text-lg">QRIS / E-Wallet</p>
                <p className="text-xs text-zinc-500 italic">Otomatis Terkonfirmasi</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 hover:border-[#d42c2c] hover:bg-[#d42c2c]/5 transition-all"
              onClick={() => handleSelectMethod('CASH')}
            >
              <Banknote size={40} className="text-[#d42c2c]" />
              <div className="text-center">
                <p className="font-bold text-lg">Tunai di Kasir</p>
                <p className="text-xs text-zinc-500 italic">Bayar ke meja kasir</p>
              </div>
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nama Pelanggan (Opsional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <Input
                  id="name"
                  placeholder="Contoh: Budi"
                  className="pl-10 h-12 rounded-xl"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-zinc-400">Nama akan muncul di nomor antrean Anda</p>
            </div>

            <Button 
              className="w-full h-12 rounded-xl bg-[#d42c2c] text-white font-bold hover:bg-[#b02424]"
              onClick={handleConfirm}
            >
              Lanjutkan ke Pesanan
            </Button>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setStep('method')}
            >
              Kembali
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
