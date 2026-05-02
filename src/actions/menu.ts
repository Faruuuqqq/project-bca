'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

// --- CATEGORIES ---

export async function addCategory(name: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .insert({ name })
  if (error) throw new Error(error.message)
  revalidateTag('menus', 'page')
  return { success: true }
}

export async function updateCategory(id: string, name: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidateTag('menus', 'page')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidateTag('menus', 'page')
  return { success: true }
}

// --- MENUS ---

export async function addMenu(data: {
  category_id: string
  name: string
  price: number
  description?: string
  image_url?: string
  current_stock: number
}) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('menus')
    .insert(data)
  if (error) throw new Error(error.message)
  revalidateTag('menus', 'page')
  return { success: true }
}

export async function updateMenu(id: string, data: any) {
  const supabase = await createClient()
  
  // Extract options if any to handle separately (future)
  const { menu_options, categories, ...cleanData } = data

  const { error } = await supabase
    .from('menus')
    .update(cleanData)
    .eq('id', id)
    
  if (error) throw new Error(error.message)
  revalidateTag('menus', 'page')
  return { success: true }
}

export async function deleteMenu(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('menus')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidateTag('menus', 'page')
  return { success: true }
}

export async function toggleSoldOut(menuId: string, value: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('menus')
    .update({ is_sold_out: value })
    .eq('id', menuId)

  if (error) {
    console.error('Toggle Sold Out Error:', error)
    throw new Error('Gagal memperbarui status menu')
  }

  revalidateTag('menus', 'page')
  return { success: true }
}
