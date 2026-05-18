'use client'

import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CriticalStockIndicatorProps {
  currentStock: number
  threshold: number
  className?: string
}

/**
 * Shows visual indicator if stock is at critical level
 * Used in inventory tables and cards
 */
export function CriticalStockIndicator({
  currentStock,
  threshold,
  className,
}: CriticalStockIndicatorProps) {
  const isCritical = currentStock <= threshold
  const isVeryLow = currentStock <= Math.floor(threshold / 2)

  if (!isCritical) {
    return (
      <div className={cn('text-xs font-semibold text-green-700', className)}>
        ✓ Aman
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold',
        isVeryLow
          ? 'bg-red-100 text-red-700 animate-pulse'
          : 'bg-amber-100 text-amber-700',
        className
      )}
    >
      <AlertTriangle size={14} />
      <span>{currentStock} porsi</span>
    </div>
  )
}

/**
 * Inline warning message for critical stock
 */
export function CriticalStockWarning({
  name,
  currentStock,
  threshold,
}: {
  name: string
  currentStock: number
  threshold: number
}) {
  if (currentStock > threshold) return null

  const severity = currentStock === 0 ? 'critical' : currentStock <= threshold ? 'warning' : null
  if (!severity) return null

  return (
    <div
      className={cn(
        'text-xs p-2 rounded-lg font-semibold',
        severity === 'critical'
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      )}
    >
      {severity === 'critical'
        ? `❌ ${name} HABIS - Pesan segera!`
        : `⚠️ ${name} tinggal ${currentStock} porsi`}
    </div>
  )
}
