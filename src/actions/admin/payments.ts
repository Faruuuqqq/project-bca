'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Get payment history with aggregated statistics
 */
export async function getPaymentHistory(limit: number = 100, offset: number = 0) {
  const supabase = await createClient()
  
  const { data, error, count } = await supabase
    .from('orders')
    .select(
      'id, total_price, payment_method, payment_status, order_type, created_at, order_items(menu_name, quantity, menu_price)',
      { count: 'exact' }
    )
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)
  return { payments: data, total: count }
}

/**
 * Get payment statistics (cash vs QRIS, success rate, etc)
 */
export async function getPaymentStatistics(dateFrom?: string, dateTo?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('orders')
    .select('total_price, payment_method, payment_status')
    .eq('payment_status', 'paid')

  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  const stats = {
    totalRevenue: 0,
    qrisRevenue: 0,
    cashRevenue: 0,
    qrisCount: 0,
    cashCount: 0,
  }

  data?.forEach((order) => {
    stats.totalRevenue += order.total_price || 0
    if (order.payment_method === 'QRIS') {
      stats.qrisRevenue += order.total_price || 0
      stats.qrisCount++
    } else if (order.payment_method === 'CASH') {
      stats.cashRevenue += order.total_price || 0
      stats.cashCount++
    }
  })

  return stats
}

/**
 * Get menu sales statistics
 */
export async function getMenuSalesHistory(limit: number = 100, offset: number = 0) {
  const supabase = await createClient()

  const { data, error, count } = await supabase
    .from('order_items')
    .select(
      'menu_name, quantity, menu_price, menus(id, cost_price)',
      { count: 'estimated' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)

  const aggregated = new Map<
    string,
    {
      name: string
      units: number
      revenue: number
      cost: number
    }
  >()

  data?.forEach((item: { menu_name: string; quantity: number; menu_price: number; menus: Array<{ id: string; cost_price: number | null }> }) => {
    const key = item.menu_name
    const current = aggregated.get(key) || {
      name: item.menu_name,
      units: 0,
      revenue: 0,
      cost: 0,
    }

    current.units += item.quantity || 0
    current.revenue += (item.menu_price || 0) * (item.quantity || 0)
    if (item.menus?.[0]?.cost_price) {
      current.cost += item.menus[0].cost_price * (item.quantity || 0)
    }

    aggregated.set(key, current)
  })

  const results = Array.from(aggregated.values())
    .sort((a, b) => b.revenue - a.revenue)

  return { sales: results, total: count }
}

/**
 * Get top selling menu items
 */
export async function getTopSellingMenus(days: number = 30, limit: number = 10) {
  const supabase = await createClient()
  const dateFrom = new Date()
  dateFrom.setDate(dateFrom.getDate() - days)

  const { data, error } = await supabase
    .from('order_items')
    .select('menu_name, quantity, menu_price, menus(id, cost_price)')
    .gte('created_at', dateFrom.toISOString())
    .order('created_at', { ascending: false })
    .limit(2000)

  if (error) throw new Error(error.message)

  const aggregated = new Map<
    string,
    {
      name: string
      units: number
      revenue: number
      profit: number
    }
  >()

  data?.forEach((item: { menu_name: string; quantity: number; menu_price: number; menus: Array<{ id: string; cost_price: number | null }> }) => {
    const key = item.menu_name
    const current = aggregated.get(key) || {
      name: item.menu_name,
      units: 0,
      revenue: 0,
      profit: 0,
    }

    const itemRevenue = (item.menu_price || 0) * (item.quantity || 0)
    const itemCost = (item.menus?.[0]?.cost_price || 0) * (item.quantity || 0)

    current.units += item.quantity || 0
    current.revenue += itemRevenue
    current.profit += itemRevenue - itemCost

    aggregated.set(key, current)
  })

  return Array.from(aggregated.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}
