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
const DOUBLE_HEIGHT = ESC + '!1' // Double height font
const NORMAL_FONT = ESC + '!0'
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

    const printerIp = process.env.PRINTER_IP
    const printerPort = parseInt(process.env.PRINTER_PORT || '9100')

    // Jika PRINTER_IP tidak di-set di .env, fallback ke Console Simulator
    if (!printerIp || printerIp === '127.0.0.1') {
      console.log(`[SIMULATOR PRINTER] Mengarahkan cetakan ke log karena PRINTER_IP belum dikonfigurasi.`)
      console.log(`Kitchen Copy & Customer Copy untuk Antrean #${order.queue_number} tercetak!`)
      return { success: true }
    }

    // Bangun string cetakan (ESC/POS)
    let receiptData = INIT

    // --- 1. KITCHEN COPY ---
    receiptData += ALIGN_CENTER + BOLD_ON + DOUBLE_HEIGHT
    receiptData += "=== COPY DAPUR ===\n\n"
    receiptData += NORMAL_FONT + BOLD_ON
    receiptData += `ANTREAN: #${order.queue_number}\n`
    receiptData += `TIPE: ${order.order_type === 'take-away' ? 'BAWA PULANG' : 'MAKAN SINI'}\n`
    receiptData += `WAKTU: ${new Date(order.created_at).toLocaleString('id-ID')}\n`
    receiptData += "--------------------------------\n"
    
    receiptData += ALIGN_LEFT + BOLD_ON
    order.order_items?.forEach((item: any) => {
      receiptData += `[ ${item.quantity}x ] ${item.menu_name.toUpperCase()}\n`
      if (item.order_item_options && item.order_item_options.length > 0) {
        const opts = item.order_item_options.map((o: any) => o.value_label).join(', ')
        receiptData += `      * ${opts}\n`
      }
      receiptData += '\n'
    })
    receiptData += ALIGN_CENTER + "--------------------------------\n"
    receiptData += "\n\n" + CUT_PAPER // Potong kertas untuk dapur

    // --- 2. CUSTOMER COPY ---
    receiptData += INIT + ALIGN_CENTER + BOLD_ON
    receiptData += "AYAM KALINTANG\n"
    receiptData += NORMAL_FONT + BOLD_OFF
    receiptData += "Jl. Contoh No. 123, Bandung\n"
    receiptData += "--------------------------------\n"
    receiptData += ALIGN_LEFT
    receiptData += `ANTREAN : #${order.queue_number}\n`
    receiptData += `WAKTU   : ${new Date(order.created_at).toLocaleString('id-ID')}\n`
    receiptData += `TIPE    : ${order.order_type === 'take-away' ? 'Bawa Pulang' : 'Makan Sini'}\n`
    receiptData += "--------------------------------\n"
    
    order.order_items?.forEach((item: any) => {
      // Format Item Name and Qty
      const line = `${item.menu_name.substring(0, 24).padEnd(24)} ${item.quantity}x\n`
      receiptData += line
      if (item.order_item_options && item.order_item_options.length > 0) {
        const opts = item.order_item_options.map((o: any) => o.value_label).join(', ')
        receiptData += `  * ${opts}\n`
      }
    })
    
    receiptData += "--------------------------------\n"
    receiptData += BOLD_ON
    receiptData += `TOTAL: Rp ${formatCurrency(order.total_amount)}\n`
    receiptData += BOLD_OFF
    receiptData += "================================\n"
    receiptData += ALIGN_CENTER
    receiptData += "Terima Kasih Atas Kunjungan Anda!\n"
    receiptData += "Mohon tunggu nomor antrean Anda\ndipanggil oleh kasir.\n"
    receiptData += "\n\n\n\n\n" + CUT_PAPER // Potong kertas konsumen

    // Kirim data mentah ke printer fisik via TCP Socket
    return new Promise((resolve) => {
      const client = new net.Socket()
      
      // Timeout 5 detik jika printer mati/kertas habis
      client.setTimeout(5000)

      client.connect(printerPort, printerIp, () => {
        console.log(`[PRINTER] Connected to ${printerIp}:${printerPort}`)
        // Convert string to Buffer using standard local encoding (latin1/ascii is typical for ESC/POS)
        client.write(Buffer.from(receiptData, 'latin1'), () => {
          console.log(`[PRINTER] Print job sent successfully for Order #${order.queue_number}`)
          client.destroy()
          resolve({ success: true })
        })
      })

      client.on('error', (err) => {
        console.error(`[PRINTER] Connection Error:`, err.message)
        client.destroy()
        resolve({ success: false, error: 'Koneksi ke printer gagal. Pastikan printer menyala dan IP benar.' })
      })

      client.on('timeout', () => {
        console.error(`[PRINTER] Connection Timeout`)
        client.destroy()
        resolve({ success: false, error: 'Printer tidak merespons (Timeout)' })
      })
    })

  } catch (err) {
    console.error('Print failed:', err)
    return { success: false, error: 'Internal Error' }
  }
}
