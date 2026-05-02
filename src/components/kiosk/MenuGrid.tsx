'use client'

import { useState, useEffect } from 'react'
import { Category } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { CustomizationSheet } from './CustomizationSheet'
import { useCartStore } from '@/store/cart'
import { ShoppingBasket, ChevronRight, Loader2 } from 'lucide-react'
import { CartSheet } from './CartSheet'
import { PaymentMethodModal } from './PaymentMethodModal'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createOrder } from '@/actions/order'
import { QRISScreen } from './QRISScreen'
import { CashWaitScreen } from './CashWaitScreen'
import { toast } from 'sonner'

interface MenuGridProps {
  initialCategories: Category[]
  initialMenus: any[]
}

export function MenuGrid({ initialCategories, initialMenus }: MenuGridProps) {
  const router = useRouter()
  const supabase = createClient()
  const { items, orderType } = useCartStore()
  
  const [menus, setMenus] = useState(initialMenus)
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategories[0]?.id || 'all'
  )
  const [selectedMenu, setSelectedMenu] = useState<any | null>(null)
  const [isCustomSheetOpen, setIsCustomSheetOpen] = useState(false)
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  // Payment states
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [paymentStep, setPaymentStep] = useState<'none' | 'qris' | 'cash'>('none')

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0)

  // Realtime subscription for sold-out and stock sync
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

  const handleMenuClick = (menu: any) => {
    // Menu is unavailable if manually sold out OR stock <= 0
    if (menu.is_sold_out || menu.current_stock <= 0) return
    setSelectedMenu(menu)
    setIsCustomSheetOpen(true)
  }

  const handleCheckout = () => {
    setIsCartSheetOpen(false)
    setIsPaymentModalOpen(true)
  }

  const handleSelectPayment = async (method: 'QRIS' | 'CASH', customerName: string) => {
    setIsPaymentModalOpen(false)
    setIsCreatingOrder(true)
    
    try {
      const result = await createOrder({
        items,
        orderType: orderType!,
        paymentMethod: method,
        customerName
      })

      if (result.success) {
        setOrderData({
          ...result,
          customerName
        })
        setPaymentStep(method === 'QRIS' ? 'qris' : 'cash')
      }
    } catch (error: any) {
      console.error('Checkout Error:', error)
      toast.error(error.message || 'Gagal memproses pesanan. Silakan coba lagi.')
    } finally {
      setIsCreatingOrder(false)
    }
  }

  const filteredMenus = menus.filter((menu) => 
    selectedCategory === 'all' || menu.category_id === selectedCategory
  )

  return (
    <div className="flex h-full flex-col relative">
      {/* Category Tabs */}
      <div className="bg-white px-4 py-2 shadow-sm">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="bg-transparent p-0">
              <TabsTrigger 
                value="all"
                className="rounded-full px-6 py-2 data-[state=active]:bg-[#d42c2c] data-[state=active]:text-white"
              >
                Semua
              </TabsTrigger>
              {initialCategories.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="rounded-full px-6 py-2 data-[state=active]:bg-[#d42c2c] data-[state=active]:text-white"
                >
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </Tabs>
      </div>

      {/* Menus Grid */}
      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-4 pb-32 md:grid-cols-3 lg:grid-cols-4">
          {filteredMenus.map((menu) => {
            const isUnavailable = menu.is_sold_out || menu.current_stock <= 0;
            return (
              <Card 
                key={menu.id} 
                onClick={() => handleMenuClick(menu)}
                className={`overflow-hidden border-none shadow-md transition-all active:scale-95 ${
                  isUnavailable ? 'opacity-60 grayscale' : 'cursor-pointer hover:shadow-lg'
                }`}
              >
                <div className="aspect-square bg-zinc-200 relative">
                  {menu.image_url ? (
                    <img 
                      src={menu.image_url} 
                      alt={menu.name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-400">
                      No Image
                    </div>
                  )}
                  {isUnavailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Badge variant="destructive" className="text-lg px-4 py-1">HABIS</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="line-clamp-2 font-bold text-[#3d2b1f]">{menu.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm font-bold text-[#d42c2c]">
                      Rp {new Intl.NumberFormat('id-ID').format(menu.price)}
                    </p>
                    {menu.current_stock > 0 && menu.current_stock <= 10 && (
                      <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded">
                        Sisa {menu.current_stock}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Cart Summary Bar */}
      {totalItems > 0 && !isCreatingOrder && paymentStep === 'none' && (
        <div className="absolute bottom-6 left-6 right-6 z-20">
          <button 
            onClick={() => setIsCartSheetOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-[#d42c2c] p-4 text-white shadow-2xl transition-transform active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <ShoppingBasket size={32} />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-[#d42c2c]">
                  {totalItems}
                </span>
              </div>
              <div className="text-left">
                <p className="text-xs opacity-80 uppercase font-bold tracking-wider">Lihat Keranjang</p>
                <p className="text-lg font-black">
                  Rp {new Intl.NumberFormat('id-ID').format(totalPrice)}
                </p>
              </div>
            </div>
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isCreatingOrder && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 className="h-12 w-12 animate-spin text-[#d42c2c] mb-4" />
          <p className="text-lg font-bold text-[#3d2b1f]">Memproses Pesanan...</p>
        </div>
      )}

      {/* Payment Screens */}
      {paymentStep === 'qris' && orderData && (
        <QRISScreen 
          orderId={orderData.orderId}
          snapToken={orderData.snapToken}
          onCancel={() => setPaymentStep('none')}
        />
      )}

      {paymentStep === 'cash' && orderData && (
        <CashWaitScreen 
          orderId={orderData.orderId}
          queueNumber={orderData.queueNumber}
          customerName={orderData.customerName}
          onCancel={() => setPaymentStep('none')}
        />
      )}

      <CustomizationSheet 
        menu={selectedMenu} 
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
