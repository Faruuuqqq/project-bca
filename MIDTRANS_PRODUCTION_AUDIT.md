# MIDTRANS INTEGRATION - PRODUCTION READINESS AUDIT

**Last Reviewed**: 2026-05-23  
**Status**: ⚠️ READY WITH CRITICAL ISSUES TO FIX  
**Target**: Production Deployment

---

## 📋 Executive Summary

Midtrans QRIS integration is **functionally complete** but has **4 CRITICAL security/reliability issues** that must be fixed before production. The integration correctly handles payment generation, verification, and webhook processing, but requires hardening in environment management, error handling, and transaction safety.

**Risk Level**: 🔴 **HIGH** (cannot deploy as-is)  
**Estimated Fix Time**: 2-3 hours

---

## ✅ STRENGTHS

### 1. **Correct Webhook Signature Verification**
- **File**: `src/app/api/webhook/midtrans/route.ts:19`
- ✅ Uses SHA512 hash verification
- ✅ Compares with Midtrans signature_key
- ✅ Prevents unauthorized payment updates
- **Status**: SECURE

### 2. **Idempotent Payment Updates**
- **File**: `src/app/api/webhook/midtrans/route.ts:38`
- ✅ Uses `.eq('payment_status', 'unpaid')` guard clause
- ✅ Prevents duplicate payment recordings
- ✅ Multiple webhook deliveries won't double-charge
- **Status**: CORRECT

### 3. **Multi-Channel Payment Detection**
- **File**: `src/components/kiosk/QRISScreen.tsx:48-75`
- ✅ Polling every 3 seconds (fast)
- ✅ Realtime Supabase listener for instant updates
- ✅ Manual button check for user override
- ✅ Prevents false negatives
- **Status**: ROBUST

### 4. **Dual-Path Status Checking**
- **File**: `src/actions/payment.ts:42-50` (fallback logic)
- ✅ If Midtrans API fails, falls back to DB check
- ✅ Graceful degradation if Midtrans is down
- **Status**: RESILIENT

### 5. **Server-Side Payment Validation**
- **File**: `src/actions/payment.ts` (all payment actions)
- ✅ All payment logic runs server-side
- ✅ Client cannot manipulate payment status
- ✅ PIN validation server-side (not client)
- **Status**: SECURE

### 6. **Environment Separation**
- **File**: `.env` variables
- ✅ Separate production flag (`MIDTRANS_IS_PRODUCTION`)
- ✅ Server key stored in backend environment
- ✅ Client key protected (Next.js public prefix but backend-only usage)
- **Status**: CONFIGURED

---

## 🔴 CRITICAL ISSUES TO FIX

### ISSUE #1: Missing Environment Variable Validation (CRITICAL)

**Location**: `src/lib/midtrans/index.ts:13-14`

```typescript
// ❌ DANGEROUS - allows empty/undefined values
serverKey: process.env.MIDTRANS_SERVER_KEY || '',
clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
```

**Problem**:
- If env vars are missing, defaults to empty string
- Midtrans API calls will fail silently
- Hard to debug in production
- Can cause payment failures without clear error

**Risk**: 🔴 HIGH - Users think payment is processing but it's actually failing

**Fix**:
```typescript
const serverKey = process.env.MIDTRANS_SERVER_KEY
const clientKey = process.env.MIDTRANS_CLIENT_KEY

if (!serverKey || !clientKey) {
  throw new Error('CRITICAL: Midtrans API keys not configured in environment')
}

export const midtransCore = new midtransClient.CoreApi({
  isProduction: isProduction,
  serverKey: serverKey,
  clientKey: clientKey,
})
```

**Impact**: Prevents silent failures, ensures payment system is ready before app starts

---

### ISSUE #2: Missing Rate Limiting on Payment Status Check (CRITICAL)

**Location**: `src/actions/payment.ts:9-54`

```typescript
export async function checkPaymentStatus(orderId: string) {
  // ❌ NO RATE LIMITING - anyone can spam Midtrans API
  const transaction = await midtransCore.transaction.status(orderId)
  // ...
}
```

**Problem**:
- Frontend polls every 3 seconds indefinitely
- No rate limiting on API calls to Midtrans
- User can manually click "Cek Status" repeatedly
- Potential DDoS on Midtrans API
- May hit Midtrans rate limits → payment detection fails

**Risk**: 🔴 HIGH - Payment verification can fail due to rate limits

**Scenario**:
```
T=0s: User starts payment flow
T=3s: First poll - OK
T=6s: User clicks "Cek Status" manually while polling (2 API calls)
T=9s: Second poll + another manual click (3 API calls)
T=30s: 10 API calls in 30 seconds → Midtrans returns 429 Too Many Requests
T=33s: Payment detection fails for 30+ seconds
```

**Fix**:
```typescript
// Add debounce/throttle to checkPaymentStatus calls
const lastCheckTime = useRef<number>(0)
const MIN_CHECK_INTERVAL = 2000 // 2 seconds

const checkStatusManual = async () => {
  const now = Date.now()
  if (now - lastCheckTime.current < MIN_CHECK_INTERVAL) {
    toast.warning("Tunggu 2 detik sebelum cek lagi")
    return
  }
  lastCheckTime.current = now
  // ... proceed with check
}
```

Also add server-side rate limiting:
```typescript
// src/actions/payment.ts
const paymentCheckCache = new Map<string, number>()

export async function checkPaymentStatus(orderId: string) {
  const lastCheck = paymentCheckCache.get(orderId) || 0
  if (Date.now() - lastCheck < 1000) { // Min 1 second between checks
    return { status: 'checking', cached: true }
  }
  
  paymentCheckCache.set(orderId, Date.now())
  // ... proceed with Midtrans API call
}
```

**Impact**: Prevents API rate limiting issues, ensures payment detection is reliable

---

### ISSUE #3: Missing Transaction Monitoring & Alerts (CRITICAL)

**Location**: `src/lib/midtrans/index.ts` + `src/app/api/webhook/midtrans/route.ts`

```typescript
// ❌ NO LOGGING/MONITORING
const response = await midtransCore.charge(parameter)
// Just logs, no metrics tracking
console.log("✅ [Midtrans] Charge Response Received")
```

**Problem**:
- No tracking of failed payment generations
- No alerting if Midtrans API is down
- No visibility into payment conversion rates
- Can't identify patterns of payment failures
- Admin dashboard has no Midtrans health status

**Risk**: 🔴 HIGH - Payment failures go undetected until customer complaints

**Scenarios That Aren't Monitored**:
- "Payment generation fails 5% of the time" (can't detect)
- "Midtrans API is down for 5 minutes" (no alert sent)
- "Webhook delivery failures silently happen" (never noticed)
- "10 failed transactions yesterday" (can't query it)

**Fix** - Create monitoring table:
```sql
CREATE TABLE midtrans_transactions (
  id UUID PRIMARY KEY,
  order_id VARCHAR REFERENCES orders(id),
  transaction_type VARCHAR, -- 'charge', 'status', 'webhook'
  status VARCHAR, -- 'success', 'failed', 'timeout'
  amount DECIMAL,
  error_message TEXT,
  response_time_ms INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_midtrans_daily ON midtrans_transactions(created_at DESC);
```

Then log every transaction:
```typescript
// src/lib/midtrans/index.ts
async function logMidtransTransaction(data: {
  orderId: string
  type: 'charge' | 'status' | 'webhook'
  status: 'success' | 'failed'
  error?: string
  responseTime?: number
}) {
  await supabase.from('midtrans_transactions').insert({
    order_id: data.orderId,
    transaction_type: data.type,
    status: data.status,
    error_message: data.error,
    response_time_ms: data.responseTime
  })
}
```

**Impact**: Enables monitoring, debugging, and faster incident response

---

### ISSUE #4: Incomplete Error Handling & Recovery (CRITICAL)

**Location**: `src/components/kiosk/QRISScreen.tsx:57-59`, `src/actions/payment.ts:37-54`

```typescript
// ❌ SILENT FAILURES
} catch (e) {
  // silent fail
}

// ❌ VAGUE ERROR MESSAGES
return { status: 'unpaid', error: errMsg }
```

**Problem**:
- Polling silently fails without retries
- User doesn't know if payment check failed or payment is unpaid
- No distinction between:
  - Network timeout
  - Midtrans API error
  - Payment not received yet (legitimate)
  - Invalid order ID (bug)

**Risk**: 🔴 HIGH - Payment detection failures appear as unpaid orders to users

**Current User Experience**:
```
Customer waits for payment detection
↓
API fails silently (connection timeout)
↓
Customer doesn't know if payment failed or is still checking
↓
Customer leaves without confirmation
↓
Order stuck as unpaid in database
```

**Fix** - Add retry logic with exponential backoff:
```typescript
// src/actions/payment.ts
export async function checkPaymentStatus(orderId: string, retryCount = 0) {
  const MAX_RETRIES = 3
  const RETRY_DELAY = [1000, 2000, 5000] // ms

  try {
    const transaction = await midtransCore.transaction.status(orderId)
    return { status: 'success', data: transaction }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      // Exponential backoff retry
      await new Promise(r => setTimeout(r, RETRY_DELAY[retryCount]))
      return checkPaymentStatus(orderId, retryCount + 1)
    }
    
    // All retries exhausted, check DB as fallback
    const { data } = await supabase
      .from('orders')
      .select('payment_status')
      .eq('id', orderId)
      .single()
    
    return { 
      status: 'fallback',
      data: data?.payment_status,
      message: 'Midtrans API unavailable, checking local database'
    }
  }
}
```

Then in QRISScreen, handle different statuses:
```typescript
if (result.status === 'success' && result.data.transaction_status === 'paid') {
  handleSuccess()
} else if (result.status === 'fallback') {
  toast.info("API sedang lambat, menggunakan data lokal...")
  if (result.data === 'paid') handleSuccess()
} else if (result.status === 'error') {
  toast.error("Gagal mengecek pembayaran, coba lagi dalam 5 detik")
}
```

**Impact**: Graceful error handling, users know what's happening, payment system is more reliable

---

## ⚠️ MEDIUM PRIORITY ISSUES

### ISSUE #5: Missing Webhook Timeout Handling

**Location**: `src/app/api/webhook/midtrans/route.ts:34-43`

```typescript
// ❌ NO TIMEOUT - Supabase call can hang indefinitely
const { error } = await supabase
  .from('orders')
  .update({ payment_status: 'paid' })
  .eq('id', order_id)
  .eq('payment_status', 'unpaid')
```

**Problem**:
- If Supabase is slow/down, webhook handler hangs
- Midtrans will retry webhook (duplicate updates)
- Can cause "hanging request" issues in production

**Fix**: Add timeout wrapper
```typescript
const withTimeout = async (promise: Promise<any>, timeoutMs = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ])
}

// In webhook handler:
try {
  await withTimeout(
    supabase.from('orders').update(...).eq(...)
  )
} catch (error) {
  if (error.message === 'Timeout') {
    console.error('DB update timeout - Midtrans will retry webhook')
  }
  throw error
}
```

---

### ISSUE #6: Production Key Management Not Documented

**Location**: `.env` (test keys only)

```
MIDTRANS_SERVER_KEY=Mid-server-HWIXsSG64koXZbeqsMkIcJOR  # ❌ TEST KEY
MIDTRANS_IS_PRODUCTION=false
```

**Problem**:
- Currently using sandbox/test keys
- No documentation on how to switch to production
- No process for safely rotating keys
- Production keys might end up in .env file (security risk)

**Fix**: Create deployment guide
```markdown
## Production Deployment Checklist

### 1. Get Production Keys from Midtrans Dashboard
- Log into merchant.midtrans.com
- Go to Settings → API Keys
- Copy production Server Key and Client Key

### 2. Store in Vercel Environment Variables (NOT .env)
- Go to Vercel dashboard → Settings → Environment Variables
- Add MIDTRANS_SERVER_KEY (only for production environment)
- Add MIDTRANS_CLIENT_KEY (only for production environment)
- Add MIDTRANS_IS_PRODUCTION=true

### 3. Never commit production keys
- .env and .env.local should only have sandbox keys
- .gitignore should include .env.local
- Review commits before pushing to staging

### 4. Test before going live
- Create test transaction
- Verify payment detection works
- Check webhook is received
```

---

## 🟡 LOW PRIORITY ISSUES

### ISSUE #7: GoPay Payment Type Hard-Coded

**Location**: `src/lib/midtrans/index.ts:30`

```typescript
const parameter = {
  payment_type: "gopay",  // ❌ HARD-CODED
  // ...
}
```

**Impact**: Can't easily add other payment methods (credit card, bank transfer, etc.)

**Fix**: Make it configurable
```typescript
export async function generateMidtransQRIS(
  orderId: string, 
  amount: number,
  paymentType: 'gopay' | 'qris' = 'gopay'
) {
  const parameter = {
    payment_type: paymentType,
    // ...
  }
}
```

---

### ISSUE #8: No Merchant ID Validation

**Location**: `src/components/kiosk/PaymentMethodModal.tsx` (hard-coded)

```typescript
<span>Merchant ID: BC-001293</span>  // ❌ HARD-CODED
```

**Impact**: If merchant ID changes, need to update code in multiple places

**Fix**: Store in database
```typescript
const { data: config } = await supabase
  .from('store_configs')
  .select('config_value')
  .eq('config_key', 'merchant_id')
  .single()

return config?.config_value || 'BC-001293'
```

---

## 📊 Production Readiness Checklist

| Category | Item | Status | Priority |
|----------|------|--------|----------|
| **Security** | Webhook signature verification | ✅ PASS | - |
| **Security** | Server-side payment validation | ✅ PASS | - |
| **Security** | Idempotent payment updates | ✅ PASS | - |
| **Security** | Environment variable validation | ❌ FAIL | 🔴 CRITICAL |
| **Reliability** | Rate limiting on API calls | ❌ MISSING | 🔴 CRITICAL |
| **Reliability** | Transaction monitoring | ❌ MISSING | 🔴 CRITICAL |
| **Reliability** | Error handling & retries | ❌ INCOMPLETE | 🔴 CRITICAL |
| **Reliability** | Webhook timeout handling | ⚠️ WEAK | 🟡 MEDIUM |
| **Operations** | Production key management | ⚠️ UNDOCUMENTED | 🟡 MEDIUM |
| **Extensibility** | Payment method flexibility | ⚠️ HARD-CODED | 🟢 LOW |
| **Maintainability** | Configuration centralization | ⚠️ SCATTERED | 🟢 LOW |

---

## 🚀 Implementation Plan - CRITICAL ISSUES ONLY

**Estimated Time**: 2-3 hours

### Phase 1: Fix Environment Validation (30 min)
1. Update `src/lib/midtrans/index.ts` to throw error if keys missing
2. Test: Run app with missing keys, verify error is clear
3. Commit: `fix(midtrans): add environment variable validation`

### Phase 2: Add Rate Limiting (45 min)
1. Add server-side rate limiting in `src/actions/payment.ts`
2. Add client-side debounce in `src/components/kiosk/QRISScreen.tsx`
3. Test: Simulate rapid clicks, verify rate limiting works
4. Commit: `fix(midtrans): add rate limiting to payment status checks`

### Phase 3: Add Monitoring (60 min)
1. Create `midtrans_transactions` table in Supabase
2. Create `src/lib/midtrans/monitor.ts` with logging functions
3. Update all Midtrans calls to log transactions
4. Create admin dashboard widget to show Midtrans health
5. Commit: `feat(midtrans): add transaction monitoring and alerts`

### Phase 4: Improve Error Handling (30 min)
1. Add retry logic to `checkPaymentStatus`
2. Update error messages with distinct statuses
3. Test: Simulate API failures, verify retries work
4. Commit: `fix(midtrans): add retry logic and better error messages`

### Phase 5: Documentation (30 min)
1. Create production deployment guide
2. Add webhook testing instructions
3. Document how to rotate keys
4. Commit: `docs(midtrans): add production deployment guide`

---

## 🎯 Summary

**Current State**:
- ✅ Core integration works correctly
- ✅ Webhook signature verification is secure
- ❌ Missing critical production hardening

**Before Production Deployment**:
1. ✅ Fix environment validation
2. ✅ Add rate limiting
3. ✅ Add transaction monitoring
4. ✅ Improve error handling
5. ✅ Document production process

**Estimated Time to Production-Ready**: 2-3 hours  
**Risk Level After Fixes**: 🟢 LOW

---

## 📝 Sign-Off

- [ ] All CRITICAL issues fixed
- [ ] All fixes tested on staging
- [ ] Production keys configured in Vercel
- [ ] Monitoring dashboard set up
- [ ] Team trained on payment troubleshooting
- [ ] Ready for production deployment

