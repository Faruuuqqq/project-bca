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
      // 2-baris: baris 1 nama menu, baris 2 qty x harga (agar nama tidak terpotong)
      const maxNameLen = 32
      const menuName = item.menu_name.substring(0, maxNameLen)
      const priceStr = `Rp${formatCurrency(item.subtotal)}`
      const qtyPriceLine = `  ${item.quantity}x `.padEnd(16, ' ') + priceStr.padStart(16, ' ')
      receiptData += `${menuName}\n`
      receiptData += `${qtyPriceLine}\n`

      // Tampilkan opsi, filter [ARCHIVED], urut berdasarkan option_name priority
      if (item.order_item_options && item.order_item_options.length > 0) {
        // Filter archived dan group by option_name
        const filtered = item.order_item_options.filter((o: any) => !o.option_name?.startsWith('[ARCHIVED]'))
        const grouped: Record<string, string[]> = {}
        const groupOrder: string[] = []
        filtered.forEach((o: any) => {
          const name = o.option_name || ''
          if (!grouped[name]) { grouped[name] = []; groupOrder.push(name) }
          grouped[name].push(o.value_label)
        })
        // Prioritas urut: Jenis Ayam/Pilihan Bagian dulu, baru Pilihan Sambal, lalu lainnya
        const priority = ['Jenis Ayam', 'Pilihan Bagian', 'Pilihan Sambal', 'Bumbu', 'Penyajian', 'Jukut Goreng']
        const sortedKeys = [...groupOrder].sort((a, b) => {
          const ai = priority.indexOf(a); const bi = priority.indexOf(b)
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
        })
        sortedKeys.forEach((optName) => {
          const labels = grouped[optName]
          if (labels && labels.length > 0) {
            receiptData += `  * ${labels.join(', ')}\n`
          }
        })
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
    receiptData += "\n\n\n\n\n" + CUT_PAPER // Potong kertas konsumen

    // Generate RawBT Intent URL for Android Client
    const buffer = Buffer.from(receiptData, 'latin1')
    const rawbtUrl = 'intent:base64,' + buffer.toString('base64') + '#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;B.silent=true;S.return=true;end;'
    
    return { success: true, rawbtUrl }

  } catch (err) {
    console.error('Print failed:', err)
    return { success: false, error: 'Internal Error' }
  }
}
