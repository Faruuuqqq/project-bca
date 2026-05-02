import { createClient } from '@/lib/supabase/server'
import { OrderBoard } from '@/components/admin/OrderBoard'

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  // Fetch initial orders for today that are not completed
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .neq('order_status', 'completed')
    .order('created_at', { ascending: true }) // Oldest first for KDS flow

  return (
    <div className="p-8">
      <OrderBoard initialOrders={orders || []} />
    </div>
  )
}
