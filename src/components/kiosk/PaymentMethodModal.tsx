'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QrCode, Banknote, User, X } from 'lucide-react'
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
      <DialogContent className="sm:max-w-md rounded-[2rem] bg-white border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4 flex flex-row items-center justify-between border-b bg-zinc-50/50">
          <DialogTitle className="text-xl font-black text-[#3d2b1f] uppercase tracking-tight">
            {step === 'method' ? 'Pilih Metode Bayar' : 'Data Pelanggan'}
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full">
            <X size={20} className="text-zinc-400" />
          </Button>
        </DialogHeader>

        <div className="p-8">
          {step === 'method' ? (
            <div className="grid gap-4 py-2">
              <Button
                variant="outline"
                className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 hover:border-brand-primary hover:bg-brand-primary/5 transition-all group"
                onClick={() => handleSelectMethod('QRIS')}
              >
                <QrCode size={40} className="text-brand-primary group-hover:scale-110 transition-transform" />
                <div className="text-center">
                  <p className="font-black text-lg text-[#3d2b1f]">QRIS / E-WALLET</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest italic">Konfirmasi Otomatis</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 hover:border-brand-primary hover:bg-brand-primary/5 transition-all group"
                onClick={() => handleSelectMethod('CASH')}
              >
                <Banknote size={40} className="text-brand-primary group-hover:scale-110 transition-transform" />
                <div className="text-center">
                  <p className="font-black text-lg text-[#3d2b1f]">TUNAI DI KASIR</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest italic">Bayar ke Petugas</p>
                </div>
              </Button>
            </div>
          ) : (
            <div className="space-y-8 py-2">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nama Pelanggan (Opsional)</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={20} />
                  <Input
                    id="name"
                    placeholder="Contoh: Budi"
                    className="pl-12 h-16 rounded-2xl bg-zinc-50 border-zinc-100 focus:bg-white focus:border-brand-primary transition-all font-bold text-lg"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 font-medium italic">Nama ini akan tercetak pada nomor antrean Anda.</p>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full h-16 rounded-2xl bg-brand-primary text-white font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-900 transition-all active:scale-[0.98]"
                  onClick={handleConfirm}
                >
                  LANJUTKAN PESANAN
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full h-12 text-zinc-400 font-bold uppercase tracking-widest text-xs"
                  onClick={() => setStep('method')}
                >
                  Kembali ke Metode Bayar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
