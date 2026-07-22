'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { CartItem } from '@/store/cart'
import { generateMidtransQRIS } from '@/lib/midtrans'

export async function createOrder(data: {
  items: CartItem[]
  orderType: 'dine-in' | 'take-away'
  paymentMethod: 'QRIS' | 'CASH'
  customerName?: string
}) {
  const supabase = createAdminClient()
  
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
    // INCLUDE menu_options and menu_option_values TO VERIFY PRICES AND REQUIRED RULES
    .select('id, name, price, current_stock, is_sold_out, menu_options(id, is_required, menu_option_values(id, extra_price))')
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
    
    // Add extra price from options based on quantities
    let extraOptionsCost = 0
    if (item.options && item.options.length > 0) {
      // Group by optionId
      const optionsByGroup: Record<string, typeof item.options> = {}
      for (const opt of item.options) {
        if (!optionsByGroup[opt.optionId]) optionsByGroup[opt.optionId] = []
        optionsByGroup[opt.optionId].push(opt)
      }

      for (const [optionId, opts] of Object.entries(optionsByGroup)) {
        const dbOption = dbMenu.menu_options?.find((o: any) => o.id === optionId)
        const isRequired = dbOption ? dbOption.is_required : false
        
        let groupQty = 0
        let groupCost = 0
        const pricesInGroup: number[] = []

        for (const opt of opts) {
          if (opt.quantity > 0) {
            // Get verified price from DB if possible
            const dbVal = dbOption?.menu_option_values?.find((v: any) => v.id === opt.valueId)
            const verifiedPrice = dbVal ? Number(dbVal.extra_price) : Number(opt.extraPrice)

            groupQty += opt.quantity
            groupCost += opt.quantity * verifiedPrice
            
            for(let i=0; i<opt.quantity; i++) {
              pricesInGroup.push(verifiedPrice)
            }
          }
        }

        if (groupQty > 0) {
          if (isRequired) {
            // The discount is the base/cheapest option in this group (e.g. 11000 for Ayam, 0 for Sambal)
            let defaultDiscount = 0
            if (dbOption?.menu_option_values && dbOption.menu_option_values.length > 0) {
              defaultDiscount = Math.min(...dbOption.menu_option_values.map((v: any) => Number(v.extra_price)))
            }
            extraOptionsCost += Math.max(0, groupCost - defaultDiscount)
          } else {
            extraOptionsCost += groupCost
          }
        }
      }
    }

    serverSubtotal += extraOptionsCost * item.quantity
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
      customer_name: data.customerName || null,
      payment_status: data.paymentMethod === 'CASH' ? 'paid' : 'unpaid',
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

  // 5. Insert order item options with expanded quantities
  const itemOptions: { order_item_id: string | undefined; option_value_id: string; option_name: string; value_label: string; extra_price: number }[] = []
  data.items.forEach((item) => {
    if (item.options) {
      const orderItemId = insertedItems.find(ii => ii.menu_id === item.menuId)?.id
      item.options.forEach(opt => {
        // Expand quantity into multiple rows!
        for (let i = 0; i < opt.quantity; i++) {
          itemOptions.push({
            order_item_id: orderItemId,
            option_value_id: opt.valueId,
            option_name: opt.optionName,
            value_label: opt.valueLabel,
            extra_price: opt.extraPrice // Note: DB stores individual extra_price here (could be 0 for the first one if we wanted, but it's okay to just store the raw price since total is verified)
          })
        }
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

  // 6. Handle QRIS Payment (Midtrans)
  if (data.paymentMethod === 'QRIS') {
    try {
      // Generate QRIS URL using Midtrans Core API
      // TAHAP SEMENTARA: Gunakan QRIS statis BCA karena akun Midtrans belum di-ACC
      // const qrContent = await generateMidtransQRIS(order.id, calculatedTotalPrice)
      const qrContent = '/qrisFinalSementara.jpeg'
      
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

  // 7. Handle Cash Payment
  return {
    success: true,
    orderId: order.id,
    queueNumber: order.queue_number
  }
}
