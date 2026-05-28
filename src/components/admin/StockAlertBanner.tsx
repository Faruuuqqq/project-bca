'use client'

import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { dismissStockAlert } from '@/actions/admin/inventory'
import { toast } from 'sonner'

interface StockAlertBannerProps {
  alerts: Array<{
    id?: string
    name: string
    current_stock: number
    critical_stock_threshold: number
  }>
}

export function StockAlertBanner({ alerts }: StockAlertBannerProps) {
  const [visible, setVisible] = useState(true)
  const [dismissing, setDismissing] = useState(false)

  if (!visible || alerts.length === 0) return null

  const handleDismiss = async () => {
    setDismissing(true)
    try {
      // In a real app, you'd dismiss individual alerts
      // For now, just hide the banner
      setVisible(false)
      toast.success('Alert dihapus')
    } catch (error: unknown) {
      toast.error('Gagal menghapus alert')
    } finally {
      setDismissing(false)
    }
  }

  const criticalCount = alerts.length
  const totalStock = alerts.reduce((sum, item) => sum + item.current_stock, 0)

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 animate-in slide-in-from-top">
      <div className="flex items-start gap-3 justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={20} className="text-red-600" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-red-900 text-sm lg:text-base">
              ⚠️ {criticalCount} Item Stok Kritis
            </h3>
            <p className="text-xs lg:text-sm text-red-700 mt-1">
              {alerts.slice(0, 2).map((item) => item.name).join(', ')}
              {alerts.length > 2 && `, dan ${alerts.length - 2} item lainnya`}
            </p>
            <p className="text-xs text-red-600 mt-2">
              Total sisa: <span className="font-bold">{totalStock} porsi</span> - Pesan stok segera!
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          disabled={dismissing}
          className="shrink-0 h-8 w-8 p-0 text-red-600 hover:bg-red-100"
        >
          <X size={16} />
        </Button>
      </div>
    </div>
  )
}
