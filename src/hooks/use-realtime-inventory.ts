'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { invalidateInventoryCache } from '@/lib/cache'

interface RealtimePayload {
  new: {
    id: string
    name: string
    current_stock: number
    is_sold_out: boolean
    critical_stock_threshold: number
  }
  old: {
    id: string
    current_stock: number
  }
}

/**
 * Subscribes to real-time inventory changes via Supabase Realtime.
 * Shows toast notifications when stock changes and auto-refreshes the page.
 *
 * Used in admin pages (Inventory, Dashboard) for multi-admin sync.
 */
export function useRealtimeInventory(options?: {
  /** Show toast notifications on changes */
  showToasts?: boolean
  /** Auto-refresh the page on changes */
  autoRefresh?: boolean
  /** Critical stock threshold for alerts */
  alertThreshold?: number
}) {
  const {
    showToasts = true,
    autoRefresh = true,
    alertThreshold = 5,
  } = options ?? {}

  const router = useRouter()
  const supabase = createClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const handleStockChange = useCallback(
    (payload: RealtimePayload) => {
      const { new: newData, old: oldData } = payload
      const diff = newData.current_stock - (oldData?.current_stock ?? 0)

      if (showToasts) {
        // Critical stock alert
        if (newData.current_stock <= alertThreshold && newData.current_stock > 0) {
          toast.warning(
            `⚠️ ${newData.name}: stok tinggal ${newData.current_stock} porsi`,
            { duration: 5000 }
          )
        }

        // Out of stock alert
        if (newData.current_stock === 0 || newData.is_sold_out) {
          toast.error(
            `❌ ${newData.name}: HABIS!`,
            { duration: 8000 }
          )
        }

        // Normal stock change notification
        if (diff !== 0 && newData.current_stock > alertThreshold) {
          const direction = diff > 0 ? '+' : ''
          toast.info(
            `${newData.name}: ${direction}${diff} porsi (sisa: ${newData.current_stock})`,
            { duration: 3000 }
          )
        }
      }

      // Invalidate client cache
      invalidateInventoryCache()

      // Auto-refresh to get latest server data
      if (autoRefresh) {
        router.refresh()
      }
    },
    [showToasts, autoRefresh, alertThreshold, router]
  )

  useEffect(() => {
    const channel = supabase
      .channel('admin-inventory-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'menus',
          // Only listen for stock-related column changes
        },
        (payload) => handleStockChange(payload as unknown as RealtimePayload)
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [supabase, handleStockChange])

  return {
    /** Manually unsubscribe from updates */
    unsubscribe: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    },
  }
}
