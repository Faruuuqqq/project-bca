import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { OrderBoard } from '@/components/admin/OrderBoard'
import OrdersLoading from './loading'

export const dynamic = 'force-dynamic'

async function OrdersContent() {
  const supabase = await createClient()

  // Active orders for KDS: paid, not yet completed/voided.
  // Includes order_items + their options so chef sees customizations.
  // OPTIMIZATION: Added LIMIT (200) to prevent memory spikes during peak, ordered by priority + time
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_type, order_status, payment_status, is_priority, queue_number, created_at, total_price, order_items(id, menu_id, menu_name, quantity, special_instructions, order_item_options(*))')
    .eq('payment_status', 'paid')
    .neq('order_status', 'completed')
    .neq('order_status', 'void')
    .order('is_priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(200)

  return <OrderBoard initialOrders={orders || []} />
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<OrdersLoading />}>
      <OrdersContent />
    </Suspense>
  )
}
