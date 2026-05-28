import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Deducts stock for all items in a paid order.
 *
 * Idempotent: checks orders.stock_deducted before doing anything.
 * Safe to call from both Midtrans webhook (service-role client) and
 * server actions (anon client) — caller passes the appropriate client.
 *
 * @param orderId  - UUID of the paid order
 * @param supabase - Supabase client (service-role for webhook, anon for actions)
 */
export async function deductStockForOrder(
  orderId: string,
  supabase: SupabaseClient
): Promise<void> {
  // 1. Idempotent guard — skip if already deducted
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, queue_number, stock_deducted')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.warn(`[Stock] Could not fetch order ${orderId}:`, orderError?.message)
    return
  }

  if (order.stock_deducted) {
    console.log(`[Stock] Order ${orderId} already deducted, skipping.`)
    return
  }

  // 2. Fetch order items
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('menu_id, quantity, menu_name')
    .eq('order_id', orderId)

  if (itemsError || !items || items.length === 0) {
    console.warn(`[Stock] No items found for order ${orderId}:`, itemsError?.message)
    return
  }

  const queueLabel = order.queue_number ? `#${order.queue_number}` : orderId.slice(0, 8)
  const reason = `Pesanan ${queueLabel}`

  // 3. Deduct stock per item and log movements in parallel
  const deductPromises = items.map(async (item) => {
    const { error: deductError } = await supabase.rpc('decrement_stock', {
      p_menu_id: item.menu_id,
      p_amount: item.quantity,
    })

    if (deductError) {
      console.error(`[Stock] RPC decrement_stock failed for ${item.menu_name}:`, deductError.message)
    }

    // Log inventory movement
    await supabase.from('inventory_movements').insert({
      menu_id: item.menu_id,
      movement_type: 'out',
      amount: item.quantity,
      reason,
    })
  })

  await Promise.allSettled(deductPromises)

  // 4. Mark order as stock_deducted = true (prevents double deduction)
  await supabase
    .from('orders')
    .update({ stock_deducted: true })
    .eq('id', orderId)

  console.log(`[Stock] Deducted stock for order ${orderId} (${items.length} items)`)
}
