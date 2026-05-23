'use client'

import { useEffect, useCallback, useRef } from 'react'

interface UseKioskKeyboardOptions {
  /** Total number of menu items in current view */
  itemCount: number
  /** Number of columns in the grid */
  columns: number
  /** Called when Enter is pressed on focused item */
  onSelect: (index: number) => void
  /** Called when Escape is pressed */
  onEscape?: () => void
  /** Whether keyboard nav is enabled */
  enabled?: boolean
}

/**
 * Keyboard navigation for kiosk menu grid.
 * Arrow keys navigate between items, Enter selects, Escape closes modals.
 */
export function useKioskKeyboard({
  itemCount,
  columns,
  onSelect,
  onEscape,
  enabled = true,
}: UseKioskKeyboardOptions) {
  const focusedIndex = useRef<number>(-1)

  const getFocusableElements = useCallback(() => {
    return document.querySelectorAll<HTMLElement>('[data-kiosk-item]')
  }, [])

  const setFocus = useCallback(
    (index: number) => {
      const items = getFocusableElements()
      if (index < 0 || index >= items.length) return

      // Remove previous focus
      items.forEach((el) => el.removeAttribute('data-kiosk-focused'))

      // Set new focus
      focusedIndex.current = index
      const target = items[index]
      target.setAttribute('data-kiosk-focused', 'true')
      target.focus({ preventScroll: false })
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    },
    [getFocusableElements]
  )

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      // Skip if user is typing in an input
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        return
      }

      const items = getFocusableElements()
      const current = focusedIndex.current

      switch (e.key) {
        case 'ArrowRight': {
          e.preventDefault()
          const next = current + 1
          if (next < items.length) setFocus(next)
          break
        }
        case 'ArrowLeft': {
          e.preventDefault()
          const prev = current - 1
          if (prev >= 0) setFocus(prev)
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          const below = current + columns
          if (below < items.length) setFocus(below)
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          const above = current - columns
          if (above >= 0) setFocus(above)
          break
        }
        case 'Enter': {
          e.preventDefault()
          if (current >= 0 && current < items.length) {
            onSelect(current)
          }
          break
        }
        case 'Escape': {
          e.preventDefault()
          onEscape?.()
          break
        }
        // Number pad: quick focus to category tabs
        case 'Tab': {
          // Allow natural tab behavior
          break
        }
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, columns, onSelect, onEscape, getFocusableElements, setFocus])

  // Reset focus when items change
  useEffect(() => {
    focusedIndex.current = -1
  }, [itemCount])

  return {
    setFocus,
  }
}
