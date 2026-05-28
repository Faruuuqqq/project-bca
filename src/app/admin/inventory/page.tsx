import { Suspense } from 'react'
import { InventoryManager } from '@/components/admin/InventoryManager'
import { getInventoryHistory, getCriticalStockAlerts } from '@/actions/admin/inventory'
import { StockAlertBanner } from '@/components/admin/StockAlertBanner'
import InventoryLoading from './loading'
import { getCachedMenusForInventory } from '@/lib/cache/menus'

async function InventoryContent() {
  // Parallel fetch: menus (cached) + history + alerts
  const [menus, history, criticalAlerts] = await Promise.all([
    getCachedMenusForInventory(),
    getInventoryHistory(),
    getCriticalStockAlerts(),
  ])

  return (
    <div className="p-8">
      {criticalAlerts.length > 0 && <StockAlertBanner alerts={criticalAlerts} />}
      <InventoryManager 
        initialMenus={menus} 
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
