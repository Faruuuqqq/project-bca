'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireAdminAuth } from '@/lib/admin-auth'

// --- IMAGE UPLOAD ---

export async function uploadMenuImage(formData: FormData): Promise<string> {
  await requireAdminAuth()
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
  await requireAdminAuth()
  const supabase = createAdminClient()

  // Extract file path from URL
  const match = imageUrl.match(/menu-images\/(.+)$/)
  if (!match) return // Not a storage URL, skip

  const filePath = match[1]
  await supabase.storage.from('menu-images').remove([filePath])
}

// --- CATEGORIES ---

export async function createCategory(formData: FormData) {
  await requireAdminAuth()
  const supabase = createAdminClient()
  const name = formData.get('name') as string
  
  const { data: maxCat } = await supabase
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  const sort_order = maxCat ? (maxCat.sort_order + 1) : 1

  const { error } = await supabase
    .from('categories')
    .insert({ name, sort_order })

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/menus')
  return { success: true }
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdminAuth()
  const supabase = createAdminClient()
  const name = formData.get('name') as string

  const { error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/menus')
  return { success: true }
}

export async function swapCategoryOrder(id1: string, order1: number, id2: string, order2: number) {
  await requireAdminAuth()
  const supabase = createAdminClient()
  
  const { error: error1 } = await supabase.from('categories').update({ sort_order: order2 }).eq('id', id1)
  if (error1) throw new Error(error1.message)

  const { error: error2 } = await supabase.from('categories').update({ sort_order: order1 }).eq('id', id2)
  if (error2) throw new Error(error2.message)
  
  revalidatePath('/admin/menus')
  return { success: true }
}

export async function deleteCategory(id: string) {
  await requireAdminAuth()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/admin/menus')
  return { success: true }
}

// --- MENUS ---

export async function createMenu(formData: FormData) {
  await requireAdminAuth()
  const supabase = createAdminClient()

  const imageUrl = formData.get('image_url') as string

  const data = {
    name: formData.get('name') as string,
    category_id: formData.get('category_id') as string,
    price: parseFloat(formData.get('price') as string),
    cost_price: parseFloat((formData.get('cost_price') as string) || '0'),
    description: formData.get('description') as string,
    image_url: imageUrl || null,
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
  await requireAdminAuth()
  const supabase = createAdminClient()

  const imageUrl = formData.get('image_url') as string

  const data = {
    name: formData.get('name') as string,
    category_id: formData.get('category_id') as string,
    price: parseFloat(formData.get('price') as string),
    cost_price: parseFloat((formData.get('cost_price') as string) || '0'),
    description: formData.get('description') as string,
    image_url: imageUrl || null,
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
  await requireAdminAuth()
  const supabase = createAdminClient()
  
  // Clean up related menu options to prevent FK constraint error if cascade is missing
  await supabase.from('menu_options').delete().eq('menu_id', id)
  
  const { error } = await supabase
    .from('menus')
    .delete()
    .eq('id', id)

  if (error) {
    if (error.code === '23503') {
      return { success: false, error: 'Gagal menghapus: Menu ini sudah memiliki riwayat pesanan (coba ubah stok menjadi 0 atau Habis).' }
    }
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin/menus')
  return { success: true }
}

export async function toggleSoldOut(menuId: string, value: boolean) {
  await requireAdminAuth()
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

export async function toggleMenuSoldOut(menuId: string) {
  await requireAdminAuth()
  const supabase = createAdminClient()
  
  const { data: menu, error: fetchError } = await supabase
    .from('menus')
    .select('is_sold_out')
    .eq('id', menuId)
    .single()
  
  if (fetchError) throw new Error(fetchError.message)
  if (!menu) throw new Error('Menu tidak ditemukan')
  
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
