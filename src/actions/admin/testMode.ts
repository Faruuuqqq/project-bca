'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Mendapatkan daftar ID pesanan test dari store_configs
 */
export async function getTestOrderIds(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('store_configs')
      .select('config_value')
      .eq('config_key', 'test_order_ids')
      .single()

    if (data?.config_value) {
      return JSON.parse(data.config_value) as string[]
    }
  } catch (err) {
    // Ignore error if key doesn't exist yet
  }
  return []
}

/**
 * Menandai / Mengubah status pesanan sebagai test order
 */
export async function toggleTestOrder(orderId: string, forceState?: boolean) {
  const supabase = createAdminClient()

  // 1. Ambil daftar ID test yang ada
  const currentTestIds = await getTestOrderIds()
  const isCurrentlyTest = currentTestIds.includes(orderId)
  const shouldBeTest = forceState !== undefined ? forceState : !isCurrentlyTest

  let updatedTestIds: string[]
  if (shouldBeTest) {
    updatedTestIds = Array.from(new Set([...currentTestIds, orderId]))
  } else {
    updatedTestIds = currentTestIds.filter(id => id !== orderId)
  }

  // 2. Simpan ke store_configs
  const { error: configError } = await supabase
    .from('store_configs')
    .upsert(
      { config_key: 'test_order_ids', config_value: JSON.stringify(updatedTestIds) },
      { onConflict: 'config_key' }
    )

  if (configError) {
    console.error('Error saving test_order_ids:', configError)
    throw new Error('Gagal memperbarui status test order')
  }

  // 3. Update customer_name untuk menambahkan/menghapus tag [TEST] secara eksplisit
  const { data: order } = await supabase
    .from('orders')
    .select('customer_name')
    .eq('id', orderId)
    .single()

  if (order) {
    let newName = order.customer_name || ''
    if (shouldBeTest) {
      if (!newName.includes('[TEST]')) {
        newName = newName ? `[TEST] ${newName}` : '[TEST]'
      }
    } else {
      newName = newName.replace(/\[TEST\]\s*/g, '').trim() || null as any
    }

    await supabase
      .from('orders')
      .update({ customer_name: newName })
      .eq('id', orderId)
  }

  // Revalidate semua halaman admin yang relevan
  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/orders')
  revalidatePath('/admin/orders/history')
  revalidatePath('/admin/sales/history')

  return { success: true, isTest: shouldBeTest }
}
