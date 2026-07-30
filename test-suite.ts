import { signToken, verifyToken } from './src/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xnmvbmlvkoghdcvntdoo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubXZibWx2a29naGRjdm50ZG9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcyMDk4NSwiZXhwIjoyMDkzMjk2OTg1fQ.gO3kKBu1U2mrqjd4Xn_ZfodWKcyyqRcY-y9mxeX5uDA'
)

async function runTestSuite() {
  console.log('====================================================')
  console.log('        PHASE 3 EXECUTABLE TEST SUITE               ')
  console.log('====================================================\n')

  // TEST 1: Valid Secret Signing & Verification
  try {
    const token = signToken()
    const isValid = verifyToken(token)
    console.log('[TEST 1] Valid Secret Token Sign & Verify:', isValid ? 'PASS' : 'FAIL')
  } catch (err: any) {
    console.log('[TEST 1] Error:', err.message)
  }

  // TEST 2: Forged Cookie Rejection
  const forgedToken = Buffer.from('fake-secret:' + Date.now()).toString('base64')
  const isForgedValid = verifyToken(forgedToken)
  console.log('[TEST 2] Forged Cookie Token Rejection:', !isForgedValid ? 'PASS' : 'FAIL')

  // TEST 3: Expired Token Rejection
  const oldTimestamp = Date.now() - (13 * 60 * 60 * 1000) // 13 hours ago (max age is 12 hours)
  const expiredToken = Buffer.from('kalintang-admin-secret:' + oldTimestamp).toString('base64')
  const isExpiredValid = verifyToken(expiredToken)
  console.log('[TEST 3] Expired Token Rejection:', !isExpiredValid ? 'PASS' : 'FAIL')

  // TEST 4: Database Price & Item Integrity
  const { data: orders } = await supabase.from('orders').select('id, total_price')
  const { data: items } = await supabase.from('order_items').select('order_id, subtotal')
  
  const itemTotals: Record<string, number> = {}
  items?.forEach(i => {
    itemTotals[i.order_id] = (itemTotals[i.order_id] || 0) + Number(i.subtotal)
  })

  let mismatches = 0
  let orphanOrders = 0

  orders?.forEach(o => {
    const sumItems = itemTotals[o.id]
    if (sumItems === undefined) {
      orphanOrders++
    } else if (Math.abs(sumItems - Number(o.total_price)) > 1) {
      mismatches++
    }
  })

  console.log('[TEST 4] Database Mismatch Check:', mismatches === 0 ? 'PASS' : `FAIL (${mismatches} mismatches)`)
  console.log('[TEST 5] Database Orphan Orders Check (Active count):', orphanOrders)

  // TEST 6: Stock Non-Negative Constraint Check
  const { data: menus } = await supabase.from('menus').select('id, name, current_stock')
  const negativeStockCount = menus?.filter(m => m.current_stock < 0).length || 0
  console.log('[TEST 6] Non-Negative Stock Integrity Check:', negativeStockCount === 0 ? 'PASS' : `FAIL (${negativeStockCount} negative stock items)`)

  console.log('\n====================================================')
  console.log('              TEST SUITE COMPLETED                  ')
  console.log('====================================================')
}

runTestSuite()
