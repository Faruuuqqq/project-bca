'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Home, Printer, Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const orderId = searchParams.get('id')
  
  const [order, setOrder] = useState<any>(null)
  const [countdown, setCountdown] = useState(7)

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
      
      if (data) setOrder(data)
    }

    fetchOrder()

    // Auto redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [orderId, router, supabase])

  // Handle redirect when countdown reaches 0
  useEffect(() => {
    if (countdown <= 0) {
      router.push('/')
    }
  }, [countdown, router])

  if (!order) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f1e7]">
      <Loader2 className="h-12 w-12 animate-spin text-[#d42c2c]" />
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f1e7] p-6">
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-lg mx-auto w-full">
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
            <CheckCircle2 size={64} />
          </div>
          <h1 className="text-3xl font-black text-[#3d2b1f]">PESANAN DITERIMA!</h1>
          <p className="text-[#7a5c48]">Silakan ambil struk Anda dan tunggu nomor dipanggil.</p>
        </div>

        {/* Big Queue Card */}
        <div className="w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-[#d42c2c]/10">
          <div className="bg-[#d42c2c] p-6 text-white text-center">
            <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Nomor Antrean</p>
            <h2 className="text-[120px] font-black leading-none py-4 tracking-tighter">
              {order.queue_number}
            </h2>
            {order.customer_name && (
              <p className="text-xl font-bold border-t border-white/20 pt-4 mt-2">
                {order.customer_name}
              </p>
            )}
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-[#3d2b1f] uppercase text-xs tracking-widest opacity-50">Ringkasan Pesanan</h3>
              <div className="space-y-3">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="text-sm">
                      <p className="font-bold text-[#3d2b1f]">{item.quantity}x {item.menu_name}</p>
                      {item.order_item_options?.length > 0 && (
                        <p className="text-[10px] text-zinc-400">
                          {item.order_item_options.map((o: any) => o.value_label).join(', ')}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-medium text-zinc-600">
                      Rp {new Intl.NumberFormat('id-ID').format(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <p className="font-bold text-[#3d2b1f]">Total Bayar</p>
                <p className="text-xl font-black text-[#d42c2c]">
                  Rp {new Intl.NumberFormat('id-ID').format(order.total_price)}
                </p>
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-400">
                <p>Metode: {order.payment_method}</p>
                <p>{new Date(order.created_at).toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full space-y-4 pt-4">
          <Button 
            className="w-full h-16 rounded-2xl bg-[#d42c2c] text-white text-lg font-bold hover:bg-[#b02424] shadow-lg group"
            onClick={() => router.push('/')}
          >
            <Home className="mr-2" /> 
            Selesai
            <div className="ml-auto bg-white/20 px-2 py-1 rounded text-xs font-mono">
              {countdown}s
            </div>
          </Button>
          
          <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm">
            <Printer size={16} />
            <p>Struk sedang dicetak...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f8f1e7]">
        <Loader2 className="h-12 w-12 animate-spin text-[#d42c2c]" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
