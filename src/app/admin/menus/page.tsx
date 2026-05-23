import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { MenuManager } from '@/components/admin/MenuManager'
import MenusLoading from './loading'

async function MenusContent() {
  const supabase = await createClient()

  // Parallel fetch: categories + menus
  const [{ data: categories }, { data: menus }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),
    supabase
      .from('menus')
      .select('*, categories(name)')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-8">
      <MenuManager 
        initialMenus={menus || []} 
        initialCategories={categories || []} 
      />
    </div>
  )
}

export default function MenusPage() {
  return (
    <Suspense fallback={<MenusLoading />}>
      <MenusContent />
    </Suspense>
  )
}
