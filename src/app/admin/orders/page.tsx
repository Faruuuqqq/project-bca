import { createClient } from '@/lib/supabase/server'
import { OrderBoard } from '@/components/admin/OrderBoard'

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  // Active orders for KDS: paid, not yet completed/voided.
  // Includes order_items + their options so chef sees customizations.
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*, order_item_options(*))')
    .eq('payment_status', 'paid')
    .neq('order_status', 'completed')
    .neq('order_status', 'void')
    .order('created_at', { ascending: true })

  return <OrderBoard initialOrders={orders || []} />
}
