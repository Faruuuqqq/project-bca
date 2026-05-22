'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- CATEGORIES ---

export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const sort_order = parseInt(formData.get('sort_order') as string || '0')

  const { error } = await supabase
    .from('categories')
    .insert({ name, sort_order })

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/menus')
  return { success: true }
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const sort_order = parseInt(formData.get('sort_order') as string || '0')

  const { error } = await supabase
    .from('categories')
    .update({ name, sort_order })
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/menus')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/menus')
  return { success: true }
}

// --- MENUS ---

export async function createMenu(formData: FormData) {
  const supabase = await createClient()
  
  const data = {
    name: formData.get('name') as string,
    category_id: formData.get('category_id') as string,
    price: parseFloat(formData.get('price') as string),
    description: formData.get('description') as string,
    image_url: formData.get('image_url') as string,
    is_sold_out: formData.get('is_sold_out') === 'on',
  }

  const { error } = await supabase
    .from('menus')
    .insert(data)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/menus')
  return { success: true }
}

export async function updateMenu(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const data = {
    name: formData.get('name') as string,
    category_id: formData.get('category_id') as string,
    price: parseFloat(formData.get('price') as string),
    description: formData.get('description') as string,
    image_url: formData.get('image_url') as string,
    is_sold_out: formData.get('is_sold_out') === 'on',
  }

  const { error } = await supabase
    .from('menus')
    .update(data)
    .eq('id', id)
    
  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/menus')
  return { success: true }
}

export async function deleteMenu(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('menus')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/menus')
  return { success: true }
}

export async function toggleSoldOut(menuId: string, value: boolean) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('menus')
    .update({ is_sold_out: value })
    .eq('id', menuId)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/menus')
  revalidatePath('/admin/orders')
  return { success: true }
}
