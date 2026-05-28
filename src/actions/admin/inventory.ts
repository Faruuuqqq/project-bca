'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Adjust stock for a menu item (+ or -)
 */
export async function adjustStock(menuId: string, amount: number, reason: string) {
  const supabase = await createClient()

  const { data: menu, error: fetchError } = await supabase
    .from('menus')
    .select('current_stock, critical_stock_threshold, name')
    .eq('id', menuId)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  const newStock = (menu.current_stock || 0) + amount

  // Parallelize: update stock + insert log (independent operations)
  const [{ error: updateError }, { error: logError }] = await Promise.all([
    supabase
      .from('menus')
      .update({ current_stock: newStock })
      .eq('id', menuId),
    supabase.from('inventory_movements').insert({
      menu_id: menuId,
      movement_type: amount >= 0 ? 'in' : 'out',
      amount: Math.abs(amount),
      reason: reason,
    }),
  ])

  if (updateError) throw new Error(updateError.message)
  if (logError) throw new Error(logError.message)

  // Check and trigger stock alerts if needed (fire-and-forget)
  checkAndTriggerStockAlerts(menuId).catch((e) => {
    console.warn("Stock alert check failed:", e)
  })

  revalidatePath('/admin/inventory')
  return { success: true }
}

export async function getInventoryHistory() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('id, menu_id, movement_type, amount, reason, created_at, menus!inner(name)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return data
}

/**
 * Get all menu items currently below their critical stock threshold
 */
export async function getCriticalStockAlerts() {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('menus')
      .select('id, name, current_stock, critical_stock_threshold')
      .order('current_stock', { ascending: true })
      .limit(100)

    if (error) {
      console.warn("Stock alert error (likely missing migration):", error.message)
      return []
    }
    
    return (data || []).filter(
      (m) => m.current_stock < (m.critical_stock_threshold ?? 5)
    )
  } catch (e) {
    return []
  }
}

export async function getStockAlertHistory(menuId: string, limit = 10) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stock_alerts')
    .select('id, menu_id, menu_name, alert_type, current_stock, triggered_at, resolved_at')
    .eq('menu_id', menuId)
    .order('triggered_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data || []
}

export async function createStockAlert(
  menuId: string,
  currentStock: number,
  threshold: number
) {
  const supabase = await createClient()
  const { error } = await supabase.from('stock_alerts').insert({
    menu_id: menuId,
    stock_level: currentStock,
    threshold: threshold,
  })

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function dismissStockAlert(alertId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('stock_alerts')
    .update({
      dismissed_at: new Date().toISOString(),
      dismissed_by: 'admin',
    })
    .eq('id', alertId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/inventory')
  return { success: true }
}

export async function updateStockThreshold(menuId: string, threshold: number) {
  const supabase = await createClient()
  
  if (threshold < 0) throw new Error('Threshold tidak boleh negatif')
  
  const { error } = await supabase
    .from('menus')
    .update({ critical_stock_threshold: threshold })
    .eq('id', menuId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/inventory')
  return { success: true }
}

/**
 * Check and trigger alerts for items below threshold.
 * Called after every stock adjustment.
 */
export async function checkAndTriggerStockAlerts(menuId: string) {
  const supabase = await createClient()
  
  try {
    const { data: menu, error: fetchError } = await supabase
      .from('menus')
      .select('current_stock, critical_stock_threshold, name')
      .eq('id', menuId)
      .single()

    if (fetchError) {
      console.warn("Could not check stock thresholds:", fetchError.message)
      return { success: true }
    }

    const threshold = menu.critical_stock_threshold ?? 5

    if (menu.current_stock <= threshold) {
      const { data: existingAlert, error: alertError } = await supabase
        .from('stock_alerts')
        .select('id')
        .eq('menu_id', menuId)
        .is('dismissed_at', null)
        .single()

      if (alertError && alertError.code !== 'PGRST116') {
        console.warn("Could not check existing alerts:", alertError.message)
      } else if (!existingAlert) {
        try {
          await createStockAlert(menuId, menu.current_stock, threshold)
        } catch (e) {
          console.warn("Could not create alert:", e)
        }
      }
    }
  } catch (e) {
    console.warn("Stock alert check failed:", e)
  }

  return { success: true }
}

/**
 * Update the daily default stock for a menu item.
 * daily_stock = 0 means "no daily reset" for this item.
 */
export async function updateDailyStock(menuId: string, dailyStock: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('menus')
    .update({ daily_stock: Math.max(0, dailyStock) })
    .eq('id', menuId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/inventory')
  return { success: true }
}

/**
 * Reset current_stock to daily_stock for all menus that have daily_stock > 0.
 * Logs each reset as an inventory_movement for audit trail.
 */
export async function resetDailyStock() {
  const supabase = await createClient()

  const { data: menus, error: fetchError } = await supabase
    .from('menus')
    .select('id, name, current_stock, daily_stock')
    .gt('daily_stock', 0)

  if (fetchError) throw new Error(fetchError.message)
  if (!menus || menus.length === 0) {
    return { success: true, resetCount: 0, message: 'Tidak ada menu dengan stok harian yang dikonfigurasi.' }
  }

  const resetPromises = menus.map(async (menu) => {
    const diff = menu.daily_stock - (menu.current_stock || 0)

    await supabase
      .from('menus')
      .update({ current_stock: menu.daily_stock })
      .eq('id', menu.id)

    if (diff !== 0) {
      await supabase.from('inventory_movements').insert({
        menu_id: menu.id,
        movement_type: diff > 0 ? 'in' : 'out',
        amount: Math.abs(diff),
        reason: 'Reset stok harian',
      })
    }
  })

  await Promise.allSettled(resetPromises)

  revalidatePath('/admin/inventory')
  return { success: true, resetCount: menus.length }
}
