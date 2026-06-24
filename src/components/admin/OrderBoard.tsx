'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Utensils,
  Timer,
  CheckCircle2,
  Bell,
  Printer,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { completeOrder, togglePriority, reprintReceipt, voidOrder } from '@/actions/payment'
import { sendToRawBT } from '@/lib/rawbt-client'
import { toast } from 'sonner'
import { playNotificationSound } from '@/lib/audio'
import { cn, formatTime } from '@/lib/utils'
import { adminTokens } from '@/components/admin/_tokens'

type ConnState = 'connecting' | 'connected' | 'error'

type OrderItemOption = {
  id: string
  option_name: string
  value_label: string
}

type OrderItem = {
  id: string
  menu_id: string
  menu_name: string
  quantity: number
  order_item_options?: OrderItemOption[]
}

type Order = {
  id: string
  queue_number: string
  order_type: 'dine-in' | 'take-away'
  payment_status: string
  order_status: 'pending' | 'cooking' | 'ready' | 'completed' | 'void'
  is_priority?: boolean
  created_at: string
  updated_at?: string
  order_items?: OrderItem[]
}

type AgeTier = {
  bucketLabel: string
  className: string
}

function ageTier(elapsedMin: number): AgeTier {
  if (elapsedMin < 5) {
    return { bucketLabel: 'calm', className: 'bg-emerald-50 text-emerald-700' }
  }
  if (elapsedMin < 10) {
    return { bucketLabel: 'watch', className: 'bg-amber-50 text-amber-700' }
  }
  if (elapsedMin < 15) {
    return { bucketLabel: 'warn', className: 'bg-orange-100 text-orange-800' }
  }
  return {
    bucketLabel: 'critical',
    className: 'bg-red-100 text-red-700 animate-pulse',
  }
}

function ElapsedTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState<{ minutes: number; seconds: number } | null>(null)

  useEffect(() => {
    const tick = () => setElapsed(computeElapsed(startTime))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  if (elapsed === null) {
    return (
      <div
        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold text-muted-foreground bg-muted/30"
        role="timer"
      >
        <Timer size={12} aria-hidden="true" />
        <span className="tabular-nums">--:--</span>
      </div>
    )
  }

  const tier = ageTier(elapsed.minutes)

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition-colors tabular-nums',
        tier.className
      )}
      role="timer"
    >
      <Timer size={12} aria-hidden="true" />
      <span>
        {elapsed.minutes}m {String(elapsed.seconds).padStart(2, '0')}s
      </span>
    </div>
  )
}

function computeElapsed(startTime: string) {
  const diffSec = Math.max(
    0,
    Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
  )
  return { minutes: Math.floor(diffSec / 60), seconds: diffSec % 60 }
}

export function OrderBoard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)

  // Sync state when props change (e.g. after full page refresh or navigation)
  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  const [connState, setConnState] = useState<ConnState>('connecting')
  
  const supabase = useMemo(() => createClient(), [])

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
              .select('*, order_items(*, order_item_options(*))')
              .eq('id', payload.new.id)
              .eq('payment_status', 'paid')
              .single()
            if (data) {
              setOrders((prev) =>
                prev.find((o) => o.id === data.id) ? prev : [...prev, data as Order]
              )
              playNotificationSound()
            }
          } else if (payload.eventType === 'UPDATE') {
            const next = payload.new as Partial<Order> & { id: string; order_status: Order['order_status']; payment_status: string }
            if (next.order_status === 'completed' || next.order_status === 'void') {
              setOrders((prev) => prev.filter((o) => o.id !== next.id))
              return
            }
            if (next.payment_status !== 'paid') {
              setOrders((prev) => prev.filter((o) => o.id !== next.id))
              return
            }
            setOrders((prev) => {
              const exists = prev.find((o) => o.id === next.id)
              if (exists) {
                // If it just became paid from pending, play sound
                if (exists.payment_status !== 'paid' && next.payment_status === 'paid') {
                   playNotificationSound()
                }
                return prev.map((o) => (o.id === next.id ? { ...o, ...next } : o))
              }
              void (async () => {
                const { data } = await supabase
                  .from('orders')
                  .select('*, order_items(*, order_item_options(*))')
                  .eq('id', next.id)
                  .single()
                if (data) {
                  setOrders((p) =>
                    p.find((o) => o.id === data.id) ? p : [...p, data as Order]
                  )
                  playNotificationSound()
                }
              })()
              return prev
            })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnState('connected')
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnState('error')
        } else {
          setConnState('connecting')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const activeQueue = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            o.payment_status === 'paid' &&
            o.order_status !== 'completed' &&
            o.order_status !== 'void'
        )
        .sort((a, b) => {
          if (a.is_priority !== b.is_priority) {
            return a.is_priority ? -1 : 1
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        }),
    [orders]
  )

  const handlePickup = async (order: Order) => {
    try {
      await completeOrder(order.id)
      toast.success(`#${order.queue_number} diserahkan ke pelanggan`)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const handleTogglePriority = async (orderId: string, currentStatus: boolean) => {
    try {
      await togglePriority(orderId, currentStatus)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      

      {/* Header */}
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className={adminTokens.pageTitle}>Pesanan Aktif</h1>
            <Badge className="bg-brand-secondary text-brand-primary text-xs px-2 py-0.5 font-bold rounded-md">
              {activeQueue.length}
            </Badge>
            <ConnectionPill state={connState} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"
              aria-hidden="true"
            />
            <p className={adminTokens.pageSubtitle}>Daftar pesanan yang sedang diproses</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-xl border border-border shadow-sm">
            <Bell size={14} className="text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-semibold text-muted-foreground">Kasir Utama</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4 auto-rows-fr">
        {activeQueue.map((order, idx) => (
          <ActiveOrderCard
            key={order.id}
            order={order}
            position={idx + 1}
            onPickup={() => handlePickup(order)}
            onTogglePriority={handleTogglePriority}
          />
        ))}
        {activeQueue.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-muted-foreground gap-3 bg-card rounded-2xl border border-dashed border-border">
            <Utensils size={32} className="opacity-30" aria-hidden="true" />
            <p className="font-semibold text-sm uppercase tracking-wide opacity-60">
              Tidak ada pesanan aktif
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ConnectionPill({ state }: { state: ConnState }) {
  if (state === 'connected') {
    return (
      <span
        className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md text-xs font-semibold"
      >
        <Wifi size={12} aria-hidden="true" />
        Live
      </span>
    )
  }
  if (state === 'error') {
    return (
      <span
        className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md text-xs font-semibold animate-pulse"
      >
        <WifiOff size={12} aria-hidden="true" />
        Offline
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md text-xs font-semibold"
    >
      <Wifi size={12} aria-hidden="true" />
      Sambung...
    </span>
  )
}

function OptionsRow({ options }: { options?: OrderItemOption[] }) {
  if (!options || options.length === 0) return null
  return (
    <div className="text-xs text-muted-foreground italic ml-4 leading-snug">
      {options.map((o) => o.value_label).join(' • ')}
    </div>
  )
}


function ActiveOrderCard({
  order,
  position,
  onPickup,
  onTogglePriority,
}: {
  order: Order
  position: number
  onPickup: () => void
  onTogglePriority: (id: string, current: boolean) => void
}) {
  const isRush = order.is_priority
  const [isPrinting, setIsPrinting] = useState(false)
  const [showVoidPin, setShowVoidPin] = useState(false)
  const [voidPin, setVoidPin] = useState('')
  const [isVoiding, setIsVoiding] = useState(false)

  const handleReprint = async () => {
    setIsPrinting(true)
    const toastId = toast.loading('Mencetak ulang struk...')
    try {
      const res = await reprintReceipt(order.id)
      if (res.error) throw new Error(res.error)
      if (res.rawbtUrl) {
        sendToRawBT(res.rawbtUrl)
      }
      toast.success('Struk berhasil dicetak', { id: toastId })
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setIsPrinting(false)
    }
  }

  const handleVoid = async () => {
    if (voidPin.length !== 4) return toast.error('PIN harus 4 digit')
    setIsVoiding(true)
    try {
      const res = await voidOrder(order.id, voidPin)
      if (res.error) throw new Error(res.error)
      toast.success('Pesanan dibatalkan')
      setShowVoidPin(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsVoiding(false)
      setVoidPin('')
    }
  }

  return (
    <Card className={cn(
      "rounded-2xl shadow-sm overflow-hidden flex flex-col h-full animate-in zoom-in-95 duration-200 border-2",
      isRush ? "border-red-500 shadow-red-100" : "border-transparent"
    )}>
      {showVoidPin ? (
        <div className="flex flex-col h-full p-6 items-center justify-center bg-red-50 z-10">
          <Trash2 size={40} className="text-red-500 mb-4 animate-bounce" />
          <h3 className="font-black text-red-700 text-lg uppercase tracking-wider mb-2">Batalkan Pesanan?</h3>
          <p className="text-xs text-red-600/80 text-center mb-6 font-bold">Masukkan PIN Kasir untuk membatalkan antrean #{order.queue_number}</p>
          
          <input 
            type="password"
            maxLength={4}
            value={voidPin}
            onChange={(e) => setVoidPin(e.target.value)}
            className="w-full text-center text-2xl tracking-[0.5em] font-black p-4 rounded-xl border-2 border-red-200 bg-white focus:border-red-500 outline-none mb-4"
            placeholder="PIN"
            autoFocus
          />
          <div className="flex w-full gap-2">
            <Button variant="outline" className="flex-1 rounded-xl text-zinc-500" onClick={() => { setShowVoidPin(false); setVoidPin(''); }}>
              Kembali
            </Button>
            <Button className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={handleVoid} disabled={isVoiding}>
              {isVoiding ? '...' : 'Konfirmasi'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className={cn(
            "px-3 py-3 text-white flex justify-between items-center shrink-0",
            isRush ? "bg-red-600" : "bg-brand-primary"
          )}>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70 inline-flex items-center gap-1">
                {isRush ? 'PRIORITAS' : `Antrean #${position}`}
              </span>
              <span className="text-3xl font-black tracking-tight leading-none text-white tabular-nums drop-shadow-sm">
                #{order.queue_number}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className="bg-white/20 text-white border-none text-[10px] lg:text-xs font-semibold px-2 py-0.5">
                {order.order_type === 'take-away' ? 'Bawa Pulang' : 'Makan Sini'}
              </Badge>
            </div>
          </div>

          <CardContent className="p-3 flex flex-col gap-3 flex-1 relative bg-white">
            <div className="flex justify-between items-center border-b border-border pb-2 shrink-0">
              <ElapsedTimer startTime={order.created_at} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold tabular-nums">
                <Clock size={12} className="mr-1" aria-hidden="true" />
                {formatTime(order.created_at)}
              </div>
            </div>

            <div className="space-y-2 flex-1 min-h-[80px] max-h-64 overflow-y-auto touch-scroll pr-1">
              {order.order_items?.map((item) => (
                <div
                  key={item.id}
                  className="text-sm leading-tight border-l-2 border-brand-primary/30 pl-2 py-0.5"
                >
                  <div className="flex gap-2">
                    <span className="font-bold text-brand-primary shrink-0 tabular-nums">
                      {item.quantity}x
                    </span>
                    <span className="font-semibold text-foreground line-clamp-1">{item.menu_name}</span>
                  </div>
                  <OptionsRow options={item.order_item_options} />
                </div>
              ))}
            </div>

            <div className="flex gap-2 shrink-0 pt-2 border-t border-border">
              <Button
                variant="outline"
                className={cn(
                  'h-12 w-12 min-h-[48px] rounded-xl shrink-0 transition-colors',
                  isRush ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'text-zinc-400 hover:text-red-500'
                )}
                onClick={() => onTogglePriority(order.id, !!isRush)}
                aria-label="Toggle Priority"
              >
                <Bell size={18} />
              </Button>
              
              <Button
                variant="outline"
                className="h-12 w-12 min-h-[48px] rounded-xl shrink-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50 border-blue-100 transition-colors"
                onClick={handleReprint}
                disabled={isPrinting}
                aria-label="Cetak Ulang"
              >
                <Printer size={18} />
              </Button>

              <Button
                variant="outline"
                className="h-12 w-12 min-h-[48px] rounded-xl shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 transition-colors"
                onClick={() => setShowVoidPin(true)}
                aria-label="Batalkan"
              >
                <Trash2 size={18} />
              </Button>
              
              <Button
                className={cn(
                  'flex-1 h-12 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors',
                  adminTokens.focus
                )}
                onClick={onPickup}
              >
                <CheckCircle2 size={18} aria-hidden="true" />
              </Button>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  )
}
