'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Search, Eye, Printer, Download } from 'lucide-react'
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
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { adminTokens } from '@/components/admin/_tokens'
import { toast } from 'sonner'
import { reprintReceipt } from '@/actions/payment'
import { exportOrdersCSV } from '@/actions/admin/orders'

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
  recap?: { qrisTotal: number, cashTotal: number, resetAt: string | null }
}

import { resetRevenueRecap } from '@/actions/admin/orders'
export default function OrdersHistoryPage({
  initialOrders,
  currentPage,
  totalPages,
  totalOrders,
  searchQuery,
  statusFilter,
  dateFrom,
  dateTo,
  recap,
}: OrdersHistoryPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // State
  const [search, setSearch] = useState(searchQuery || '')
  const [status, setStatus] = useState(statusFilter || 'all')
  const [paymentFilter, setPaymentFilter] = useState(searchParams.get('payment') || 'all')
  const [from, setFrom] = useState(dateFrom || '')
  const [to, setTo] = useState(dateTo || '')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const handleResetRecap = async () => {
    if (confirm('Yakin ingin mereset angka rekap pendapatan? Angka akan dihitung ulang dari waktu sekarang (riwayat pesanan lama tidak akan dihapus).')) {
      setIsResetting(true)
      try {
        const res = await resetRevenueRecap()
        if (res.success) {
          toast.success('Rekap pendapatan berhasil direset')
          router.refresh()
        }
      } catch (err: any) {
        toast.error(err.message)
      } finally {
        setIsResetting(false)
      }
    }
  }

  // Sync state when props change
  useEffect(() => {
    setSearch(searchQuery || '')
    setStatus(statusFilter || 'all')
    setPaymentFilter(searchParams.get('payment') || 'all')
    setFrom(dateFrom || '')
    setTo(dateTo || '')
  }, [searchQuery, statusFilter, dateFrom, dateTo, searchParams])

  // Update URL params function
  const updateFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', '1') // Reset to page 1 on filter change
    
    if (search) params.set('search', search)
    else params.delete('search')
    
    if (status && status !== 'all') params.set('status', status)
    else params.delete('status')

    if (paymentFilter && paymentFilter !== 'all') params.set('payment', paymentFilter)
    else params.delete('payment')
    
    if (from) params.set('from', from)
    else params.delete('from')
    
    if (to) params.set('to', to)
    else params.delete('to')
    
    router.push(`${pathname}?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    const toastId = toast.loading('Mengekspor data ke CSV...')
    try {
      const csv = await exportOrdersCSV({
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
        payment: paymentFilter !== 'all' ? paymentFilter : undefined,
        dateFrom: from || undefined,
        dateTo: to || undefined
      })
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `Laporan_Pesanan_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Berhasil mengekspor data', { id: toastId })
    } catch (error) {
      toast.error('Gagal mengekspor data', { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  const handleReprintReceipt = async (orderId: string) => {
    setIsPrinting(true)
    const toastId = toast.loading('Mencetak struk...')
    try {
      const res = await reprintReceipt(orderId)
      if (res.success) {
        toast.success('Membuka aplikasi print...', { id: toastId })
        // Buka URL RawBT di background
        if (res.rawbtUrl) {
          const { sendToRawBT } = await import('@/lib/rawbt-client')
          sendToRawBT(res.rawbtUrl)
        }
      } else {
        toast.error(res.error || 'Gagal mencetak struk', { id: toastId })
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mencetak', { id: toastId })
    } finally {
      setIsPrinting(false)
    }
  }

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus !== 'paid') return { label: 'Belum Bayar', color: 'bg-amber-100 text-amber-700' }
    if (status === 'completed') return { label: 'Selesai', color: 'bg-emerald-100 text-emerald-700' }
    if (status === 'ready') return { label: 'Siap', color: 'bg-teal-100 text-teal-700' }
    if (status === 'cooking') return { label: 'Dimasak', color: 'bg-orange-100 text-orange-700' }
    return { label: 'Diproses', color: 'bg-blue-100 text-blue-700' }
  }

  const getPaymentBadge = (method: string) => {
    if (method === 'QRIS') return { label: 'QRIS', color: 'bg-indigo-100 text-indigo-700' }
    return { label: 'Tunai', color: 'bg-orange-100 text-orange-700' }
  }

  const getOrderTypeBadge = (type: string) => {
    if (type === 'dine-in') return { label: 'Makan di Tempat', color: 'bg-purple-100 text-purple-700' }
    return { label: 'Bawa Pulang', color: 'bg-cyan-100 text-cyan-700' }
  }

  // Fallback to local calculation if recap is not provided
  const qrisTotal = recap ? recap.qrisTotal : initialOrders.filter(o => o.payment_method === 'QRIS' && o.payment_status === 'paid').reduce((sum, order) => sum + (order.total_price || 0), 0)
  const cashTotal = recap ? recap.cashTotal : initialOrders.filter(o => o.payment_method === 'CASH' && o.payment_status === 'paid').reduce((sum, order) => sum + (order.total_price || 0), 0)

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/orders')} className="mr-2">
              <ChevronLeft size={18} />
            </Button>
            <h1 className={adminTokens.pageTitle}>Riwayat Pesanan</h1>
          </div>
          <p className={adminTokens.pageSubtitle}>
            Total {totalOrders} pesanan | Halaman {currentPage} dari {totalPages || 1}
          </p>
          <div className="flex gap-3 mt-3 items-center flex-wrap">
            <Badge variant="outline" className="text-indigo-700 bg-indigo-50/50 border-indigo-200 py-1 px-3 text-sm">
              Total QRIS: Rp {new Intl.NumberFormat('id-ID').format(qrisTotal)}
            </Badge>
            <Badge variant="outline" className="text-orange-700 bg-orange-50/50 border-orange-200 py-1 px-3 text-sm">
              Total CASH: Rp {new Intl.NumberFormat('id-ID').format(cashTotal)}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleResetRecap} disabled={isResetting} className="ml-2 h-7 text-xs border-dashed border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700">
              {isResetting ? 'Resetting...' : 'Reset Rekap'}
            </Button>
            {recap?.resetAt && (
              <span className="text-xs text-muted-foreground ml-1">
                (Sejak: {new Date(recap.resetAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
              </span>
            )}
          </div>
        </div>
        <Button onClick={handleExportCSV} disabled={isExporting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* FILTERS */}
      <div className="bg-card p-4 rounded-2xl border border-border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari ID/Menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 rounded-xl"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 h-11 border border-border rounded-xl bg-background text-sm font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Diproses</option>
            <option value="completed">Selesai</option>
            <option value="unpaid">Belum Bayar</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 h-11 border border-border rounded-xl bg-background text-sm font-medium"
          >
            <option value="all">Semua Pembayaran</option>
            <option value="QRIS">QRIS</option>
            <option value="CASH">Tunai</option>
          </select>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-11 rounded-xl text-sm"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-11 rounded-xl text-sm"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="rounded-xl h-10" onClick={() => {
            setSearch(''); setStatus('all'); setPaymentFilter('all'); setFrom(''); setTo('')
            router.push(pathname)
          }}>
            Reset
          </Button>
          <Button onClick={updateFilters} className="rounded-xl h-10 font-semibold">Terapkan Filter</Button>
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Order ID</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Item</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Total</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Tipe</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Pembayaran</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Status</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Waktu</th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {initialOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold text-foreground">Tidak ada pesanan ditemukan</div>
                      <p>Coba sesuaikan filter pencarian Anda.</p>
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
                      <td className="px-4 py-3 whitespace-nowrap"><span className="text-xs font-mono font-semibold">{order.id.slice(0, 8)}</span></td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap"><span className="text-muted-foreground">{itemCount} item</span></td>
                      <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">{formatRupiah(order.total_price)}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge className={cn('text-xs border-none', orderTypeBadge.color)}>{orderTypeBadge.label}</Badge></td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge className={cn('text-xs border-none', paymentBadge.color)}>{paymentBadge.label}</Badge></td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge className={cn('text-xs border-none', statusBadge.color)}>{statusBadge.label}</Badge></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(order.created_at)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)} className="rounded-lg h-8">
                          <Eye size={14} className="mr-1.5" /> Detail
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
        <div className="text-sm font-medium text-muted-foreground">
          Halaman {currentPage} dari {totalPages || 1}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1} className="h-9 w-9 p-0 rounded-lg">
            <ChevronLeft size={16} />
          </Button>
          <div className="px-4 py-2 bg-muted rounded-lg text-sm font-semibold">{currentPage} / {totalPages || 1}</div>
          <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="h-9 w-9 p-0 rounded-lg">
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* ORDER DETAIL DIALOG */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl overflow-hidden p-0 border-border" showCloseButton={false}>
          <DialogHeader className="p-6 border-b border-border bg-muted/20">
            <DialogTitle className="text-xl">Detail Pesanan <span className="font-mono text-brand-primary">#{selectedOrder?.id.slice(0, 8)}</span></DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Waktu:</span>
              <span className="font-semibold">{selectedOrder ? formatDateTime(selectedOrder.created_at) : ''}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-border pb-5">
              <span className="text-muted-foreground font-medium">Pembayaran:</span>
              <Badge className={cn('text-xs border-none', selectedOrder ? getPaymentBadge(selectedOrder.payment_method).color : '')}>
                {selectedOrder ? getPaymentBadge(selectedOrder.payment_method).label : ''}
              </Badge>
            </div>
            <div className="space-y-3 pt-1">
              <h4 className="text-sm font-bold text-foreground">Daftar Menu</h4>
              <div className="max-h-64 overflow-y-auto space-y-3 pr-2 touch-scroll">
                {selectedOrder?.order_items?.map((item, idx) => (
                  <div key={idx} className="text-sm space-y-1 bg-muted/30 p-3 rounded-xl border border-border">
                    <div className="flex justify-between">
                      <div className="flex gap-2 font-bold text-foreground">
                        <span className="text-brand-primary">{item.quantity}x</span>
                        <span>{item.menu_name}</span>
                      </div>
                      <span className="text-muted-foreground font-semibold shrink-0">{formatRupiah(item.menu_price * item.quantity)}</span>
                    </div>
                    {item.order_item_options && item.order_item_options.length > 0 && (() => {
                      const grouped = item.order_item_options.reduce((acc, curr) => {
                        if (!acc[curr.id]) acc[curr.id] = { ...curr, qty: 0 }
                        acc[curr.id].qty += 1
                        return acc
                      }, {} as Record<string, OrderItemOption & { qty: number }>)

                      return (
                        <div className="pl-6 space-y-1 mt-1.5">
                          {Object.values(grouped).map((opt) => (
                            <div key={opt.id} className="flex justify-between text-xs text-muted-foreground font-medium">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-brand-secondary"></span>
                                {opt.option_name}: {opt.qty > 1 ? `${opt.qty}x ` : ''}{opt.value_label}
                              </span>
                              {opt.extra_price > 0 && <span className="font-semibold text-foreground/80">+{formatRupiah(opt.extra_price * opt.qty)}</span>}
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center font-bold text-lg pt-5 border-t border-border">
              <span>Total Tagihan</span>
              <span className="text-brand-primary">{selectedOrder ? formatRupiah(selectedOrder.total_price) : ''}</span>
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/20 border-t border-border flex-col sm:flex-row gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="w-full sm:w-1/2 rounded-xl h-11 font-semibold">
              TUTUP
            </Button>
            <Button 
              onClick={() => selectedOrder && handleReprintReceipt(selectedOrder.id)} 
              disabled={isPrinting}
              className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-bold shadow-sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              CETAK STRUK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
