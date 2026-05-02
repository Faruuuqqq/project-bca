import { createClient } from '@/lib/supabase/server'
import { MenuGrid } from '@/components/kiosk/MenuGrid'
import { Suspense } from 'react'
import { MenuGridSkeleton } from '@/components/kiosk/MenuGridSkeleton'

async function MenuList() {
  const supabase = await createClient()

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  // Fetch menus with their options and values
  const { data: menus } = await supabase
    .from('menus')
    .select(`
      *,
      menu_options (
        *,
        menu_option_values (*)
      )
    `)
    .order('sort_order', { ascending: true })

  return (
    <MenuGrid 
      initialCategories={categories || []} 
      initialMenus={menus || []} 
    />
  )
}

export default function MenuPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8f1e7]">
      <header className="sticky top-0 z-10 bg-[#d42c2c] p-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">AYAM KALINTANG</h1>
          <div className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
            Kiosk #01
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Suspense fallback={<MenuGridSkeleton />}>
          <MenuList />
        </Suspense>
      </main>
    </div>
  )
}
