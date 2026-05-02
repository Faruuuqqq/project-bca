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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCheckout: () => void
}

export function CartSheet({ open, onOpenChange, onCheckout }: CartSheetProps) {
  const { items, updateQty, removeItem, orderType } = useCartStore()

  const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const getOptionsHash = (options?: CartItem['options']) => {
    if (!options) return ''
    return options
      .map((o) => o.valueId)
      .sort()
      .join('-')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-[2rem] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="text-[#d42c2c]" />
              Keranjang Saya
            </SheetTitle>
            <Badge variant="secondary" className="bg-[#f8f1e7] text-[#7a5c48] capitalize">
              {orderType === 'dine-in' ? 'Makan di Sini' : 'Bawa Pulang'}
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
              <ShoppingCart size={64} className="mb-4 opacity-20" />
              <p>Keranjang Anda masih kosong</p>
            </div>
          ) : (
            <div className="py-6 space-y-6">
              {items.map((item, idx) => (
                <div key={`${item.menuId}-${idx}`} className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-bold text-[#3d2b1f]">{item.name}</h4>
                      {item.options && item.options.length > 0 && (
                        <p className="text-xs text-zinc-500">
                          {item.options.map(o => o.valueLabel).join(', ')}
                        </p>
                      )}
                      <p className="text-sm font-bold text-[#d42c2c]">
                        Rp {new Intl.NumberFormat('id-ID').format(item.subtotal)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-zinc-100 p-1 rounded-full">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full"
                        onClick={() => updateQty(item.menuId, -1, getOptionsHash(item.options))}
                      >
                        {item.quantity === 1 ? <Trash2 size={14} className="text-red-500" /> : <Minus size={14} />}
                      </Button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full"
                        onClick={() => updateQty(item.menuId, 1, getOptionsHash(item.options))}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  </div>
                  {idx < items.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <SheetFooter className="p-6 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-zinc-600">Total Pembayaran</span>
              <span className="text-2xl font-black text-[#d42c2c]">
                Rp {new Intl.NumberFormat('id-ID').format(totalPrice)}
              </span>
            </div>
            
            <Button 
              className="w-full h-14 rounded-2xl bg-[#d42c2c] text-white text-lg font-bold hover:bg-[#b02424] disabled:opacity-50"
              disabled={items.length === 0}
              onClick={onCheckout}
            >
              Lanjut Pembayaran
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-zinc-500"
              onClick={() => onOpenChange(false)}
            >
              Tambah Menu Lain
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

import { Badge } from '@/components/ui/badge'
