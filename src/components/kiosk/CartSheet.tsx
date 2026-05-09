'use client'

import { useCartStore, CartItem } from '@/store/cart'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Plus, Minus, Trash2, ShoppingCart, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCheckout: () => void
}

export function CartSheet({ open, onOpenChange, onCheckout }: CartSheetProps) {
  const { items, updateQty, orderType } = useCartStore()

  const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0)

  const getOptionsHash = (options?: CartItem['options']) => {
    if (!options) return ''
    return options
      .map((o) => o.valueId)
      .sort()
      .join('-')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        showCloseButton={false}
        className="h-[85vh] max-h-[85vh] rounded-t-[2.5rem] p-0 flex flex-col bg-white border-none shadow-[0_-20px_80px_rgba(0,0,0,0.15)] overflow-hidden outline-none"
      >
        
        {/* HEADER - High Visibility */}
        <div className="bg-white shrink-0 border-b-2 z-30 shadow-sm">
          <SheetHeader className="p-4 md:p-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-brand-primary rounded-2xl text-white shadow-lg shadow-blue-100">
                <ShoppingCart size={22} />
              </div>
              <div>
                <SheetTitle className="text-xl md:text-2xl font-black text-[#3d2b1f] uppercase tracking-tight leading-none">
                  Keranjang
                </SheetTitle>
                <div className="flex items-center gap-2.5 mt-1.5">
                  <Badge className="bg-brand-primary text-white border-none text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm">
                    {orderType === 'dine-in' ? 'MAKAN DI SINI' : 'BAWA PULANG'}
                  </Badge>
                  <span className="text-[10px] font-black text-[#3d2b1f] uppercase tracking-widest opacity-40">{items.length} Pesanan</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full h-12 w-12 text-[#3d2b1f] hover:bg-zinc-100 border-2 border-zinc-50 shadow-sm transition-all">
              <X size={24} className="stroke-[3]" />
            </Button>
          </SheetHeader>
        </div>

        {/* ITEMS LIST */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-50/50 px-4 md:px-8 py-5 touch-pan-y custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-300">
              <ShoppingCart size={48} className="opacity-10 mb-2" />
              <p className="font-black uppercase tracking-widest text-[10px]">Keranjang Kosong</p>
            </div>
          ) : (
            <div className="space-y-3 pb-12">
              {items.map((item, idx) => (
                <div key={`${item.menuId}-${idx}`} className="bg-white p-4 rounded-3xl shadow-sm border border-zinc-100 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-[#3d2b1f] uppercase text-sm md:text-base truncate leading-tight">{item.name}</h4>
                    {item.options && item.options.length > 0 && (
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight truncate mt-0.5 opacity-60">
                        {item.options.map(o => o.valueLabel).join(' • ')}
                      </p>
                    )}
                    <p className="text-base font-black text-brand-primary mt-1.5">
                      Rp {new Intl.NumberFormat('id-ID').format(item.subtotal)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-zinc-100/80 p-1 rounded-2xl border border-zinc-100 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 rounded-xl bg-white shadow-sm hover:text-red-500 transition-all active:scale-90"
                      onClick={() => updateQty(item.menuId, -1, getOptionsHash(item.options))}
                    >
                      {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                    </Button>
                    <span className="text-lg font-black w-6 text-center text-[#3d2b1f] tabular-nums">{item.quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 rounded-xl bg-white shadow-sm hover:text-brand-primary transition-all active:scale-90"
                      onClick={() => updateQty(item.menuId, 1, getOptionsHash(item.options))}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER - High Contrast */}
        <div className="bg-white shrink-0 border-t-2 shadow-2xl z-30">
          <div className="p-6 md:p-10 space-y-6">
            <div className="flex items-end justify-between px-2">
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase text-[#3d2b1f] tracking-[0.3em] leading-none mb-1.5 opacity-40">TOTAL PEMBAYARAN</span>
                <span className="text-4xl font-black text-brand-primary tracking-tighter">
                  Rp {new Intl.NumberFormat('id-ID').format(totalPrice)}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge className="bg-zinc-800 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-md shadow-lg">SUDAH TERMASUK PAJAK</Badge>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <Button 
                className="w-full h-20 rounded-[2rem] bg-brand-primary text-white text-xl font-black shadow-xl shadow-blue-100 hover:bg-blue-900 transition-all active:scale-[0.98] uppercase tracking-tight border-b-8 border-blue-900"
                disabled={items.length === 0}
                onClick={onCheckout}
              >
                Bayar Sekarang
              </Button>
              <Button 
                variant="ghost" 
                className="w-full h-10 text-[#3d2b1f] font-black uppercase tracking-[0.25em] text-[11px] hover:bg-transparent underline decoration-zinc-200 underline-offset-8"
                onClick={() => onOpenChange(false)}
              >
                Tambah Menu Lain
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
