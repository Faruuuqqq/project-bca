'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDashboardStats() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const startDate = sevenDaysAgo.toISOString().split('T')[0]

  // 1. Total Revenue Today
  const { data: revenueData } = await supabase
    .from('orders')
    .select('total_price, created_at, payment_method')
    .eq('payment_status', 'paid')
    .gte('created_at', today)

  const totalRevenueToday = revenueData?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0

  // 2. Chart Data: Revenue Last 7 Days
  const { data: chartDataRaw } = await supabase
    .from('orders')
    .select('total_price, created_at')
    .eq('payment_status', 'paid')
    .gte('created_at', startDate)

  const chartMap: Record<string, number> = {}
  chartDataRaw?.forEach(o => {
    const day = new Date(o.created_at).toLocaleDateString('id-ID', { weekday: 'short' })
    chartMap[day] = (chartMap[day] || 0) + Number(o.total_price)
  })

  const chartData = Object.entries(chartMap).map(([day, total]) => ({ day, total }))

  // 3. Payment Method Breakdown
  const qrisCount = revenueData?.filter(o => o.payment_method === 'QRIS').length || 0
  const cashCount = revenueData?.filter(o => o.payment_method === 'CASH').length || 0

  // 4. Total Orders Today
  const { count: totalOrdersToday } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today)

  // 5. Bestsellers
  const { data: bestsellers } = await supabase
    .from('order_items')
    .select('menu_name, quantity')
    .order('quantity', { ascending: false })
  
  const salesMap: Record<string, number> = {}
  bestsellers?.forEach(item => {
    salesMap[item.menu_name] = (salesMap[item.menu_name] || 0) + item.quantity
  })

  const sortedBestsellers = Object.entries(salesMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  return {
    totalRevenueToday,
    totalOrdersToday: totalOrdersToday || 0,
    bestsellers: sortedBestsellers,
    chartData,
    paymentStats: { qris: qrisCount, cash: cashCount }
  }
}

export async function adjustStock(menuId: string, quantity: number, type: 'IN' | 'ADJUSTMENT', notes: string) {
  const supabase = await createClient()

  const { data: menu } = await supabase
    .from('menus')
    .select('current_stock')
    .eq('id', menuId)
    .single()

  const currentStock = menu?.current_stock || 0
  const newStock = type === 'IN' ? currentStock + quantity : quantity

  const { error: updateError } = await supabase
    .from('menus')
    .update({ current_stock: newStock })
    .eq('id', menuId)

  if (updateError) throw new Error(updateError.message)

  const { error: logError } = await supabase
    .from('inventory_movements')
    .insert({
      menu_id: menuId,
      movement_type: type,
      quantity: quantity,
      notes: notes
    })

  if (logError) throw new Error(logError.message)

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
