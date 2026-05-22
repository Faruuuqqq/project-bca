'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getDashboardStats() {
  const supabase = await createClient()
  
  // Date setup
  const now = new Date()
  const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString()
  
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const startDate = sevenDaysAgo.toISOString()

  // 1. Fetch Today's Orders
  const { data: todayOrders } = await supabase
    .from('orders')
    .select('total_price, order_type, payment_method, created_at')
    .eq('payment_status', 'paid')
    .gte('created_at', todayStart)

  const totalRevenueToday = todayOrders?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0
  const totalOrdersToday = todayOrders?.length || 0
  const avgOrderValue = totalOrdersToday > 0 ? totalRevenueToday / totalOrdersToday : 0

  // 2. Weekly Sales Trend
  const { data: weeklyDataRaw } = await supabase
    .from('orders')
    .select('total_price, created_at')
    .eq('payment_status', 'paid')
    .gte('created_at', startDate)

  const weeklyMap: Record<string, number> = {}
  weeklyDataRaw?.forEach(o => {
    const day = new Date(o.created_at).toLocaleDateString('id-ID', { weekday: 'short' })
    weeklyMap[day] = (weeklyMap[day] || 0) + Number(o.total_price)
  })
  const weeklyChartData = Object.entries(weeklyMap).map(([day, total]) => ({ day, total }))

  // 3. Peak Hour Analysis
  const hourlyMap: Record<number, number> = {}
  todayOrders?.forEach(o => {
    const hour = new Date(o.created_at).getHours()
    hourlyMap[hour] = (hourlyMap[hour] || 0) + 1
  })
  const hourlyData = Object.entries(hourlyMap).map(([hour, count]) => ({
    hour: `${hour.padStart(2, '0')}:00`,
    orders: count
  })).filter(h => parseInt(h.hour) >= 8 && parseInt(h.hour) <= 22)

  // 4. Inventory Value & Low Stock
  const { data: inventoryData } = await supabase
    .from('menus')
    .select('name, current_stock, price')

  const totalInventoryValue = inventoryData?.reduce((sum, item) => sum + (item.current_stock * Number(item.price)), 0) || 0
  const lowStockItems = inventoryData?.filter(i => i.current_stock <= 10).sort((a,b) => a.current_stock - b.current_stock).slice(0, 5) || []

  // 5. Bestsellers (Menu Engineering)
  const { data: bestsellerItems } = await supabase
    .from('order_items')
    .select('menu_name, quantity')
  
  const salesMap: Record<string, number> = {}
  bestsellerItems?.forEach(item => {
    salesMap[item.menu_name] = (salesMap[item.menu_name] || 0) + item.quantity
  })

  const sortedBestsellers = Object.entries(salesMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  return {
    financials: {
      revenue: totalRevenueToday,
      orders: totalOrdersToday,
      aov: avgOrderValue,
      inventoryValue: totalInventoryValue,
      estGrossProfit: totalRevenueToday * 0.65 // Owners love estimated profit (assuming 35% COGS/Food Cost)
    },
    operations: {
      dineIn: todayOrders?.filter(o => o.order_type === 'dine-in').length || 0,
      takeaway: todayOrders?.filter(o => o.order_type === 'take-away').length || 0,
      hourlyData
    },
    weeklyChartData,
    inventoryAlerts: lowStockItems,
    bestsellers: sortedBestsellers,
    paymentStats: {
      qris: todayOrders?.filter(o => o.payment_method === 'QRIS').length || 0,
      cash: todayOrders?.filter(o => o.payment_method === 'CASH').length || 0
    }
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
      amount: Math.abs(amount),
      reason: reason
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
