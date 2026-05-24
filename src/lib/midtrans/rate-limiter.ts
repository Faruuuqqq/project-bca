/**
 * Rate Limiting for Midtrans API calls
 * FIX #2: Prevents users from spamming payment status checks
 * 
 * Usage:
 * - Server-side: Create RateLimiter instance per orderId
 * - Client-side: Add debounce to manual check button
 */

interface RateLimitConfig {
  minIntervalMs: number  // Minimum milliseconds between calls
  maxAttemptsPerMinute?: number  // Max calls per minute (optional burst limit)
}

interface RateLimitState {
  lastCheckTime: number
  attemptCount: number
  attemptWindowStart: number
}

class MidtransRateLimiter {
  private states: Map<string, RateLimitState> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig = { minIntervalMs: 1000, maxAttemptsPerMinute: 20 }) {
    this.config = config
  }

  /**
   * Check if a payment status check is allowed for this orderId
   * Returns: { allowed: boolean, retryAfterMs?: number, reason?: string }
   */
  isAllowed(orderId: string): { allowed: boolean; retryAfterMs?: number; reason?: string } {
    const now = Date.now()
    let state = this.states.get(orderId)

    // Initialize new state for this orderId
    if (!state) {
      state = {
        lastCheckTime: 0,
        attemptCount: 0,
        attemptWindowStart: now,
      }
      this.states.set(orderId, state)
    }

    // Reset attempt count if window expired (1 minute)
    if (now - state.attemptWindowStart > 60000) {
      state.attemptCount = 0
      state.attemptWindowStart = now
    }

    // Check minimum interval since last check
    const timeSinceLastCheck = now - state.lastCheckTime
    if (timeSinceLastCheck < this.config.minIntervalMs) {
      const retryAfterMs = this.config.minIntervalMs - timeSinceLastCheck
      return {
        allowed: false,
        retryAfterMs,
        reason: `Too frequent. Retry after ${retryAfterMs}ms`,
      }
    }

    // Check burst limit (optional)
    if (this.config.maxAttemptsPerMinute) {
      if (state.attemptCount >= this.config.maxAttemptsPerMinute) {
        return {
          allowed: false,
          retryAfterMs: 60000 - (now - state.attemptWindowStart),
          reason: `Rate limit exceeded. Max ${this.config.maxAttemptsPerMinute} attempts per minute`,
        }
      }
    }

    // Update state
    state.lastCheckTime = now
    state.attemptCount += 1

    return { allowed: true }
  }

  /**
   * Reset rate limit for an orderId (e.g., when order completes)
   */
  reset(orderId: string) {
    this.states.delete(orderId)
  }

  /**
   * Get current state for debugging
   */
  getState(orderId: string) {
    return this.states.get(orderId)
  }
}

/**
 * Global singleton instance for Midtrans rate limiting
 * Server-side instance persists across requests
 */
export const midtransRateLimiter = new MidtransRateLimiter({
  minIntervalMs: 1000, // Minimum 1 second between checks per order
  maxAttemptsPerMinute: 20, // Max 20 checks per minute per order
})
