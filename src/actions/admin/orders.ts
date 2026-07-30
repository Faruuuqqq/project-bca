'use server'
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

import { getTestOrderIds } from './testMode'
import { requireAdminAuth } from '@/lib/admin-auth'
import { checkIsTestOrder } from '@/lib/testOrder'

export async function getOrdersHistory(
  limit: number = 100, 
  offset: number = 0,
  filters?: {
    search?: string
    status?: string
    payment?: string
    dateFrom?: string
    dateTo?: string
    hideTest?: boolean
  }
) {
  await requireAdminAuth()
  const supabase = await createClient()
  const testOrderIds = await getTestOrderIds()
  const testIdsSet = new Set(testOrderIds)

  let query = supabase
    .from('orders')
    .select(
      'id, total_price, order_type, payment_method, payment_status, created_at, order_status, customer_name, order_items(menu_name, quantity, menu_price, order_item_options(id, option_name, value_label, extra_price))',
      { count: 'exact' }
    )

  if (filters?.status && filters.status !== 'all') {
    if (filters.status === 'unpaid') query = query.eq('payment_status', 'unpaid')
    else if (filters.status === 'completed') {
      query = query.eq('payment_status', 'paid').eq('order_status', 'completed')
    } else if (filters.status === 'pending') {
      query = query.eq('payment_status', 'paid').not('order_status', 'in', '("completed","void")')
    } else if (filters.status === 'test') {
      // Filter test orders specifically
      if (testOrderIds.length > 0) {
        query = query.or(`id.in.(${testOrderIds.map(id => `"${id}"`).join(',')}),customer_name.ilike.%[TEST]%`)
      } else {
        query = query.ilike('customer_name', '%[TEST]%')
      }
    }
  }

  if (filters?.payment && filters.payment !== 'all') {
    query = query.eq('payment_method', filters.payment)
  }

  if (filters?.search) {
    query = query.ilike('id', `%${filters.search}%`)
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', `${filters.dateFrom}T00:00:00Z`)
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', `${filters.dateTo}T23:59:59.999Z`)
  }

  // Get recap configuration
  const { data: config } = await supabase.from('store_configs').select('config_value').eq('config_key', 'revenue_reset_at').single()
  const resetAt = config?.config_value ? new Date(config.config_value) : null

  // Fetch recap data
  let recapQuery = supabase.from('orders').select('id, payment_method, total_price, payment_status, created_at, customer_name')
  
  if (resetAt) {
    recapQuery = recapQuery.gte('created_at', resetAt.toISOString())
  }
  
  if (filters?.dateFrom) {
     recapQuery = recapQuery.gte('created_at', `${filters.dateFrom}T00:00:00Z`)
  }
  if (filters?.dateTo) {
     recapQuery = recapQuery.lte('created_at', `${filters.dateTo}T23:59:59.999Z`)
  }
  
  const { data: recapData } = await recapQuery
  
  let qrisTotal = 0
  let cashTotal = 0
  if (recapData) {
     for (const order of recapData) {
        // Exclude test orders from recap totals if hideTest is true or default
        if (filters?.hideTest !== false && checkIsTestOrder(order, testIdsSet)) {
          continue
        }
        if (order.payment_status === 'paid') {
           if (order.payment_method === 'QRIS') qrisTotal += (order.total_price || 0)
           if (order.payment_method === 'CASH') cashTotal += (order.total_price || 0)
        }
     }
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)

  // Attach is_test boolean to each order object
  const formattedOrders = data?.map(order => ({
    ...order,
    is_test: checkIsTestOrder(order, testIdsSet)
  }))

  return { orders: formattedOrders, total: count, recap: { qrisTotal, cashTotal, resetAt: resetAt?.toISOString() || null } }
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(menu_name, quantity, menu_price)')
    .eq('id', orderId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function exportOrdersCSV(filters?: {
  search?: string
  status?: string
  payment?: string
  dateFrom?: string
  dateTo?: string
}) {
  await requireAdminAuth()
  const supabase = await createClient()
  const testOrderIds = await getTestOrderIds()
  const testIdsSet = new Set(testOrderIds)

  let query = supabase
    .from('orders')
    .select(
      'id, total_price, order_type, payment_method, payment_status, created_at, order_status, customer_name, order_items(menu_name, quantity, menu_price, order_item_options(id, option_name, value_label, extra_price))'
    )

  if (filters?.status && filters.status !== 'all') {
    if (filters.status === 'unpaid') query = query.eq('payment_status', 'unpaid')
    else if (filters.status === 'completed') {
      query = query.eq('payment_status', 'paid').eq('order_status', 'completed')
    } else if (filters.status === 'pending') {
      query = query.eq('payment_status', 'paid').not('order_status', 'in', '("completed","void")')
    } else if (filters.status === 'test') {
      if (testOrderIds.length > 0) {
        query = query.or(`id.in.(${testOrderIds.map(id => `"${id}"`).join(',')}),customer_name.ilike.%[TEST]%`)
      } else {
        query = query.ilike('customer_name', '%[TEST]%')
      }
    }
  }

  if (filters?.payment && filters.payment !== 'all') {
    query = query.eq('payment_method', filters.payment)
  }

  if (filters?.search) {
    query = query.ilike('id', `%${filters.search}%`)
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', `${filters.dateFrom}T00:00:00Z`)
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', `${filters.dateTo}T23:59:59.999Z`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  let csv = 'Tanggal,Waktu,ID Pesanan,Tipe Pesanan,Status Pembayaran,Status Pesanan,Metode Pembayaran,Total Harga,Kategori Data,Daftar Menu\n'
  
  if (data) {
    for (const order of data) {
      const dateObj = new Date(order.created_at)
      const dateStr = dateObj.toLocaleDateString('id-ID')
      const timeStr = dateObj.toLocaleTimeString('id-ID')
      const isTest = checkIsTestOrder(order, testIdsSet)
      const dataType = isTest ? 'TEST' : 'REAL'
      
      const itemsList = order.order_items?.map((item: any) => {
        let text = `${item.quantity}x ${item.menu_name}`
        if (item.order_item_options?.length > 0) {
          const opts = item.order_item_options.map((o: any) => o.value_label).join(', ')
          text += ` (${opts})`
        }
        return text
      }).join(' | ') || ''
      
      const safeItems = `"${itemsList.replace(/"/g, '""')}"`
      
      csv += `${dateStr},${timeStr},${order.id},${order.order_type},${order.payment_status},${order.order_status},${order.payment_method},${order.total_price},${dataType},${safeItems}\n`
    }
  }
  
  return csv
}


export async function resetRevenueRecap() {
  await requireAdminAuth()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('store_configs')
    .upsert({ config_key: 'revenue_reset_at', config_value: new Date().toISOString() }, { onConflict: 'config_key' })
    
  if (error) throw new Error(error.message)
  revalidatePath('/admin/orders/history')
  return { success: true }
}
