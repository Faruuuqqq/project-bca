'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Category } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useCartStore } from '@/store/cart'
import { ShoppingBasket, ChevronRight, Loader2, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createOrder } from '@/actions/order'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const CustomizationSheet = dynamic(() => import('./CustomizationSheet').then(m => m.CustomizationSheet), { ssr: false })
const CartSheet = dynamic(() => import('./CartSheet').then(m => m.CartSheet), { ssr: false })
const CartSidebar = dynamic(() => import('./CartSidebar').then(m => m.CartSidebar), { ssr: false })
const PaymentMethodModal = dynamic(() => import('./PaymentMethodModal').then(m => m.PaymentMethodModal), { ssr: false })
const QRISScreen = dynamic(() => import('./QRISScreen').then(m => m.QRISScreen), { ssr: false })
const CashWaitScreen = dynamic(() => import('./CashWaitScreen').then(m => m.CashWaitScreen), { ssr: false })
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
  categories?: { name: string } | Array<{ name: string }>
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
  const [searchQuery, setSearchQuery] = useState('')
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

  const filteredMenus = menus.filter((menu) => {
    const matchCategory = selectedCategory === 'all' || menu.category_id === selectedCategory
    const matchSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

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

  const handleSelectPayment = async (method: 'QRIS' | 'CASH', customerName: string) => {
    setIsPaymentModalOpen(false)
    setIsCreatingOrder(true)
    
    try {
      const result = await createOrder({
        items,
        orderType: orderType!,
        paymentMethod: method,
        customerName: customerName
      })

      if (result.success) {
        setOrderData({ ...result })
        setPaymentStep(method === 'QRIS' ? 'qris' : 'cash')
      }
    } catch (error: unknown) {
      console.error('Checkout Error:', error)
      const errMsg = (error as Error).message; if (errMsg === 'Failed to fetch' || errMsg.includes('fetch')) toast.error('Koneksi terputus, silakan periksa internet dan coba lagi.'); else toast.error(errMsg || 'Gagal memproses pesanan. Silakan coba lagi.');
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
        {/* Search Bar & Category Tabs */}
        <div className="px-4 py-4 md:px-6 md:py-6 shrink-0 z-20 flex flex-col gap-4 bg-white/50 backdrop-blur-sm border-b border-zinc-100">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Cari menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-[1.5rem] py-3.5 pl-12 pr-4 text-sm md:text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
            />
          </div>
          
          <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="bg-white p-1.5 rounded-[1.8rem] shadow-sm border border-zinc-100 flex gap-1 h-auto w-fit">
                <TabsTrigger 
                  value="all"
                  className="rounded-full px-7 py-2 font-black transition-all text-[11px] uppercase tracking-[0.12em]
                             data-[state=active]:bg-brand-primary data-[state=active]:text-white data-[state=active]:shadow-md
                             text-zinc-500 hover:text-brand-primary"
                >
                  Semua Menu
                </TabsTrigger>
                {initialCategories.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="rounded-full px-7 py-2 font-black transition-all text-[11px] uppercase tracking-[0.12em]
                               data-[state=active]:bg-brand-primary data-[state=active]:text-white data-[state=active]:shadow-md
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

        {/* Menu List View with skeleton on category switch */}
        <ScrollArea className="flex-1 min-h-0 w-full overflow-y-auto bg-zinc-50/50">
          {isSwitchingCategory ? (
            <div className="animate-in fade-in duration-100 p-4 md:p-6">
              <MenuGridSkeleton />
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-4 md:p-6 pb-40 animate-in fade-in duration-200">
              {filteredMenus.map((menu, index) => {
                const isUnavailable = menu.is_sold_out || menu.current_stock <= 0
                return (
                  <div
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
                      'flex items-center gap-4 bg-white p-3 md:p-4 rounded-[1.5rem] border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all group',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
                      isUnavailable
                        ? 'opacity-60 grayscale cursor-not-allowed'
                        : 'cursor-pointer hover:shadow-[0_8px_20px_rgba(6,103,172,0.08)] hover:-translate-y-0.5 active:scale-[0.98]'
                    )}
                  >
                    {/* Image Thumbnail */}
                    <div className="h-16 w-16 md:h-20 md:w-20 bg-zinc-50 relative overflow-hidden shrink-0 rounded-2xl">
                      {menu.image_url ? (
                        <Image 
                          src={menu.image_url} 
                          alt={menu.name}
                          fill
                          sizes="(max-width: 768px) 5rem, 5rem"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-200 p-2 text-center">
                          <span className="text-[8px] font-black uppercase tracking-widest leading-tight">Ayam</span>
                        </div>
                      )}
                      {isUnavailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                          <span className="text-[9px] text-white font-black uppercase tracking-tighter">Habis</span>
                        </div>
                      )}
                    </div>

                    {/* Menu Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-[#3d2b1f] text-sm md:text-base leading-tight uppercase tracking-tight group-hover:text-brand-primary transition-colors truncate">
                        {menu.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-sm md:text-base font-black text-brand-primary tracking-tighter">
                          Rp {new Intl.NumberFormat('id-ID').format(menu.price)}
                        </p>
                        {menu.current_stock > 0 && menu.current_stock <= 10 && (
                          <span className="text-[9px] font-black text-brand-tertiary bg-orange-50 px-2 py-1 rounded-lg uppercase tracking-widest border border-orange-100">
                            Sisa {menu.current_stock}
                          </span>
                        )}
                        {menu.current_stock > 10 && (
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-widest border border-emerald-100">
                            Stok: {menu.current_stock}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 ml-2">
                      <button 
                        className={cn(
                          "flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full transition-colors",
                          isUnavailable 
                            ? "bg-zinc-100 text-zinc-400"
                            : "bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white"
                        )}
                      >
                        <ShoppingBasket size={18} className="md:hidden" />
                        <ShoppingBasket size={22} className="hidden md:block" />
                      </button>
                    </div>
                  </div>
                )
              })}
              
              {filteredMenus.length === 0 && (
                <div className="text-center py-20 text-zinc-400">
                  <p className="font-bold uppercase tracking-widest">Tidak ada menu ditemukan</p>
                </div>
              )}
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
          totalPrice={totalPrice}
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
        menu={selectedMenu as any} 
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

