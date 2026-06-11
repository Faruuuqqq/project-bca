'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// --- IMAGE UPLOAD ---

export async function uploadMenuImage(formData: FormData): Promise<string> {
  const supabase = createAdminClient()
  const file = formData.get('file') as File

  if (!file || file.size === 0) {
    throw new Error('Tidak ada file yang dipilih')
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.')
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran file maksimal 5MB')
  }

  // Generate unique filename
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `menus/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('menu-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) throw new Error(`Upload gagal: ${uploadError.message}`)

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('menu-images')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

export async function deleteMenuImage(imageUrl: string) {
  const supabase = createAdminClient()

  // Extract file path from URL
  const match = imageUrl.match(/menu-images\/(.+)$/)
  if (!match) return // Not a storage URL, skip

  const filePath = match[1]
  await supabase.storage.from('menu-images').remove([filePath])
}

// --- CATEGORIES ---

export async function createCategory(formData: FormData) {
  const supabase = createAdminClient()
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
  const supabase = createAdminClient()
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
  const supabase = createAdminClient()
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
  const supabase = createAdminClient()

  const imageUrl = formData.get('image_url') as string

  const data = {
    name: formData.get('name') as string,
    category_id: formData.get('category_id') as string,
    price: parseFloat(formData.get('price') as string),
    cost_price: parseFloat((formData.get('cost_price') as string) || '0'),
    description: formData.get('description') as string,
    image_url: imageUrl || null, // FIX BUG: Empty string instead of null
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
  const supabase = createAdminClient()

  const imageUrl = formData.get('image_url') as string

  const data = {
    name: formData.get('name') as string,
    category_id: formData.get('category_id') as string,
    price: parseFloat(formData.get('price') as string),
    cost_price: parseFloat((formData.get('cost_price') as string) || '0'),
    description: formData.get('description') as string,
    image_url: imageUrl || null, // FIX BUG: Empty string instead of null
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
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('menus')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/menus')
  return { success: true }
}

export async function toggleSoldOut(menuId: string, value: boolean) {
  const supabase = createAdminClient()
   
   const { error } = await supabase
     .from('menus')
     .update({ is_sold_out: value })
     .eq('id', menuId)

   if (error) throw new Error(error.message)
   
   revalidatePath('/admin/menus')
   revalidatePath('/admin/orders')
   return { success: true }
}

/**
 * Toggle menu sold out status (quick action for admin)
 * Gets current state, toggles it, and updates
 */
export async function toggleMenuSoldOut(menuId: string) {
  const supabase = createAdminClient()
  
  // Get current state
  const { data: menu, error: fetchError } = await supabase
    .from('menus')
    .select('is_sold_out')
    .eq('id', menuId)
    .single()
  
  if (fetchError) throw new Error(fetchError.message)
  if (!menu) throw new Error('Menu tidak ditemukan')
  
  // Toggle the state
  const newState = !menu.is_sold_out
  
  const { error: updateError } = await supabase
    .from('menus')
    .update({ is_sold_out: newState })
    .eq('id', menuId)
  
  if (updateError) throw new Error(updateError.message)
  
  revalidatePath('/admin/menus')
  revalidatePath('/admin/orders')
  return { success: true, is_sold_out: newState }
}
