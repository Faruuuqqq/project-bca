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
  ChefHat,
  Bell,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { startCooking, markReady, completeOrder, togglePriority } from '@/actions/payment'
import { toast } from 'sonner'
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

// Calculate estimated prep time based on item count and order type
function estimatePrepTime(items: OrderItem[] = [], orderType: string) {
  let minutes = 0
  
  items.forEach(item => {
    // Base 2 mins per item
    minutes += item.quantity * 2
    
    // Add extra time for complex items
    if (item.menu_name.toLowerCase().includes('bakar') || 
        item.menu_name.toLowerCase().includes('utuh')) {
      minutes += 5 * item.quantity
    }
    
    // Add time for customizations
    if (item.order_item_options && item.order_item_options.length > 0) {
      minutes += 1 * item.quantity
    }
  })
  
  // Take-away adds 2 mins for packaging
  if (orderType === 'take-away') {
    minutes += 2
  }
  
  // Min 3 mins, Max 30 mins
  return Math.max(3, Math.min(minutes, 30))
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
    // Set initial elapsed on mount (after hydration)
    const tick = () => setElapsed(computeElapsed(startTime))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  // During SSR/hydration, render empty or placeholder
  if (elapsed === null) {
    return (
      <div
        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold text-muted-foreground bg-muted/30 rounded-md"
        role="timer"
        aria-label="Menghitung waktu..."
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
      aria-label={`Berlalu ${elapsed.minutes} menit ${elapsed.seconds} detik`}
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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = useMemo(() => createClient(), [])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Refetch with joins. Filter paid orders only.
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
              audioRef.current?.play().catch(() => {
                /* autoplay blocked; ignore */
              })
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
                return prev.map((o) => (o.id === next.id ? { ...o, ...next } : o))
              }
              // UPDATE for an order we don't yet have (e.g. payment_status flipped to paid). Refetch.
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
                  audioRef.current?.play().catch(() => {})
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

  // Sorted active queues
  const cookQueue = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            o.payment_status === 'paid' &&
            (o.order_status === 'pending' || o.order_status === 'cooking')
        )
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
    [orders]
  )

  const readyQueue = useMemo(
    () =>
      orders
        .filter((o) => o.payment_status === 'paid' && o.order_status === 'ready')
        .sort((a, b) => {
          const at = new Date(a.updated_at ?? a.created_at).getTime()
          const bt = new Date(b.updated_at ?? b.created_at).getTime()
          return at - bt
        }),
    [orders]
  )

  // Keyboard shortcuts: 1-9 advance the Nth cook-queue order.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement ||
          target.isContentEditable)
      ) {
        return
      }
      const idx = '123456789'.indexOf(e.key)
      if (idx === -1) return
      const order = cookQueue[idx]
      if (!order) return
      e.preventDefault()
      if (order.order_status === 'pending') {
        startCooking(order.id)
          .then(() => toast.success(`#${order.queue_number} mulai dimasak`))
          .catch((err) => toast.error((err as Error).message))
      } else if (order.order_status === 'cooking') {
        markReady(order.id)
          .then(() => toast.success(`#${order.queue_number} siap diambil`))
          .catch((err) => toast.error((err as Error).message))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cookQueue])

  const handleStart = async (order: Order) => {
    try {
      await startCooking(order.id)
      toast.success(`#${order.queue_number} mulai dimasak`)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const handleReady = async (order: Order) => {
    try {
      await markReady(order.id)
      toast.success(`#${order.queue_number} siap diambil`)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const handlePickup = async (order: Order) => {
    try {
      await completeOrder(order.id)
      toast.success(`#${order.queue_number} diambil pelanggan`)
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
      {/* Audio cue (gesture-gated by browser; first click anywhere unlocks) */}
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />

      {/* Header */}
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className={adminTokens.pageTitle}>Antrean Masak</h1>
            <Badge className="bg-brand-secondary text-brand-primary text-xs px-2 py-0.5 font-bold rounded-md">
              {cookQueue.length + readyQueue.length}
            </Badge>
            <ConnectionPill state={connState} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"
              aria-hidden="true"
            />
            <p className={adminTokens.pageSubtitle}>Kitchen Display System</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-xl border border-border shadow-sm">
            <Bell size={14} className="text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-semibold text-muted-foreground">Dapur #01</span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-3">
        {/* COOK QUEUE — wider */}
        <section
          aria-labelledby="cook-queue-heading"
          className="lg:col-span-2 space-y-2 lg:space-y-3"
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ChefHat size={18} className="text-brand-primary" aria-hidden="true" />
              <h2 id="cook-queue-heading" className={adminTokens.sectionTitle}>
                Antre Masak
              </h2>
              <Badge className="bg-blue-50 text-brand-primary border-none text-xs font-semibold">
                {cookQueue.length}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-3 auto-rows-fr">
            {cookQueue.map((order, idx) => (
              <CookCard
                key={order.id}
                order={order}
                position={idx + 1}
                onStart={() => handleStart(order)}
                onReady={() => handleReady(order)}
                onTogglePriority={handleTogglePriority}
              />
            ))}
            {cookQueue.length === 0 && (
              <EmptyState label="Tidak ada antrean masak" />
            )}
          </div>
        </section>

        {/* READY QUEUE */}
        <section aria-labelledby="ready-queue-heading" className="space-y-2 lg:space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-emerald-600" aria-hidden="true" />
              <h2 id="ready-queue-heading" className={adminTokens.sectionTitle}>
                Siap Diambil
              </h2>
              <Badge className="bg-emerald-50 text-emerald-700 border-none text-xs font-semibold">
                {readyQueue.length}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-3 auto-rows-fr">
            {readyQueue.map((order) => (
              <ReadyCard
                key={order.id}
                order={order}
                onPickup={() => handlePickup(order)}
              />
            ))}
            {readyQueue.length === 0 && <EmptyState label="Belum ada pesanan siap" />}
          </div>
        </section>
      </div>
    </div>
  )
}

function ConnectionPill({ state }: { state: ConnState }) {
  if (state === 'connected') {
    return (
      <span
        className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md text-xs font-semibold"
        role="status"
        aria-label="Realtime tersambung"
        title="Realtime tersambung"
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
        role="status"
        aria-label="Realtime terputus"
        title="Realtime terputus — refresh untuk reconnect"
      >
        <WifiOff size={12} aria-hidden="true" />
        Offline
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md text-xs font-semibold"
      role="status"
      aria-label="Menyambungkan realtime"
    >
      <Wifi size={12} aria-hidden="true" />
      Sambung...
    </span>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="col-span-full py-10 flex flex-col items-center justify-center text-muted-foreground gap-2 bg-card rounded-2xl border border-dashed border-border">
      <Utensils size={28} className="opacity-30" aria-hidden="true" />
      <p className="font-semibold text-sm uppercase tracking-wide opacity-60">
        {label}
      </p>
    </div>
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

function CookCard({
  order,
  position,
  onStart,
  onReady,
  onTogglePriority,
}: {
  order: Order
  position: number
  onStart: () => void
  onReady: () => void
  onTogglePriority: (id: string, current: boolean) => void
}) {
  const isCooking = order.order_status === 'cooking'
  const isRush = order.is_priority
  const estMins = estimatePrepTime(order.order_items, order.order_type)

  return (
    <Card className={cn(
      "rounded-2xl shadow-sm overflow-hidden flex flex-col h-full animate-in zoom-in-95 duration-200 border-2",
      isRush ? "border-red-500 shadow-red-100" : "border-transparent"
    )}>
      <div className={cn(
        "px-3 py-2 text-white flex justify-between items-center shrink-0",
        isRush ? "bg-red-600" : "bg-brand-primary"
      )}>
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70 inline-flex items-center gap-1">
            {position <= 9 && (
              <kbd className="bg-white/20 text-[10px] font-bold px-1 rounded">
                {position}
              </kbd>
            )}
            {isRush ? 'RUSH' : 'Antrean'}
          </span>
          <span className="text-2xl lg:text-3xl font-black tracking-tight leading-none text-white tabular-nums drop-shadow-sm">
            #{order.queue_number}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <Badge className="bg-white/20 text-white border-none text-[10px] lg:text-xs font-semibold px-2 py-0.5">
            {order.order_type === 'take-away' ? 'Bawa Pulang' : 'Makan Sini'}
          </Badge>
          {isCooking && (
            <Badge className="bg-amber-400 text-amber-900 border-none text-[10px] lg:text-xs font-bold px-2 py-0.5 inline-flex items-center gap-1 shadow-sm">
              <ChefHat size={10} aria-hidden="true" />
              Memasak
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-3 flex flex-col gap-2 flex-1 relative bg-white">
        <div className="flex justify-between items-center border-b border-border pb-1.5 shrink-0">
          <ElapsedTimer startTime={order.created_at} />
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase text-brand-primary tracking-widest bg-blue-50 px-1.5 py-0.5 rounded">Est {estMins}m</span>
            <div className="flex items-center text-[10px] lg:text-xs text-muted-foreground font-semibold tabular-nums">
              <Clock size={12} className="mr-1" aria-hidden="true" />
              {formatTime(order.created_at)}
            </div>
          </div>
        </div>

        <div className="space-y-1 flex-1 min-h-[60px] lg:min-h-[80px] max-h-48 lg:max-h-64 overflow-y-auto touch-scroll pr-1">
          {order.order_items?.map((item) => (
            <div
              key={item.id}
              className="text-xs lg:text-sm leading-tight border-l-2 border-brand-primary/30 pl-2 py-0.5"
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

        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            className={cn(
              'h-10 lg:h-12 w-12 min-h-[40px] rounded-xl shrink-0 transition-colors',
              isRush ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'text-zinc-400 hover:text-red-500'
            )}
            onClick={() => onTogglePriority(order.id, !!isRush)}
            aria-label="Toggle Priority"
          >
            <Bell size={16} />
          </Button>
          
          {isCooking ? (
            <Button
              className={cn(
                'w-full h-10 lg:h-12 min-h-[40px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs lg:text-sm shadow-sm flex items-center justify-center gap-2 shrink-0 transition-colors flex-1',
                adminTokens.focus
              )}
              onClick={onReady}
            >
              <CheckCircle2 size={16} aria-hidden="true" />
              Siap
            </Button>
          ) : (
            <Button
              className={cn(
                'w-full h-10 lg:h-12 min-h-[40px] bg-brand-primary hover:bg-brand-primary/90 active:bg-brand-primary/80 text-white rounded-xl font-bold text-xs lg:text-sm shadow-sm flex items-center justify-center gap-2 shrink-0 transition-colors flex-1',
                adminTokens.focus
              )}
              onClick={onStart}
            >
              <ChefHat size={16} aria-hidden="true" />
              Masak
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ReadyCard({
  order,
  onPickup,
}: {
  order: Order
  onPickup: () => void
}) {
  return (
    <Card className="rounded-2xl border-emerald-200 bg-emerald-50/40 shadow-sm overflow-hidden flex flex-col h-full animate-in zoom-in-95 duration-200">
      <div className="bg-emerald-600 px-3 py-2 text-white flex justify-between items-center shrink-0">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
            Siap Diambil
          </span>
          <span className="text-2xl lg:text-3xl font-black tracking-tight leading-none text-white tabular-nums">
            #{order.queue_number}
          </span>
        </div>
        <Badge className="bg-white/15 text-white border-none text-[10px] lg:text-xs font-semibold px-2 py-0.5">
          {order.order_type === 'take-away' ? 'Bawa Pulang' : 'Makan Sini'}
        </Badge>
      </div>

      <CardContent className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-center border-b border-emerald-200/60 pb-1.5 shrink-0">
          <ElapsedTimer startTime={order.created_at} />
          <div className="flex items-center text-[10px] lg:text-xs text-muted-foreground font-semibold tabular-nums">
            <Clock size={12} className="mr-1" aria-hidden="true" />
            {formatTime(order.updated_at ?? order.created_at)}
          </div>
        </div>

        <div className="space-y-1 flex-1 min-h-[60px] max-h-48 overflow-y-auto touch-scroll pr-1">
          {order.order_items?.map((item) => (
            <div
              key={item.id}
              className="text-xs lg:text-sm leading-tight border-l-2 border-emerald-500/40 pl-2 py-0.5"
            >
              <div className="flex gap-2">
                <span className="font-bold text-emerald-700 shrink-0 tabular-nums">
                  {item.quantity}x
                </span>
                <span className="font-semibold text-foreground line-clamp-1">{item.menu_name}</span>
              </div>
              <OptionsRow options={item.order_item_options} />
            </div>
          ))}
        </div>

        <Button
          className={cn(
            'w-full h-10 lg:h-12 min-h-[40px] bg-foreground hover:bg-foreground/90 active:bg-foreground/80 text-background rounded-xl font-bold text-xs lg:text-sm shadow-sm flex items-center justify-center gap-2 shrink-0 transition-colors',
            adminTokens.focus
          )}
          onClick={onPickup}
        >
          <CheckCircle2 size={16} aria-hidden="true" />
          Diambil
        </Button>
      </CardContent>
    </Card>
  )
}
