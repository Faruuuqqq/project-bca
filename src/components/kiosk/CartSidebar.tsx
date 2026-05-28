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
        'w-[340px] lg:w-[400px] xl:w-[440px] shrink-0',
        'bg-white border-l border-zinc-100 shadow-[-30px_0_60px_rgba(0,0,0,0.05)]',
        'h-full relative z-10'
      )}
    >
      {/* HEADER */}
      <div className="px-6 py-6 lg:py-8 border-b border-zinc-100 shrink-0 bg-white">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
            <ShoppingBasket size={24} className="lg:w-7 lg:h-7" />
          </div>
          <div>
            <h2 className="font-black text-[#3d2b1f] uppercase text-base lg:text-lg tracking-tight leading-none">
              Keranjang
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-brand-primary text-white border-none text-[10px] lg:text-xs font-black uppercase px-2.5 py-0.5 rounded-md">
                {orderType === 'dine-in' ? 'Dine-in' : 'Take-away'}
              </Badge>
              {totalItems > 0 && (
                <span className="text-[11px] lg:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {totalItems} item
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ITEMS */}
      <ScrollArea className="flex-1 min-h-0 bg-zinc-50/50">
        <div className="px-5 py-5 lg:px-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-300">
              <ShoppingBasket size={56} className="opacity-20 mb-4" />
              <p className="font-black uppercase tracking-widest text-xs lg:text-sm text-zinc-400">
                Keranjang Kosong
              </p>
              <p className="text-[10px] lg:text-xs mt-1.5 opacity-70 font-medium">Silakan pilih menu untuk memulai</p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={`${item.menuId}-${idx}`}
                className="bg-white p-5 lg:p-6 rounded-3xl border border-zinc-100 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[#3d2b1f] text-sm lg:text-base uppercase tracking-tight leading-tight line-clamp-2">
                      {item.name}
                    </p>
                    {item.options && item.options.length > 0 && (
                      <p className="text-[10px] lg:text-xs text-zinc-400 font-semibold uppercase tracking-tight mt-1 truncate">
                        {item.options.map((o) => o.valueLabel).join(' • ')}
                      </p>
                    )}
                  </div>
                  <p className="text-sm lg:text-base font-black text-brand-primary shrink-0 tabular-nums">
                    Rp {new Intl.NumberFormat('id-ID').format(item.subtotal)}
                  </p>
                </div>

                {/* Qty Controls */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 lg:h-12 lg:w-12 rounded-[1rem] border-zinc-200 bg-zinc-50 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors touch-manipulation shadow-sm"
                    onClick={() => updateQty(item.menuId, -1, getOptionsHash(item.options))}
                  >
                    {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={18} />}
                  </Button>
                  <span className="w-8 lg:w-10 text-center text-base lg:text-xl font-black tabular-nums text-[#3d2b1f]">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 lg:h-12 lg:w-12 rounded-[1rem] border-zinc-200 bg-zinc-50 hover:bg-brand-primary hover:border-brand-primary hover:text-white transition-colors touch-manipulation shadow-sm"
                    onClick={() => updateQty(item.menuId, 1, getOptionsHash(item.options))}
                  >
                    <Plus size={18} />
                  </Button>
                  <span className="ml-auto text-[10px] lg:text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    @Rp {new Intl.NumberFormat('id-ID').format(item.price)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* FOOTER */}
      <div className="px-5 py-6 lg:px-6 lg:py-8 border-t border-zinc-100 shrink-0 bg-white">
        {/* Total */}
        <div className="flex items-end justify-between mb-5 lg:mb-6">
          <div>
            <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
              Total Pembayaran
            </p>
            <p className="text-3xl lg:text-4xl font-black text-brand-primary tracking-tighter tabular-nums leading-none">
              Rp {new Intl.NumberFormat('id-ID').format(totalPrice)}
            </p>
          </div>
          <Badge className="bg-zinc-800 text-white border-none text-[9px] lg:text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
            Inkl. Pajak
          </Badge>
        </div>

        {/* Checkout Button */}
        <Button
          className={cn(
            'w-full h-16 lg:h-20 rounded-[1.5rem] lg:rounded-[2rem] font-black text-base lg:text-xl uppercase tracking-tight',
            'bg-brand-primary text-white border-b-[6px] border-blue-900 touch-manipulation',
            'shadow-[0_15px_30px_rgba(6,103,172,0.3)] hover:bg-blue-800 active:scale-[0.98] transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          <CreditCard size={24} className="mr-3" />
          Bayar Sekarang
        </Button>
      </div>
    </aside>
  )
}
