'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, Award, TrendingUp, Package, Coins, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatRupiah } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { adminTokens } from '@/components/admin/_tokens'

interface SalesItem {
  name: string
  units: number
  revenue: number
  profit: number
}

interface MenuSalesHistoryPageProps {
  initialSales: SalesItem[]
  days: number
  sortBy: string
}

export default function MenuSalesHistoryPage({
  initialSales,
  days,
  sortBy: initialSort,
}: MenuSalesHistoryPageProps) {
  const router = useRouter()
  const [period, setPeriod] = useState(days)
  const [sortBy, setSortBy] = useState(initialSort)

  const sorted = useMemo(() => {
    const data = [...initialSales]
    switch (sortBy) {
      case 'units':
        return data.sort((a, b) => b.units - a.units)
      case 'profit':
        return data.sort((a, b) => b.profit - a.profit)
      case 'revenue':
      default:
        return data.sort((a, b) => b.revenue - a.revenue)
    }
  }, [initialSales, sortBy])

  const totalUnits = initialSales.reduce((s, i) => s + i.units, 0)
  const totalRevenue = initialSales.reduce((s, i) => s + i.revenue, 0)
  const totalProfit = initialSales.reduce((s, i) => s + i.profit, 0)
  const topItem = sorted[0]

  const handlePeriodChange = (newDays: number) => {
    setPeriod(newDays)
    const params = new URLSearchParams()
    params.set('days', newDays.toString())
    if (sortBy !== 'revenue') params.set('sort', sortBy)
    router.push(`/admin/sales/history?${params.toString()}`)
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/orders')}
              className="mr-2"
            >
              <ChevronLeft size={18} />
            </Button>
            <h1 className={adminTokens.pageTitle}>Performa Penjualan Menu</h1>
          </div>
          <p className={adminTokens.pageSubtitle}>
            Data {period} hari terakhir | {initialSales.length} menu
          </p>
        </div>

        {/* Period Chips */}
        <div className="flex gap-2">
          {[7, 14, 30, 90].map((d) => (
            <Button
              key={d}
              variant={period === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange(d)}
              className={cn(
                'rounded-lg text-xs font-semibold',
                period === d && 'bg-brand-primary text-white'
              )}
            >
              {d}h
            </Button>
          ))}
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package size={20} className="text-brand-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Total Terjual</p>
                <p className="text-lg font-bold">{totalUnits.toLocaleString()} porsi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Total Pendapatan</p>
                <p className="text-lg font-bold">{formatRupiah(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Coins size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Laba Kotor</p>
                <p className="text-lg font-bold">{formatRupiah(totalProfit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Award size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Menu Terlaris</p>
                <p className="text-sm font-bold truncate max-w-[140px]">{topItem?.name || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SORT CONTROLS */}
      <div className="flex items-center gap-2">
        <ArrowUpDown size={14} className="text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground mr-2">Urutkan:</span>
        {[
          { key: 'revenue', label: 'Pendapatan' },
          { key: 'units', label: 'Terjual' },
          { key: 'profit', label: 'Laba' },
        ].map((opt) => (
          <Button
            key={opt.key}
            variant={sortBy === opt.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy(opt.key)}
            className={cn(
              'rounded-lg text-xs font-semibold h-8',
              sortBy === opt.key && 'bg-brand-primary text-white'
            )}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* SALES TABLE */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-10">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Menu</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Terjual</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Pendapatan</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Laba</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Margin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Kontribusi</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold">Belum ada penjualan</div>
                      <p>Coba ubah periode waktu</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((item, idx) => {
                  const margin = item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : '0'
                  const contribution = totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100) : 0

                  return (
                    <tr key={item.name} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className={cn(
                          'h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold',
                          idx === 0 ? 'bg-brand-secondary text-brand-primary' :
                          idx <= 2 ? 'bg-blue-50 text-brand-primary' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-sm">{item.name}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">
                        {item.units.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">
                        {formatRupiah(item.revenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">
                        {formatRupiah(item.profit)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge className={cn(
                          'text-xs',
                          parseFloat(margin) >= 30 ? 'bg-emerald-100 text-emerald-700' :
                          parseFloat(margin) >= 15 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        )}>
                          {margin}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-primary rounded-full"
                              style={{ width: `${Math.min(contribution, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">{contribution.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
