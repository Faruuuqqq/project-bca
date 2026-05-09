'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Validasi PIN Kasir via Server-Side (Database)
 */
export async function confirmCashPayment(orderId: string, pin: string) {
  const supabase = await createClient()

  // 1. Ambil PIN dari tabel store_configs (Hanya bisa dibaca oleh server client)
  const { data: config, error: configError } = await supabase
    .from('store_configs')
    .select('config_value')
    .eq('config_key', 'cashier_pin')
    .single()

  if (configError || !config) {
    console.error('Config Error:', configError)
    // Fallback ke hardcoded jika tabel belum dibuat (hanya untuk demo agar tidak patah)
    if (pin !== '1234') return { error: 'PIN Kasir tidak valid' }
  } else {
    if (pin !== config.config_value) {
      return { error: 'PIN Kasir tidak valid' }
    }
  }

  // 2. Update order status to PAID
  const { data, error } = await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    console.error('Payment Confirm Error:', error)
    throw new Error('Gagal mengonfirmasi pembayaran')
  }

  return { success: true, order: data }
}

/**
 * Validasi Kode Recovery via Server-Side
 */
export async function verifyRecoveryCode(code: string) {
  const supabase = await createClient()

  const { data: config, error: configError } = await supabase
    .from('store_configs')
    .select('config_value')
    .eq('config_key', 'recovery_code')
    .single()

  if (configError || !config) {
    // Fallback demo
    return code === '4321' ? { success: true } : { error: 'Kode pemulihan salah' }
  }

  if (code !== config.config_value) {
    return { error: 'Kode pemulihan salah' }
  }

  return { success: true }
}

export async function completeOrder(orderId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ order_status: 'completed' })
    .eq('id', orderId)

  if (error) {
    console.error('Complete Order Error:', error)
    throw new Error('Gagal menandai pesanan selesai')
  }

  return { success: true }
}
