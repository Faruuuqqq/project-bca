'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Utensils, Timer } from 'lucide-react'
import { completeOrder } from '@/actions/payment'
import { toast } from 'sonner'

function ElapsedTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    const calculate = () => {
      const start = new Date(startTime).getTime()
      const now = new Date().getTime()
      const diffInSeconds = Math.floor((now - start) / 1000)
      
      const minutes = Math.floor(diffInSeconds / 60)
      const seconds = diffInSeconds % 60
      
      setElapsed(`${minutes}m ${seconds}s`)
    }

    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 rounded-lg text-[#3d2b1f] font-black text-xs">
      <Timer size={14} className="text-[#d42c2c]" />
      <span>{elapsed}</span>
    </div>
  )
}

export function OrderBoard({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('orders')
              .select('*, order_items(*)')
              .eq('id', payload.new.id)
              .single()
            if (data) setOrders(prev => [...prev, data]) 
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.order_status === 'completed') {
              setOrders(prev => prev.filter(o => o.id !== payload.new.id))
            } else {
              setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const activeOrders = orders
    .filter(o => o.payment_status === 'paid' && o.order_status !== 'completed')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const handleComplete = async (orderId: string) => {
    try {
      await completeOrder(orderId)
      toast.success('Pesanan selesai')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border">
        <div>
          <h3 className="text-xl font-black text-[#3d2b1f] flex items-center gap-2">
            <Utensils className="text-[#d42c2c]" /> ANTREAN DAPUR
          </h3>
          <p className="text-xs text-zinc-400 font-medium">Monitor durasi masak secara realtime.</p>
        </div>
        <Badge className="bg-[#d42c2c] text-lg px-4 py-1">{activeOrders.length} Pesanan</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activeOrders.map((order) => (
          <Card 
            key={order.id} 
            className="border-none shadow-xl bg-white overflow-hidden flex flex-col h-full"
          >
            <div className="bg-[#3d2b1f] p-4 text-white flex justify-between items-center">
              <span className="text-4xl font-black tracking-tighter">#{order.queue_number}</span>
              <div className="text-right">
                <p className="text-[10px] font-bold opacity-60 uppercase">{order.order_type}</p>
                <p className="text-xs font-black">Pesanan Kiosk</p>
              </div>
            </div>
            
            <CardContent className="p-5 flex-1 flex flex-col">
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center">
                  <ElapsedTimer startTime={order.created_at} />
                  <div className="flex items-center text-[10px] text-zinc-400 font-bold">
                    <Clock size={12} className="mr-1" />
                    {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="space-y-1 bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                      <div className="flex justify-between text-sm">
                        <span className="font-black text-[#3d2b1f]">{item.quantity}x {item.menu_name}</span>
                      </div>
                      {/* Opsi kustomisasi bisa ditambahkan di sini */}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-end">
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 rounded-xl px-8 py-6 font-black text-lg shadow-lg shadow-green-100 active:scale-95 transition-all"
                  onClick={() => handleComplete(order.id)}
                >
                  SIAP ✓
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {activeOrders.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-300">
            <Clock size={64} className="mb-4 opacity-20" />
            <p className="font-bold text-lg">Belum ada pesanan aktif</p>
          </div>
        )}
      </div>
    </div>
  )
}
