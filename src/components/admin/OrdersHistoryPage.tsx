'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Search, Filter, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn, formatRupiah, formatDateTime } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { adminTokens } from '@/components/admin/_tokens'

interface OrderItem {
  menu_name: string
  quantity: number
  menu_price: number
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
  searchQuery = '',
  statusFilter = 'all',
  dateFrom = '',
  dateTo = '',
}: OrdersHistoryPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchQuery)
  const [status, setStatus] = useState(statusFilter)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const handleSearch = (value: string) => {
    setSearch(value)
    // Trigger search after user stops typing
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    params.set('page', newPage.toString())
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    router.push(`/admin/orders/history?${params.toString()}`)
  }

  const getStatusBadge = (status: string, paymentStatus: string) => {
    const paid = paymentStatus === 'paid'
    if (status === 'completed' && paid) {
      return { label: 'Selesai', color: 'bg-emerald-100 text-emerald-700' }
    }
    if (status === 'pending' && paid) {
      return { label: 'Diproses', color: 'bg-blue-100 text-blue-700' }
    }
    if (!paid) {
      return { label: 'Belum Bayar', color: 'bg-amber-100 text-amber-700' }
    }
    return { label: status, color: 'bg-gray-100 text-gray-700' }
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
            <h1 className={adminTokens.pageTitle}>Riwayat Pesanan</h1>
          </div>
          <p className={adminTokens.pageSubtitle}>
            Total {totalOrders} pesanan | Halaman {currentPage} dari {totalPages}
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari Order ID..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-card text-sm font-medium"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Diproses</option>
          <option value="completed">Selesai</option>
          <option value="unpaid">Belum Bayar</option>
        </select>

        <select
          defaultValue="all"
          className="px-3 py-2 border border-border rounded-lg bg-card text-sm font-medium"
        >
          <option value="all">Semua Pembayaran</option>
          <option value="QRIS">QRIS</option>
          <option value="CASH">Tunai</option>
        </select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full"
        >
          <Filter size={16} className="mr-2" />
          Filter Lanjut
        </Button>
      </div>

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
              {initialOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold">Tidak ada pesanan</div>
                      <p>Coba ubah filter pencarian Anda</p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialOrders.map((order) => {
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
                          <Eye size={14} className="mr-2" />
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
          Menampilkan {(currentPage - 1) * 20 + 1}-{Math.min(currentPage * 20, totalOrders)} dari {totalOrders} pesanan
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

      {/* ORDER DETAIL DIALOG */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Detail Pesanan {selectedOrder?.id.slice(0, 8)}</DialogTitle>
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

            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-semibold">Daftar Menu</h4>
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                {selectedOrder?.order_items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div className="flex gap-2">
                      <span className="font-medium">{item.quantity}x</span>
                      <span>{item.menu_name}</span>
                    </div>
                    <span className="text-muted-foreground">{formatRupiah(item.menu_price * item.quantity)}</span>
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
            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="w-full sm:w-auto">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
