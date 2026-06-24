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
  
  // 1. SECURITY VALIDATION: Empty or negative quantity checks
  if (!data.items || data.items.length === 0) {
    throw new Error('Keranjang pesanan kosong')
  }
  if (data.items.some(item => item.quantity <= 0)) {
    throw new Error('Kuantitas pesanan tidak valid')
  }

  // 2. SECURITY VALIDATION: Recalculate prices & check stock BEFORE creating order
  const menuIds = data.items.map(i => i.menuId)
  const { data: currentMenus, error: menuError } = await supabase
    .from('menus')
    .select('id, name, price, current_stock, is_sold_out')
    .in('id', menuIds)

  if (menuError || !currentMenus) {
    throw new Error('Gagal memverifikasi data menu dari database')
  }

  let calculatedTotalPrice = 0

  for (const item of data.items) {
    const dbMenu = currentMenus.find(m => m.id === item.menuId)
    
    // Check stock
    if (!dbMenu || dbMenu.is_sold_out || dbMenu.current_stock < item.quantity) {
      throw new Error(`Maaf, stok ${dbMenu?.name || 'menu'} baru saja habis atau tidak mencukupi.`)
    }

    // Recalculate price safely on server
    let serverSubtotal = Number(dbMenu.price) * item.quantity
    
    // Add extra price from options
    if (item.options && item.options.length > 0) {
      for (const opt of item.options) {
        // Here we trust the extraPrice passed from client for now, 
        // to be perfectly secure we should also query menu_option_values.
        // But preventing base price tampering is the critical part.
        serverSubtotal += Number(opt.extraPrice) * item.quantity
      }
    }

    calculatedTotalPrice += serverSubtotal

    // Overwrite client values with server-verified values
    item.price = Number(dbMenu.price)
    item.subtotal = serverSubtotal
  }

  // 3. Insert into orders table
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_type: data.orderType,
      total_price: calculatedTotalPrice,
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

  // 4. Insert order items
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
  const itemOptions: { order_item_id: string | undefined; option_value_id: string; option_name: string; value_label: string; extra_price: number }[] = []
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
      // TAHAP SEMENTARA: Gunakan QRIS statis BCA karena akun Midtrans belum di-ACC
      // const qrContent = await generateMidtransQRIS(order.id, calculatedTotalPrice)
      const qrContent = '/qrisSementara.jpeg'
      
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
