'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QrCode, Banknote, X, CheckCircle2, Zap, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PaymentMethodModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (method: 'QRIS' | 'CASH') => void
}

export function PaymentMethodModal({ open, onOpenChange, onSelect }: PaymentMethodModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-[90vw] sm:max-w-[420px] rounded-[2.5rem] bg-white border-none shadow-2xl p-0 overflow-hidden outline-none">
        {/* Header - Unified Design */}
        <DialogHeader className="p-6 md:p-8 pb-4 flex flex-row items-center justify-between border-b bg-zinc-50/30">
          <div className="flex flex-col">
            <DialogTitle className="text-xl font-black text-[#3d2b1f] uppercase tracking-tight">
              Pilih Pembayaran
            </DialogTitle>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-0.5">Konfirmasi Pesanan</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full h-10 w-10 hover:bg-red-50 hover:text-red-500 transition-colors">
            <X size={20} />
          </Button>
        </DialogHeader>

        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-4">
            {/* QRIS OPTION - Professional Nudge */}
            <div className="relative group w-full">
              <div className="absolute -top-3 left-6 z-10">
                <Badge className="bg-brand-primary text-white border-none px-3 py-1 font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                  <Zap size={10} className="fill-white" /> Rekomendasi
                </Badge>
              </div>
              <Button
                variant="outline"
                className="w-full h-32 flex flex-col items-center justify-center gap-1 rounded-[1.8rem] border-2 border-brand-primary bg-brand-primary/[0.03] hover:bg-brand-primary/[0.08] transition-all duration-300 relative overflow-hidden"
                onClick={() => onSelect('QRIS')}
              >
                <div className="absolute right-[-10px] bottom-[-10px] text-brand-primary opacity-5 group-hover:opacity-10 transition-opacity">
                  <CheckCircle2 size={120} />
                </div>
                <QrCode size={40} className="text-brand-primary mb-1 group-hover:scale-110 transition-transform duration-500" />
                <div className="text-center z-10 px-4">
                  <p className="font-black text-lg text-[#3d2b1f] tracking-tight">QRIS & Saldo Digital</p>
                  <p className="text-[10px] text-brand-primary font-bold leading-tight mt-1">
                    Lunas otomatis. Mendukung myBCA & semua e-wallet.
                  </p>
                </div>
              </Button>
            </div>

            {/* CASH OPTION - Clean & Operational */}
            <div className="w-full">
              <Button
                variant="outline"
                className="w-full h-28 flex flex-col items-center justify-center gap-1 rounded-[1.8rem] border-2 border-zinc-100 bg-white hover:border-zinc-200 hover:bg-zinc-50 transition-all duration-300"
                onClick={() => onSelect('CASH')}
              >
                <Banknote size={32} className="text-zinc-400 mb-0.5" />
                <div className="text-center px-4">
                  <p className="font-bold text-base text-zinc-600 tracking-tight uppercase">Bayar Tunai di Kasir</p>
                  <p className="text-[9px] text-zinc-400 font-medium leading-tight mt-1">
                    Bayar tunai melalui petugas kasir kami.
                  </p>
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer - Professional Trust Badge */}
        <div className="px-8 py-5 bg-zinc-50 border-t flex items-center justify-between gap-4">
           <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-green-600" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 leading-none">Keamanan Terjamin</span>
           </div>
           <div className="h-4 w-px bg-zinc-200" />
           <p className="text-[9px] font-black text-brand-primary uppercase tracking-[0.15em] leading-none">Merchant ID BC-001293</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
