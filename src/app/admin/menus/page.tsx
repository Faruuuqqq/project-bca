import { createClient } from '@/lib/supabase/server'
import { MenuManager } from '@/components/admin/MenuManager'

export default async function MenusPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  const { data: menus } = await supabase
    .from('menus')
    .select('*, categories(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-black text-[#3d2b1f]">Editor Menu</h2>
        <p className="text-zinc-500">Kelola daftar makanan, harga, dan kategori restoran.</p>
      </div>

      <MenuManager 
        initialMenus={menus || []} 
        initialCategories={categories || []} 
      />
    </div>
  )
}
