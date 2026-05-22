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
import { Package, History, ArrowUpRight, ArrowDownLeft, Search, Settings2 } from 'lucide-react'
import { adjustStock } from '@/actions/admin'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface InventoryManagerProps {
  initialMenus: any[]
  initialHistory: any[]
}

export function InventoryManager({ initialMenus, initialHistory }: InventoryManagerProps) {
  const router = useRouter()
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleAdjustStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const menuId = formData.get('menu_id') as string
    const amount = parseInt(formData.get('amount') as string)
    const reason = formData.get('reason') as string

    try {
      await adjustStock(menuId, amount, reason)
      toast.success('Stok berhasil diperbarui')
      setIsAdjustDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const filteredMenus = (initialMenus || []).filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-700 -mt-4 md:-mt-6">
      {/* SECTION: STOCK OVERVIEW - Minimal Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-[#3d2b1f] uppercase tracking-tighter">
                  Stok Barang
                </h3>
                <Badge className="bg-brand-primary text-white text-[10px] px-2 py-0 rounded-md font-black shadow-sm">
                  {initialMenus.length} ITEMS
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                 <div className="h-1.5 w-1.5 rounded-full bg-brand-secondary" />
                 <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Monitoring of raw material availability</p>
              </div>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="relative hidden lg:block">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
               <Input 
                 placeholder="Cari menu..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="h-10 pl-10 rounded-xl border-2 border-zinc-50 bg-white w-56 focus:bg-white transition-all text-xs"
               />
            </div>
            <Button 
              onClick={() => setIsAdjustDialogOpen(true)}
              className="bg-brand-primary hover:bg-blue-900 rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100"
            >
              Update Stok
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-zinc-100">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-none">
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400 pl-8 py-5">Nama Menu</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Kategori</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Stok Saat Ini</TableHead>
                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-zinc-400 pr-8">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMenus.map((menu) => (
                <TableRow key={menu.id} className="hover:bg-zinc-50/50 transition-colors border-zinc-50">
                  <TableCell className="pl-8 py-5">
                    <p className="font-black text-[#3d2b1f] uppercase text-sm tracking-tight">{menu.name}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 border-none font-bold text-[9px] uppercase px-2 py-0.5">
                      {menu.categories?.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                       <span className="text-xl font-black text-brand-primary tabular-nums">{menu.current_stock}</span>
                       <span className="text-[10px] font-bold text-zinc-300 uppercase">Porsi</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    {menu.current_stock <= 10 ? (
                      <Badge className="bg-red-500 animate-pulse uppercase text-[9px] font-black tracking-widest">
                        Critical Stock
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500 uppercase text-[9px] font-black tracking-widest">
                        Aman
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* SECTION: MOVEMENT HISTORY */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 px-2">
           <History className="text-brand-primary" size={24} />
           <h3 className="text-xl font-black text-[#3d2b1f] uppercase tracking-tight">Riwayat Perubahan</h3>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-zinc-100">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-none">
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400 pl-8 py-5">Waktu</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Item</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Tipe</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Jumlah</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Alasan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(initialHistory || []).map((m) => (
                <TableRow key={m.id} className="hover:bg-zinc-50/50 transition-colors border-zinc-50">
                  <TableCell className="pl-8 py-4 text-[11px] font-bold text-zinc-400">
                    {new Date(m.created_at).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell>
                    <p className="font-black text-[#3d2b1f] uppercase text-xs">{m.menus?.name}</p>
                  </TableCell>
                  <TableCell>
                    {m.movement_type === 'in' ? (
                      <div className="flex items-center gap-1.5 text-green-600 font-black text-[10px] uppercase bg-green-50 px-2 py-1 rounded-lg border border-green-100 w-fit">
                        <ArrowUpRight size={12} /> Masuk
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-red-600 font-black text-[10px] uppercase bg-red-50 px-2 py-1 rounded-lg border border-red-100 w-fit">
                        <ArrowDownLeft size={12} /> Keluar
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-black text-sm tabular-nums">
                    {m.amount > 0 ? `+${m.amount}` : m.amount}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 font-medium italic">
                    {m.reason}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* STOCK ADJUST DIALOG - Premium Solid */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-md rounded-[2.5rem] bg-white border-none shadow-2xl p-0 overflow-hidden outline-none">
          <form onSubmit={handleAdjustStock}>
            <DialogHeader className="p-8 border-b bg-zinc-50/30">
              <DialogTitle className="text-2xl font-black text-[#3d2b1f] uppercase tracking-tight flex items-center gap-3">
                <Settings2 className="text-brand-primary" /> Penyesuaian Stok
              </DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Pilih Menu</Label>
                <Select name="menu_id" required>
                  <SelectTrigger className="rounded-xl border-2 h-12">
                    <SelectValue placeholder="Pilih menu yang akan diupdate" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 rounded-xl shadow-2xl">
                    {initialMenus?.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Jumlah Perubahan</Label>
                <div className="relative">
                   <Input 
                     name="amount" 
                     type="number" 
                     required 
                     placeholder="Contoh: 10 atau -5"
                     className="rounded-xl border-2 h-12 focus:border-brand-primary pr-12 font-black" 
                   />
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-300 uppercase">Porsi</div>
                </div>
                <p className="text-[9px] text-zinc-400 mt-1 font-medium">Gunakan angka negatif untuk mengurangi stok.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Alasan Perubahan</Label>
                <Input name="reason" required placeholder="Contoh: Restock harian atau Barang rusak" className="rounded-xl border-2 h-12 focus:border-brand-primary" />
              </div>
            </div>
            <DialogFooter className="p-8 bg-zinc-50 border-t flex flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsAdjustDialogOpen(false)} className="flex-1 rounded-xl font-black text-xs uppercase text-zinc-400">Batalkan</Button>
              <Button type="submit" className="flex-1 bg-brand-primary hover:bg-blue-900 rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-100 h-12">Update Stok</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
