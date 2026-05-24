'use client'

import { useState, useMemo } from 'react'
import { HistoryFilters } from './HistoryFilters'
import { ArrowUpRight, ArrowDownLeft, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatDateTime } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { adminTokens } from '@/components/admin/_tokens'

interface HistoryItem {
  id: string
  menu_id: string
  quantity: number
  movement_type: 'in' | 'out'
  reason: string
  created_at: string
  menus?: Array<{
    name: string
  }>
}

interface MenuOption {
  id: string
  name: string
}

interface InventoryHistoryPageProps {
  initialHistory: HistoryItem[]
  menus: MenuOption[]
}

export function InventoryHistoryPage({ initialHistory, menus }: InventoryHistoryPageProps) {
  const router = useRouter()
  const [filters, setFilters] = useState({
    searchTerm: '',
    selectedMenu: null as string | null,
    movementType: 'all' as 'all' | 'in' | 'out',
    dateFrom: null as string | null,
    dateTo: null as string | null,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Filter logic
  const filteredHistory = useMemo(() => {
    return initialHistory.filter((item) => {
      // Search filter
      const searchLower = filters.searchTerm.toLowerCase()
      const matchesSearch =
        (item.menus?.[0]?.name || '').toLowerCase().includes(searchLower) ||
        item.reason.toLowerCase().includes(searchLower)

      // Menu filter
      const matchesMenu = !filters.selectedMenu || item.menu_id === filters.selectedMenu

      // Movement type filter
      const matchesType = filters.movementType === 'all' || item.movement_type === filters.movementType

      // Date filter
      let matchesDate = true
      if (filters.dateFrom || filters.dateTo) {
        const itemDate = new Date(item.created_at)
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom)
          matchesDate = matchesDate && itemDate >= fromDate
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo)
          toDate.setHours(23, 59, 59, 999) // End of day
          matchesDate = matchesDate && itemDate <= toDate
        }
      }

      return matchesSearch && matchesMenu && matchesType && matchesDate
    })
  }, [initialHistory, filters])

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const paginatedHistory = filteredHistory.slice(startIdx, startIdx + itemsPerPage)

  // Reset to page 1 when filters change
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg hover:bg-muted"
          onClick={() => router.back()}
        >
          <ChevronLeft size={20} />
        </Button>
        <div>
          <h1 className={adminTokens.pageTitle}>Riwayat Perubahan Stok</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Total: {filteredHistory.length} perubahan {filters.searchTerm || filters.selectedMenu || filters.movementType !== 'all' || filters.dateFrom || filters.dateTo ? '(terfilter)' : ''}
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <HistoryFilters menus={menus} onFilterChange={handleFilterChange} />

      {/* HISTORY LIST */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        {paginatedHistory.length > 0 ? (
          <div className="divide-y divide-border">
            {paginatedHistory.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                {/* Icon */}
                <div
                  className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center shrink-0 font-medium',
                    item.movement_type === 'in'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-600'
                  )}
                >
                  {item.movement_type === 'in' ? (
                    <ArrowUpRight size={16} aria-hidden="true" />
                  ) : (
                    <ArrowDownLeft size={16} aria-hidden="true" />
                  )}
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="font-bold text-sm text-foreground">{item.menus?.[0]?.name}</p>
                    <span
                      className={cn(
                        'text-sm font-bold tabular-nums',
                        item.movement_type === 'in' ? 'text-emerald-600' : 'text-red-600'
                      )}
                    >
                      {item.movement_type === 'in' ? '+' : '-'}{item.quantity} porsi
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.reason}</p>
                </div>

                {/* Time */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-muted-foreground tabular-nums">
                    {formatDateTime(item.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-12">
            Tidak ada riwayat perubahan yang sesuai dengan filter.
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-9 px-3 rounded-lg border border-border"
          >
            Sebelumnya
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'h-9 w-9 p-0 rounded-lg text-xs font-medium',
                  currentPage === page
                    ? 'bg-brand-primary text-white'
                    : 'border border-border hover:bg-muted'
                )}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-9 px-3 rounded-lg border border-border"
          >
            Berikutnya
          </Button>
        </div>
      )}

      {/* STATISTICS */}
      {filteredHistory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total In */}
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
              Total Masuk
            </p>
            <p className="text-2xl font-bold text-emerald-700 tabular-nums">
              +{filteredHistory.reduce((sum, i) => (i.movement_type === 'in' ? sum + i.quantity : sum), 0)}
            </p>
          </div>

          {/* Total Out */}
          <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">
              Total Keluar
            </p>
            <p className="text-2xl font-bold text-red-700 tabular-nums">
              -{filteredHistory.reduce((sum, i) => (i.movement_type === 'out' ? sum + i.quantity : sum), 0)}
            </p>
          </div>

          {/* Net Change */}
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Perubahan Bersih
            </p>
            <p className="text-2xl font-bold text-blue-700 tabular-nums">
              {filteredHistory.reduce(
                (sum, i) => sum + (i.movement_type === 'in' ? i.quantity : -i.quantity),
                0
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
