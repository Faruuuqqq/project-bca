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
      categories(name),
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
    <div className="flex h-screen flex-col bg-[#f8f1e7] overflow-hidden">
      <header className="sticky top-0 z-10 bg-[#d42c2c] p-4 md:p-6 text-white shadow-xl shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black italic tracking-tighter leading-none">AYAM KALINTANG</h1>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-70 mt-1">Self-Order Kiosk</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <p className="text-[10px] font-black uppercase opacity-60">Terminal</p>
              <p className="text-xs font-bold">KIOSK #01</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/10 backdrop-blur-sm">
              <span className="font-black text-sm">01</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 relative">
        <Suspense fallback={<MenuGridSkeleton />}>
          <MenuList />
        </Suspense>
      </main>
    </div>
  )
}
