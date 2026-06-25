import { createClient } from '@/lib/supabase/server'
import * as net from 'net'

// Standar ESC/POS Commands
const ESC = '\x1B'
const GS = '\x1D'
const INIT = ESC + '@' // Initialize printer
const ALIGN_LEFT = ESC + 'a0'
const ALIGN_CENTER = ESC + 'a1'
const BOLD_ON = ESC + 'E1'
const BOLD_OFF = ESC + 'E0'
const TITLE_FONT = ESC + '!\x11' // Double height & width
const KITCHEN_FONT = ESC + '!\x10' // Double height only
const NORMAL_FONT = ESC + '!\x00' // Normal 1x1 font
const CUT_PAPER = GS + 'V' + String.fromCharCode(66) + String.fromCharCode(0) // Partial/Full cut

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID').format(amount)
}

export async function printOrderReceipt(orderId: string) {
  try {
    const supabase = await createClient()
    
    // Fetch order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*, order_item_options(*))')
      .eq('id', orderId)
      .single()
      
    if (error || !order) {
      console.error('Print Error: Order not found', error)
      return { success: false, error: 'Order not found' }
    }

    // Bypassing IP check for RawBT Mobile Integration

    // --- 1. CUSTOMER COPY ---
    let customerData = INIT + ALIGN_CENTER + BOLD_ON
    customerData += "AYAM KALINTANG\n"
    customerData += NORMAL_FONT + BOLD_OFF
    customerData += "Depan Polsek Jatinangor, Cikeruh\n"
    customerData += "Kec. Jatinangor, Sumedang 45360\n"
    customerData += "--------------------------------\n"
    customerData += ALIGN_LEFT
    customerData += `ANTREAN : #${order.queue_number}\n`
    customerData += `WAKTU   : ${new Date(order.created_at).toLocaleString('id-ID')}\n`
    customerData += `TIPE    : ${order.order_type === 'take-away' ? 'Bawa Pulang' : 'Makan Sini'}\n`
    customerData += "--------------------------------\n"
    
    order.order_items?.forEach((item: any) => {
      // Format Item Name, Qty, and Price (32 chars max for 58mm)
      const priceStr = formatCurrency(item.subtotal)
      const nameAndQty = `${item.quantity}x ${item.menu_name}`.substring(0, 18).padEnd(18, ' ')
      const line = `${nameAndQty} Rp${priceStr.padStart(9, ' ')}\n`
      customerData += line
      if (item.order_item_options && item.order_item_options.length > 0) {
        const opts = item.order_item_options.map((o: any) => o.value_label).join(', ')
        customerData += `  * ${opts}\n`
      }
    })
    
    customerData += "--------------------------------\n"
    customerData += BOLD_ON
    customerData += `TOTAL: Rp ${formatCurrency(order.total_price)}\n`
    customerData += BOLD_OFF
    customerData += "================================\n"
    customerData += ALIGN_CENTER
    customerData += "Terima Kasih Atas Kunjungan Anda!\n"
    customerData += "Mohon tunggu nomor antrean Anda\ndipanggil oleh kasir.\n"
    customerData += "\n\n" + CUT_PAPER // Potong kertas konsumen

    // --- 2. KITCHEN COPY ---
    let kitchenData = INIT + ALIGN_CENTER + BOLD_ON + TITLE_FONT
    kitchenData += "=== COPY DAPUR ===\n\n"
    kitchenData += KITCHEN_FONT + BOLD_ON
    kitchenData += `ANTREAN: #${order.queue_number}\n`
    kitchenData += `TIPE: ${order.order_type === 'take-away' ? 'BAWA PULANG' : 'MAKAN SINI'}\n`
    kitchenData += `WAKTU: ${new Date(order.created_at).toLocaleString('id-ID')}\n`
    kitchenData += "--------------------------------\n"
    
    kitchenData += ALIGN_LEFT + BOLD_ON
    order.order_items?.forEach((item: any) => {
      kitchenData += `[ ${item.quantity}x ] ${item.menu_name.toUpperCase()}\n`
      if (item.order_item_options && item.order_item_options.length > 0) {
        const opts = item.order_item_options.map((o: any) => o.value_label).join(', ')
        kitchenData += `      * ${opts}\n`
      }
      kitchenData += '\n'
    })
    kitchenData += ALIGN_CENTER + "--------------------------------\n"
    kitchenData += "\n" + CUT_PAPER // Potong kertas untuk dapur

    // Generate RawBT Intent URL for Android Client
    const bufferCust = Buffer.from(customerData, 'latin1')
    const rawbtUrl = 'intent:base64,' + bufferCust.toString('base64') + '#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;B.silent=true;S.return=true;end;'
    
    const bufferKitch = Buffer.from(kitchenData, 'latin1')
    const rawbtKitchenUrl = 'intent:base64,' + bufferKitch.toString('base64') + '#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;B.silent=true;S.return=true;end;'
    
    return { success: true, rawbtUrl, rawbtKitchenUrl }

  } catch (err) {
    console.error('Print failed:', err)
    return { success: false, error: 'Internal Error' }
  }
}
