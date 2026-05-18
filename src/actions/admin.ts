'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  DashboardRange,
  DashboardStats,
} from '@/types/dashboard'

type RangeWindow = {
  start: Date
  end: Date
  prevStart: Date
  prevEnd: Date
  labelMode: 'hour' | 'day'
}

function rangeWindow(range: DashboardRange, now: Date = new Date()): RangeWindow {
  const end = new Date(now)
  const start = new Date(now)

  if (range === 'today') {
    start.setHours(0, 0, 0, 0)
  } else if (range === '7d') {
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
  } else if (range === '30d') {
    start.setDate(start.getDate() - 29)
    start.setHours(0, 0, 0, 0)
  } else {
    // mtd: from 1st of current month
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  }

  // Previous period of equal length, ending right before `start`.
  const periodMs = end.getTime() - start.getTime()
  const prevEnd = new Date(start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - periodMs)

  return {
    start,
    end,
    prevStart,
    prevEnd,
    labelMode: range === 'today' ? 'hour' : 'day',
  }
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

type OrderRow = {
  id: string
  total_price: number
  order_type: 'dine-in' | 'take-away'
  payment_method: 'QRIS' | 'CASH'
  created_at: string
}

type OrderItemRow = {
  menu_name: string
  quantity: number
  menu_price: number
  menus: { cost_price: number | null } | null
}

async function fetchPaidOrders(
  supabase: Awaited<ReturnType<typeof createClient>>,
  start: Date,
  end: Date
): Promise<OrderRow[]> {
  const { data } = await supabase
    .from('orders')
    .select('id, total_price, order_type, payment_method, created_at')
    .eq('payment_status', 'paid')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())

  return (data ?? []) as OrderRow[]
}

async function fetchOrderItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderIds: string[]
): Promise<OrderItemRow[]> {
  if (orderIds.length === 0) return []
  const { data } = await supabase
    .from('order_items')
    .select('menu_name, quantity, menu_price, menus(cost_price)')
    .in('order_id', orderIds)

  return (data ?? []) as unknown as OrderItemRow[]
}

export async function getDashboardStats(
  range: DashboardRange = 'today'
): Promise<DashboardStats> {
  const supabase = await createClient()
  const win = rangeWindow(range)

  // Period orders + previous-period orders run in parallel
  const [currentOrders, previousOrders] = await Promise.all([
    fetchPaidOrders(supabase, win.start, win.end),
    fetchPaidOrders(supabase, win.prevStart, win.prevEnd),
  ])

  const currentItems = await fetchOrderItems(
    supabase,
    currentOrders.map((o) => o.id)
  )

  // Financials — current
  const revenue = currentOrders.reduce((s, o) => s + Number(o.total_price), 0)
  const orderCount = currentOrders.length
  const aov = orderCount > 0 ? revenue / orderCount : 0

  // Real gross profit: sum(qty * (menu_price - cost_price)) per item joined to menus.
  // Falls back to 0 cost if menus row missing or cost_price null.
  const grossProfit = currentItems.reduce((sum, item) => {
    const cost = Number(item.menus?.cost_price ?? 0)
    const margin = Number(item.menu_price) - cost
    return sum + margin * Number(item.quantity)
  }, 0)
  const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0

  // Financials — previous (for deltas)
  const prevRevenue = previousOrders.reduce((s, o) => s + Number(o.total_price), 0)
  const prevOrderCount = previousOrders.length
  const prevAov = prevOrderCount > 0 ? prevRevenue / prevOrderCount : 0

  // Operations
  const dineIn = currentOrders.filter((o) => o.order_type === 'dine-in').length
  const takeaway = currentOrders.filter((o) => o.order_type === 'take-away').length

  // Hourly buckets (only meaningful for today). For longer ranges, aggregate by day instead.
  let hourlyData: { hour: string; orders: number }[] = []
  if (win.labelMode === 'hour') {
    const buckets = new Map<number, number>()
    currentOrders.forEach((o) => {
      const h = new Date(o.created_at).getHours()
      buckets.set(h, (buckets.get(h) ?? 0) + 1)
    })
    hourlyData = Array.from(buckets.entries())
      .filter(([h]) => h >= 8 && h <= 22)
      .map(([h, count]) => ({
        hour: `${String(h).padStart(2, '0')}:00`,
        orders: count,
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour))
  } else {
    const buckets = new Map<string, number>()
    currentOrders.forEach((o) => {
      const day = new Date(o.created_at).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
      })
      buckets.set(day, (buckets.get(day) ?? 0) + 1)
    })
    hourlyData = Array.from(buckets.entries())
      .map(([hour, orders]) => ({ hour, orders }))
      .sort((a, b) => a.hour.localeCompare(b.hour))
  }

  // Weekly chart — keep simple: rolling 7d revenue by weekday short name
  const weeklyMap = new Map<string, number>()
  if (range !== 'today') {
    currentOrders.forEach((o) => {
      const day = new Date(o.created_at).toLocaleDateString('id-ID', {
        weekday: 'short',
      })
      weeklyMap.set(day, (weeklyMap.get(day) ?? 0) + Number(o.total_price))
    })
  } else {
    // Always show last 7 days context even when viewing today
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)
    const weekly = await fetchPaidOrders(supabase, weekStart, win.end)
    weekly.forEach((o) => {
      const day = new Date(o.created_at).toLocaleDateString('id-ID', {
        weekday: 'short',
      })
      weeklyMap.set(day, (weeklyMap.get(day) ?? 0) + Number(o.total_price))
    })
  }
  const weeklyChartData = Array.from(weeklyMap.entries()).map(([day, total]) => ({
    day,
    total,
  }))

  // Inventory snapshot (always current state, not range-filtered)
  const { data: inventoryData } = await supabase
    .from('menus')
    .select('id, name, current_stock, price')

  const inventoryValue =
    inventoryData?.reduce(
      (sum, item) => sum + Number(item.current_stock) * Number(item.price),
      0
    ) ?? 0

  const inventoryAlerts =
    inventoryData
      ?.filter((m) => Number(m.current_stock) <= 10)
      .sort((a, b) => Number(a.current_stock) - Number(b.current_stock))
      .slice(0, 5)
      .map((m) => ({
        id: m.id as string,
        name: m.name as string,
        current_stock: Number(m.current_stock),
      })) ?? []

  // Bestsellers — bounded by current range (was lifetime O(N))
  const bestsellerMap = new Map<string, number>()
  currentItems.forEach((item) => {
    bestsellerMap.set(
      item.menu_name,
      (bestsellerMap.get(item.menu_name) ?? 0) + Number(item.quantity)
    )
  })
  const bestsellers = Array.from(bestsellerMap.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  // Payment split
  const qris = currentOrders.filter((o) => o.payment_method === 'QRIS').length
  const cash = currentOrders.filter((o) => o.payment_method === 'CASH').length

  return {
    range,
    financials: {
      revenue,
      revenueDelta: pctDelta(revenue, prevRevenue),
      orders: orderCount,
      ordersDelta: pctDelta(orderCount, prevOrderCount),
      aov,
      aovDelta: pctDelta(aov, prevAov),
      inventoryValue,
      grossProfit,
      grossMarginPct,
    },
    operations: { dineIn, takeaway, hourlyData },
    weeklyChartData,
    inventoryAlerts,
    bestsellers,
    paymentStats: { qris, cash },
  }
}

export async function adjustStock(menuId: string, amount: number, reason: string) {
  const supabase = await createClient()

  const { data: menu, error: fetchError } = await supabase
    .from('menus')
    .select('current_stock')
    .eq('id', menuId)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  const newStock = (menu.current_stock || 0) + amount

  const { error: updateError } = await supabase
    .from('menus')
    .update({ current_stock: newStock })
    .eq('id', menuId)

  if (updateError) throw new Error(updateError.message)

  const { error: logError } = await supabase
    .from('inventory_movements')
    .insert({
      menu_id: menuId,
      movement_type: amount >= 0 ? 'in' : 'out',
      quantity: Math.abs(amount),
      reason: reason,
    })

  if (logError) throw new Error(logError.message)

  revalidatePath('/admin/inventory')
  return { success: true }
}

export async function getInventoryHistory() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*, menus(name)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return data
}

export async function getOrdersHistory(limit: number = 100, offset: number = 0) {
  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from('orders')
    .select(
      'id, total_price, order_type, payment_method, payment_status, created_at, order_status, order_items(menu_name, quantity, menu_price)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)
  return { orders: data, total: count }
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(menu_name, quantity, menu_price)')
    .eq('id', orderId)
    .single()

  if (error) throw new Error(error.message)
  return data
}
