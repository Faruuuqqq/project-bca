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
      <DialogContent showCloseButton={false} className="max-w-[90vw] sm:max-w-[480px] md:max-w-[560px] rounded-[2.5rem] md:rounded-[3rem] bg-white border-none shadow-2xl p-0 overflow-hidden outline-none">
        {/* Header - Unified Design */}
        <DialogHeader className="p-6 md:p-8 lg:p-10 pb-4 md:pb-6 flex flex-row items-center justify-between border-b bg-zinc-50/30">
          <div className="flex flex-col">
            <DialogTitle className="text-xl md:text-2xl lg:text-3xl font-black text-[#3d2b1f] uppercase tracking-tight">
              Pilih Pembayaran
            </DialogTitle>
            <p className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] mt-1 md:mt-1.5">Konfirmasi Pesanan</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full h-12 w-12 md:h-14 md:w-14 hover:bg-red-50 hover:text-red-500 transition-colors touch-manipulation">
            <X size={24} className="md:w-7 md:h-7" />
          </Button>
        </DialogHeader>

        <div className="p-6 md:p-8 lg:p-10">
          <div className="flex flex-col gap-5 md:gap-6">
            {/* QRIS OPTION - Professional Nudge */}
            <div className="relative group w-full">
              <div className="absolute -top-3 left-6 md:left-8 z-10">
                <Badge className="bg-brand-primary text-white border-none px-3 py-1.5 md:px-4 md:py-2 font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                  <Zap size={12} className="fill-white" /> Rekomendasi
                </Badge>
              </div>
              <Button
                variant="outline"
                className="w-full h-36 md:h-44 flex flex-col items-center justify-center gap-2 rounded-[2rem] md:rounded-[2.5rem] border-4 border-brand-primary/80 bg-brand-primary/[0.03] hover:bg-brand-primary/[0.08] hover:border-brand-primary transition-all duration-300 relative overflow-hidden touch-manipulation shadow-sm hover:shadow-md"
                onClick={() => onSelect('QRIS')}
              >
                <div className="absolute right-[-10px] bottom-[-10px] text-brand-primary opacity-5 group-hover:opacity-10 transition-opacity">
                  <CheckCircle2 size={160} className="md:w-48 md:h-48" />
                </div>
                <QrCode size={48} className="text-brand-primary mb-1 md:mb-2 group-hover:scale-110 transition-transform duration-500 md:w-14 md:h-14" />
                <div className="text-center z-10 px-4 md:px-8">
                  <p className="font-black text-xl md:text-2xl text-[#3d2b1f] tracking-tight">QRIS & Saldo Digital</p>
                  <p className="text-[11px] md:text-sm text-brand-primary font-bold leading-tight mt-1.5 md:mt-2">
                    Lunas otomatis. Mendukung myBCA & semua e-wallet.
                  </p>
                </div>
              </Button>
            </div>

            {/* CASH OPTION - Clean & Operational */}
            <div className="w-full">
              <Button
                variant="outline"
                className="w-full h-32 md:h-36 flex flex-col items-center justify-center gap-1.5 md:gap-2 rounded-[2rem] md:rounded-[2.5rem] border-[3px] border-zinc-100 bg-white hover:border-zinc-200 hover:bg-zinc-50 transition-all duration-300 touch-manipulation"
                onClick={() => onSelect('CASH')}
              >
                <Banknote size={36} className="text-zinc-400 mb-0.5 md:mb-1 md:w-10 md:h-10" />
                <div className="text-center px-4 md:px-8">
                  <p className="font-bold text-lg md:text-xl text-zinc-600 tracking-tight uppercase">Bayar Tunai di Kasir</p>
                  <p className="text-[10px] md:text-xs text-zinc-400 font-medium leading-tight mt-1 md:mt-1.5">
                    Bayar tunai melalui petugas kasir kami.
                  </p>
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer - Professional Trust Badge */}
        <div className="px-8 md:px-10 py-5 md:py-6 bg-zinc-50 border-t flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            <ShieldCheck size={16} className="text-green-600 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-400 leading-none">Keamanan Terjamin</span>
          </div>
          <div className="h-5 md:h-6 w-px bg-zinc-200" />
          <p className="text-[10px] md:text-xs font-black text-brand-primary uppercase tracking-[0.15em] leading-none">Merchant ID BC-001293</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
