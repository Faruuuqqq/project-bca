import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  menuId: string
  name: string
  price: number
  quantity: number
  subtotal: number
  options?: {
    optionId: string
    optionName: string
    valueId: string
    valueLabel: string
    extraPrice: number
  }[]
}

type OrderType = 'dine-in' | 'take-away' | null

interface CartState {
  orderType: OrderType
  items: CartItem[]
  setOrderType: (type: OrderType) => void
  addItem: (item: CartItem) => void
  removeItem: (menuId: string, optionsHash?: string) => void
  updateQty: (menuId: string, delta: number, optionsHash?: string) => void
  clearCart: () => void
}

// Helper to create a hash of options to distinguish same menu items with different customizations
const getOptionsHash = (options?: CartItem['options']) => {
  if (!options) return ''
  return options
    .map((o) => o.valueId)
    .sort()
    .join('-')
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      orderType: null,
      items: [],

      setOrderType: (type) => set({ orderType: type }),

      addItem: (newItem) =>
        set((state) => {
          const newOptionsHash = getOptionsHash(newItem.options)
          const existingItemIndex = state.items.findIndex(
            (item) =>
              item.menuId === newItem.menuId &&
              getOptionsHash(item.options) === newOptionsHash
          )

          if (existingItemIndex > -1) {
            const updatedItems = [...state.items]
            const existingItem = updatedItems[existingItemIndex]
            updatedItems[existingItemIndex] = {
              ...existingItem,
              quantity: existingItem.quantity + newItem.quantity,
              subtotal: existingItem.subtotal + newItem.subtotal,
            }
            return { items: updatedItems }
          }

          return { items: [...state.items, newItem] }
        }),

      removeItem: (menuId, optionsHash) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.menuId === menuId &&
                getOptionsHash(item.options) === (optionsHash || '')
              )
          ),
        })),

      updateQty: (menuId, delta, optionsHash) =>
        set((state) => {
          const updatedItems = state.items
            .map((item) => {
              if (
                item.menuId === menuId &&
                getOptionsHash(item.options) === (optionsHash || '')
              ) {
                const newQty = Math.max(0, item.quantity + delta)
                const unitPrice = item.subtotal / item.quantity
                return {
                  ...item,
                  quantity: newQty,
                  subtotal: unitPrice * newQty,
                }
              }
              return item
            })
            .filter((item) => item.quantity > 0)

          return { items: updatedItems }
        }),

      clearCart: () => set({ items: [], orderType: null }),
    }),
    {
      name: 'sok-cart',
    }
  )
)
