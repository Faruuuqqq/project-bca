import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { InventoryManager } from '@/components/admin/InventoryManager'
import { getInventoryHistory, getCriticalStockAlerts } from '@/actions/admin'
import { StockAlertBanner } from '@/components/admin/StockAlertBanner'
import InventoryLoading from './loading'

async function InventoryContent() {
  const supabase = await createClient()

  // Parallel fetch: menus + history + alerts
  const [{ data: menus }, history, criticalAlerts] = await Promise.all([
    supabase
      .from('menus')
      .select('*, categories(name)')
      .order('name', { ascending: true }),
    getInventoryHistory(),
    getCriticalStockAlerts(),
  ])

  return (
    <div className="p-8">
      {criticalAlerts.length > 0 && <StockAlertBanner alerts={criticalAlerts} />}
      <InventoryManager 
        initialMenus={menus || []} 
        initialHistory={history || []} 
      />
    </div>
  )
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<InventoryLoading />}>
      <InventoryContent />
    </Suspense>
  )
}
