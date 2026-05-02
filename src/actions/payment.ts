'use server'

import { createClient } from '@/lib/supabase/server'

export async function confirmCashPayment(orderId: string, pin: string) {
  const supabase = await createClient()

  // TEMPORARY FIX: Hardcoded PIN for simulation due to environment variable issues
  // In production, use bcrypt.compare with process.env.KASIR_PIN_HASH
  const isPinValid = pin === '1234'

  if (!isPinValid) {
    return { error: 'PIN yang Anda masukkan salah' }
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
