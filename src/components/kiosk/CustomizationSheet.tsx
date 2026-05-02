'use client'

import { useState, useEffect } from 'react'
import { Menu, MenuOption } from '@/types/database'
import { useCartStore } from '@/store/cart'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'

interface CustomizationSheetProps {
  menu: any | null // Use any to match the joined structure from Supabase
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomizationSheet({ menu, open, onOpenChange }: CustomizationSheetProps) {
  const addItem = useCartStore((state) => state.addItem)
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})
  const [totalPrice, setTotalPrice] = useState(0)

  // Reset state when menu changes
  useEffect(() => {
    if (menu) {
      setQuantity(1)
      setSelectedOptions({})
      setTotalPrice(Number(menu.price))
    }
  }, [menu])

  // Calculate total price whenever options or quantity change
  useEffect(() => {
    if (!menu) return

    let extraPrice = 0
    Object.values(selectedOptions).flat().forEach(valueId => {
      // Find the value in the menu options to get its extra_price
      menu.menu_options?.forEach((opt: any) => {
        const val = opt.menu_option_values?.find((v: any) => v.id === valueId)
        if (val) extraPrice += Number(val.extra_price)
      })
    })

    setTotalPrice((Number(menu.price) + extraPrice) * quantity)
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
    return menu.menu_options?.some((opt: any) => {
      if (opt.is_required) {
        return !selectedOptions[opt.id] || selectedOptions[opt.id].length === 0
      }
      return false
    })
  }

  const handleAddToCart = () => {
    const optionsForCart: { optionId: string; optionName: any; valueId: string; valueLabel: any; extraPrice: number }[] = []
    
    for (const [optionId, valueIds] of Object.entries(selectedOptions)) {
      const option = menu.menu_options.find((o: any) => o.id === optionId)
      valueIds.forEach(vId => {
        const value = option.menu_option_values.find((v: any) => v.id === vId)
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-[2rem] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-2xl font-bold text-[#3d2b1f]">{menu.name}</SheetTitle>
          <p className="text-sm text-zinc-500">{menu.description}</p>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-8 pb-32">
            {menu.menu_options?.map((opt: any) => (
              <div key={opt.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#3d2b1f]">
                    {opt.name}
                    {opt.is_required && <span className="text-[#d42c2c] ml-1">*</span>}
                  </h3>
                  {opt.is_required && (
                    <Badge variant="outline" className="text-[10px] uppercase">Wajib</Badge>
                  )}
                </div>

                {opt.selection_type === 'single' ? (
                  <RadioGroup 
                    value={selectedOptions[opt.id]?.[0] || ""} 
                    onValueChange={(val) => handleToggleOption(opt.id, val, 'single')}
                    className="space-y-3"
                  >
                    {opt.menu_option_values?.map((val: any) => (
                      <div key={val.id} className="flex items-center justify-between rounded-xl border p-4 transition-colors has-[:checked]:border-[#d42c2c] has-[:checked]:bg-[#d42c2c]/5">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={val.id} id={val.id} className="border-2 text-[#d42c2c]" />
                          <Label htmlFor={val.id} className="font-medium cursor-pointer">{val.label}</Label>
                        </div>
                        {Number(val.extra_price) > 0 && (
                          <span className="text-sm font-bold text-[#d42c2c]">
                            +Rp {new Intl.NumberFormat('id-ID').format(val.extra_price)}
                          </span>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-3">
                    {opt.menu_option_values?.map((val: any) => (
                      <div key={val.id} className="flex items-center justify-between rounded-xl border p-4 transition-colors has-[button[data-state=checked]]:border-[#d42c2c] has-[button[data-state=checked]]:bg-[#d42c2c]/5">
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            id={val.id} 
                            checked={selectedOptions[opt.id]?.includes(val.id)}
                            onCheckedChange={() => handleToggleOption(opt.id, val.id, 'multiple')}
                            className="border-2 data-[state=checked]:bg-[#d42c2c] data-[state=checked]:border-[#d42c2c]"
                          />
                          <Label htmlFor={val.id} className="font-medium cursor-pointer">{val.label}</Label>
                        </div>
                        {Number(val.extra_price) > 0 && (
                          <span className="text-sm font-bold text-[#d42c2c]">
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
        </ScrollArea>

        <SheetFooter className="absolute bottom-0 left-0 right-0 bg-white border-t p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 bg-zinc-100 p-1 rounded-full">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-full"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                >
                  <Minus size={20} />
                </Button>
                <span className="text-xl font-bold w-6 text-center">{quantity}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-full"
                  onClick={() => setQuantity(q => q + 1)}
                >
                  <Plus size={20} />
                </Button>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-500">Total Harga</p>
                <p className="text-2xl font-black text-[#d42c2c]">
                  Rp {new Intl.NumberFormat('id-ID').format(totalPrice)}
                </p>
              </div>
            </div>
            
            <Button 
              className="w-full h-14 rounded-2xl bg-[#d42c2c] text-white text-lg font-bold hover:bg-[#b02424] disabled:opacity-50"
              disabled={isAddDisabled()}
              onClick={handleAddToCart}
            >
              Tambah ke Keranjang
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
