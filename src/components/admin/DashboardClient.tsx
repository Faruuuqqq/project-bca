'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Banknote,
  Award,
  QrCode,
  Wallet,
  Calendar,
  TrendingDown,
  Zap,
  LayoutGrid,
  Coins,
  Warehouse,
  TrendingUp,
  Minus,
} from 'lucide-react'
import { cn, formatRupiah, formatDate } from '@/lib/utils'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { adminTokens } from '@/components/admin/_tokens'
import { DateRangeChips } from '@/components/admin/DateRangeChips'
import type { DashboardStats } from '@/types/dashboard'

export default function DashboardClient({ stats }: { stats: DashboardStats }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* HEADER */}
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className={adminTokens.pageTitle}>Ringkasan Bisnis</h1>
            <Badge className="bg-brand-primary text-white text-xs px-2 py-0.5 font-bold rounded-md">
              LIVE
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"
              aria-hidden="true"
            />
            <p className={adminTokens.pageSubtitle}>Operational Pulse Analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <DateRangeChips active={stats.range} />
          <div className="hidden md:flex items-center gap-2 bg-card px-3 py-1.5 rounded-xl border border-border shadow-sm">
            <Calendar size={14} className="text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              {mounted ? formatDate(new Date()) : '...'}
            </span>
          </div>
        </div>
      </div>

      {/* CORE FINANCIALS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          accent="bg-brand-primary"
          label="Total Pendapatan"
          value={formatRupiah(stats.financials.revenue)}
          icon={<Banknote size={20} />}
          iconBg="bg-blue-50 text-brand-primary"
          delta={stats.financials.revenueDelta}
        />
        <StatCard
          accent="bg-emerald-600"
          label={
            stats.financials.grossMarginPct > 0
              ? `Laba Kotor (${stats.financials.grossMarginPct.toFixed(1)}%)`
              : 'Laba Kotor'
          }
          value={formatRupiah(stats.financials.grossProfit)}
          icon={<Coins size={20} />}
          iconBg="bg-emerald-50 text-emerald-600"
          hint={
            stats.financials.grossProfit === stats.financials.revenue ? (
              <span className={adminTokens.statHint}>
                Set harga modal di Katalog Menu
              </span>
            ) : (
              <span className={adminTokens.statHint}>Berdasarkan harga modal</span>
            )
          }
        />
        <StatCard
          accent="bg-brand-secondary"
          label="Nilai Aset Stok"
          value={formatRupiah(stats.financials.inventoryValue)}
          icon={<Warehouse size={20} />}
          iconBg="bg-amber-50 text-brand-secondary"
          hint={<span className={adminTokens.statHint}>Modal di gudang</span>}
        />
        <StatCard
          accent="bg-brand-tertiary"
          label="Rata-rata Keranjang"
          value={formatRupiah(stats.financials.aov)}
          icon={<Zap size={20} />}
          iconBg="bg-orange-50 text-brand-tertiary"
          delta={stats.financials.aovDelta}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* PEAK HOUR / DAILY TREND */}
        <Card className="lg:col-span-2 rounded-2xl border-border shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 pb-2 gap-3">
            <div>
              <h2 className={cn(adminTokens.sectionTitle, 'text-lg lg:text-xl')}>
                {stats.range === 'today' ? 'Analisis Jam Sibuk' : 'Tren Pesanan'}
              </h2>
              <p className={cn(adminTokens.sectionEyebrow, 'mt-1 text-xs lg:text-sm')}>
                {stats.range === 'today'
                  ? 'Kepadatan pelanggan hari ini'
                  : 'Volume pesanan per hari'}
              </p>
            </div>
            <Badge className="bg-blue-50 text-brand-primary border-none font-semibold text-xs px-3 py-1 rounded-full shrink-0">
              {stats.financials.orders} pesanan
            </Badge>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="h-64 sm:h-72 lg:h-72 w-full">
              {stats.operations.hourlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.operations.hourlyData}>
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

        {/* INVENTORY ALERTS */}
        <Card className="rounded-2xl border-border shadow-sm flex flex-col">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                <TrendingDown size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className={cn(adminTokens.sectionTitle, 'text-lg lg:text-xl')}>Kebutuhan Stok</h2>
                <p className={cn(adminTokens.sectionEyebrow, 'mt-0.5 text-xs lg:text-sm')}>
                  Wajib belanja segera
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-2 flex-1 flex flex-col">
            <div className="flex-1 space-y-2">
              {stats.inventoryAlerts.length > 0 ? (
                stats.inventoryAlerts.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border"
                  >
                    <div>
                      <p className="font-bold text-sm text-foreground truncate max-w-[160px]">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sisa {item.current_stock} porsi
                      </p>
                    </div>
                    <Badge className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5">
                      Kritis
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 py-8">
                  <LayoutGrid size={32} aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-wider">
                    Seluruh bahan baku cukup
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MENU PERFORMANCE + PAYMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center text-brand-secondary shrink-0">
                <Award size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className={cn(adminTokens.sectionTitle, 'text-lg lg:text-xl')}>Ranking Produk</h2>
                <p className={cn(adminTokens.sectionEyebrow, 'mt-0.5 text-xs lg:text-sm')}>
                  Menu terlaris periode ini
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="space-y-3">
              {stats.bestsellers.length > 0 ? (
                stats.bestsellers.map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0',
                          idx === 0
                            ? 'bg-brand-secondary text-brand-primary shadow-sm'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.qty} porsi terjual
                        </p>
                      </div>
                    </div>
                    <div
                      className="hidden sm:block h-1.5 w-28 bg-muted rounded-full overflow-hidden shrink-0"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full bg-brand-primary rounded-full"
                        style={{
                          width: `${(item.qty / stats.bestsellers[0].qty) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Belum ada penjualan periode ini.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-md bg-brand-primary text-white relative overflow-hidden">
          <div
            className="absolute -bottom-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"
            aria-hidden="true"
          />
          <CardContent className="p-6 relative space-y-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-brand-secondary uppercase">
                Metode Transaksi
              </h2>
              <p className="text-xs font-semibold text-blue-100/60 uppercase tracking-wider mt-1">
                Visualisasi perputaran dana
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <PaymentTile
                icon={<QrCode size={32} className="text-brand-secondary" aria-hidden="true" />}
                value={stats.paymentStats.qris}
                label="BCA QRIS"
              />
              <PaymentTile
                icon={<Wallet size={32} className="text-blue-100/70" aria-hidden="true" />}
                value={stats.paymentStats.cash}
                label="Cash"
              />
            </div>

            <div className="flex items-center justify-between text-blue-100/40 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Audit Trail v2.5
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider">
                Bakti BCA
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DeltaPill({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted px-2 py-0.5 rounded-md text-xs font-semibold">
        <Minus size={12} aria-hidden="true" />
        Tidak ada data sebelumnya
      </span>
    )
  }
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums">
        <Minus size={12} aria-hidden="true" />
        0% vs periode lalu
      </span>
    )
  }
  const positive = delta > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums',
        positive
          ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
          : 'text-red-700 bg-red-50 border border-red-100'
      )}
    >
      {positive ? (
        <TrendingUp size={12} aria-hidden="true" />
      ) : (
        <TrendingDown size={12} aria-hidden="true" />
      )}
      {`${positive ? '+' : ''}${delta.toFixed(1)}% vs periode lalu`}
    </span>
  )
}

function StatCard({
  accent,
  label,
  value,
  icon,
  iconBg,
  delta,
  hint,
}: {
  accent: string
  label: string
  value: string
  icon: React.ReactNode
  iconBg: string
  delta?: number | null
  hint?: React.ReactNode
}) {
  return (
    <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
      <div className={cn('h-1.5', accent)} aria-hidden="true" />
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-1.5 lg:p-5 lg:pb-2">
        <span className={cn(adminTokens.statLabel, 'text-xs sm:text-sm')}>{label}</span>
        <div
          className={cn('h-9 w-9 lg:h-10 lg:w-10 rounded-xl flex items-center justify-center', iconBg)}
          aria-hidden="true"
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 lg:p-5 lg:pt-0">
        <div className={cn(adminTokens.statValue, 'text-xl lg:text-2xl')}>{value}</div>
        <div className="mt-1.5 lg:mt-2">
          {delta !== undefined ? <DeltaPill delta={delta} /> : hint}
        </div>
      </CardContent>
    </Card>
  )
}

function PaymentTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col items-center gap-3">
      {icon}
      <div className="text-center">
        <p className="text-2xl font-black leading-none tabular-nums">{value}</p>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mt-1.5">
          {label}
        </p>
      </div>
    </div>
  )
}
