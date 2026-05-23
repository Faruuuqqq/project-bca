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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, X } from 'lucide-react'
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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})

  // Reset state when menu changes using key-like pattern with ref
  const prevMenuId = useRef<string | null>(null)
  useEffect(() => {
    if (menu && menu.id !== prevMenuId.current) {
      prevMenuId.current = menu.id
      setQuantity(1)
      setSelectedOptions({})
    }
  }, [menu])

  // Derive totalPrice from state instead of using useEffect+setState
  const totalPrice = useMemo(() => {
    if (!menu) return 0

    let extraPrice = 0
    Object.values(selectedOptions).flat().forEach(valueId => {
      menu.menu_options?.forEach((opt: MenuOption) => {
        const val = opt.menu_option_values?.find((v: MenuOptionValue) => v.id === valueId)
        if (val) extraPrice += Number(val.extra_price)
      })
    })

    return (Number(menu.price) + extraPrice) * quantity
  }, [selectedOptions, quantity, menu])

  if (!menu) return null

  const handleToggleOption = (optionId: string, valueId: string, type: 'single' | 'multiple') => {
    setSelectedOptions(prev => {
      const current = prev[optionId] || []
      if (type === 'single') {
        return { ...prev, [optionId]: [valueId] }
      } else {
        if (current.includes(valueId)) {
          return { ...prev, [optionId]: current.filter(id => id !== valueId) }
        } else {
          return { ...prev, [optionId]: [...current, valueId] }
        }
      }
    })
  }

  const isAddDisabled = () => {
    // Check if all required options are selected
    return menu.menu_options?.some((opt: MenuOption) => {
      if (opt.is_required) {
        return !selectedOptions[opt.id] || selectedOptions[opt.id].length === 0
      }
      return false
    })
  }

  const handleAddToCart = () => {
    const optionsForCart: { optionId: string; optionName: string; valueId: string; valueLabel: string; extraPrice: number }[] = []
    
    for (const [optionId, valueIds] of Object.entries(selectedOptions)) {
      const option = menu.menu_options?.find((o: MenuOption) => o.id === optionId)
      if (!option) continue
      valueIds.forEach(vId => {
        const value = option.menu_option_values?.find((v: MenuOptionValue) => v.id === vId)
        if (!value) return
        optionsForCart.push({
          optionId,
          optionName: option.name,
          valueId: vId,
          valueLabel: value.label,
          extraPrice: Number(value.extra_price)
        })
      })
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
      <DialogContent showCloseButton={false} className="max-w-[95vw] md:max-w-2xl rounded-[2rem] p-0 flex flex-col bg-white border-none shadow-2xl overflow-hidden h-[85vh] outline-none">
        {/* HEADER - Fixed at top */}
        <DialogHeader className="p-6 bg-white shrink-0 border-b flex flex-row items-center justify-between z-10">
          <div className="space-y-1">
            <DialogTitle className="text-xl md:text-2xl font-black text-[#3d2b1f] uppercase tracking-tight">{menu.name}</DialogTitle>
            <p className="text-xs text-zinc-400 font-medium italic line-clamp-1">{menu.description}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full shrink-0 h-10 w-10">
            <X size={24} className="text-zinc-400" />
          </Button>
        </DialogHeader>

        {/* SCROLL AREA - Bagian yang bisa digeser */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-white touch-pan-y custom-scrollbar">
          <div className="space-y-8 pb-32">
            {menu.menu_options?.map((opt: MenuOption) => (
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

                {opt.selection_type === 'single' ? (
                  <RadioGroup 
                    value={selectedOptions[opt.id]?.[0] || ""} 
                    onValueChange={(val) => handleToggleOption(opt.id, val, 'single')}
                    className="space-y-3"
                  >
                    {opt.menu_option_values?.map((val: MenuOptionValue) => (
                      <div 
                        key={val.id} 
                        onClick={() => handleToggleOption(opt.id, val.id, 'single')}
                        className="flex items-center justify-between rounded-2xl border-2 p-4 transition-all has-[:checked]:border-brand-primary has-[:checked]:bg-brand-primary/5 cursor-pointer active:bg-zinc-50 hover:border-zinc-300"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <RadioGroupItem 
                            value={val.id} 
                            id={val.id} 
                            className="border-2 text-brand-primary shrink-0" 
                          />
                          <Label 
                            htmlFor={val.id} 
                            className="font-bold text-[#3d2b1f] cursor-pointer flex-1 py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {val.label}
                          </Label>
                        </div>
                        {Number(val.extra_price) > 0 && (
                          <span className="text-sm font-black text-brand-primary shrink-0">
                            +Rp {new Intl.NumberFormat('id-ID').format(val.extra_price)}
                          </span>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-3">
                    {opt.menu_option_values?.map((val: MenuOptionValue) => (
                      <div 
                        key={val.id} 
                        onClick={() => handleToggleOption(opt.id, val.id, 'multiple')}
                        className="flex items-center justify-between rounded-2xl border-2 p-4 transition-all has-[button[data-state=checked]]:border-brand-primary has-[button[data-state=checked]]:bg-brand-primary/5 cursor-pointer active:bg-zinc-50 hover:border-zinc-300"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <Checkbox 
                            id={val.id} 
                            checked={selectedOptions[opt.id]?.includes(val.id)}
                            onCheckedChange={() => handleToggleOption(opt.id, val.id, 'multiple')}
                            className="border-2 data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Label 
                            htmlFor={val.id} 
                            className="font-bold text-[#3d2b1f] cursor-pointer flex-1 py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {val.label}
                          </Label>
                        </div>
                        {Number(val.extra_price) > 0 && (
                          <span className="text-sm font-black text-brand-primary shrink-0">
                            +Rp {new Intl.NumberFormat('id-ID').format(val.extra_price)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER - Fixed at bottom */}
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
            disabled={isAddDisabled()}
            onClick={handleAddToCart}
          >
            TAMBAHKAN KE KERANJANG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
