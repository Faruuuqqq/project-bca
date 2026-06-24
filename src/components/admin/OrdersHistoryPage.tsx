'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Search, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn, formatRupiah, formatDateTime } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { adminTokens } from '@/components/admin/_tokens'

interface OrderItemOption {
  id: string
  option_name: string
  value_label: string
  extra_price: number
}

interface OrderItem {
  menu_name: string
  quantity: number
  menu_price: number
  order_item_options?: OrderItemOption[]
}

interface Order {
  id: string
  total_price: number
  order_type: 'dine-in' | 'take-away'
  payment_method: 'QRIS' | 'CASH'
  payment_status: 'paid' | 'unpaid'
  order_status: string
  created_at: string
  order_items?: OrderItem[]
}

interface OrdersHistoryPageProps {
  initialOrders: Order[]
  currentPage: number
  totalPages: number
  totalOrders: number
  searchQuery?: string
  statusFilter?: string
  dateFrom?: string
  dateTo?: string
}

export default function OrdersHistoryPage({
  initialOrders,
  currentPage,
  totalPages,
  totalOrders,
}: OrdersHistoryPageProps) {
  const router = useRouter()

  // Client-side filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Client-side filtering — applied on top of the server-fetched page
  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      const matchesSearch =
        !search ||
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        order.order_items?.some((item) =>
          item.menu_name.toLowerCase().includes(search.toLowerCase())
        )

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'unpaid' && order.payment_status === 'unpaid') ||
        (statusFilter === 'completed' && order.order_status === 'completed' && order.payment_status === 'paid') ||
        (statusFilter === 'pending' &&
          order.payment_status === 'paid' &&
          !['completed', 'void'].includes(order.order_status))

      const matchesPayment =
        paymentFilter === 'all' || order.payment_method === paymentFilter

      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [initialOrders, search, statusFilter, paymentFilter])

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    params.set('page', newPage.toString())
    router.push(`/admin/orders/history?${params.toString()}`)
  }

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus !== 'paid') {
      return { label: 'Belum Bayar', color: 'bg-amber-100 text-amber-700' }
    }
    if (status === 'completed') {
      return { label: 'Selesai', color: 'bg-emerald-100 text-emerald-700' }
    }
    if (status === 'ready') {
      return { label: 'Siap', color: 'bg-teal-100 text-teal-700' }
    }
    if (status === 'cooking') {
      return { label: 'Dimasak', color: 'bg-orange-100 text-orange-700' }
    }
    return { label: 'Diproses', color: 'bg-blue-100 text-blue-700' }
  }

  const getPaymentBadge = (method: string) => {
    if (method === 'QRIS') {
      return { label: 'QRIS', color: 'bg-indigo-100 text-indigo-700' }
    }
    return { label: 'Tunai', color: 'bg-orange-100 text-orange-700' }
  }

  const getOrderTypeBadge = (type: string) => {
    if (type === 'dine-in') {
      return { label: 'Makan di Tempat', color: 'bg-purple-100 text-purple-700' }
    }
    return { label: 'Bawa Pulang', color: 'bg-cyan-100 text-cyan-700' }
  }

  const qrisOrders = filteredOrders.filter(o => o.payment_method === 'QRIS' && o.payment_status === 'paid')
  const cashOrders = filteredOrders.filter(o => o.payment_method === 'CASH' && o.payment_status === 'paid')
  
  const qrisTotal = qrisOrders.reduce((sum, order) => sum + (order.total_price || 0), 0)
  const cashTotal = cashOrders.reduce((sum, order) => sum + (order.total_price || 0), 0)

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
              aria-label="Kembali ke antrean"
              className="mr-2"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </Button>
            <h1 className={adminTokens.pageTitle}>Riwayat Pesanan</h1>
          </div>
          <p className={adminTokens.pageSubtitle}>
            Total {totalOrders} pesanan | Halaman {currentPage} dari {totalPages}
          </p>
          
          {/* Cash/QRIS Summary for Current Filter */}
          <div className="flex gap-3 mt-3">
            <Badge variant="outline" className="text-indigo-700 bg-indigo-50/50 border-indigo-200 py-1 px-3">
              QRIS: {qrisOrders.length}x (Rp {new Intl.NumberFormat('id-ID').format(qrisTotal)})
            </Badge>
            <Badge variant="outline" className="text-orange-700 bg-orange-50/50 border-orange-200 py-1 px-3">
              CASH: {cashOrders.length}x (Rp {new Intl.NumberFormat('id-ID').format(cashTotal)})
            </Badge>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="text"
            placeholder="Cari Order ID atau nama menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Cari pesanan"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-card text-sm font-medium"
          aria-label="Filter status pesanan"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Diproses</option>
          <option value="completed">Selesai</option>
          <option value="unpaid">Belum Bayar</option>
        </select>

        {/* Payment Method Filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-card text-sm font-medium"
          aria-label="Filter metode pembayaran"
        >
          <option value="all">Semua Pembayaran</option>
          <option value="QRIS">QRIS</option>
          <option value="CASH">Tunai</option>
        </select>
      </div>

      {/* Active filter result count */}
      {(search || statusFilter !== 'all' || paymentFilter !== 'all') && (
        <p className="text-sm text-muted-foreground">
          Menampilkan <span className="font-bold text-foreground">{filteredOrders.length}</span> hasil dari {initialOrders.length} pesanan di halaman ini
        </p>
      )}

      {/* ORDERS TABLE */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Tipe</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Pembayaran</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Waktu</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold">Tidak ada pesanan ditemukan</div>
                      <p>Coba ubah filter pencarian Anda</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusBadge = getStatusBadge(order.order_status, order.payment_status)
                  const paymentBadge = getPaymentBadge(order.payment_method)
                  const orderTypeBadge = getOrderTypeBadge(order.order_type)
                  const itemCount = order.order_items?.length || 0

                  return (
                    <tr key={order.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-semibold">{order.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-muted-foreground">{itemCount} item</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">{formatRupiah(order.total_price)}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn('text-xs', orderTypeBadge.color)}>
                          {orderTypeBadge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('text-xs', paymentBadge.color)}>
                          {paymentBadge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('text-xs', statusBadge.color)}>
                          {statusBadge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                          <Eye size={14} className="mr-2" aria-hidden="true" />
                          Detail
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-muted-foreground">
          Halaman {currentPage} dari {totalPages} ({totalOrders} total pesanan)
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </Button>

          <div className="px-3 py-1.5 bg-muted rounded-lg text-sm font-semibold">
            {currentPage} / {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* ORDER DETAIL DIALOG */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md bg-white" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Detail Pesanan #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Waktu:</span>
              <span className="font-medium">{selectedOrder ? formatDateTime(selectedOrder.created_at) : ''}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Tipe:</span>
              <Badge className={cn('text-xs', selectedOrder ? getOrderTypeBadge(selectedOrder.order_type).color : '')}>
                {selectedOrder ? getOrderTypeBadge(selectedOrder.order_type).label : ''}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge className={cn('text-xs', selectedOrder ? getStatusBadge(selectedOrder.order_status, selectedOrder.payment_status).color : '')}>
                {selectedOrder ? getStatusBadge(selectedOrder.order_status, selectedOrder.payment_status).label : ''}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-4">
              <span className="text-muted-foreground">Pembayaran:</span>
              <Badge className={cn('text-xs', selectedOrder ? getPaymentBadge(selectedOrder.payment_method).color : '')}>
                {selectedOrder ? getPaymentBadge(selectedOrder.payment_method).label : ''}
              </Badge>
            </div>

            {/* Items with Customizations */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-semibold">Daftar Menu</h4>
              <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                {selectedOrder?.order_items?.map((item, idx) => (
                  <div key={idx} className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <div className="flex gap-2 font-medium">
                        <span>{item.quantity}x</span>
                        <span>{item.menu_name}</span>
                      </div>
                      <span className="text-muted-foreground shrink-0">
                        {formatRupiah(item.menu_price * item.quantity)}
                      </span>
                    </div>
                    {/* Customizations */}
                    {item.order_item_options && item.order_item_options.length > 0 && (
                      <div className="pl-5 space-y-0.5">
                        {item.order_item_options.map((opt) => (
                          <div key={opt.id} className="flex justify-between text-xs text-muted-foreground">
                            <span>↳ {opt.option_name}: {opt.value_label}</span>
                            {opt.extra_price > 0 && (
                              <span>+{formatRupiah(opt.extra_price)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!selectedOrder?.order_items?.length && (
                  <div className="text-sm text-muted-foreground italic">Tidak ada detail item.</div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center font-bold text-lg pt-4 border-t">
              <span>Total</span>
              <span>{selectedOrder ? formatRupiah(selectedOrder.total_price) : ''}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="w-full">
              TUTUP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
