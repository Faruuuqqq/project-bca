# Requirements Document

## Introduction

This specification defines comprehensive backend security hardening for the SOK (Self-Order Kiosk) Ayam Kalintang application. The system is a Next.js 16 application with Supabase backend, BCA SNAP API for QRIS payments, and an admin panel protected by proxy-level authentication. A security audit identified critical, high, and medium severity vulnerabilities across server actions, webhook endpoints, and application configuration. This feature addresses all identified issues to bring the application to production-ready security posture.

## Glossary

- **Server_Action**: A Next.js server-side function invoked from client components, located in `src/actions/`
- **Validation_Layer**: A Zod-based schema validation module that validates all inputs before processing in Server Actions
- **Auth_Guard**: A reusable server-side function that verifies Supabase session existence before allowing Server Action execution
- **Rate_Limiter**: An in-memory sliding-window rate limiting module that restricts request frequency per IP or identifier
- **Price_Calculator**: A server-side module that queries menu prices from the database and computes order totals independently of client-provided values
- **Webhook_Handler**: The POST route handler at `src/app/api/webhook/midtrans/route.ts` that processes payment notifications
- **PIN_Hash**: A bcrypt-hashed cashier PIN stored in the `store_configs` table under config_key `cashier_pin_hash`
- **Recovery_Hash**: A bcrypt-hashed recovery code stored in the `store_configs` table under config_key `recovery_code_hash`
- **Idempotency_Key**: A unique client-generated identifier sent with order creation requests to prevent duplicate submissions
- **Security_Headers**: HTTP response headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) configured in `next.config.ts`
- **Structured_Logger**: A logging utility that outputs JSON-formatted log entries with severity, timestamp, context, and sanitized error details

## Requirements

### Requirement 1: Input Validation on All Server Actions

**User Story:** As a system operator, I want all server action inputs validated against strict schemas, so that malformed or malicious data cannot reach the database layer.

#### Acceptance Criteria

1. WHEN a Server_Action receives input, THE Validation_Layer SHALL validate the input against a Zod schema before any database operation executes
2. IF the Validation_Layer detects invalid input, THEN THE Server_Action SHALL return a structured error response containing field-level validation messages without throwing an exception
3. THE Validation_Layer SHALL enforce type constraints, string length limits, numeric ranges, and UUID format for all Server_Action parameters
4. WHEN the createOrder Server_Action receives items, THE Validation_Layer SHALL verify each item contains a valid UUID menu_id, a positive integer quantity (1-99), and a valid orderType enum value
5. WHEN a menu management Server_Action receives formData, THE Validation_Layer SHALL verify name length (1-100 characters), price as a positive number, category_id as a valid UUID, and description length (0-500 characters)
6. WHEN the adjustStock Server_Action receives parameters, THE Validation_Layer SHALL verify menuId as a valid UUID, amount as an integer between -9999 and 9999, and reason as a non-empty string (1-200 characters)

### Requirement 2: Authentication Guard on Admin Server Actions

**User Story:** As a system operator, I want all admin-facing server actions to verify authentication, so that unauthenticated users cannot invoke privileged operations.

#### Acceptance Criteria

1. WHEN an admin Server_Action is invoked, THE Auth_Guard SHALL verify a valid Supabase session exists before executing any business logic
2. IF the Auth_Guard detects no valid session, THEN THE Server_Action SHALL return an unauthorized error response with no data leakage
3. THE Auth_Guard SHALL protect the following Server Actions: adjustStock, getDashboardStats, getInventoryHistory, createMenu, updateMenu, deleteMenu, createCategory, updateCategory, deleteCategory
4. THE Auth_Guard SHALL protect the completeOrder Server_Action, requiring a valid Supabase session before marking orders as completed

### Requirement 3: Secure PIN and Recovery Code Verification

**User Story:** As a system operator, I want PIN and recovery codes stored as bcrypt hashes with no hardcoded fallbacks, so that credential compromise through source code exposure is impossible.

#### Acceptance Criteria

1. THE confirmCashPayment Server_Action SHALL retrieve the PIN hash from the `store_configs` table using config_key `cashier_pin_hash`
2. WHEN the confirmCashPayment Server_Action receives a PIN, THE Server_Action SHALL compare the input against the stored PIN_Hash using bcryptjs.compare
3. IF the database query for PIN_Hash fails or returns no result, THEN THE confirmCashPayment Server_Action SHALL reject the request with a generic error message
4. THE verifyRecoveryCode Server_Action SHALL retrieve the recovery hash from the `store_configs` table using config_key `recovery_code_hash`
5. WHEN the verifyRecoveryCode Server_Action receives a code, THE Server_Action SHALL compare the input against the stored Recovery_Hash using bcryptjs.compare
6. IF the database query for Recovery_Hash fails or returns no result, THEN THE verifyRecoveryCode Server_Action SHALL reject the request with a generic error message
7. THE system SHALL provide a changePin admin Server_Action that accepts the current PIN and a new PIN, verifies the current PIN against the stored hash, and stores the bcrypt hash of the new PIN

### Requirement 4: Server-Side Price Calculation

**User Story:** As a system operator, I want order totals calculated from database prices on the server, so that clients cannot manipulate prices or subtotals.

#### Acceptance Criteria

1. WHEN the createOrder Server_Action processes an order, THE Price_Calculator SHALL query the current price for each menu_id from the `menus` table
2. THE Price_Calculator SHALL compute each item subtotal as (database_price + sum_of_selected_option_extra_prices) multiplied by quantity
3. THE Price_Calculator SHALL compute the order total_price as the sum of all server-calculated item subtotals
4. IF any menu_id in the order does not exist in the database or is marked as sold out, THEN THE createOrder Server_Action SHALL reject the order with a descriptive error identifying the invalid item
5. THE createOrder Server_Action SHALL ignore any client-provided price, subtotal, or total_price values

### Requirement 5: Rate Limiting

**User Story:** As a system operator, I want rate limiting on sensitive endpoints, so that brute-force attacks and abuse are mitigated.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL use an in-memory sliding-window algorithm suitable for single-instance deployment
2. WHEN the confirmCashPayment Server_Action is invoked, THE Rate_Limiter SHALL allow a maximum of 5 attempts per IP address within a 15-minute window
3. WHEN the verifyRecoveryCode Server_Action is invoked, THE Rate_Limiter SHALL allow a maximum of 3 attempts per IP address within a 15-minute window
4. WHEN the createOrder Server_Action is invoked, THE Rate_Limiter SHALL allow a maximum of 10 orders per IP address within a 1-minute window
5. WHEN the Webhook_Handler receives a request, THE Rate_Limiter SHALL allow a maximum of 100 requests per IP address within a 1-minute window
6. IF the Rate_Limiter detects a request exceeding the allowed threshold, THEN THE system SHALL return HTTP 429 with a Retry-After header indicating seconds until the window resets

### Requirement 6: Webhook Source IP Validation

**User Story:** As a system operator, I want the webhook endpoint to validate source IP addresses, so that only legitimate payment provider servers can trigger payment status updates.

#### Acceptance Criteria

1. WHEN the Webhook_Handler receives a POST request, THE Webhook_Handler SHALL extract the source IP from request headers (X-Forwarded-For or direct connection IP)
2. THE Webhook_Handler SHALL maintain a configurable allowlist of BCA/Midtrans IP ranges stored as an environment variable
3. IF the source IP does not match any entry in the allowlist, THEN THE Webhook_Handler SHALL return HTTP 403 and log the rejected IP address
4. WHILE the IP allowlist environment variable is not configured, THE Webhook_Handler SHALL log a warning and proceed with signature verification only (graceful degradation for development)

### Requirement 7: Security Headers

**User Story:** As a system operator, I want security headers configured on all responses, so that common web attacks (clickjacking, MIME sniffing, XSS) are mitigated.

#### Acceptance Criteria

1. THE Security_Headers SHALL include Content-Security-Policy restricting script sources to self and inline scripts required by Next.js
2. THE Security_Headers SHALL include Strict-Transport-Security with max-age of 31536000 seconds and includeSubDomains directive
3. THE Security_Headers SHALL include X-Frame-Options set to DENY
4. THE Security_Headers SHALL include X-Content-Type-Options set to nosniff
5. THE Security_Headers SHALL include Referrer-Policy set to strict-origin-when-cross-origin
6. THE Security_Headers SHALL be configured in `next.config.ts` using the Next.js headers configuration

### Requirement 8: Safe Error Handling

**User Story:** As a system operator, I want server actions to return generic error messages to clients, so that internal system details are not leaked to potential attackers.

#### Acceptance Criteria

1. WHEN a Server_Action encounters a database error, THE Server_Action SHALL return a generic user-facing error message without exposing the raw Supabase error details
2. WHEN a Server_Action encounters a database error, THE Structured_Logger SHALL log the full error details server-side including the action name, input context (excluding sensitive fields), and error message
3. THE Server_Action SHALL categorize errors into client-facing types: validation_error, unauthorized, rate_limited, not_found, and internal_error
4. IF an unexpected exception occurs in a Server_Action, THEN THE Server_Action SHALL catch the exception, log full details via Structured_Logger, and return an internal_error response

### Requirement 9: Structured Logging

**User Story:** As a system operator, I want structured JSON logging for all security-relevant events, so that incidents can be investigated and monitored in production.

#### Acceptance Criteria

1. THE Structured_Logger SHALL output log entries in JSON format with fields: timestamp, level, action, message, and optional context object
2. THE Structured_Logger SHALL support log levels: debug, info, warn, and error
3. WHEN a rate limit is exceeded, THE Structured_Logger SHALL log a warn-level entry with the IP address, action name, and current attempt count
4. WHEN an authentication check fails, THE Structured_Logger SHALL log a warn-level entry with the action name and request context
5. WHEN a PIN or recovery code verification fails, THE Structured_Logger SHALL log a warn-level entry with the IP address and attempt count without logging the submitted credential
6. THE Structured_Logger SHALL sanitize all log entries to exclude sensitive values (PINs, passwords, tokens, full request bodies)

### Requirement 10: Remove Dead Dependency

**User Story:** As a developer, I want unused dependencies removed from package.json, so that the attack surface and bundle size are minimized.

#### Acceptance Criteria

1. THE system SHALL remove the `midtrans-client` package from the dependencies in `package.json`
2. WHEN the `midtrans-client` package is removed, THE system SHALL verify no import statements reference `midtrans-client` in the codebase

### Requirement 11: Order Creation Idempotency

**User Story:** As a system operator, I want order creation to be idempotent, so that duplicate submissions from network retries or double-clicks do not create duplicate orders.

#### Acceptance Criteria

1. WHEN the createOrder Server_Action receives a request, THE Server_Action SHALL accept an Idempotency_Key parameter from the client
2. THE Validation_Layer SHALL verify the Idempotency_Key is a valid UUID string
3. IF an order with the same Idempotency_Key already exists in the database, THEN THE createOrder Server_Action SHALL return the existing order data instead of creating a duplicate
4. THE `orders` table SHALL have a unique constraint on the idempotency_key column to enforce uniqueness at the database level
5. IF the Idempotency_Key is not provided, THEN THE createOrder Server_Action SHALL reject the request with a validation error

### Requirement 12: Admin PIN Change

**User Story:** As an admin, I want to change the cashier PIN through a secure server action, so that PIN rotation does not require direct database access.

#### Acceptance Criteria

1. WHEN the changePin Server_Action is invoked, THE Auth_Guard SHALL verify a valid Supabase session exists
2. WHEN the changePin Server_Action receives the current PIN and new PIN, THE Server_Action SHALL verify the current PIN against the stored PIN_Hash using bcryptjs.compare
3. IF the current PIN verification fails, THEN THE changePin Server_Action SHALL return an error and log the failed attempt
4. WHEN the current PIN is verified, THE changePin Server_Action SHALL hash the new PIN using bcryptjs with a cost factor of 10 and store the hash in `store_configs`
5. THE Validation_Layer SHALL verify the new PIN is exactly 4-6 digits
