import { createClient } from '@/lib/supabase/server'
import { InventoryManager } from '@/components/admin/InventoryManager'
import { getInventoryHistory } from '@/actions/admin'

export default async function InventoryPage() {
  const supabase = await createClient()

  const { data: menus } = await supabase
    .from('menus')
    .select('*, categories(name)')
    .order('name', { ascending: true })

  const history = await getInventoryHistory()

  return (
    <div className="p-8">
      <InventoryManager 
        initialMenus={menus || []} 
        initialHistory={history || []} 
      />
    </div>
  )
}
