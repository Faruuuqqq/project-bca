'use server'

import { createClient } from '@/lib/supabase/server'
import { CartItem } from '@/store/cart'
// @ts-ignore
import midtransClient from 'midtrans-client'

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
})

export async function createOrder(data: {
  items: CartItem[]
  orderType: 'dine-in' | 'take-away'
  paymentMethod: 'QRIS' | 'CASH'
  customerName?: string
}) {
  const supabase = await createClient()
  const totalPrice = data.items.reduce((sum, item) => sum + item.subtotal, 0)

  // 1. Insert into orders table
  // queue_number and queue_date are handled by DB triggers/defaults
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: data.customerName,
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
  data.items.forEach((item, index) => {
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

  // 4. Handle QRIS Payment with Midtrans
  if (data.paymentMethod === 'QRIS') {
    try {
      const parameter = {
        transaction_details: {
          order_id: order.id,
          gross_amount: totalPrice,
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          first_name: data.customerName || 'Pelanggan',
        },
      }

      const transaction = await snap.createTransaction(parameter)
      
      // Update order with midtrans_order_id (if needed for callback mapping)
      await supabase
        .from('orders')
        .update({ midtrans_order_id: order.id })
        .eq('id', order.id)

      return {
        success: true,
        orderId: order.id,
        snapToken: transaction.token,
        snapUrl: transaction.redirect_url,
        queueNumber: order.queue_number
      }
    } catch (midtransError) {
      console.error('Midtrans Error:', midtransError)
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
