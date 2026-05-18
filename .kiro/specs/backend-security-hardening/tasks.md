# Implementation Plan: Backend Security Hardening

## Overview

This plan implements a layered security architecture for the SOK Ayam Kalintang backend. Foundational modules (logger, errors, validation, auth-guard, rate-limiter, price-calculator) are built first under `src/lib/security/`, then composed into refactored server actions and the webhook route handler. The approach ensures each task builds on previous ones with no orphaned code.

## Tasks

- [ ] 1. Project setup and dependency management
  - [-] 1.1 Add zod dependency and remove midtrans-client
    - Run `pnpm add zod` to add the validation library
    - Run `pnpm remove midtrans-client` to remove the unused dependency
    - Verify no import statements reference `midtrans-client` in the codebase (the webhook already uses raw crypto)
    - _Requirements: 10.1, 10.2_

  - [~] 1.2 Create `src/lib/security/` directory with barrel export
    - Create `src/lib/security/index.ts` that will re-export all security modules
    - _Requirements: N/A (project structure)_

- [ ] 2. Implement Structured Logger module
  - [~] 2.1 Create `src/lib/security/logger.ts`
    - Implement `LogLevel` type: `'debug' | 'info' | 'warn' | 'error'`
    - Implement `LogEntry` interface with timestamp, level, action, message, context fields
    - Implement `sanitizeContext()` function that replaces values for keys matching sensitive field names (pin, password, token, authorization, cookie, secret) with `'[REDACTED]'`
    - Implement `logger` singleton with `debug()`, `info()`, `warn()`, `error()` methods
    - Output JSON to `console.log` (info/debug) and `console.error` (warn/error)
    - _Requirements: 9.1, 9.2, 9.6_

  - [ ]* 2.2 Write property test for logger sanitization
    - **Property 6: Logger sanitization completeness**
    - *For any* log context object containing keys matching sensitive field names, the Structured Logger SHALL replace their values with '[REDACTED]' while preserving non-sensitive fields unchanged
    - **Validates: Requirements 9.6**

- [ ] 3. Implement Error Types and Safe Action Handler
  - [~] 3.1 Create `src/lib/security/errors.ts`
    - Define `ErrorType` union: `'validation_error' | 'unauthorized' | 'rate_limited' | 'not_found' | 'internal_error'`
    - Define `ActionError` interface with `error: true`, `type`, `message`, optional `fieldErrors`
    - Define `ActionSuccess<T>` interface with optional `error: false` and `data: T`
    - Define `ActionResult<T>` type alias
    - Implement error constructors: `validationError()`, `unauthorizedError()`, `rateLimitedError()`, `notFoundError()`, `internalError()`
    - Implement `safeAction<TInput, TOutput>()` wrapper that catches exceptions, logs via Structured Logger, and returns generic `ActionError`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 3.2 Write property test for safe error handler
    - **Property 8: Error handler never leaks internal details**
    - *For any* exception thrown during server action execution (including database errors with table names, column names, or constraint details), the safe error handler SHALL return only a generic message and SHALL NOT include the original error message in the client response
    - **Validates: Requirements 8.1, 8.3, 8.4**

- [ ] 4. Implement Validation Layer
  - [~] 4.1 Create `src/lib/security/validation.ts`
    - Implement all Zod schemas from the design document:
      - `createOrderSchema` (items array with menuId UUID, quantity 1-99, options, orderType enum, paymentMethod enum, idempotencyKey UUID)
      - `createMenuSchema` (name 1-100 chars, category_id UUID, price positive, description 0-500, image_url, is_sold_out)
      - `updateMenuSchema` (extends createMenuSchema with id UUID)
      - `createCategorySchema` (name 1-100 chars, sort_order int >= 0)
      - `updateCategorySchema` (extends createCategorySchema with id UUID)
      - `adjustStockSchema` (menuId UUID, amount int -9999 to 9999, reason 1-200 chars)
      - `confirmCashPaymentSchema` (orderId UUID, pin 4-6 digits)
      - `verifyRecoveryCodeSchema` (code 1-20 chars)
      - `changePinSchema` (currentPin 4-6 digits, newPin 4-6 digits)
      - `deleteByIdSchema` (id UUID)
      - `completeOrderSchema` (orderId UUID)
      - `webhookPayloadSchema` (order_id, status_code, gross_amount, signature_key, transaction_status strings)
    - Implement `validate<T>(schema: ZodSchema<T>, data: unknown): ActionResult<T>` helper that returns parsed data or `validationError` with field-level messages
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 11.2, 12.5_

  - [ ]* 4.2 Write property tests for validation schemas
    - **Property 1: Validation rejects all invalid inputs**
    - *For any* input that violates schema constraints (wrong types, out-of-range values, invalid UUIDs, strings exceeding length limits), the validation layer SHALL return a validation_error
    - **Property 2: Validation accepts all valid inputs**
    - *For any* input that conforms to schema constraints, the validation layer SHALL pass the input through without error
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**

- [ ] 5. Implement Auth Guard
  - [~] 5.1 Create `src/lib/security/auth-guard.ts`
    - Implement `requireAuth()` async function that calls `supabase.auth.getUser()`
    - Return `{ userId: string }` on success
    - Return `unauthorizedError()` on failure (no session or expired)
    - Log failed auth attempts via Structured Logger at warn level with action name and request context
    - _Requirements: 2.1, 2.2_

- [ ] 6. Implement Rate Limiter
  - [~] 6.1 Create `src/lib/security/rate-limiter.ts`
    - Implement in-memory sliding-window algorithm using `Map<string, number[]>`
    - Implement `RateLimitConfig` interface with `maxAttempts` and `windowMs`
    - Implement `RateLimitResult` interface with `allowed`, `remaining`, `retryAfterSeconds`
    - Implement `checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult`
    - Implement `getRateLimitKey(headers: Headers, action: string): string` extracting IP from `x-forwarded-for`, `x-real-ip`, or `'unknown'`
    - Implement periodic cleanup (every 5 minutes) to remove stale entries and prevent memory leaks
    - Define rate limit configs: confirmCashPayment (5/15min), verifyRecoveryCode (3/15min), createOrder (10/1min), webhook (100/1min)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 6.2 Write property test for rate limiter sliding window
    - **Property 3: Rate limiter sliding window correctness**
    - *For any* sequence of N requests within a time window W, the rate limiter SHALL allow exactly min(N, maxAttempts) requests and reject the rest, and after the window expires, previously rejected keys SHALL be allowed again
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

- [ ] 7. Implement Price Calculator
  - [~] 7.1 Create `src/lib/security/price-calculator.ts`
    - Implement `PriceCalculationResult` interface with items array (menuId, menuName, basePrice, options, quantity, subtotal) and totalPrice
    - Implement `calculateOrderPrices()` async function that:
      - Queries `menus` table for current prices of all menu_ids
      - Queries `menu_option_values` table for extra prices of selected options
      - Rejects orders with non-existent or sold-out menu items (returns `notFoundError`)
      - Computes subtotal = (base_price + sum(option_extra_prices)) × quantity
      - Computes total = sum of all subtotals
    - Uses Supabase service client for database queries
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 7.2 Write property test for price calculation
    - **Property 4: Price calculation ignores client values**
    - *For any* order with items containing arbitrary client-provided price/subtotal values, the Price Calculator SHALL compute totals exclusively from database prices, and the resulting total SHALL equal the sum of (db_price + sum(option_extra_prices)) × quantity for each item
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**

- [~] 8. Checkpoint - Verify all security modules compile
  - Ensure all modules in `src/lib/security/` compile without TypeScript errors
  - Verify the barrel export in `src/lib/security/index.ts` re-exports all modules
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Database migration for idempotency and PIN hashes
  - [~] 9.1 Create SQL migration script
    - Create migration file at `migrations/001_security_hardening.sql`
    - Add `idempotency_key UUID UNIQUE` column to `orders` table
    - Create index `idx_orders_idempotency_key` on the new column
    - Insert `cashier_pin_hash` row into `store_configs` (bcrypt hash of current PIN '1234' with cost factor 10)
    - Insert `recovery_code_hash` row into `store_configs` (bcrypt hash of current recovery code '4321' with cost factor 10)
    - Optionally remove old plaintext `cashier_pin` and `recovery_code` rows
    - Script must be idempotent (use IF NOT EXISTS / ON CONFLICT where possible)
    - _Requirements: 11.4, 3.1, 3.4_

- [ ] 10. Refactor `src/actions/order.ts` - createOrder with security layers
  - [~] 10.1 Refactor createOrder server action
    - Wrap with `safeAction` error handler
    - Add rate limiting: `checkRateLimit(ip, { maxAttempts: 10, windowMs: 60_000 })`
    - Add input validation using `createOrderSchema`
    - Add idempotency check: query existing order by `idempotency_key`, return existing if found
    - Replace client-trusted `item.subtotal` with `calculateOrderPrices()` for server-side price computation
    - Insert order with server-calculated `total_price` and `idempotency_key`
    - Remove direct `throw new Error()` calls, use typed error returns instead
    - Preserve existing BCA QRIS and CASH payment flows
    - _Requirements: 1.1, 1.4, 4.1, 4.2, 4.3, 4.5, 5.4, 8.1, 8.4, 11.1, 11.3, 11.5_

  - [ ]* 10.2 Write property test for order idempotency
    - **Property 7: Idempotency key deduplication**
    - *For any* order creation request with an idempotency_key that already exists, the createOrder action SHALL return the existing order data without creating a new record
    - **Validates: Requirements 11.3, 11.4**

- [ ] 11. Refactor `src/actions/payment.ts` - PIN verification and auth
  - [~] 11.1 Refactor confirmCashPayment server action
    - Wrap with `safeAction` error handler
    - Add rate limiting: `checkRateLimit(ip, { maxAttempts: 5, windowMs: 900_000 })`
    - Add input validation using `confirmCashPaymentSchema`
    - Replace plaintext PIN comparison with bcrypt: query `store_configs` for `cashier_pin_hash`, use `bcryptjs.compare()`
    - Remove hardcoded fallback `'1234'`
    - If config query fails or returns no result, return generic error (no data leakage)
    - Log failed PIN attempts at warn level (IP + attempt count, never the submitted PIN)
    - _Requirements: 1.1, 3.1, 3.2, 3.3, 5.2, 8.1, 9.5_

  - [~] 11.2 Refactor verifyRecoveryCode server action
    - Wrap with `safeAction` error handler
    - Add rate limiting: `checkRateLimit(ip, { maxAttempts: 3, windowMs: 900_000 })`
    - Add input validation using `verifyRecoveryCodeSchema`
    - Replace plaintext comparison with bcrypt: query `store_configs` for `recovery_code_hash`, use `bcryptjs.compare()`
    - Remove hardcoded fallback `'4321'`
    - If config query fails or returns no result, return generic error
    - Log failed recovery attempts at warn level
    - _Requirements: 1.1, 3.4, 3.5, 3.6, 5.3, 8.1, 9.5_

  - [~] 11.3 Refactor completeOrder server action
    - Wrap with `safeAction` error handler
    - Add auth guard: call `requireAuth()` before business logic
    - Add input validation using `completeOrderSchema`
    - _Requirements: 1.1, 2.4, 8.1_

  - [ ]* 11.4 Write property test for PIN verification round-trip
    - **Property 5: PIN verification round-trip**
    - *For any* valid PIN string (4-6 digits), hashing with bcrypt then comparing the original PIN against the hash SHALL return true, and comparing any different PIN SHALL return false
    - **Validates: Requirements 3.2, 3.5**

- [ ] 12. Implement changePin admin server action
  - [~] 12.1 Add changePin to `src/actions/payment.ts`
    - Wrap with `safeAction` error handler
    - Add auth guard: call `requireAuth()` before business logic
    - Add input validation using `changePinSchema`
    - Verify current PIN against stored `cashier_pin_hash` using `bcryptjs.compare()`
    - If current PIN verification fails, return error and log the failed attempt
    - Hash new PIN with `bcryptjs.hash(newPin, 10)` (cost factor 10)
    - Update `store_configs` row where `config_key = 'cashier_pin_hash'` with new hash
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 13. Refactor `src/actions/admin.ts` - Auth guard on all admin actions
  - [~] 13.1 Refactor getDashboardStats
    - Wrap with `safeAction` error handler
    - Add auth guard: call `requireAuth()` before executing queries
    - Replace `throw new Error()` with typed error returns
    - _Requirements: 2.1, 2.2, 2.3, 8.1_

  - [~] 13.2 Refactor adjustStock
    - Wrap with `safeAction` error handler
    - Add auth guard: call `requireAuth()`
    - Add input validation using `adjustStockSchema`
    - Replace `throw new Error(error.message)` with safe error handling (log full details, return generic error)
    - _Requirements: 1.1, 1.6, 2.1, 2.3, 8.1_

  - [~] 13.3 Refactor getInventoryHistory
    - Wrap with `safeAction` error handler
    - Add auth guard: call `requireAuth()`
    - Replace `throw new Error()` with typed error returns
    - _Requirements: 2.1, 2.3, 8.1_

- [ ] 14. Refactor `src/actions/menu.ts` - Auth guard and validation on menu actions
  - [~] 14.1 Refactor createMenu
    - Wrap with `safeAction` error handler
    - Add auth guard: call `requireAuth()`
    - Convert from `FormData` input to validated object input using `createMenuSchema`
    - Replace `throw new Error()` with safe error handling
    - _Requirements: 1.1, 1.5, 2.1, 2.3, 8.1_

  - [~] 14.2 Refactor updateMenu
    - Wrap with `safeAction` error handler
    - Add auth guard: call `requireAuth()`
    - Convert from `FormData` + `id` parameter to validated object input using `updateMenuSchema`
    - Replace `throw new Error()` with safe error handling
    - _Requirements: 1.1, 1.5, 2.1, 2.3, 8.1_

  - [~] 14.3 Refactor deleteMenu
    - Wrap with `safeAction` error handler
    - Add auth guard: call `requireAuth()`
    - Add input validation using `deleteByIdSchema`
    - Replace `throw new Error()` with safe error handling
    - _Requirements: 2.1, 2.3, 8.1_

  - [~] 14.4 Refactor createCategory
    - Wrap with `safeAction` error handler
    - Add auth guard: call `requireAuth()`
    - Convert from `FormData` input to validated object input using `createCategorySchema`
    - Replace `throw new Error()` with safe error handling
    - _Requirements: 1.1, 2.1, 2.3, 8.1_

  - [~] 14.5 Refactor updateCategory
    - Wrap with `safeAction` error handler
    - Add auth guard: call `requireAuth()`
    - Convert from `FormData` + `id` parameter to validated object input using `updateCategorySchema`
    - Replace `throw new Error()` with safe error handling
    - _Requirements: 1.1, 2.1, 2.3, 8.1_

  - [~] 14.6 Refactor deleteCategory
    - Wrap with `safeAction` error handler
    - Add auth guard: call `requireAuth()`
    - Add input validation using `deleteByIdSchema`
    - Replace `throw new Error()` with safe error handling
    - _Requirements: 2.1, 2.3, 8.1_

- [~] 15. Checkpoint - Verify all server actions compile and pass
  - Ensure all refactored server actions compile without TypeScript errors
  - Verify no remaining `throw new Error()` calls in action files (all wrapped with safeAction)
  - Verify no remaining hardcoded PIN/recovery code fallbacks
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Harden webhook endpoint
  - [~] 16.1 Refactor `src/app/api/webhook/midtrans/route.ts`
    - Add IP validation: extract source IP from `x-forwarded-for` or `x-real-ip` headers
    - Parse `WEBHOOK_ALLOWED_IPS` environment variable (comma-separated IPs/CIDRs)
    - If IP not in allowlist, return HTTP 403 and log rejected IP at warn level
    - If `WEBHOOK_ALLOWED_IPS` is not configured, log warning and proceed (graceful degradation for dev)
    - Add rate limiting: `checkRateLimit(ip, { maxAttempts: 100, windowMs: 60_000 })`
    - Add input validation using `webhookPayloadSchema`
    - Replace `console.error` / `console.log` calls with Structured Logger
    - Wrap entire handler in try/catch with safe error responses (no internal detail leakage)
    - _Requirements: 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 8.1, 9.1_

- [ ] 17. Add security headers to next.config.ts
  - [~] 17.1 Configure security headers in `next.config.ts`
    - Add `headers()` async function to Next.js config
    - Apply headers to all routes using `source: '/(.*)'`
    - Add Content-Security-Policy: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; font-src 'self'; frame-ancestors 'none'`
    - Add Strict-Transport-Security: `max-age=31536000; includeSubDomains`
    - Add X-Frame-Options: `DENY`
    - Add X-Content-Type-Options: `nosniff`
    - Add Referrer-Policy: `strict-origin-when-cross-origin`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 18. Update client components to handle new ActionResult types
  - [~] 18.1 Update kiosk components for new error response format
    - Update `CartSheet.tsx`, `PaymentMethodModal.tsx`, `CashWaitScreen.tsx`, `QRISScreen.tsx` to handle `ActionResult` responses (check `result.error` instead of catching thrown errors)
    - Pass `idempotencyKey` (generated UUID) with createOrder calls
    - Display user-friendly error messages from `ActionError.message`
    - _Requirements: 11.1 (client must send idempotencyKey)_

  - [~] 18.2 Update admin components for new error response format
    - Update `MenuManager.tsx`, `InventoryManager.tsx`, `OrderBoard.tsx`, `CashAuthModal.tsx`, `DashboardClient.tsx`
    - Convert FormData-based calls to object-based calls matching new validated schemas
    - Handle `ActionResult` responses instead of try/catch on thrown errors
    - Display appropriate error messages for validation_error, unauthorized, rate_limited types
    - _Requirements: 8.3 (client receives typed errors)_

- [~] 19. Final checkpoint - Full build verification
  - Run `pnpm build` to verify the entire application compiles without errors
  - Verify no TypeScript errors across all modified files
  - Verify no remaining references to `midtrans-client`
  - Verify no remaining plaintext PIN comparisons or hardcoded fallbacks
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The migration script (task 9.1) should be run in the Supabase SQL Editor before testing tasks 10-12
- Client component updates (task 18) are necessary because the server action return types change from thrown errors to typed `ActionResult` objects
 