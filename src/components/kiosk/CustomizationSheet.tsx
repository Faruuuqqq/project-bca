'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useCartStore } from '@/store/cart'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, X, CheckSquare, Square } from 'lucide-react'
import { toast } from 'sonner'

interface MenuOptionValue {
  id: string
  label: string
  extra_price: number
}

interface MenuOption {
  id: string
  name: string
  is_required: boolean
  selection_type: 'single' | 'multiple'
  menu_option_values?: MenuOptionValue[]
}

interface MenuWithOptions {
  id: string
  name: string
  price: number
  description?: string
  menu_options?: MenuOption[]
}

interface CustomizationSheetProps {
  menu: MenuWithOptions | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomizationSheet({ menu, open, onOpenChange }: CustomizationSheetProps) {
  const addItem = useCartStore((state) => state.addItem)
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  useEffect(() => { if (!open) setIsSubmitting(false) }, [open])
  
  // Format: { optionId: { valueId: qty } }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, Record<string, number>>>({})

  // Reset state when menu changes
  const prevMenuId = useRef<string | null>(null)
  useEffect(() => {
    if (menu && menu.id !== prevMenuId.current) {
      prevMenuId.current = menu.id
      setQuantity(1)
      
      const filteredOptions = menu.menu_options?.filter((opt) => !opt.name.startsWith('[ARCHIVED]')) || []
      
      const defaultSelections: Record<string, Record<string, number>> = {}
      filteredOptions.forEach((opt: MenuOption) => {
        if (opt.is_required && opt.menu_option_values && opt.menu_option_values.length > 0) {
          defaultSelections[opt.id] = {
            [opt.menu_option_values[0].id]: 1
          }
        }
      })
      setSelectedOptions(defaultSelections)
    }
  }, [menu])

  // Derive totalPrice from state
  const totalPrice = useMemo(() => {
    if (!menu) return 0

    let extraPrice = 0
    const filteredOptions = menu.menu_options?.filter((opt) => !opt.name.startsWith('[ARCHIVED]')) || []
    
    filteredOptions.forEach((opt: MenuOption) => {
      const selectedForOpt = selectedOptions[opt.id] || {}
      
      let groupQty = 0
      let groupCost = 0
      let pricesInGroup: number[] = []

      opt.menu_option_values?.forEach((val: MenuOptionValue) => {
        const qty = selectedForOpt[val.id] || 0
        if (qty > 0) {
          groupQty += qty
          groupCost += qty * Number(val.extra_price)
          for(let i = 0; i < qty; i++) {
            pricesInGroup.push(Number(val.extra_price))
          }
        }
      })

      if (groupQty > 0) {
        if (opt.is_required) {
          // The discount is the base/cheapest option in this group (e.g. 11000 for Ayam, 0 for Sambal)
          let defaultDiscount = 0
          if (opt.menu_option_values && opt.menu_option_values.length > 0) {
            defaultDiscount = Math.min(...opt.menu_option_values.map((v: MenuOptionValue) => Number(v.extra_price)))
          }
          extraPrice += Math.max(0, groupCost - defaultDiscount)
        } else {
          // If not required, all cost extra
          extraPrice += groupCost
        }
      }
    })

    return (Number(menu.price) + extraPrice) * quantity
  }, [selectedOptions, quantity, menu])

  if (!menu) return null

  const handleUpdateOptionQty = (optionId: string, valueId: string, delta: number) => {
    setSelectedOptions(prev => {
      const optGroup = prev[optionId] || {}
      const currentQty = optGroup[valueId] || 0
      const newQty = Math.max(0, currentQty + delta)
      
      const newOptGroup = { ...optGroup, [valueId]: newQty }
      
      // Clean up 0 qty keys
      if (newQty === 0) {
        delete newOptGroup[valueId]
      }
      
      return { ...prev, [optionId]: newOptGroup }
    })
  }

  const handleSelectRadio = (optionId: string, valueId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: { [valueId]: 1 }
    }))
  }

  const isAddDisabled = () => {
    const filteredOptions = menu.menu_options?.filter((opt) => !opt.name.startsWith('[ARCHIVED]')) || []
    return filteredOptions.some((opt: MenuOption) => {
      if (opt.is_required) {
        const selectedForOpt = selectedOptions[opt.id] || {}
        const totalQty = Object.values(selectedForOpt).reduce((sum, q) => sum + q, 0)
        return totalQty < 1
      }
      return false
    })
  }

  const handleAddToCart = () => {
    setIsSubmitting(true)
    const optionsForCart: { optionId: string; optionName: string; valueId: string; valueLabel: string; extraPrice: number, quantity: number }[] = []
    const filteredOptions = menu.menu_options?.filter((opt) => !opt.name.startsWith('[ARCHIVED]')) || []
    
    for (const [optionId, valueMap] of Object.entries(selectedOptions)) {
      const option = filteredOptions.find((o: MenuOption) => o.id === optionId)
      if (!option) continue
      
      for (const [vId, qty] of Object.entries(valueMap)) {
        if (qty <= 0) continue
        const value = option.menu_option_values?.find((v: MenuOptionValue) => v.id === vId)
        if (!value) continue
        
        optionsForCart.push({
          optionId,
          optionName: option.name,
          valueId: vId,
          valueLabel: value.label,
          extraPrice: Number(value.extra_price),
          quantity: qty
        })
      }
    }

    addItem({
      menuId: menu.id,
      name: menu.name,
      price: Number(menu.price),
      quantity,
      subtotal: totalPrice,
      options: optionsForCart
    })

    toast.success(`${menu.name} ditambahkan ke keranjang`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-[95vw] md:max-w-4xl rounded-[2rem] p-0 flex flex-col bg-white border-none shadow-2xl overflow-hidden h-[85vh] outline-none">
        {/* HEADER */}
        <DialogHeader className="p-6 bg-white shrink-0 border-b flex flex-row items-center justify-between z-10">
          <div className="space-y-1">
            <DialogTitle className="text-xl md:text-2xl font-black text-[#3d2b1f] uppercase tracking-tight">{menu.name}</DialogTitle>
            <p className="text-xs text-zinc-400 font-medium italic line-clamp-1">{menu.description}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full shrink-0 h-10 w-10">
            <X size={24} className="text-zinc-400" />
          </Button>
        </DialogHeader>

        {/* SCROLL AREA - Layout 2 Kolom untuk Tablet (md) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-white touch-pan-y custom-scrollbar">
          <div className="pb-32">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {menu.menu_options?.filter((opt) => !opt.name.startsWith('[ARCHIVED]')).map((opt: MenuOption) => (
                <div key={opt.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-[#3d2b1f] uppercase tracking-tight">
                      {opt.name}
                      {opt.is_required && <span className="text-[#d42c2c] ml-1">*</span>}
                    </h3>
                    {opt.is_required && (
                      <Badge variant="outline" className="text-[10px] uppercase font-black border-red-200 text-red-500 bg-red-50">Wajib Pilih</Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    {opt.menu_option_values?.map((val: MenuOptionValue) => {
                      const qty = selectedOptions[opt.id]?.[val.id] || 0;
                      const isSingle = opt.selection_type === 'single';

                      let priceToDisplay = Number(val.extra_price);
                      let showPrice = priceToDisplay > 0;
                      
                      let defaultDiscount = 0
                      if (opt.menu_option_values && opt.menu_option_values.length > 0) {
                        defaultDiscount = Math.min(...opt.menu_option_values.map((v: MenuOptionValue) => Number(v.extra_price)))
                      }

                      if (opt.is_required && defaultDiscount > 0) {
                        if (qty === 0) {
                          priceToDisplay = 0;
                          showPrice = true; // Show +Rp 0
                        } else {
                          priceToDisplay = Number(val.extra_price);
                          showPrice = priceToDisplay > 0;
                        }
                      }

                      return (
                        <div 
                          key={val.id}
                          onClick={() => isSingle ? handleSelectRadio(opt.id, val.id) : handleUpdateOptionQty(opt.id, val.id, qty > 0 ? -1 : 1)}
                          className={`flex items-center justify-between rounded-2xl border-2 p-3 transition-all cursor-pointer ${qty > 0 ? 'border-brand-primary bg-brand-primary/5' : 'hover:border-zinc-300'}`}
                        >
                          <div className="flex-1 flex flex-col justify-center py-1">
                            <Label 
                              className={`font-bold text-[#3d2b1f] cursor-pointer`}
                            >
                              {val.label}
                            </Label>
                            {showPrice && (
                              <span className="text-[10px] font-black text-brand-primary shrink-0 mt-0.5">
                                +Rp {new Intl.NumberFormat('id-ID').format(priceToDisplay)}
                              </span>
                            )}
                          </div>
                          
                          {isSingle ? (
                            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${qty > 0 ? 'border-brand-primary' : 'border-zinc-300'}`}>
                              {qty > 0 && <div className="h-3 w-3 rounded-full bg-brand-primary" />}
                            </div>
                          ) : (
                            <div className="flex items-center text-brand-primary">
                              {qty > 0 ? <CheckSquare size={24} className="fill-brand-primary text-white rounded-md" /> : <Square size={24} className="text-zinc-300" />}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="bg-white border-t p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] shrink-0 z-10 flex flex-col gap-4">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-4 bg-zinc-100 p-1 rounded-2xl">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-12 w-12 rounded-xl bg-white shadow-sm"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
              >
                <Minus size={20} />
              </Button>
              <span className="text-2xl font-black w-8 text-center text-brand-primary">{quantity}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-12 w-12 rounded-xl bg-white shadow-sm"
                onClick={() => setQuantity(q => q + 1)}
              >
                <Plus size={20} />
              </Button>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">Total</p>
              <p className="text-2xl font-black text-brand-primary tracking-tighter">
                Rp {new Intl.NumberFormat('id-ID').format(totalPrice)}
              </p>
            </div>
          </div>
          
          <Button 
            className="w-full h-16 rounded-[1.5rem] bg-brand-primary text-white text-lg font-black hover:bg-blue-900 disabled:opacity-50 shadow-xl shadow-blue-100 active:scale-[0.98] transition-all"
            disabled={isAddDisabled() || isSubmitting}
            onClick={handleAddToCart}
          >
            TAMBAHKAN KE KERANJANG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
