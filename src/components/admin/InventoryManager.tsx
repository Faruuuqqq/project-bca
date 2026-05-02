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
import { Button } from '@/components/ui/button'
import { PlusCircle, History, Package, ArrowUpCircle, ArrowDownCircle, RefreshCw, X, Box } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adjustStock } from '@/actions/admin'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export function InventoryManager({ initialMenus, initialHistory }: { initialMenus: any[], initialHistory: any[] }) {
  const [menus] = useState(initialMenus)
  const [history] = useState(initialHistory)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  const [form, setForm] = useState({
    menuId: '',
    quantity: '',
    type: 'IN' as 'IN' | 'ADJUSTMENT',
    notes: ''
  })

  const handleSave = async () => {
    try {
      if (!form.menuId || !form.quantity) {
        toast.error('Lengkapi data stok')
        return
      }
      
      await adjustStock(
        form.menuId, 
        parseInt(form.quantity), 
        form.type, 
        form.notes || (form.type === 'IN' ? 'Restock Harian' : 'Penyesuaian Manual')
      )
      
      toast.success('Stok berhasil diperbarui')
      window.location.reload()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-8">
      {/* HEADER LOKAL */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-[#3d2b1f] tracking-tight">Inventaris Stok</h2>
          <p className="text-zinc-500 font-medium">Pantau ketersediaan produk Ayam Kalintang secara realtime.</p>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)} 
          className="bg-brand-primary hover:bg-blue-900 rounded-xl font-bold shadow-lg shadow-blue-100 px-6 h-12"
        >
          <PlusCircle size={18} className="mr-2" /> Update Stok
        </Button>
      </div>

      <Tabs defaultValue="stock" className="w-full flex flex-col items-start">
        {/* TAB LIST - Dipaksa ke kiri atas tabel */}
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border mb-6 h-auto w-fit">
          <TabsTrigger value="stock" className="rounded-xl font-bold px-8 py-3 data-[state=active]:bg-brand-primary data-[state=active]:text-white transition-all">
            <Package size={18} className="mr-2" /> Stok Saat Ini
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl font-bold px-8 py-3 data-[state=active]:bg-brand-primary data-[state=active]:text-white transition-all">
            <History size={18} className="mr-2" /> Riwayat Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="w-full outline-none">
          <div className="bg-white rounded-[2rem] shadow-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="w-[400px] font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400 py-6 pl-8">Informasi Menu</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400">Kategori</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400 text-center">Stok Tersisa</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400 pr-8">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menus.map((menu) => (
                  <TableRow key={menu.id} className="group hover:bg-zinc-50/50 border-zinc-50 transition-colors">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200">
                          <Box size={20} />
                        </div>
                        <p className="font-black text-[#3d2b1f] text-lg uppercase tracking-tight">{menu.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-zinc-100 text-zinc-500 border-none font-bold uppercase text-[10px] px-2 py-0.5">
                        {menu.categories?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-2xl font-black ${menu.current_stock <= 5 ? 'text-red-500 animate-pulse' : 'text-brand-primary'}`}>
                          {menu.current_stock}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Porsi</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      {menu.current_stock <= 0 ? (
                        <Badge variant="destructive" className="uppercase font-black text-[10px] tracking-widest px-3 py-1 rounded-lg shadow-lg shadow-red-100">Habis Total</Badge>
                      ) : menu.current_stock <= 5 ? (
                        <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50 uppercase font-black text-[10px] tracking-widest px-3 py-1 rounded-lg">Stok Kritis</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 uppercase font-black text-[10px] tracking-widest px-3 py-1 rounded-lg">Stok Aman</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="history" className="w-full outline-none">
          <div className="bg-white rounded-[2rem] shadow-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400 py-6 pl-8">Waktu & Tanggal</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400">Produk</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400 text-center">Tipe Pergerakan</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400 text-center">Jumlah</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400 pr-8">Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((log) => (
                  <TableRow key={log.id} className="group hover:bg-zinc-50/50 border-zinc-50 transition-colors">
                    <TableCell className="py-4 pl-8">
                      <div className="space-y-0.5">
                        <p className="font-bold text-[#3d2b1f] text-sm">
                          {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                          {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-[#3d2b1f] uppercase text-xs">{log.menus?.name}</TableCell>
                    <TableCell className="text-center">
                      {log.movement_type === 'IN' && (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-black text-[9px] uppercase tracking-widest">
                          <ArrowUpCircle size={12} className="mr-1" /> Masuk
                        </Badge>
                      )}
                      {log.movement_type === 'OUT' && (
                        <Badge className="bg-red-100 text-red-600 hover:bg-red-100 border-none font-black text-[9px] uppercase tracking-widest">
                          <ArrowDownCircle size={12} className="mr-1" /> Keluar
                        </Badge>
                      )}
                      {log.movement_type === 'ADJUSTMENT' && (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-black text-[9px] uppercase tracking-widest">
                          <RefreshCw size={12} className="mr-1" /> Koreksi
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-base font-black ${log.movement_type === 'OUT' ? 'text-red-500' : 'text-green-600'}`}>
                        {log.movement_type === 'OUT' ? `-${log.quantity}` : `+${log.quantity}`}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400 font-medium italic pr-8 line-clamp-1">{log.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Update Stock Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[500px] rounded-[2.5rem] bg-white border-none shadow-2xl p-0 overflow-hidden outline-none">
          <DialogHeader className="p-8 pb-4 bg-zinc-50/50 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-2xl font-black text-[#3d2b1f] uppercase tracking-tight">Update Stok Barang</DialogTitle>
          </DialogHeader>

          <div className="p-8 space-y-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Pilih Produk</Label>
              <Select onValueChange={(v: string | null) => setForm({...form, menuId: v || ""})}>
                <SelectTrigger className="h-16 rounded-2xl bg-zinc-50 border-zinc-100 font-bold text-lg">
                  <SelectValue placeholder="Pilih menu makanan/minuman" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {menus.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Tipe Update</Label>
                <Select defaultValue="IN" onValueChange={v => setForm({...form, type: v as any})}>
                  <SelectTrigger className="h-16 rounded-2xl bg-zinc-50 border-zinc-100 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="IN">Barang Masuk (+)</SelectItem>
                    <SelectItem value="ADJUSTMENT">Atur Total Stok (=)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Jumlah Porsi</Label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  className="h-16 rounded-2xl bg-zinc-50 border-zinc-100 font-black text-2xl text-brand-primary"
                  value={form.quantity}
                  onChange={e => setForm({...form, quantity: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Catatan</Label>
              <Input 
                placeholder="Contoh: Belanja pagi, Stok rusak, dll" 
                className="h-16 rounded-2xl bg-zinc-50 border-zinc-100"
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="p-8 bg-zinc-50/50 border-t flex flex-row gap-4 sm:justify-between">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-2xl font-bold text-zinc-400 h-14 px-8">BATALKAN</Button>
            <Button onClick={handleSave} className="h-14 bg-brand-primary hover:bg-blue-900 rounded-2xl px-12 font-black text-lg text-white shadow-xl shadow-blue-100 active:scale-[0.98] transition-all">SIMPAN STOK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
