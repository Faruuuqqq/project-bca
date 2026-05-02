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
    <div className="p-8">
      <MenuManager 
        initialMenus={menus || []} 
        initialCategories={categories || []} 
      />
    </div>
  )
}
