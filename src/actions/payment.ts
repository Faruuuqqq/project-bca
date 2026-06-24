'use server'

import { createClient } from '@/lib/supabase/server'
import { midtransCore } from '@/lib/midtrans'
import { midtransRateLimiter } from '@/lib/midtrans/rate-limiter'
import { logMidtransTransaction } from '@/lib/midtrans/monitor'
import { retryWithBackoff, withTimeout } from '@/lib/midtrans/retry'
import { deductStockForOrder } from '@/lib/stock'
import { printOrderReceipt } from '@/lib/printer'

export async function checkPaymentStatus(orderId: string) {
  const supabase = await createClient()
  const startTime = Date.now()

  console.log(`🔍 [Inquiry] Checking Midtrans status for Order: ${orderId}`)

  const rateLimitCheck = midtransRateLimiter.isAllowed(orderId)
  if (!rateLimitCheck.allowed) {
    console.warn(`⏱️ [Rate Limit] Order ${orderId}: ${rateLimitCheck.reason}`)
    return { 
      status: 'rate_limited',
      retryAfterMs: rateLimitCheck.retryAfterMs,
      error: rateLimitCheck.reason
    }
  }

  try {
    const retryResult = await retryWithBackoff(
      async () => {
        return await withTimeout(
          () => midtransCore.transaction.status(orderId),
          5000
        )
      },
      {
        maxRetries: 2,
        initialDelayMs: 1000,
        maxDelayMs: 3000,
      }
    )

    if (!retryResult.success) {
      const responseTime = Date.now() - startTime
      console.error(`❌ [Midtrans API Error] After retries (${responseTime}ms):`, retryResult.error)
      
      await logMidtransTransaction({
        order_id: orderId,
        transaction_type: 'status',
        status: 'failed',
        error_message: retryResult.error,
        response_time_ms: responseTime,
        http_status: null,
        metadata: { retriesAttempted: retryResult.retriesAttempted },
      })
      
      const { data } = await supabase
        .from('orders')
        .select('payment_status')
        .eq('id', orderId)
        .single()
      
      if (data?.payment_status === 'paid') {
        console.log("ℹ️ [Inquiry] Order already marked as paid in DB (using fallback).")
        return { status: 'paid' }
      }
      
      return { 
        status: 'unpaid',
        error: retryResult.error,
        message: 'Midtrans API unavailable, please try again',
      }
    }

    const transaction = retryResult.data as any
    const responseTime = Date.now() - startTime
    console.log(
      `✅ [Midtrans Response] Order: ${orderId}, Status: ${transaction.transaction_status} ` +
      `(${responseTime}ms, ${retryResult.retriesAttempted} retries)`
    )

    const isPaid = ['settlement', 'capture', 'success'].includes(transaction.transaction_status)
    
    if (isPaid) {
      console.log(`💰 [Payment Success] Updating DB for Order: ${orderId}`)
      
      // Check if it was already paid to prevent double-printing
      const { data: existingOrder } = await supabase.from('orders').select('payment_status').eq('id', orderId).single()
      
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderId)

      if (error) {
        console.error("❌ DB Update Error:", error.message)
        throw error
      }
      
      await logMidtransTransaction({
        order_id: orderId,
        transaction_type: 'status',
        status: 'success',
        response_time_ms: responseTime,
        http_status: transaction.http_status || null,
        metadata: { retriesAttempted: retryResult.retriesAttempted },
      })

      // Auto-print receipt if newly paid
      if (existingOrder?.payment_status !== 'paid') {
        const printRes = await printOrderReceipt(orderId) as any;
    if (!printRes?.success) {
      return { success: true, printerError: printRes?.error || "Gagal mencetak struk" };
    }
      }

      deductStockForOrder(orderId, supabase).catch((e) =>
        console.error(`[Stock] Deduction failed for order ${orderId}:`, e)
      )
      
      return { status: 'paid' }
    }

    await logMidtransTransaction({
      order_id: orderId,
      transaction_type: 'status',
      status: 'success',
      response_time_ms: responseTime,
      http_status: transaction.http_status || null,
      metadata: { retriesAttempted: retryResult.retriesAttempted },
    })

    return { status: transaction.transaction_status }
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime
    const errMsg = (error as Error).message
    console.error(`❌ [Unexpected Error] (${responseTime}ms):`, errMsg)
    
    await logMidtransTransaction({
      order_id: orderId,
      transaction_type: 'status',
      status: 'failed',
      error_message: errMsg,
      response_time_ms: responseTime,
      http_status: null,
    })
    
    const { data } = await supabase
      .from('orders')
      .select('payment_status')
      .eq('id', orderId)
      .single()
    
    if (data?.payment_status === 'paid') {
      console.log("ℹ️ [Inquiry] Order already marked as paid in DB (fallback).")
      return { status: 'paid' }
    }
    
    return { status: 'unpaid', error: errMsg }
  }
}

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

  const { data: existingOrder } = await supabase.from('orders').select('payment_status').eq('id', orderId).single()

  const { data, error } = await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw new Error('Gagal mengonfirmasi pembayaran')

  // Trigger printer
  if (existingOrder?.payment_status !== 'paid') {
    printOrderReceipt(orderId).catch(console.error)
  }

  deductStockForOrder(orderId, supabase).catch((e) =>
    console.error(`[Stock] Deduction failed for order ${orderId}:`, e)
  )

  return { success: true, order: data }
}

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

  const { error } = await supabase
    .from('orders')
    .update({ order_status: 'completed' })
    .eq('id', orderId)

  if (error) throw new Error('Gagal menandai pesanan selesai')
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


export async function reprintReceipt(orderId: string) {
  const result = await printOrderReceipt(orderId) as any;
  if (!result || !result.success) {
    return { error: result?.error || 'Gagal mencetak struk' };
  }
  return { success: true };
}

export async function voidOrder(orderId: string, pin: string) {
  const supabase = await createClient();
  
  // Verify Admin PIN
  const { data: config } = await supabase
    .from('store_configs')
    .select('config_value')
    .eq('config_key', 'cashier_pin')
    .single();

  const validPin = config ? config.config_value : '1234';
  if (pin !== validPin) return { error: 'PIN Admin tidak valid' };

  // Set order status to void
  const { error } = await supabase
    .from('orders')
    .update({ order_status: 'void' })
    .eq('id', orderId);

  if (error) return { error: 'Gagal membatalkan pesanan' };
  
  return { success: true };
}
