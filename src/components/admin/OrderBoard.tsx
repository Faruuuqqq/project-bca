'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Utensils, Timer, CheckCircle2, Monitor, LayoutGrid, ZapOff } from 'lucide-react'
import { completeOrder } from '@/actions/payment'
import { toggleSoldOut } from '@/actions/menu'
import { toast } from 'sonner'

function ElapsedTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState('')
  const [isDelayed, setIsDelayed] = useState(false)

  useEffect(() => {
    const calculate = () => {
      const start = new Date(startTime).getTime()
      const now = new Date().getTime()
      const diffInSeconds = Math.floor((now - start) / 1000)
      
      const minutes = Math.floor(diffInSeconds / 60)
      const seconds = diffInSeconds % 60
      
      if (minutes >= 15) setIsDelayed(true)
      setElapsed(`${minutes}m ${seconds}s`)
    }

    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-black text-[10px] transition-colors ${
      isDelayed ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-brand-primary/5 text-brand-primary'
    }`}>
      <Timer size={12} />
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
      toast.success('Selesai!')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 -mt-4 md:-mt-6">
      {/* MINIMAL KDS Header - Integrated into the background */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-[#3d2b1f] uppercase tracking-tighter">
                Antrean Masak
              </h3>
              <Badge className="bg-brand-secondary text-brand-primary text-[10px] px-2 py-0 rounded-md font-black shadow-sm">
                {activeOrders.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
               <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
               <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Kitchen Display System Active</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
           <div className="hidden md:flex flex-col text-right pr-4 border-r border-zinc-200">
              <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest leading-none mb-1">Terminal</p>
              <p className="text-[10px] font-black text-brand-primary uppercase">Dapur #01</p>
           </div>
           <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border shadow-sm">
              <LayoutGrid size={14} className="text-zinc-400" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Grid View</span>
           </div>
        </div>
      </div>

      {/* COMPACT Orders Grid - Target 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
        {activeOrders.map((order) => (
          <Card 
            key={order.id} 
            className="border-none shadow-lg bg-white rounded-3xl overflow-hidden flex flex-col h-fit animate-in zoom-in duration-300"
          >
            {/* COMPACT Card Header */}
            <div className="bg-brand-primary px-4 py-3 text-white flex justify-between items-center shrink-0">
              <div className="flex flex-col">
                <span className="text-[8px] font-black opacity-50 uppercase tracking-widest">Antrean</span>
                <span className="text-3xl font-black tracking-tighter leading-none text-brand-secondary">#{order.queue_number}</span>
              </div>
              <div className="text-right">
                <Badge className="bg-white/10 text-white border-none text-[8px] font-black uppercase px-2 py-0">
                  {order.order_type === 'take-away' ? 'Bawa Pulang' : 'Makan Sini'}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-3 flex flex-col gap-3">
              {/* Timing info */}
              <div className="flex justify-between items-center border-b border-zinc-50 pb-2">
                <ElapsedTimer startTime={order.created_at} />
                <div className="flex items-center text-[9px] text-zinc-400 font-bold">
                  <Clock size={10} className="mr-1" />
                  {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Ultra Compact Item List */}
              <div className="space-y-1.5 min-h-[100px]">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between group/item border-l-2 border-brand-primary/20 pl-2 py-0.5">
                    <div className="flex gap-2 text-xs leading-tight">
                      <span className="font-black text-brand-primary shrink-0">{item.quantity}x</span>
                      <span className="font-bold text-[#3d2b1f] uppercase tracking-tight">{item.menu_name}</span>
                    </div>
                    {/* KILL SWITCH: Tandai Habis */}
                    <button 
                      onClick={async () => {
                        if (confirm(`Tandai ${item.menu_name} sebagai HABIS?`)) {
                          await toggleSoldOut(item.menu_id, true)
                          toast.error(`${item.menu_name} sekarang HABIS`)
                        }
                      }}
                      className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-50 text-red-400 rounded transition-all"
                      title="Tandai Habis"
                    >
                      <ZapOff size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Compact Action Button */}
              <Button 
                className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-b-4 border-green-800"
                onClick={() => handleComplete(order.id)}
              >
                <CheckCircle2 size={16} />
                SIAP
              </Button>
            </CardContent>
          </Card>
        ))}

        {activeOrders.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-300">
            <Utensils size={48} className="opacity-10 mb-4" />
            <p className="font-black text-lg uppercase tracking-tighter opacity-20">Dapur Bersih</p>
          </div>
        )}
      </div>
    </div>
  )
}
