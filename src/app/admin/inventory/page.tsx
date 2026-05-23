import { createClient } from '@/lib/supabase/server'
import { InventoryManager } from '@/components/admin/InventoryManager'
import { getInventoryHistory, getCriticalStockAlerts } from '@/actions/admin'
import { StockAlertBanner } from '@/components/admin/StockAlertBanner'

export default async function InventoryPage() {
  const supabase = await createClient()

  const { data: menus } = await supabase
    .from('menus')
    .select('*, categories(name)')
    .order('name', { ascending: true })

  const history = await getInventoryHistory()
  const criticalAlerts = await getCriticalStockAlerts()

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
