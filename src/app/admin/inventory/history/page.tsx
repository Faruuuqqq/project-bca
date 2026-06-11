import { Suspense } from 'react'
import { InventoryHistoryPage } from '@/components/admin/InventoryHistoryPage'
import { getInventoryHistory } from '@/actions/admin/inventory'
import { createClient } from '@/lib/supabase/server'
import HistoryLoading from './loading'

const ITEMS_PER_PAGE = 20

async function HistoryContent({
  page,
}: {
  page: number
}) {
  const supabase = await createClient()
  
  const offset = (page - 1) * ITEMS_PER_PAGE

  const [{ data: menus }, { history, total }] = await Promise.all([
    supabase
      .from('menus')
      .select('id, name')
      .order('name', { ascending: true }),
    getInventoryHistory(ITEMS_PER_PAGE, offset),
  ])

  const totalPages = Math.ceil((total || 0) / ITEMS_PER_PAGE)

  return (
    <div className="p-8">
      <InventoryHistoryPage 
        initialHistory={history || []}
        menus={menus || []}
        currentPage={page}
        totalPages={totalPages}
        totalItems={total || 0}
      />
    </div>
  )
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))

  return (
    <Suspense fallback={<HistoryLoading />}>
      <HistoryContent page={page} />
    </Suspense>
  )
}
