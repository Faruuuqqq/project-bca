'use client'

import { useEffect } from 'react'

type Handler = (event: KeyboardEvent) => void

/**
 * Bind a keyboard shortcut to the window. Ignores events when focus is in
 * input/textarea/contenteditable to avoid stealing typing.
 *
 * @param key The KeyboardEvent.key value to match (e.g. '1', 'Escape').
 * @param handler Called when key matches and focus is not in editable element.
 * @param deps Dependency list passed to the underlying useEffect.
 */
export function useKeyboardShortcut(
  key: string,
  handler: Handler,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        return
      }
      if (e.key !== key) return
      e.preventDefault()
      handler(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
