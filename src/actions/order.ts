'use server'

import { createClient } from '@/lib/supabase/server'
import { CartItem } from '@/store/cart'
import { generateMidtransQRIS } from '@/lib/midtrans'

export async function createOrder(data: {
  items: CartItem[]
  orderType: 'dine-in' | 'take-away'
  paymentMethod: 'QRIS' | 'CASH'
}) {
  const supabase = await createClient()
  const totalPrice = data.items.reduce((sum, item) => sum + item.subtotal, 0)

  // 1. Insert into orders table
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_type: data.orderType,
      total_price: totalPrice,
      payment_method: data.paymentMethod,
      payment_status: 'unpaid',
      order_status: 'pending',
    })
    .select()
    .single()

  if (orderError) {
    console.error('Order Error:', orderError)
    throw new Error('Gagal membuat pesanan')
  }

  // 1.5 LAST-SECOND STOCK CHECK
  // Verify all items are still available before proceeding
  const menuIds = data.items.map(i => i.menuId)
  const { data: currentMenus } = await supabase
    .from('menus')
    .select('id, name, current_stock, is_sold_out')
    .in('id', menuIds)

  for (const item of data.items) {
    const dbMenu = currentMenus?.find(m => m.id === item.menuId)
    if (!dbMenu || dbMenu.is_sold_out || dbMenu.current_stock < item.quantity) {
      // Cleanup the abandoned order header since items failed stock check
      await supabase.from('orders').delete().eq('id', order.id)
      throw new Error(`Maaf, stok ${dbMenu?.name || 'menu'} baru saja habis.`)
    }
  }

  // 2. Insert order items
  const orderItems = data.items.map((item) => ({
    order_id: order.id,
    menu_id: item.menuId,
    menu_name: item.name,
    menu_price: item.price,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }))

  const { data: insertedItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select()

  if (itemsError) {
    console.error('Items Error:', itemsError)
    throw new Error('Gagal menyimpan item pesanan')
  }

  // 3. Insert order item options
  const itemOptions: any[] = []
  data.items.forEach((item) => {
    if (item.options) {
      const orderItemId = insertedItems.find(ii => ii.menu_id === item.menuId)?.id
      item.options.forEach(opt => {
        itemOptions.push({
          order_item_id: orderItemId,
          option_value_id: opt.valueId,
          option_name: opt.optionName,
          value_label: opt.valueLabel,
          extra_price: opt.extraPrice
        })
      })
    }
  })

  if (itemOptions.length > 0) {
    const { error: optionsError } = await supabase
      .from('order_item_options')
      .insert(itemOptions)
    
    if (optionsError) {
      console.error('Options Error:', optionsError)
    }
  }

  // 4. Handle QRIS Payment (Midtrans)
  if (data.paymentMethod === 'QRIS') {
    try {
      // Generate QRIS URL using Midtrans Core API
      const qrContent = await generateMidtransQRIS(order.id, totalPrice)
      
      // Update order with Reference
      await supabase
        .from('orders')
        .update({ midtrans_order_id: order.id })
        .eq('id', order.id)

      return {
        success: true,
        orderId: order.id,
        qrContent: qrContent, // In Midtrans this is the QR URL/String
        queueNumber: order.queue_number
      }
    } catch (error) {
      console.error('Midtrans API Error:', error)
      throw new Error('Gagal inisialisasi pembayaran QRIS')
    }
  }

  // 5. Handle Cash Payment
  return {
    success: true,
    orderId: order.id,
    queueNumber: order.queue_number
  }
}
