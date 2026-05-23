'use server'

import { createClient } from '@/lib/supabase/server'
import { midtransCore } from '@/lib/midtrans'

/**
 * Cek Status Pembayaran ke Midtrans & Update DB (Manual Inquiry)
 */
export async function checkPaymentStatus(orderId: string) {
  const supabase = await createClient()

  console.log(`🔍 [Inquiry] Checking Midtrans status for Order: ${orderId}`)

  try {
    // 1. Tanya ke Midtrans
    const transaction = await midtransCore.transaction.status(orderId)
    console.log(`✅ [Midtrans Response] Order: ${orderId}, Status: ${transaction.transaction_status}`)

    // 2. Jika lunas (settlement/capture), update DB
    const isPaid = ['settlement', 'capture', 'success'].includes(transaction.transaction_status)
    
    if (isPaid) {
      console.log(`💰 [Payment Success] Updating DB for Order: ${orderId}`)
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderId)

      if (error) {
        console.error("❌ DB Update Error:", error.message)
        throw error
      }
      return { status: 'paid' }
    }

    return { status: transaction.transaction_status }
  } catch (error: unknown) {
    const errMsg = (error as Error).message
    console.error("❌ [Midtrans API Error]:", errMsg)
    
    // Fallback: Jika error tapi di DB sudah paid (mungkin karena webhook duluan)
    const { data } = await supabase
      .from('orders')
      .select('payment_status')
      .eq('id', orderId)
      .single()
    
    if (data?.payment_status === 'paid') {
      console.log("ℹ️ [Inquiry] Order already marked as paid in DB.")
      return { status: 'paid' }
    }
    
    return { status: 'unpaid', error: errMsg }
  }
}

/**
 * Validasi PIN Kasir via Server-Side (Database)
 */
export async function confirmCashPayment(orderId: string, pin: string) {
  const supabase = await createClient()

  const { data: config, error: configError } = await supabase
    .from('store_configs')
    .select('config_value')
    .eq('config_key', 'cashier_pin')
    .single()

  if (configError || !config) {
    if (pin !== '1234') return { error: 'PIN Kasir tidak valid' }
  } else {
    if (pin !== config.config_value) return { error: 'PIN Kasir tidak valid' }
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw new Error('Gagal mengonfirmasi pembayaran')
  return { success: true, order: data }
}

/**
 * Validasi Kode Recovery via Server-Side
 */
export async function verifyRecoveryCode(code: string) {
  const supabase = await createClient()
  const { data: config } = await supabase
    .from('store_configs')
    .select('config_value')
    .eq('config_key', 'recovery_code')
    .single()

  if (!config) return code === '4321' ? { success: true } : { error: 'Kode pemulihan salah' }
  return code === config.config_value ? { success: true } : { error: 'Kode pemulihan salah' }
}

export async function completeOrder(orderId: string) {
  const supabase = await createClient()

  // Idempotent guard: only ready orders can be marked completed.
  const { error } = await supabase
    .from('orders')
    .update({ order_status: 'completed' })
    .eq('id', orderId)
    .eq('order_status', 'ready')

  if (error) throw new Error('Gagal menandai pesanan selesai')
  return { success: true }
}

export async function startCooking(orderId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ order_status: 'cooking' })
    .eq('id', orderId)
    .eq('order_status', 'pending')

  if (error) throw new Error('Gagal mulai masak')

  return { success: true }
}

export async function markReady(orderId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ order_status: 'ready' })
    .eq('id', orderId)
    .eq('order_status', 'cooking')

  if (error) throw new Error('Gagal tandai siap')

  return { success: true }
}

export async function togglePriority(orderId: string, currentPriority: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ is_priority: !currentPriority })
    .eq('id', orderId)

  if (error) throw new Error('Gagal ubah prioritas')

  return { success: true }
}
