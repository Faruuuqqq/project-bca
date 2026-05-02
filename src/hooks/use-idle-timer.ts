'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'

export function useIdleTimer(timeoutMs: number = 180000) { // Default 3 minutes
  const router = useRouter()
  const clearCart = useCartStore((state) => state.clearCart)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    
    timerRef.current = setTimeout(() => {
      clearCart()
      router.push('/')
    }, timeoutMs)
  }

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    const handleEvent = () => resetTimer()

    events.forEach((event) => {
      document.addEventListener(event, handleEvent)
    })

    resetTimer()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((event) => {
        document.removeEventListener(event, handleEvent)
      })
    }
  }, [router, clearCart, timeoutMs])
}
