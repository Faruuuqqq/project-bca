'use client'

import { useEffect, useRef } from 'react'

/**
 * Custom hook to detect user inactivity.
 * Triggers a callback after X milliseconds of no interaction.
 */
export function useIdleTimer(callback: () => void, timeout: number = 120000) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleEvents = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        callback()
      }, timeout)
    }

    // List of interaction events to monitor
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    events.forEach(event => {
      window.addEventListener(event, handleEvents, { passive: true })
    })

    // Start the timer on mount
    handleEvents()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      events.forEach(event => {
        window.removeEventListener(event, handleEvents)
      })
    }
  }, [callback, timeout])
}
