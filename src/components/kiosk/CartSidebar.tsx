'use client'

import { useCartStore, CartItem } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Minus, Trash2, ShoppingBasket, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CartSidebarProps {
  onCheckout: () => void
  /** Hidden when payment flow is active */
  hidden?: boolean
}

/**
 * Persistent right-side cart sidebar for tablet/desktop (md+).
 * Hidden on mobile — cart sheet is used instead.
 */
export function CartSidebar({ onCheckout, hidden = false }: CartSidebarProps) {
  const { items, updateQty, orderType } = useCartStore()

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = items.reduce((s, i) => s + i.subtotal, 0)

  const getOptionsHash = (options?: CartItem['options']) => {
    if (!options) return ''
    return options.map((o) => o.valueId).sort().join('-')
  }

  if (hidden) return null

  return (
    <aside
      className={cn(
        // Only show on md+ screens
        'hidden md:flex flex-col',
        'w-[300px] lg:w-[340px] shrink-0',
        'bg-white border-l border-zinc-100 shadow-[-20px_0_60px_rgba(0,0,0,0.04)]',
        'h-full relative z-10'
      )}
    >
      {/* HEADER */}
      <div className="px-6 py-5 border-b border-zinc-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-md shadow-blue-100">
            <ShoppingBasket size={20} />
          </div>
          <div>
            <h2 className="font-black text-[#3d2b1f] uppercase text-sm tracking-tight leading-none">
              Keranjang
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-brand-primary text-white border-none text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                {orderType === 'dine-in' ? 'Dine-in' : 'Take-away'}
              </Badge>
              {totalItems > 0 && (
                <span className="text-[10px] font-bold text-muted-foreground">
                  {totalItems} item
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ITEMS */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-300">
              <ShoppingBasket size={40} className="opacity-20 mb-3" />
              <p className="font-black uppercase tracking-widest text-[10px]">
                Keranjang Kosong
              </p>
              <p className="text-[9px] mt-1 opacity-70">Pilih menu untuk memulai</p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={`${item.menuId}-${idx}`}
                className="bg-zinc-50/80 p-3.5 rounded-2xl border border-zinc-100 group"
              >
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[#3d2b1f] text-xs uppercase tracking-tight leading-tight truncate">
                      {item.name}
                    </p>
                    {item.options && item.options.length > 0 && (
                      <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-tight mt-0.5 truncate">
                        {item.options.map((o) => o.valueLabel).join(' • ')}
                      </p>
                    )}
                  </div>
                  <p className="text-xs font-black text-brand-primary shrink-0 tabular-nums">
                    Rp {new Intl.NumberFormat('id-ID').format(item.subtotal)}
                  </p>
                </div>

                {/* Qty Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl border-zinc-200 hover:border-red-200 hover:text-red-500 transition-colors"
                    onClick={() => updateQty(item.menuId, -1, getOptionsHash(item.options))}
                  >
                    {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                  </Button>
                  <span className="w-6 text-center text-sm font-black tabular-nums text-[#3d2b1f]">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl border-zinc-200 hover:border-brand-primary hover:text-brand-primary transition-colors"
                    onClick={() => updateQty(item.menuId, 1, getOptionsHash(item.options))}
                  >
                    <Plus size={13} />
                  </Button>
                  <span className="ml-auto text-[9px] font-bold text-zinc-400 uppercase">
                    @Rp {new Intl.NumberFormat('id-ID').format(item.price)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* FOOTER */}
      <div className="px-4 py-4 border-t border-zinc-100 shrink-0 bg-white">
        {/* Total */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
              Total Pembayaran
            </p>
            <p className="text-2xl font-black text-brand-primary tracking-tighter tabular-nums">
              Rp {new Intl.NumberFormat('id-ID').format(totalPrice)}
            </p>
          </div>
          <Badge className="bg-zinc-800 text-white border-none text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
            Inkl. Pajak
          </Badge>
        </div>

        {/* Checkout Button */}
        <Button
          className={cn(
            'w-full h-14 rounded-2xl font-black text-sm uppercase tracking-tight',
            'bg-brand-primary text-white border-b-4 border-blue-900',
            'shadow-lg shadow-blue-100 hover:bg-blue-800 active:scale-[0.98] transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          <CreditCard size={18} className="mr-2" />
          Bayar Sekarang
        </Button>

        {/* Keyboard hint */}
        <p className="text-center text-[9px] text-zinc-300 font-semibold uppercase tracking-widest mt-3">
          ↑↓←→ Navigasi · Enter Pilih · Esc Tutup
        </p>
      </div>
    </aside>
  )
}
