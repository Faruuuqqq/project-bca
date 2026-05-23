import { Suspense } from 'react'
import { MenuManager } from '@/components/admin/MenuManager'
import MenusLoading from './loading'
import { getCachedCategoriesAndMenus } from '@/lib/cache/menus'

async function MenusContent() {
  // Uses React.cache() to deduplicate multiple menus/categories queries in same request
  const { categories, menus } = await getCachedCategoriesAndMenus()

  return (
    <div className="p-8">
      <MenuManager 
        initialMenus={menus} 
        initialCategories={categories} 
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
