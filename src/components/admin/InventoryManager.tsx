'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { History, ArrowUpRight, ArrowDownLeft, Search, Settings2, Plus, Minus, ChevronRight } from 'lucide-react'
import { adjustStock } from '@/actions/admin'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { cn, formatDateTime } from '@/lib/utils'
import { adminTokens } from '@/components/admin/_tokens'
import { invalidateInventoryCache } from '@/lib/cache'
import { CriticalStockIndicator, CriticalStockWarning } from '@/components/admin/CriticalStockIndicator'
import { useRealtimeInventory } from '@/hooks/use-realtime-inventory'

interface InventoryItem {
  id: string
  name: string
  current_stock: number
  critical_stock_threshold?: number
  category_id?: string
  categories?: Array<{ name: string }>
  price?: number
}

interface InventoryMovement {
  id: string
  menu_id: string
  movement_type: 'in' | 'out'
  amount: number
  reason: string
  created_at: string
  menus?: Array<{ name: string }>
}

interface InventoryManagerProps {
  initialMenus: InventoryItem[]
  initialHistory: InventoryMovement[]
}

export function InventoryManager({ initialMenus, initialHistory }: InventoryManagerProps) {
  const router = useRouter()
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<{ id: string; name: string; stock: number } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Real-time inventory sync — shows toasts when other admins change stock
  useRealtimeInventory({ showToasts: true, autoRefresh: true })

  // Quick +1 / -1 adjustment
  const handleQuickAdjust = async (menuId: string, menuName: string, amount: number) => {
    setLoadingId(menuId)
    const toastId = toast.loading(`Memperbarui stok ${menuName}...`)
    try {
      // adjustStock now handles stock alert checks internally
      await adjustStock(menuId, amount, amount > 0 ? 'Quick add' : 'Quick reduce')
      toast.success(`${menuName}: ${amount > 0 ? '+' : ''}${amount} porsi`, { id: toastId })
      invalidateInventoryCache()
      router.refresh()
    } catch (error: unknown) {
      toast.error((error as Error).message, { id: toastId })
    } finally {
      setLoadingId(null)
    }
  }

  // Custom amount adjustment via dialog
  const handleAdjustStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const menuId = adjustTarget?.id || (formData.get('menu_id') as string)
    const amount = parseInt(formData.get('amount') as string, 10)
    const reason = formData.get('reason') as string

    const toastId = toast.loading('Menyimpan perubahan stok...')
    try {
      // adjustStock now handles stock alert checks internally
      await adjustStock(menuId, amount, reason)
      toast.success('Stok berhasil diperbarui', { id: toastId })
      invalidateInventoryCache()
      setIsAdjustDialogOpen(false)
      setAdjustTarget(null)
      router.refresh()
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Gagal memperbarui stok', { id: toastId })
    }
  }

  const openEditDialog = (menu: InventoryItem) => {
    setAdjustTarget({ id: menu.id, name: menu.name, stock: menu.current_stock })
    setIsAdjustDialogOpen(true)
  }

  const filteredMenus = (initialMenus || []).filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={adminTokens.pageTitle}>Stok Barang</h1>
            <Badge className="bg-brand-primary text-white text-xs px-2 py-0.5 font-bold rounded-md">
              {initialMenus.length} ITEM
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-secondary" aria-hidden="true" />
            <p className={adminTokens.pageSubtitle}>Monitoring ketersediaan bahan baku</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative w-full sm:w-auto">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={14}
              aria-hidden="true"
            />
            <Input
              placeholder="Cari menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Cari menu"
              className="h-10 pl-9 rounded-xl border border-border bg-card w-full sm:w-56 text-sm"
            />
          </div>
          <Button
            onClick={() => {
              setAdjustTarget(null)
              setIsAdjustDialogOpen(true)
            }}
            className={cn(
              'bg-brand-primary hover:bg-brand-primary/90 active:bg-brand-primary/80 text-white rounded-xl h-11 min-h-[44px] px-5 font-semibold text-sm shadow-sm transition-colors',
              adminTokens.focus
            )}
          >
            Update Stok
          </Button>
        </div>
      </div>

      {/* STOCK TABLE */}
      <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
        <div className="overflow-x-auto touch-scroll">
          <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border">
              <TableHead className={cn(adminTokens.tableHeader, 'pl-6 py-4')}>
                Nama Menu
              </TableHead>
              <TableHead className={cn(adminTokens.tableHeader, 'py-4')}>Kategori</TableHead>
              <TableHead className={cn(adminTokens.tableHeader, 'py-4')}>Stok</TableHead>
              <TableHead className={cn(adminTokens.tableHeader, 'py-4')}>Status</TableHead>
              <TableHead className={cn(adminTokens.tableHeader, 'text-right pr-6 py-4')}>
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMenus.map((menu) => (
              <TableRow
                key={menu.id}
                className="hover:bg-muted/30 transition-colors border-border"
              >
                <TableCell className="pl-6 py-4">
                  <p className="font-bold text-sm text-foreground">{menu.name}</p>
                </TableCell>
                <TableCell className="py-4">
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground border-none font-semibold text-xs px-2 py-0.5"
                  >
                    {menu.categories?.[0]?.name}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn(
                      'text-lg font-bold tabular-nums',
                      menu.current_stock <= 10 ? 'text-red-600' : 'text-brand-primary'
                    )}>
                      {menu.current_stock}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">porsi</span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <CriticalStockIndicator
                    currentStock={menu.current_stock}
                    threshold={menu.critical_stock_threshold || 5}
                  />
                </TableCell>
                <TableCell className="text-right pr-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    {/* Quick -1 */}
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Kurangi 1 stok ${menu.name}`}
                      disabled={loadingId === menu.id || menu.current_stock <= 0}
                      className="h-9 w-9 min-h-[44px] min-w-[44px] rounded-lg border-red-200 text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                      onClick={() => handleQuickAdjust(menu.id, menu.name, -1)}
                    >
                      <Minus size={16} aria-hidden="true" />
                    </Button>
                    {/* Quick +1 */}
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Tambah 1 stok ${menu.name}`}
                      disabled={loadingId === menu.id}
                      className="h-9 w-9 min-h-[44px] min-w-[44px] rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 transition-colors"
                      onClick={() => handleQuickAdjust(menu.id, menu.name, 1)}
                    >
                      <Plus size={16} aria-hidden="true" />
                    </Button>
                    {/* Edit Stok (custom amount) */}
                    <Button
                      variant="ghost"
                      aria-label={`Edit stok ${menu.name}`}
                      className="h-9 min-h-[44px] px-3 rounded-lg text-xs font-semibold text-brand-primary hover:bg-blue-50 active:bg-blue-100 transition-colors"
                      onClick={() => openEditDialog(menu)}
                    >
                      <Settings2 size={14} className="mr-1" aria-hidden="true" />
                      Edit
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredMenus.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                  Tidak ada menu ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>
      </div>

      {/* MOVEMENT HISTORY - MINI */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <History className="text-brand-primary" size={20} aria-hidden="true" />
            <h2 className={adminTokens.sectionTitle}>Riwayat Terbaru</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/inventory/history')}
            className="text-xs font-semibold text-brand-primary hover:bg-blue-50 active:bg-blue-100 rounded-lg px-3 h-9 min-h-[44px]"
          >
            Lihat Semua
            <ChevronRight size={14} className="ml-1" aria-hidden="true" />
          </Button>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="divide-y divide-border max-h-[320px] overflow-y-auto touch-scroll">
            {(initialHistory || []).slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                {/* Icon */}
                <div className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                  m.movement_type === 'in'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600'
                )}>
                  {m.movement_type === 'in' ? (
                    <ArrowUpRight size={14} aria-hidden="true" />
                  ) : (
                    <ArrowDownLeft size={14} aria-hidden="true" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-foreground truncate">{m.menus?.[0]?.name}</p>
                    <span className={cn(
                      'text-xs font-bold tabular-nums shrink-0',
                      m.movement_type === 'in' ? 'text-emerald-600' : 'text-red-600'
                    )}>
                      {m.movement_type === 'in' ? '+' : '-'}{m.amount}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.reason}</p>
                </div>

                {/* Time */}
                <span className="text-[10px] text-muted-foreground font-medium tabular-nums shrink-0">
                  {formatDateTime(m.created_at)}
                </span>
              </div>
            ))}
            {(!initialHistory || initialHistory.length === 0) && (
              <div className="text-center text-sm text-muted-foreground py-10">
                Belum ada riwayat perubahan.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADJUST DIALOG */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={(open) => {
        setIsAdjustDialogOpen(open)
        if (!open) setAdjustTarget(null)
      }}>
        <DialogContent
          showCloseButton={false}
          className="max-w-md rounded-2xl bg-card border-border shadow-md p-0 overflow-hidden"
        >
          <form onSubmit={handleAdjustStock}>
            <DialogHeader className="p-6 border-b border-border">
              <DialogTitle className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                <Settings2 className="text-brand-primary" size={18} aria-hidden="true" />
                {adjustTarget ? `Edit Stok: ${adjustTarget.name}` : 'Penyesuaian Stok'}
              </DialogTitle>
              {adjustTarget && (
                <p className="text-sm text-muted-foreground mt-1">
                  Stok saat ini: <span className="font-bold text-foreground tabular-nums">{adjustTarget.stock} porsi</span>
                </p>
              )}
            </DialogHeader>
            <div className="p-6 space-y-4">
              {!adjustTarget && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pilih Menu
                  </Label>
                  <Select name="menu_id" required>
                    <SelectTrigger className="rounded-xl border border-border h-11 min-h-[44px]">
                      <SelectValue placeholder="Pilih menu yang akan diupdate" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border rounded-xl shadow-md">
                      {initialMenus?.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="min-h-[44px]">
                          {m.name} ({m.current_stock} porsi)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {adjustTarget && (
                <input type="hidden" name="menu_id" value={adjustTarget.id} />
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Jumlah Perubahan
                </Label>
                <div className="relative">
                  <Input
                    name="amount"
                    type="number"
                    step="1"
                    inputMode="numeric"
                    required
                    placeholder="Contoh: 10 atau -5"
                    className="rounded-xl border border-border h-11 min-h-[44px] pr-14 font-semibold text-base"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground uppercase">
                    porsi
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Gunakan angka positif untuk menambah, negatif untuk mengurangi (misal: -5).
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Alasan Perubahan
                </Label>
                <Input
                  name="reason"
                  required
                  placeholder="Contoh: Restock harian"
                  className="rounded-xl border border-border h-11 min-h-[44px] text-base"
                />
              </div>
            </div>
            <DialogFooter className="p-6 bg-muted/30 border-t border-border flex flex-row gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsAdjustDialogOpen(false)
                  setAdjustTarget(null)
                }}
                className="flex-1 rounded-xl font-semibold text-sm h-11 min-h-[44px]"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-brand-primary hover:bg-brand-primary/90 active:bg-brand-primary/80 text-white rounded-xl font-semibold text-sm h-11 min-h-[44px] shadow-sm transition-colors"
              >
                Update Stok
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
