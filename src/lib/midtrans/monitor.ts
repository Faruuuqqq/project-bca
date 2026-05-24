'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Midtrans Transaction Monitoring & Logging
 * FIX #3: Adds visibility into payment system health
 * 
 * Tracks all Midtrans API interactions:
 * - QRIS generation attempts (success/failure)
 * - Status check inquiries
 * - Webhook deliveries
 * - Response times & errors
 * 
 * Enables:
 * - Performance monitoring
 * - Error pattern analysis
 * - Payment failure debugging
 * - SLA reporting
 */

export type MidtransTransactionType = 'charge' | 'status' | 'webhook'
export type MidtransTransactionStatus = 'success' | 'failed' | 'timeout'

interface MidtransTransactionLog {
  order_id: string
  transaction_type: MidtransTransactionType
  status: MidtransTransactionStatus
  amount?: number
  error_message?: string | null
  response_time_ms?: number
  http_status?: number | null
  metadata?: Record<string, unknown>
}

/**
 * Log a Midtrans transaction to database for monitoring
 * This is a best-effort log - failures don't block payment flow
 */
export async function logMidtransTransaction(log: MidtransTransactionLog) {
  try {
    const supabase = await createClient()
    
    // Build the log entry with all details
    const logEntry = {
      order_id: log.order_id,
      transaction_type: log.transaction_type,
      status: log.status,
      amount: log.amount || null,
      error_message: log.error_message || null,
      response_time_ms: log.response_time_ms || null,
      http_status: log.http_status || null,
      metadata: log.metadata ? JSON.stringify(log.metadata) : null,
      created_at: new Date().toISOString(),
    }

    // Insert with timeout - don't block if DB is slow
    const { error } = await Promise.race<{ error?: Error | null }>([ 
      supabase.from('midtrans_transactions').insert([logEntry]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Logging timeout')), 2000)
      ),
    ]) as { error?: Error | null }

    if (error) {
      console.error('❌ [Midtrans Monitor] Failed to log transaction:', error.message)
      // Don't throw - logging should not block payment flow
    }
  } catch (error) {
    // Silently fail logging - payment is more important than monitoring
    console.warn('⚠️ [Midtrans Monitor] Logging error (ignored):', error)
  }
}

/**
 * Get Midtrans transaction statistics for dashboard
 * Returns: success rate, failure rate, avg response time, etc.
 */
export async function getMidtransStats(hours: number = 24) {
  try {
    const supabase = await createClient()
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    // Get all transactions in time range
    const { data, error } = await supabase
      .from('midtrans_transactions')
      .select('*')
      .gte('created_at', cutoffTime)
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.error('Failed to fetch Midtrans stats:', error?.message)
      return null
    }

    // Type definition for transaction record
    interface TransactionRecord {
      order_id: string
      transaction_type: MidtransTransactionType
      status: MidtransTransactionStatus
      response_time_ms?: number | null
      error_message?: string | null
      created_at: string
    }

    // Calculate statistics
    const stats = {
      totalTransactions: data.length,
      successCount: 0,
      failureCount: 0,
      timeoutCount: 0,
      avgResponseTime: 0,
      successRate: 0,
      byType: {
        charge: { total: 0, success: 0, failed: 0 },
        status: { total: 0, success: 0, failed: 0 },
        webhook: { total: 0, success: 0, failed: 0 },
      },
      recentErrors: [] as Array<{ order_id: string; error: string; timestamp: string }>,
    }

    let totalResponseTime = 0
    let responseTimeCount = 0

    data.forEach((tx: TransactionRecord) => {
      if (tx.status === 'success') {
        stats.successCount++
        stats.byType[tx.transaction_type].success++
      } else if (tx.status === 'timeout') {
        stats.timeoutCount++
        stats.byType[tx.transaction_type].failed++
      } else {
        stats.failureCount++
        stats.byType[tx.transaction_type].failed++
      }

      stats.byType[tx.transaction_type].total++

      if (tx.response_time_ms) {
        totalResponseTime += tx.response_time_ms
        responseTimeCount++
      }

      if (tx.status !== 'success' && tx.error_message) {
        stats.recentErrors.push({
          order_id: tx.order_id,
          error: tx.error_message,
          timestamp: tx.created_at,
        })
      }
    })

    stats.avgResponseTime = responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0
    stats.successRate = stats.totalTransactions > 0 ? Math.round((stats.successCount / stats.totalTransactions) * 100) : 0
    stats.recentErrors = stats.recentErrors.slice(0, 10) // Keep last 10 errors

    return stats
  } catch (error) {
    console.error('Failed to calculate Midtrans stats:', error)
    return null
  }
}

/**
 * Get health status of Midtrans integration
 * Returns: 'healthy', 'degraded', or 'down'
 */
export async function getMidtransHealth() {
  try {
    const stats = await getMidtransStats(1) // Last 1 hour

    if (!stats) return { status: 'unknown', message: 'Could not fetch stats' }

    if (stats.totalTransactions === 0) {
      return { status: 'no_data', message: 'No transactions in past hour' }
    }

    if (stats.successRate >= 95) {
      return {
        status: 'healthy',
        message: `${stats.successRate}% success rate`,
        stats,
      }
    }

    if (stats.successRate >= 80) {
      return {
        status: 'degraded',
        message: `${stats.successRate}% success rate - some failures detected`,
        stats,
      }
    }

    return {
      status: 'down',
      message: `${stats.successRate}% success rate - high failure rate`,
      stats,
    }
  } catch (error) {
    console.error('Failed to check Midtrans health:', error)
    return { status: 'error', message: 'Could not determine health status' }
  }
}
