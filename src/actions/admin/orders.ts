'use server'

import { createClient } from '@/lib/supabase/server'

export async function getOrdersHistory(limit: number = 100, offset: number = 0) {
  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from('orders')
    .select(
      'id, total_price, order_type, payment_method, payment_status, created_at, order_status, order_items(menu_name, quantity, menu_price, order_item_options(id, option_name, value_label, extra_price))',
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
