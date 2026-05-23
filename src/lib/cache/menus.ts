'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Cached menus query per-request using React.cache()
 * Deduplicates multiple menus fetches within the same server request
 * Cache is invalidated between requests automatically
 * OPTIMIZATION: Removed SELECT * - now specifies exact columns needed
 * Impact: Smaller network payload, faster serialization
 */
export const getCachedMenus = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('menus')
    .select('id, name, price, cost_price, category_id, image_url, is_sold_out, current_stock, description, menu_options(id, name, is_required, selection_type, menu_option_values(id, label, extra_price)), categories(name)')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
})

/**
 * Cached menus with specific fields for dashboard/inventory
 */
export const getCachedMenusForInventory = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('menus')
    .select('id, name, current_stock, price, critical_stock_threshold, categories(name)')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
})

/**
 * Cached categories query per-request
 * OPTIMIZATION: Removed SELECT * - specifies exact columns needed (id, name, sort_order, description)
 * Saves bandwidth and improves serialization speed
 */
export const getCachedCategories = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, sort_order, description')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
})

/**
 * Cached combined: categories + menus (useful for pages that need both)
 */
export const getCachedCategoriesAndMenus = cache(async () => {
  const [categories, menus] = await Promise.all([
    getCachedCategories(),
    getCachedMenus(),
  ])
  return { categories, menus }
})
