/**
 * Retry Logic with Exponential Backoff
 * FIX #4: Graceful error recovery for transient failures
 * 
 * Handles:
 * - Network timeouts
 * - Temporary API failures
 * - Rate limiting
 * 
 * Does NOT retry:
 * - Invalid order IDs (4xx errors)
 * - Authentication failures
 * - Persistent API failures
 */

interface RetryOptions {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
}

interface RetryResult<T> {
  success: boolean
  data?: T
  error?: string
  retriesAttempted: number
  totalTimeMs: number
}

/**
 * Execute async function with exponential backoff retry
 * 
 * Retry schedule (default config):
 * - Attempt 1: Immediate
 * - Attempt 2: Wait 1s (1000ms)
 * - Attempt 3: Wait 2s (2000ms)  
 * - Attempt 4: Wait 4s (4000ms)
 * - Attempt 5: Wait 8s (8000ms, capped at maxDelayMs)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 4,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
  } = options

  let lastError: Error | undefined
  const startTime = Date.now()
  let retriesAttempted = 0

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await fn()
      const totalTimeMs = Date.now() - startTime
      
      if (attempt > 0) {
        console.log(`✅ [Retry] Succeeded on attempt ${attempt + 1} (${totalTimeMs}ms)`)
      }
      
      return {
        success: true,
        data,
        retriesAttempted: attempt,
        totalTimeMs,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      retriesAttempted = attempt

      // Don't retry if this is a permanent error
      if (isPermamentError(lastError)) {
        const totalTimeMs = Date.now() - startTime
        return {
          success: false,
          error: `Permanent error: ${lastError.message}`,
          retriesAttempted: attempt,
          totalTimeMs,
        }
      }

      // Stop if we've exhausted retries
      if (attempt === maxRetries) {
        const totalTimeMs = Date.now() - startTime
        return {
          success: false,
          error: `Failed after ${maxRetries + 1} attempts: ${lastError.message}`,
          retriesAttempted: attempt,
          totalTimeMs,
        }
      }

      // Calculate delay for next retry
      const delaMultiplier = Math.pow(backoffMultiplier, attempt)
      const delayMs = Math.min(
        initialDelayMs * delaMultiplier,
        maxDelayMs
      )

      console.warn(
        `⚠️ [Retry] Attempt ${attempt + 1} failed: ${lastError.message}. ` +
        `Retrying in ${delayMs}ms...`
      )

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  // Should not reach here, but return error just in case
  const totalTimeMs = Date.now() - startTime
  return {
    success: false,
    error: `All retries exhausted: ${lastError?.message}`,
    retriesAttempted: retriesAttempted,
    totalTimeMs,
  }
}

/**
 * Determine if error is permanent (should not retry)
 */
function isPermamentError(error: Error): boolean {
  const message = error.message.toLowerCase()

  // Permanent errors - don't retry these
  const permanentPatterns = [
    'invalid orderid', // Invalid order ID
    'unauthorized', // Auth failed
    '401', // Unauthorized
    '403', // Forbidden
    '404', // Not found
    'invalid request', // Bad request format
    'merchant not found', // Merchant misconfiguration
    'api key', // API key issue
  ]

  return permanentPatterns.some(pattern => message.includes(pattern))
}

/**
 * Execute async function with timeout
 * Useful for API calls that may hang
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  return Promise.race<T>([
    fn(),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ) as Promise<T>,
  ])
}
