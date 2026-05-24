'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Category } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { CustomizationSheet } from './CustomizationSheet'
import { useCartStore } from '@/store/cart'
import { ShoppingBasket, ChevronRight, Loader2 } from 'lucide-react'
import { CartSheet } from './CartSheet'
import { CartSidebar } from './CartSidebar'
import { PaymentMethodModal } from './PaymentMethodModal'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createOrder } from '@/actions/order'
import { QRISScreen } from './QRISScreen'
import { CashWaitScreen } from './CashWaitScreen'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useKioskKeyboard } from '@/hooks/use-kiosk-keyboard'
import { MenuGridSkeleton } from './MenuGridSkeleton'

interface MenuItemData {
  id: string
  name: string
  price: number
  image_url?: string | null
  is_sold_out: boolean
  current_stock: number
  category_id: string
  categories?: { name: string }
  menu_options?: Array<Record<string, unknown>>
}

interface MenuGridProps {
  initialCategories: Category[]
  initialMenus: MenuItemData[]
}

export function MenuGrid({ initialCategories, initialMenus }: MenuGridProps) {
  const router = useRouter()
  const supabase = createClient()
  const { items, orderType, addItem } = useCartStore()
  
  const [menus, setMenus] = useState(initialMenus)
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategories[0]?.id || 'all'
  )
  // Brief skeleton flash on category switch for smoother UX
  const [isSwitchingCategory, setIsSwitchingCategory] = useState(false)
  const switchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selectedMenu, setSelectedMenu] = useState<MenuItemData | null>(null)
  const [isCustomSheetOpen, setIsCustomSheetOpen] = useState(false)
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [orderData, setOrderData] = useState<{ orderId: string; qrContent?: string; queueNumber?: string; customerName?: string } | null>(null)
  const [paymentStep, setPaymentStep] = useState<'none' | 'qris' | 'cash'>('none')

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0)

  const filteredMenus = menus.filter((menu) =>
    selectedCategory === 'all' || menu.category_id === selectedCategory
  )

  // Supabase realtime for live stock updates
  useEffect(() => {
    const channel = supabase
      .channel('menu-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'menus' },
        (payload) => {
          setMenus((currentMenus) =>
            currentMenus.map((m) =>
              m.id === payload.new.id ? { 
                ...m, 
                is_sold_out: payload.new.is_sold_out,
                current_stock: payload.new.current_stock 
              } : m
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Category switch with skeleton flash
  const handleCategoryChange = useCallback((catId: string) => {
    if (catId === selectedCategory) return
    setIsSwitchingCategory(true)
    if (switchTimerRef.current) clearTimeout(switchTimerRef.current)
    switchTimerRef.current = setTimeout(() => {
      setSelectedCategory(catId)
      setIsSwitchingCategory(false)
    }, 150)
  }, [selectedCategory])

  useEffect(() => {
    return () => {
      if (switchTimerRef.current) clearTimeout(switchTimerRef.current)
    }
  }, [])

  const handleMenuClick = useCallback((menu: MenuItemData) => {
    if (menu.is_sold_out || menu.current_stock <= 0) return

    if (!menu.menu_options || menu.menu_options.length === 0) {
      addItem({
        menuId: menu.id,
        name: menu.name,
        price: Number(menu.price),
        quantity: 1,
        subtotal: Number(menu.price),
        options: []
      })
      toast.success(`${menu.name} ditambahkan ke keranjang`)
    } else {
      setSelectedMenu(menu)
      setIsCustomSheetOpen(true)
    }
  }, [addItem])

  const handleCheckout = useCallback(() => {
    setIsCartSheetOpen(false)
    setIsPaymentModalOpen(true)
  }, [])

  const handleSelectPayment = async (method: 'QRIS' | 'CASH') => {
    setIsPaymentModalOpen(false)
    setIsCreatingOrder(true)
    
    try {
      const result = await createOrder({
        items,
        orderType: orderType!,
        paymentMethod: method,
      })

      if (result.success) {
        setOrderData({ ...result })
        setPaymentStep(method === 'QRIS' ? 'qris' : 'cash')
      }
    } catch (error: unknown) {
      console.error('Checkout Error:', error)
      toast.error((error as Error).message || 'Gagal memproses pesanan. Silakan coba lagi.')
    } finally {
      setIsCreatingOrder(false)
    }
  }

  // Keyboard navigation
  const inPaymentFlow = paymentStep !== 'none' || isCreatingOrder
  useKioskKeyboard({
    itemCount: filteredMenus.length,
    columns: 3, // matches md:grid-cols-3
    onSelect: (index) => {
      const menu = filteredMenus[index]
      if (menu) handleMenuClick(menu)
    },
    onEscape: () => {
      if (isCartSheetOpen) setIsCartSheetOpen(false)
      else if (isCustomSheetOpen) setIsCustomSheetOpen(false)
      else if (isPaymentModalOpen) setIsPaymentModalOpen(false)
    },
    enabled: !inPaymentFlow,
  })

  const inPayment = paymentStep !== 'none'

  return (
    <div className="flex h-full flex-row relative overflow-hidden bg-[#f0f7ff]">
      {/* LEFT: Category + Menu Grid */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Category Tabs */}
        <div className="px-4 py-4 md:py-6 shrink-0 z-20">
          <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="bg-white p-1.5 rounded-[1.8rem] shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-zinc-100 flex gap-1 h-auto w-fit">
                <TabsTrigger 
                  value="all"
                  className="rounded-full px-7 py-2.5 font-black transition-all text-[11px] uppercase tracking-[0.12em]
                             data-[state=active]:bg-brand-primary data-[state=active]:text-white data-[state=active]:shadow-lg
                             text-zinc-500 hover:text-brand-primary"
                >
                  Semua Menu
                </TabsTrigger>
                {initialCategories.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="rounded-full px-7 py-2.5 font-black transition-all text-[11px] uppercase tracking-[0.12em]
                               data-[state=active]:bg-brand-primary data-[state=active]:text-white data-[state=active]:shadow-lg
                               text-zinc-500 hover:text-brand-primary"
                  >
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>
          </Tabs>
        </div>

        {/* Menu Grid with skeleton on category switch */}
        <ScrollArea className="flex-1 min-h-0 w-full overflow-y-auto">
          {isSwitchingCategory ? (
            <div className="animate-in fade-in duration-100">
              <MenuGridSkeleton />
            </div>
          ) : (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8 p-6 pb-40 animate-in fade-in duration-200"
            >
              {filteredMenus.map((menu, index) => {
                const isUnavailable = menu.is_sold_out || menu.current_stock <= 0
                return (
                  <Card 
                    key={menu.id}
                    data-kiosk-item
                    tabIndex={0}
                    onClick={() => handleMenuClick(menu)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleMenuClick(menu)
                      }
                    }}
                    className={cn(
                      'overflow-hidden border-none shadow-[0_15px_40px_rgba(0,0,0,0.04)] transition-all flex flex-col h-full bg-white rounded-[2.5rem] p-0 group',
                      'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
                      isUnavailable
                        ? 'opacity-60 grayscale cursor-not-allowed'
                        : 'cursor-pointer hover:shadow-[0_30px_60px_rgba(6,103,172,0.12)] hover:-translate-y-2 active:scale-95'
                    )}
                  >
                    <div className="aspect-square bg-zinc-50 relative overflow-hidden shrink-0 w-full">
                      {menu.image_url ? (
                        <img 
                          src={menu.image_url} 
                          alt={menu.name} 
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-200 p-4 text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Ayam Kalintang</span>
                        </div>
                      )}
                      {isUnavailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                          <Badge variant="destructive" className="text-sm px-4 py-1.5 font-black uppercase tracking-tighter shadow-xl">HABIS</Badge>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <CardContent className="p-5 md:p-7 flex flex-col justify-between flex-1 gap-3">
                      <div>
                        <h3 className="line-clamp-2 font-black text-[#3d2b1f] text-base md:text-xl leading-tight uppercase tracking-tight group-hover:text-brand-primary transition-colors">{menu.name}</h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1.5 opacity-60 tracking-widest">{menu.categories?.name}</p>
                      </div>
                      <div className="flex flex-col gap-2 mt-auto">
                        <p className="text-xl md:text-2xl font-black text-brand-primary tracking-tighter leading-none">
                          Rp {new Intl.NumberFormat('id-ID').format(menu.price)}
                        </p>
                        {menu.current_stock > 0 && menu.current_stock <= 10 && (
                          <span className="text-[9px] font-black text-brand-tertiary bg-orange-50 px-2 py-1.5 rounded-xl uppercase tracking-widest border border-orange-100 self-start shadow-sm shadow-orange-50">
                            Sisa {menu.current_stock}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Cart Summary Bar — mobile only (hidden on md+ where sidebar is shown) */}
        {totalItems > 0 && !isCreatingOrder && paymentStep === 'none' && (
          <div className="md:hidden absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-6">
            <button 
              onClick={() => setIsCartSheetOpen(true)}
              className="flex w-full items-center justify-between rounded-[2.5rem] bg-brand-primary p-6 text-white shadow-[0_30px_60px_rgba(6,103,172,0.4)] transition-all active:scale-95 border-b-8 border-blue-900 group"
            >
              <div className="flex items-center gap-5">
                <div className="relative p-3 bg-white/20 rounded-2xl backdrop-blur-md group-hover:bg-brand-secondary group-hover:text-brand-primary transition-colors">
                  <ShoppingBasket size={32} />
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-secondary text-xs font-black text-white shadow-lg border-2 border-brand-primary">
                    {totalItems}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[11px] opacity-70 uppercase font-black tracking-[0.2em] leading-none mb-1.5">Selesaikan Pesanan</p>
                  <p className="text-2xl font-black tracking-tighter">
                    Rp {new Intl.NumberFormat('id-ID').format(totalPrice)}
                  </p>
                </div>
              </div>
              <div className="bg-white/20 p-2.5 rounded-2xl text-brand-secondary group-hover:bg-brand-secondary group-hover:text-brand-primary transition-colors">
                <ChevronRight size={28} />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Cart Sidebar — tablet/desktop only */}
      {!inPayment && !isCreatingOrder && (
        <CartSidebar
          onCheckout={handleCheckout}
          hidden={inPayment || isCreatingOrder}
        />
      )}

      {/* Processing overlay */}
      {isCreatingOrder && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 border-8 border-brand-primary/5">
            <Loader2 className="h-16 w-16 animate-spin text-brand-primary" />
            <p className="text-xl font-black text-brand-primary uppercase tracking-tight">Memproses Pesanan</p>
          </div>
        </div>
      )}

      {paymentStep === 'qris' && orderData && (
        <QRISScreen 
          orderId={orderData.orderId}
          qrContent={orderData.qrContent || ''}
          onCancel={() => setPaymentStep('none')}
        />
      )}

      {paymentStep === 'cash' && orderData && (
        <CashWaitScreen 
          orderId={orderData.orderId}
          queueNumber={orderData.queueNumber || ''}
          customerName={orderData.customerName}
          onCancel={() => setPaymentStep('none')}
        />
      )}

      <CustomizationSheet 
        menu={selectedMenu as unknown as Parameters<typeof CustomizationSheet>[0]['menu']} 
        open={isCustomSheetOpen} 
        onOpenChange={setIsCustomSheetOpen} 
      />

      <CartSheet 
        open={isCartSheetOpen} 
        onOpenChange={setIsCartSheetOpen} 
        onCheckout={handleCheckout}
      />

      <PaymentMethodModal 
        open={isPaymentModalOpen} 
        onOpenChange={setIsPaymentModalOpen} 
        onSelect={handleSelectPayment}
      />
    </div>
  )
}

