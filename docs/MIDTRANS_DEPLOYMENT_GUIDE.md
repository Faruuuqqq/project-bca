# MIGRATION & PRODUCTION KEYS SETUP GUIDE

## 📋 STEP 1: Run Supabase Migration

### Prerequisites
- ✅ Access to Supabase project (SOK Ayam Kalintang)
- ✅ Admin/owner role in Supabase

### How to Run Migration

**1. Open Supabase SQL Editor**
```
Go to: https://supabase.com/dashboard → Your Project → SQL Editor
```

**2. Copy the SQL migration**
```
File: migrations/add-midtrans-monitoring-table.sql
Lines: 1-111 (all content)
```

**3. Paste into SQL Editor**
```sql
-- (Paste entire migration file)
CREATE TABLE IF NOT EXISTS midtrans_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ...
)
-- ... rest of migration
```

**4. Execute**
```
Click "Run" button in Supabase SQL Editor
Wait for success message: "SUCCESS - ✓ 0 rows affected"
```

**5. Verify Migration Success**
```sql
-- Query 1: Check table created
SELECT * FROM midtrans_transactions LIMIT 1;
-- Expected: 0 rows (empty table is fine)

-- Query 2: Check indexes created
SELECT indexname FROM pg_indexes 
WHERE tablename = 'midtrans_transactions';
-- Expected: 4 indexes (idx_midtrans_order_id, idx_midtrans_created_at, ...)

-- Query 3: Check views created
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' AND table_name LIKE 'midtrans%';
-- Expected: 3 views (midtrans_hourly_stats, midtrans_daily_stats, midtrans_recent_errors)

-- Query 4: Check function created
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'cleanup_midtrans_logs';
-- Expected: cleanup_midtrans_logs function exists
```

### What the Migration Creates

| Item | Type | Purpose |
|------|------|---------|
| `midtrans_transactions` | Table | Logs all Midtrans API calls |
| `idx_midtrans_order_id` | Index | Fast query by order |
| `idx_midtrans_created_at` | Index | Fast query by date |
| `idx_midtrans_type_date` | Index | Fast query by type + date |
| `idx_midtrans_failures` | Partial Index | Fast query for failures |
| `midtrans_hourly_stats` | View | Hourly success rate |
| `midtrans_daily_stats` | View | Daily aggregate stats |
| `midtrans_recent_errors` | View | Last 50 errors |
| `cleanup_midtrans_logs()` | Function | Manual log cleanup |

---

## 🔑 STEP 2: Production Keys Required

### 2.1 Midtrans Keys

**Source**: Midtrans Merchant Dashboard  
**URL**: https://merchant.midtrans.com

#### Key #1: `MIDTRANS_SERVER_KEY` (SECRET - Backend Only)
```
Environment: Production
Type: Server Key
Format: Mid-server-XXXXXXXXXXXXXXXXX
Length: ~30-40 characters
Sensitivity: 🔴 CRITICAL SECRET
```

**How to Get**:
1. Log into https://merchant.midtrans.com
2. Go to: Settings → API Keys
3. Switch to "Production" environment (toggle at top)
4. Copy: "Server Key" (NOT Client Key)
5. Format: Starts with "Mid-server-"

**Where to Use**:
- ✅ Vercel: Environment variable `MIDTRANS_SERVER_KEY` (production only)
- ❌ Never share publicly
- ❌ Never commit to git
- ❌ Never use in .env.local locally (test keys only)

**Example**:
```
MIDTRANS_SERVER_KEY=Mid-server-HWIXsSG64koXZbeqsMkIcJOR
```

---

#### Key #2: `MIDTRANS_CLIENT_KEY` (PUBLIC - Frontend OK)
```
Environment: Production
Type: Client Key
Format: Mid-client-XXXXXXXXXXXXXXXXX
Length: ~30-40 characters
Sensitivity: 🟢 OK to expose (used in frontend)
```

**How to Get**:
1. Log into https://merchant.midtrans.com
2. Go to: Settings → API Keys
3. Switch to "Production" environment
4. Copy: "Client Key"
5. Format: Starts with "Mid-client-"

**Where to Use**:
- ✅ Vercel: Environment variable `MIDTRANS_CLIENT_KEY` (production only)
- ✅ Can be in NEXT_PUBLIC_* environment variables
- ⚠️ Public but still protect it (prevent abuse)

**Example**:
```
MIDTRANS_CLIENT_KEY=Mid-client-LxHivWM9plQg255i
```

---

#### Key #3: `MIDTRANS_IS_PRODUCTION` (Config Flag)
```
Environment: Production
Type: Boolean flag
Format: "true" (string, not boolean!)
Sensitivity: 🟢 Not sensitive
```

**What it Does**:
- Tells Midtrans SDK to use production API endpoint
- If `false`: Uses sandbox API (for testing)
- If `true`: Uses real payment processing

**Where to Use**:
- ✅ Vercel: Environment variable `MIDTRANS_IS_PRODUCTION=true`

**Example**:
```
MIDTRANS_IS_PRODUCTION=true
```

---

### 2.2 Supabase Keys (Already Configured)

These should ALREADY be set in Vercel. Check:

| Key | Where | Value | Purpose |
|-----|-------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel env | https://xxx.supabase.co | Public API URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env | eyJxx... | Backend admin key |

**Verification**:
```bash
# Go to Vercel Dashboard → Settings → Environment Variables
# Filter by "production" environment
# You should see both keys
```

**If Missing**, get from Supabase:
1. Go to: https://supabase.com/dashboard → Your Project
2. Settings → API
3. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Service Role secret` → `SUPABASE_SERVICE_ROLE_KEY`

---

## 📝 ENVIRONMENT VARIABLES CHECKLIST

### Vercel Production Environment

Create/Update these in: **Vercel Dashboard → Settings → Environment Variables**

**Filter by: "Production" environment**

```
✅ NEXT_PUBLIC_SUPABASE_URL
   Value: https://xxx.supabase.co
   Already set? Yes/No: ___

✅ SUPABASE_SERVICE_ROLE_KEY
   Value: eyJxxx...
   Already set? Yes/No: ___

✅ MIDTRANS_IS_PRODUCTION
   Value: "true"
   Already set? Yes/No: ___

✅ MIDTRANS_SERVER_KEY
   Value: Mid-server-xxx
   Already set? Yes/No: ___
   ⚠️ CRITICAL: This is secret!

✅ MIDTRANS_CLIENT_KEY
   Value: Mid-client-xxx
   Already set? Yes/No: ___
```

---

## 🚀 DEPLOYMENT STEPS (CHECKLIST)

### Phase 1: Database Migration (5 min)
- [ ] Copy migration SQL file
- [ ] Paste into Supabase SQL Editor
- [ ] Run migration
- [ ] Verify: Check 4 indexes created
- [ ] Verify: Check 3 views created
- [ ] Verify: Check function created
- Status: ✅ Ready

### Phase 2: Get Midtrans Production Keys (10 min)
- [ ] Open https://merchant.midtrans.com
- [ ] Log in with production account
- [ ] Navigate to Settings → API Keys
- [ ] Verify "Production" environment is selected
- [ ] Copy `MIDTRANS_SERVER_KEY` (starts with Mid-server-)
- [ ] Copy `MIDTRANS_CLIENT_KEY` (starts with Mid-client-)
- [ ] Save in secure location (password manager recommended)
- Status: ✅ Ready

### Phase 3: Configure Vercel Environment (5 min)
- [ ] Go to Vercel Dashboard
- [ ] Select your project
- [ ] Go to: Settings → Environment Variables
- [ ] Filter by: "Production" environment
- [ ] Create/Update these variables:
  - [ ] `MIDTRANS_IS_PRODUCTION` = `true`
  - [ ] `MIDTRANS_SERVER_KEY` = `Mid-server-xxx`
  - [ ] `MIDTRANS_CLIENT_KEY` = `Mid-client-xxx`
- [ ] Verify Supabase keys are also set:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Click "Save"
- Status: ✅ Ready

### Phase 4: Redeploy Application (5 min)
- [ ] Go to Vercel Dashboard → Deployments
- [ ] Click "Redeploy" on main branch
- [ ] Wait for build to complete (~3-5 min)
- [ ] Verify: Build succeeds with "Domains ready"
- [ ] Status: ✅ Deployed

### Phase 5: Test in Production (15 min)
- [ ] Open production URL: https://ayam-kalintang.vercel.app
- [ ] Create a test order with QRIS payment
- [ ] Verify: QRIS code displays on screen
- [ ] Verify: App doesn't crash
- [ ] Check Supabase: midtrans_transactions table has logs
- [ ] Do NOT complete payment (test only)
- [ ] Status: ✅ Tested

### Phase 6: Monitor First 24 Hours
- [ ] Watch for payment errors in logs
- [ ] Check Supabase for transaction logs
- [ ] Verify: No errors related to Midtrans keys
- [ ] Monitor: Success rate >= 95%
- [ ] Status: ✅ Live

---

## ⚠️ IMPORTANT NOTES

### Security Best Practices
1. **NEVER** commit `MIDTRANS_SERVER_KEY` to git
2. **NEVER** expose `MIDTRANS_SERVER_KEY` in frontend code
3. **NEVER** log `MIDTRANS_SERVER_KEY` to console
4. **ALWAYS** use Vercel environment variables (not .env)
5. **ALWAYS** keep keys in password manager

### Key Rotation
If keys are ever compromised:
1. Go to Midtrans merchant dashboard
2. Regenerate keys (old keys stop working immediately)
3. Update all services using the keys
4. Rollback if problems occur

### Testing Strategy
1. **Sandbox Keys** (for .env.local):
   - Use sandbox keys in development
   - Don't touch production data
   - Can test payment flow

2. **Production Keys** (Vercel only):
   - Real transactions on production
   - Only deploy after testing in sandbox
   - Monitor carefully first 24 hours

---

## 📞 TROUBLESHOOTING

### Issue: "CRITICAL: Midtrans API keys not configured"

**Cause**: MIDTRANS_SERVER_KEY or MIDTRANS_CLIENT_KEY not set in Vercel

**Fix**:
1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Verify both keys are set in "Production" environment
4. Redeploy application
5. Check logs: Should show no error

### Issue: "Midtrans API returns invalid merchant"

**Cause**: Using sandbox keys in production, or keys are wrong

**Fix**:
1. Verify you copied the PRODUCTION keys (not sandbox)
2. Double-check keys match: https://merchant.midtrans.com
3. Verify `MIDTRANS_IS_PRODUCTION=true` is set
4. Update keys in Vercel
5. Redeploy

### Issue: "QRIS generation fails"

**Cause**: Keys not set, timeout, or API error

**Check**:
1. Logs show: "CRITICAL: Midtrans API keys not configured"?
2. Check Supabase: midtrans_transactions table for error logs
3. Verify merchant is active in Midtrans dashboard
4. Test manually: Can you see QRIS in test mode?

### Issue: "Webhook not being received"

**Cause**: Webhook endpoint not configured in Midtrans

**Fix**:
1. Go to: https://merchant.midtrans.com → Settings → Notification
2. Set HTTP notification to:
   ```
   https://ayam-kalintang.vercel.app/api/webhook/midtrans
   ```
3. Save and test
4. Check Supabase logs for webhook events

---

## 📊 VERIFICATION CHECKLIST

After deployment, verify everything works:

```sql
-- 1. Check migration was successful
SELECT COUNT(*) FROM midtrans_transactions;
-- Expected: 0 or more (no error)

-- 2. Check app can log transactions
SELECT * FROM midtrans_recent_errors LIMIT 5;
-- Expected: May show 0 rows initially

-- 3. Check daily stats view
SELECT * FROM midtrans_daily_stats LIMIT 1;
-- Expected: 1 row with aggregated stats

-- 4. Monitor success rate
SELECT 
  ROUND(100.0 * 
    COUNT(*) FILTER (WHERE status = 'success') / 
    COUNT(*), 2) as success_rate
FROM midtrans_transactions
WHERE created_at > NOW() - INTERVAL '1 hour';
-- Expected: >= 95% (target)
```

---

## 🎉 READY FOR PRODUCTION!

Once all steps complete:
- ✅ Database migrated
- ✅ Production keys configured
- ✅ Application deployed
- ✅ Tests passed
- ✅ Monitoring active

Your Midtrans integration is **production-ready**! 🚀

