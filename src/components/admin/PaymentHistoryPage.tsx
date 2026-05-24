'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, QrCode, Wallet, Banknote, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatRupiah, formatDateTime } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { adminTokens } from '@/components/admin/_tokens'

interface PaymentItem {
  menu_name: string
  quantity: number
  menu_price: number
}

interface Payment {
  id: string
  total_price: number
  payment_method: 'QRIS' | 'CASH'
  payment_status: string
  order_type: 'dine-in' | 'take-away'
  created_at: string
  order_items?: PaymentItem[]
}

interface PaymentStats {
  totalRevenue: number
  qrisRevenue: number
  cashRevenue: number
  qrisCount: number
  cashCount: number
}

interface PaymentHistoryPageProps {
  initialPayments: Payment[]
  currentPage: number
  totalPages: number
  totalPayments: number
  stats: PaymentStats
  methodFilter?: string
  dateFrom?: string
  dateTo?: string
}

export default function PaymentHistoryPage({
  initialPayments,
  currentPage,
  totalPages,
  totalPayments,
  stats,
  methodFilter = 'all',
  dateFrom = '',
  dateTo = '',
}: PaymentHistoryPageProps) {
  const router = useRouter()
  const [method, setMethod] = useState(methodFilter)
  const [from, setFrom] = useState(dateFrom)
  const [to, setTo] = useState(dateTo)

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    params.set('page', newPage.toString())
    if (method !== 'all') params.set('method', method)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    router.push(`/admin/payments/history?${params.toString()}`)
  }

  const handleFilter = () => {
    const params = new URLSearchParams()
    params.set('page', '1')
    if (method !== 'all') params.set('method', method)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    router.push(`/admin/payments/history?${params.toString()}`)
  }

  const qrisPct = stats.qrisCount + stats.cashCount > 0
    ? ((stats.qrisCount / (stats.qrisCount + stats.cashCount)) * 100).toFixed(1)
    : '0'

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
            <h1 className={adminTokens.pageTitle}>Riwayat Pembayaran</h1>
          </div>
          <p className={adminTokens.pageSubtitle}>
            Total {totalPayments} transaksi berhasil
          </p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Banknote size={20} className="text-brand-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Total Pendapatan</p>
                <p className="text-lg font-bold">{formatRupiah(stats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <QrCode size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">QRIS ({stats.qrisCount}x)</p>
                <p className="text-lg font-bold">{formatRupiah(stats.qrisRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Wallet size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Tunai ({stats.cashCount}x)</p>
                <p className="text-lg font-bold">{formatRupiah(stats.cashRevenue)}</p>
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
                <p className="text-xs text-muted-foreground font-semibold">Rasio QRIS</p>
                <p className="text-lg font-bold">{qrisPct}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-card text-sm font-medium"
        >
          <option value="all">Semua Metode</option>
          <option value="QRIS">QRIS</option>
          <option value="CASH">Tunai</option>
        </select>

        <input
          type="date"
          className="h-10 w-full rounded-lg border border-border px-3 text-sm bg-background appearance-none cursor-pointer"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="Dari tanggal"
        />

        <input
          type="date"
          className="h-10 w-full rounded-lg border border-border px-3 text-sm bg-background appearance-none cursor-pointer"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Sampai tanggal"
        />

        <Button
          onClick={handleFilter}
          className="h-10 bg-brand-primary text-white hover:bg-brand-primary/90 rounded-lg"
        >
          Terapkan Filter
        </Button>
      </div>

      {/* PAYMENTS TABLE */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">ID Transaksi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Metode</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Tipe</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {initialPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold">Tidak ada transaksi</div>
                      <p>Belum ada pembayaran yang berhasil</p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-semibold">{payment.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-muted-foreground">{payment.order_items?.length || 0} item</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatRupiah(payment.total_price)}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn(
                        'text-xs',
                        payment.payment_method === 'QRIS'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-orange-100 text-orange-700'
                      )}>
                        {payment.payment_method === 'QRIS' ? 'QRIS' : 'Tunai'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn(
                        'text-xs',
                        payment.order_type === 'dine-in'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-cyan-100 text-cyan-700'
                      )}>
                        {payment.order_type === 'dine-in' ? 'Dine-in' : 'Take-away'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDateTime(payment.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="text-sm text-muted-foreground">
            Menampilkan {(currentPage - 1) * 20 + 1}-{Math.min(currentPage * 20, totalPayments)} dari {totalPayments}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </Button>

            <div className="px-3 py-1.5 bg-muted rounded-lg text-sm font-semibold">
              {currentPage} / {totalPages}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
