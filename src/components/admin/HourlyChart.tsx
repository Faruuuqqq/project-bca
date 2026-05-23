'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminTokens } from '@/components/admin/_tokens'
import { Badge } from '@/components/ui/badge'

export interface HourlyChartProps {
  hourlyData: Array<{ hour: string; orders: number }>
  range: 'today' | '7d' | '30d' | 'mtd'
  orderCount: number
}

export function HourlyChart({ hourlyData, range, orderCount }: HourlyChartProps) {
  return (
    <Card className="lg:col-span-2 rounded-2xl border-border shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 pb-2 gap-3">
        <div>
          <h2 className={cn(adminTokens.sectionTitle, 'text-lg lg:text-xl')}>
            {range === 'today' ? 'Analisis Jam Sibuk' : 'Tren Pesanan'}
          </h2>
          <p className={cn(adminTokens.sectionEyebrow, 'mt-1 text-xs lg:text-sm')}>
            {range === 'today'
              ? 'Kepadatan pelanggan hari ini'
              : 'Volume pesanan per hari'}
          </p>
        </div>
        <Badge className="bg-blue-50 text-brand-primary border-none font-semibold text-xs px-3 py-1 rounded-full shrink-0">
          {orderCount} pesanan
        </Badge>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <div className="h-64 sm:h-72 lg:h-72 w-full">
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0667AC" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0667AC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  dy={8}
                />
                <YAxis hide />
                <Tooltip
                  trigger="click"
                  cursor={{ stroke: '#0667AC', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                    padding: 12,
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#0667AC"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
              <LayoutGrid size={32} aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-wider">
                Belum ada data pesanan
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
