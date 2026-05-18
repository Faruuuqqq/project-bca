'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import { adminTokens } from '@/components/admin/_tokens'
import { DASHBOARD_RANGES, type DashboardRange } from '@/types/dashboard'

export function DateRangeChips({ active }: { active: DashboardRange }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const setRange = (range: DashboardRange) => {
    const params = new URLSearchParams(searchParams.toString())
    if (range === 'today') {
      params.delete('range')
    } else {
      params.set('range', range)
    }
    const query = params.toString()
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  return (
    <div
      role="tablist"
      aria-label="Pilih rentang waktu"
      className={cn(
        'inline-flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-sm',
        pending && 'opacity-70'
      )}
    >
      {DASHBOARD_RANGES.map((opt) => {
        const isActive = opt.value === active
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => setRange(opt.value)}
            className={cn(
              'px-4 py-2 min-h-[44px] rounded-lg text-xs font-semibold transition-colors',
              adminTokens.focus,
              isActive
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted active:bg-muted/80'
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
