import { InventoryHistoryPage } from '@/components/admin/InventoryHistoryPage'
import { getInventoryHistory } from '@/actions/admin'
import { createClient } from '@/lib/supabase/server'

export default async function HistoryPage() {
  const supabase = await createClient()
  
  // Get all menus for filter dropdown
  const { data: menus } = await supabase
    .from('menus')
    .select('id, name')
    .order('name', { ascending: true })

  // Get all history
  const history = await getInventoryHistory()

  return (
    <div className="p-8">
      <InventoryHistoryPage 
        initialHistory={history || []}
        menus={menus || []}
      />
    </div>
  )
}
