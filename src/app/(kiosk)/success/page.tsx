'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Home, Printer, Loader2, PartyPopper } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Receipt } from '@/components/receipt/Receipt'

interface OrderItemOption {
  id: string
  value_label: string
}

interface OrderItem {
  id: string
  menu_name: string
  quantity: number
  subtotal: number
  order_item_options?: OrderItemOption[]
}

interface Order {
  queue_number: string
  total_price: number
  order_type: string
  payment_method: string
  created_at: string
  order_items?: OrderItem[]
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const orderId = searchParams.get('id')
  
  const [order, setOrder] = useState<Order | null>(null)
  const [countdown, setCountdown] = useState(12)
  const hasPrinted = useRef(false)

  useEffect(() => {
    if (!orderId) {
      router.push('/')
      return
    }

    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            order_item_options (*)
          )
        `)
        .eq('id', orderId)
        .single()
      
       if (data) setOrder(data as unknown as Order)
    }

    fetchOrder()

    // Auto redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [orderId, router, supabase])

  // Removed window.print

  // Handle redirect when countdown reaches 0
  useEffect(() => {
    if (countdown <= 0) {
      router.push('/')
    }
  }, [countdown, router])

  if (!order) return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 p-4 md:p-8 overflow-hidden items-center justify-center">
      <div className="w-full max-w-lg flex flex-col space-y-4 animate-in fade-in duration-700">
        
        {/* Header - Compact */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center text-brand-primary shadow-inner border-2 border-white">
            <PartyPopper size={32} />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-[#3d2b1f] tracking-tight uppercase leading-none">Pesanan Diterima!</h1>
            <p className="text-[10px] text-zinc-500 font-medium">Terima kasih telah memesan di Ayam Kalintang.</p>
          </div>
        </div>

        {/* Big Queue Card - Compacted */}
        <div className="w-full bg-white rounded-[2rem] shadow-xl overflow-hidden border-4 border-brand-primary/5">
          <div className="bg-brand-primary p-6 text-white text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em] mb-1">Nomor Antrean</p>
              <h2 className="text-8xl font-black leading-none py-1 tracking-tighter text-brand-secondary drop-shadow-md">
              {order.queue_number}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">Terminal #01</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-200" />
                <h3 className="font-black text-[#3d2b1f] uppercase text-[10px] tracking-[0.25em]">Ringkasan Pesanan</h3>
                <div className="h-px flex-1 bg-zinc-200" />
              </div>

              <div className="space-y-2.5 max-h-[180px] overflow-y-auto px-1 custom-scrollbar">
                {order.order_items?.map((item: OrderItem) => (
                  <div key={item.id} className="flex justify-between items-start text-xs">
                    <div className="flex-1 pr-4">
                      <p className="font-black text-[#3d2b1f] uppercase leading-tight">{item.quantity}x {item.menu_name}</p>
                      {item.order_item_options && item.order_item_options.length > 0 && (
                        <p className="text-[9px] text-zinc-400 font-medium italic">
                          {item.order_item_options.map((o: OrderItemOption) => o.value_label).join(', ')}
                        </p>
                      )}
                    </div>
                    <p className="font-black text-brand-primary whitespace-nowrap">
                      Rp {new Intl.NumberFormat('id-ID').format(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="bg-zinc-50" />

              <div className="flex justify-between items-center px-1">
                <p className="font-black text-zinc-400 uppercase text-[10px] tracking-widest">Total Bayar</p>
                <p className="text-xl font-black text-brand-primary tracking-tighter">
                  Rp {new Intl.NumberFormat('id-ID').format(order.total_price)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button - Compact */}
        <div className="w-full space-y-4 pt-2">
          <Button 
            className="w-full h-14 rounded-2xl bg-[#3d2b1f] text-white text-lg font-black hover:bg-black shadow-lg transition-all active:scale-[0.98] group relative overflow-hidden"
            onClick={() => router.push('/')}
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              <Home size={20} /> 
              <span>SELESAI</span>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 px-2.5 py-1 rounded-lg text-[10px] font-mono backdrop-blur-md border border-white/10">
              {countdown}s
            </div>
          </Button>
          
          <div className="flex items-center justify-center gap-2 text-brand-neutral font-black text-[9px] uppercase tracking-[0.15em] animate-pulse">
            <Printer size={14} />
            <p>Struk Sedang Dicetak...</p>
          </div>
        </div>
      </div>

      {/* Hidden Receipt — only visible during print */}
      {order && (
        <Receipt
          queueNumber={order.queue_number}
          totalPrice={order.total_price}
          orderType={order.order_type}
          paymentMethod={order.payment_method}
          items={order.order_items || []}
          createdAt={order.created_at}
        />
      )}
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
