'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { useState } from 'react'

interface HistoryFiltersProps {
  menus: Array<{ id: string; name: string }>
  onFilterChange: (filters: {
    searchTerm: string
    selectedMenu: string | null
    movementType: 'all' | 'in' | 'out'
    dateFrom: string | null
    dateTo: string | null
  }) => void
}

export function HistoryFilters({ menus, onFilterChange }: HistoryFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null)
  const [movementType, setMovementType] = useState<'all' | 'in' | 'out'>('all')
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)

  const handleFilterChange = () => {
    onFilterChange({
      searchTerm,
      selectedMenu,
      movementType,
      dateFrom,
      dateTo,
    })
  }

  const handleReset = () => {
    setSearchTerm('')
    setSelectedMenu(null)
    setMovementType('all')
    setDateFrom(null)
    setDateTo(null)
    onFilterChange({
      searchTerm: '',
      selectedMenu: null,
      movementType: 'all',
      dateFrom: null,
      dateTo: null,
    })
  }

  const hasActiveFilters = searchTerm || selectedMenu || movementType !== 'all' || dateFrom || dateTo

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-4 lg:p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3">
         {/* Search */}
         <div className="space-y-1.5">
           <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
             Cari
           </Label>
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
             <Input
               placeholder="Item atau alasan..."
               className="pl-9 h-10 rounded-lg border border-border text-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
         </div>

        {/* Menu Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </Label>
          <Select value={selectedMenu || ''} onValueChange={(v) => setSelectedMenu(v || null)}>
            <SelectTrigger className="h-10 rounded-lg border border-border">
              <SelectValue placeholder="Semua menu" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border rounded-lg">
              <SelectItem value="">Semua menu</SelectItem>
              {menus.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Movement Type */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tipe
          </Label>
          <Select value={movementType} onValueChange={(v) => setMovementType(v as 'all' | 'in' | 'out')}>
            <SelectTrigger className="h-10 rounded-lg border border-border">
              <SelectValue placeholder="Semua tipe" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border rounded-lg">
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="in">Masuk (+)</SelectItem>
              <SelectItem value="out">Keluar (-)</SelectItem>
            </SelectContent>
          </Select>
        </div>

         {/* Date From */}
         <div className="space-y-1.5">
           <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
             Dari
           </Label>
           <input
             type="date"
             className="h-10 w-full rounded-lg border border-border px-3 text-sm bg-background appearance-none cursor-pointer"
             value={dateFrom || ''}
             onChange={(e) => setDateFrom(e.target.value || null)}
           />
         </div>

         {/* Date To */}
         <div className="space-y-1.5">
           <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
             Sampai
           </Label>
           <input
             type="date"
             className="h-10 w-full rounded-lg border border-border px-3 text-sm bg-background appearance-none cursor-pointer"
             value={dateTo || ''}
             onChange={(e) => setDateTo(e.target.value || null)}
           />
         </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-10 px-4 rounded-lg border border-border"
          >
            <X size={14} className="mr-1.5" />
            Reset
          </Button>
        )}
        <Button
          onClick={handleFilterChange}
          className="h-10 px-4 rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          Terapkan Filter
        </Button>
      </div>
    </div>
  )
}
