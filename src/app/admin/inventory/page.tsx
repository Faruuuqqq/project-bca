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
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-black text-[#3d2b1f]">Inventaris Stok</h2>
        <p className="text-zinc-500">Pantau ketersediaan bahan dan produk secara realtime.</p>
      </div>

      <InventoryManager 
        initialMenus={menus || []} 
        initialHistory={history || []} 
      />
    </div>
  )
}
