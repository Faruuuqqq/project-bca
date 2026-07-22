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
    let receiptData = INIT + ALIGN_CENTER + BOLD_ON
    receiptData += "AYAM KALINTANG\n"
    receiptData += NORMAL_FONT + BOLD_OFF
    receiptData += "Depan Polsek Jatinangor, Cikeruh\n"
    receiptData += "Kec. Jatinangor, Sumedang 45360\n"
    receiptData += "--------------------------------\n"
    receiptData += ALIGN_LEFT
    receiptData += `ANTREAN : #${order.queue_number}\n`
    if (order.customer_name) {
      receiptData += `NAMA    : ${order.customer_name}\n`
    }
    receiptData += `WAKTU   : ${new Date(order.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n`
    receiptData += `TIPE    : ${order.order_type === 'take-away' ? 'Bawa Pulang' : 'Makan Sini'}\n`
    receiptData += "--------------------------------\n"
    
    order.order_items?.forEach((item: any) => {
      // Format Item Name, Qty, and Price (32 chars max for 58mm)
      const priceStr = formatCurrency(item.subtotal)
      const nameAndQty = `${item.quantity}x ${item.menu_name}`.substring(0, 18).padEnd(18, ' ')
      const line = `${nameAndQty} Rp${priceStr.padStart(9, ' ')}\n`
      receiptData += line
      if (item.order_item_options && item.order_item_options.length > 0) {
        const grouped = item.order_item_options.reduce((acc: any, curr: any) => {
          if (!acc[curr.value_label]) acc[curr.value_label] = 0
          acc[curr.value_label] += 1
          return acc
        }, {})
        const opts = Object.entries(grouped).map(([label, qty]) => (qty as number) > 1 ? `${qty}x ${label}` : label).join(', ')
        receiptData += `  * ${opts}\n`
      }
    })
    
    receiptData += "--------------------------------\n"
    receiptData += BOLD_ON
    receiptData += `TOTAL: Rp ${formatCurrency(order.total_price)}\n`
    receiptData += BOLD_OFF
    receiptData += "================================\n"
    receiptData += ALIGN_CENTER
    receiptData += "Terima Kasih Atas Kunjungan Anda!\n"
    receiptData += "Mohon tunggu nomor antrean Anda\ndipanggil oleh kasir.\n"
    
    // Memberikan space secukupnya agar bisa dirobek sebelum dapur di-print
    receiptData += "\n\n\n\n\n" + CUT_PAPER // Potong kertas konsumen

    // --- 2. KITCHEN COPY ---
    receiptData += INIT + ALIGN_CENTER + BOLD_ON + TITLE_FONT
    receiptData += "=== COPY DAPUR ===\n\n"
    receiptData += KITCHEN_FONT + BOLD_ON
    receiptData += `ANTREAN: #${order.queue_number}\n`
    if (order.customer_name) {
      receiptData += `NAMA: ${order.customer_name}\n`
    }
    receiptData += `TIPE: ${order.order_type === 'take-away' ? 'BAWA PULANG' : 'MAKAN SINI'}\n`
    receiptData += `WAKTU: ${new Date(order.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n`
    receiptData += "--------------------------------\n"
    
    receiptData += ALIGN_LEFT + BOLD_ON
    order.order_items?.forEach((item: any) => {
      receiptData += `[ ${item.quantity}x ] ${item.menu_name.toUpperCase()}\n`
      if (item.order_item_options && item.order_item_options.length > 0) {
        const grouped = item.order_item_options.reduce((acc: any, curr: any) => {
          if (!acc[curr.value_label]) acc[curr.value_label] = 0
          acc[curr.value_label] += 1
          return acc
        }, {})
        const opts = Object.entries(grouped).map(([label, qty]) => (qty as number) > 1 ? `${qty}x ${label}` : label).join(', ')
        receiptData += `      * ${opts}\n`
      }
      receiptData += '\n'
    })
    receiptData += ALIGN_CENTER + "--------------------------------\n"
    receiptData += "\n" + CUT_PAPER // Potong kertas untuk dapur

    // Generate RawBT Intent URL for Android Client
    const buffer = Buffer.from(receiptData, 'latin1')
    const rawbtUrl = 'intent:base64,' + buffer.toString('base64') + '#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;B.silent=true;S.return=true;end;'
    
    return { success: true, rawbtUrl }

  } catch (err) {
    console.error('Print failed:', err)
    return { success: false, error: 'Internal Error' }
  }
}
