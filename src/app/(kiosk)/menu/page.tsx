import { createClient } from '@/lib/supabase/server'
import { MenuGrid } from '@/components/kiosk/MenuGrid'
import { Suspense } from 'react'
import { MenuGridSkeleton } from '@/components/kiosk/MenuGridSkeleton'
import { MenuHeader } from '@/components/kiosk/MenuHeader'

async function MenuList() {
  const supabase = await createClient()

  // Parallel fetch: categories + menus with options
  const [{ data: categories }, { data: menus }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),
    supabase
      .from('menus')
      .select(`
        *,
        categories(name),
        menu_options (
          *,
          menu_option_values (*)
        )
      `)
      .order('sort_order', { ascending: true }),
  ])

  return (
    <MenuGrid 
      initialCategories={categories || []} 
      initialMenus={menus || []} 
    />
  )
}

export default function MenuPage() {
  return (
    <div className="flex h-screen flex-col bg-zinc-50 overflow-hidden">
      <MenuHeader />

      <main className="flex-1 min-h-0 relative">
        <Suspense fallback={<MenuGridSkeleton />}>
          <MenuList />
        </Suspense>
      </main>
    </div>
  )
}
