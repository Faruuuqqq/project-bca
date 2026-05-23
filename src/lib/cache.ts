'use client'

import { useCallback, useRef, useEffect } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const queryCache = new Map<string, CacheEntry<unknown>>()

/**
 * Hook for caching menu/inventory data with configurable TTL (time-to-live)
 * @param key - Unique cache key
 * @param fetcher - Async function that returns data
 * @param ttl - Time to live in milliseconds (default: 5 minutes)
 */
export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
) {
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const getCachedData = useCallback(async (): Promise<T | null> => {
    const cached = queryCache.get(key)

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T
    }

    return null
  }, [key])

  const fetch = useCallback(async (): Promise<T> => {
    const cachedData = await getCachedData()
    if (cachedData) return cachedData

    const data = await fetcher()

    if (isMountedRef.current) {
      queryCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
      })
    }

    return data
  }, [key, fetcher, ttl, getCachedData])

  const invalidate = useCallback(() => {
    queryCache.delete(key)
  }, [key])

  return { fetch, invalidate, getCachedData }
}

/**
 * Manual cache invalidation for specific keys
 */
export function invalidateCache(pattern?: string) {
  if (!pattern) {
    queryCache.clear()
    return
  }

  const keysToDelete: string[] = []
  queryCache.forEach((_, key) => {
    if (key.includes(pattern)) {
      keysToDelete.push(key)
    }
  })

  keysToDelete.forEach((key) => queryCache.delete(key))
}

/**
 * Clear cache for inventory-related data (useful after stock adjustments)
 */
export function invalidateInventoryCache() {
  invalidateCache('inventory')
  invalidateCache('menu')
}
