import { Suspense } from 'react'
import { InventoryHistoryPage } from '@/components/admin/InventoryHistoryPage'
import { getInventoryHistory } from '@/actions/admin/inventory'
import { createClient } from '@/lib/supabase/server'
import InventoryLoading from '../loading'

async function HistoryContent() {
  const supabase = await createClient()
  
  const [{ data: menus }, history] = await Promise.all([
    supabase
      .from('menus')
      .select('id, name')
      .order('name', { ascending: true }),
    getInventoryHistory(),
  ])

  return (
    <div className="p-8">
      <InventoryHistoryPage 
        initialHistory={history || []}
        menus={menus || []}
      />
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<InventoryLoading />}>
      <HistoryContent />
    </Suspense>
  )
}
