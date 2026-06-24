'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { midtransCore } from '@/lib/midtrans'
import { midtransRateLimiter } from '@/lib/midtrans/rate-limiter'
import { logMidtransTransaction } from '@/lib/midtrans/monitor'
import { retryWithBackoff, withTimeout } from '@/lib/midtrans/retry'
import { deductStockForOrder } from '@/lib/stock'
import { printOrderReceipt } from '@/lib/printer'

type MidtransStatusResponse = {
  transaction_status: string
  http_status?: string | number | null
}

/**
 * Cek Status Pembayaran ke Midtrans & Update DB (Manual Inquiry)
 * 
 * FIX #2: Rate limiting added
 * FIX #3: Transaction logging added
 * FIX #4: Retry logic with exponential backoff added
 */
export async function checkPaymentStatus(orderId: string) {
  const supabase = createAdminClient()
  const startTime = Date.now()

  console.log(`🔍 [Inquiry] Checking Midtrans status for Order: ${orderId}`)

  // FIX #2: Rate limiting check
  const rateLimitCheck = midtransRateLimiter.isAllowed(orderId)
  if (!rateLimitCheck.allowed) {
    console.warn(`⏱️ [Rate Limit] Order ${orderId}: ${rateLimitCheck.reason}`)
    return {
      status: 'rate_limited',
      retryAfterMs: rateLimitCheck.retryAfterMs,
      error: rateLimitCheck.reason,
    }
  }

  try {
    // FIX #4: Add retry logic for transient failures
    const retryResult = await retryWithBackoff(
      async () => {
        // FIX #4: Add timeout to prevent hanging
        return await withTimeout(
          () => midtransCore.transaction.status(orderId),
          5000 // 5 second timeout
        )
      },
      {
        maxRetries: 2, // Total 3 attempts (1 initial + 2 retries)
        initialDelayMs: 1000, // 1s first retry
        maxDelayMs: 3000, // Cap at 3s
      }
    )

    if (!retryResult.success) {
      const responseTime = Date.now() - startTime
      console.error(`❌ [Midtrans API Error] After retries (${responseTime}ms):`, retryResult.error)
      
      // FIX #3: Log the failed API call
      await logMidtransTransaction({
        order_id: orderId,
        transaction_type: 'status',
        status: 'failed',
        error_message: retryResult.error,
        response_time_ms: responseTime,
        http_status: null,
        metadata: { retriesAttempted: retryResult.retriesAttempted },
      })
      
      // Fallback: Check DB instead
      const { data } = await supabase
        .from('orders')
        .select('payment_status')
        .eq('id', orderId)
        .single()
      
      if (data?.payment_status === 'paid') {
        console.log('ℹ️ [Inquiry] Order already marked as paid in DB (using fallback).')
        return { status: 'paid' }
      }
      
      return {
        status: 'unpaid',
        error: retryResult.error,
        message: 'Midtrans API unavailable, please try again',
      }
    }

    const transaction = retryResult.data as MidtransStatusResponse
    const responseTime = Date.now() - startTime
    console.log(
      `✅ [Midtrans Response] Order: ${orderId}, Status: ${transaction.transaction_status} ` +
      `(${responseTime}ms, ${retryResult.retriesAttempted} retries)`
    )

    // 2. Jika lunas (settlement/capture), update DB
    const isPaid = ['settlement', 'capture', 'success'].includes(transaction.transaction_status)
    
    if (isPaid) {
      console.log(`💰 [Payment Success] Updating DB for Order: ${orderId}`)

      const { data: existingOrder } = await supabase
        .from('orders')
        .select('payment_status')
        .eq('id', orderId)
        .single()

      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderId)

      if (error) {
        console.error('❌ DB Update Error:', error.message)
        throw error
      }
      
      // FIX #3: Log successful payment detection
      await logMidtransTransaction({
        order_id: orderId,
        transaction_type: 'status',
        status: 'success',
        response_time_ms: responseTime,
        http_status: transaction.http_status ? Number(transaction.http_status) : null,
        metadata: { retriesAttempted: retryResult.retriesAttempted },
      })

      if (existingOrder?.payment_status !== 'paid') {
        const printResult = await printOrderReceipt(orderId)
        if (!printResult?.success) {
          console.error('[Printer] Auto-print failed:', printResult?.error)
        }
      }

      // Deduct stock for paid order (idempotent)
      deductStockForOrder(orderId, supabase).catch((e) =>
        console.error(`[Stock] Deduction failed for order ${orderId}:`, e)
      )
      
      return { status: 'paid' }
    }

    // FIX #3: Log successful check but payment not yet made
    await logMidtransTransaction({
      order_id: orderId,
      transaction_type: 'status',
      status: 'success',
      response_time_ms: responseTime,
      http_status: transaction.http_status ? Number(transaction.http_status) : null,
      metadata: { retriesAttempted: retryResult.retriesAttempted },
    })

    return { status: transaction.transaction_status }
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime
    const errMsg = (error as Error).message
    console.error(`❌ [Unexpected Error] (${responseTime}ms):`, errMsg)
    
    // FIX #3: Log unexpected error
    await logMidtransTransaction({
      order_id: orderId,
      transaction_type: 'status',
      status: 'failed',
      error_message: errMsg,
      response_time_ms: responseTime,
      http_status: null,
    })
    
    // Fallback: Check DB as last resort
    const { data } = await supabase
      .from('orders')
      .select('payment_status')
      .eq('id', orderId)
      .single()
    
    if (data?.payment_status === 'paid') {
      console.log('ℹ️ [Inquiry] Order already marked as paid in DB (fallback).')
      return { status: 'paid' }
    }
    
    return { status: 'unpaid', error: errMsg }
  }
}

/**
 * Validasi PIN Kasir via Server-Side (Database)
 */
export async function confirmCashPayment(orderId: string, pin: string) {
  const supabase = createAdminClient()

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

  const { data: existingOrder } = await supabase
    .from('orders')
    .select('payment_status')
    .eq('id', orderId)
    .single()

  const { data, error } = await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw new Error('Gagal mengonfirmasi pembayaran')

  if (existingOrder?.payment_status !== 'paid') {
    printOrderReceipt(orderId).catch((printError) => {
      console.error('[Printer] Cash payment auto-print failed:', printError)
    })
  }

  // Deduct stock for paid order (idempotent)
  deductStockForOrder(orderId, supabase).catch((e) =>
    console.error(`[Stock] Deduction failed for order ${orderId}:`, e)
  )

  return { success: true, order: data }
}

/**
 * Validasi Kode Recovery via Server-Side
 */
export async function verifyRecoveryCode(code: string) {
  const supabase = createAdminClient()
  const { data: config } = await supabase
    .from('store_configs')
    .select('config_value')
    .eq('config_key', 'recovery_code')
    .single()

  if (!config) return code === '4321' ? { success: true } : { error: 'Kode pemulihan salah' }
  return code === config.config_value ? { success: true } : { error: 'Kode pemulihan salah' }
}

export async function completeOrder(orderId: string) {
  const supabase = createAdminClient()

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
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('orders')
    .update({ order_status: 'cooking' })
    .eq('id', orderId)
    .eq('order_status', 'pending')

  if (error) throw new Error('Gagal mulai masak')

  return { success: true }
}

export async function markReady(orderId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('orders')
    .update({ order_status: 'ready' })
    .eq('id', orderId)
    .eq('order_status', 'cooking')

  if (error) throw new Error('Gagal tandai siap')

  return { success: true }
}

export async function togglePriority(orderId: string, currentPriority: boolean) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('orders')
    .update({ is_priority: !currentPriority })
    .eq('id', orderId)

  if (error) throw new Error('Gagal ubah prioritas')

  return { success: true }
}

export async function reprintReceipt(orderId: string) {
  const result = await printOrderReceipt(orderId)

  if (!result?.success) {
    return { error: result?.error || 'Gagal mencetak struk' }
  }

  return { success: true }
}

export async function voidOrder(orderId: string, pin: string) {
  const supabase = createAdminClient()
  
  const { data: config } = await supabase
    .from('store_configs')
    .select('config_value')
    .eq('config_key', 'cashier_pin')
    .single()

  const validPin = config ? config.config_value : '1234'
  if (pin !== validPin) return { error: 'PIN Admin tidak valid' }

  const { error } = await supabase
    .from('orders')
    .update({ order_status: 'void' })
    .eq('id', orderId)

  if (error) return { error: 'Gagal membatalkan pesanan' }
  
  return { success: true }
}
