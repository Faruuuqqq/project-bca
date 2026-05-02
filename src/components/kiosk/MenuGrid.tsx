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

  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [paymentStep, setPaymentStep] = useState<'none' | 'qris' | 'cash'>('none')

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0)

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
        setOrderData({ ...result, customerName })
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
    <div className="flex h-full flex-col relative overflow-hidden bg-zinc-50">
      {/* Category Tabs */}
      <div className="bg-white px-4 py-2 shadow-sm shrink-0">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="bg-transparent p-0 flex gap-2 h-auto">
              <TabsTrigger 
                value="all"
                className="rounded-full px-5 py-2.5 font-bold border-2 border-transparent data-[state=active]:bg-brand-primary data-[state=active]:text-white transition-all text-sm uppercase tracking-wider text-zinc-500"
              >
                Semua
              </TabsTrigger>
              {initialCategories.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="rounded-full px-5 py-2.5 font-bold border-2 border-transparent data-[state=active]:bg-brand-primary data-[state=active]:text-white transition-all text-sm uppercase tracking-wider text-zinc-500"
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
      <ScrollArea className="flex-1 min-h-0 w-full overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5 p-4 md:p-6 pb-32">
          {filteredMenus.map((menu) => {
            const isUnavailable = menu.is_sold_out || menu.current_stock <= 0;
            return (
              <Card 
                key={menu.id} 
                onClick={() => handleMenuClick(menu)}
                className={`overflow-hidden border-none shadow-lg transition-all active:scale-95 flex flex-col h-full bg-white rounded-3xl ${
                  isUnavailable ? 'opacity-60 grayscale' : 'cursor-pointer hover:shadow-2xl hover:-translate-y-1'
                }`}
              >
                <div className="aspect-square bg-zinc-100 relative overflow-hidden shrink-0">
                  {menu.image_url ? (
                    <img 
                      src={menu.image_url} 
                      alt={menu.name} 
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-zinc-300">
                      <span className="text-[10px] font-black uppercase tracking-widest">Kalintang</span>
                    </div>
                  )}
                  {isUnavailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <Badge variant="destructive" className="text-sm px-4 py-1.5 font-black uppercase tracking-tighter shadow-xl">HABIS</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4 flex flex-col justify-between flex-1 gap-2">
                  <div>
                    <h3 className="line-clamp-2 font-black text-[#3d2b1f] text-sm md:text-base leading-tight uppercase tracking-tight">{menu.name}</h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1 opacity-60">{menu.categories?.name}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-auto">
                    <p className="text-base md:text-lg font-black text-brand-primary tracking-tighter">
                      Rp {new Intl.NumberFormat('id-ID').format(menu.price)}
                    </p>
                    {menu.current_stock > 0 && menu.current_stock <= 10 && (
                      <span className="text-[9px] font-black text-brand-tertiary bg-orange-50 px-2 py-1 rounded-lg uppercase tracking-widest border border-orange-100 self-start">
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
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-6">
          <button 
            onClick={() => setIsCartSheetOpen(true)}
            className="flex w-full items-center justify-between rounded-3xl bg-brand-primary p-5 text-white shadow-[0_20px_50px_rgba(6,103,172,0.3)] transition-all active:scale-95 border-b-4 border-blue-900"
          >
            <div className="flex items-center gap-4">
              <div className="relative p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <ShoppingBasket size={28} />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-secondary text-xs font-black text-white shadow-lg">
                  {totalItems}
                </span>
              </div>
              <div className="text-left">
                <p className="text-[10px] opacity-80 uppercase font-black tracking-widest leading-none mb-1">Cek Pesanan</p>
                <p className="text-xl font-black tracking-tighter">
                  Rp {new Intl.NumberFormat('id-ID').format(totalPrice)}
                </p>
              </div>
            </div>
            <div className="bg-white/20 p-2 rounded-xl text-brand-secondary">
              <ChevronRight size={24} />
            </div>
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isCreatingOrder && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-6 border-4 border-brand-primary/10">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-brand-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-brand-primary animate-ping" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-brand-primary uppercase tracking-tighter">Memproses Pesanan</p>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Mohon tunggu sebentar...</p>
            </div>
          </div>
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
