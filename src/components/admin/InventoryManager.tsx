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
import { PlusCircle, History, Package, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react'
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
    <div className="space-y-6">
      <Tabs defaultValue="stock" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-zinc-100 p-1 rounded-xl">
            <TabsTrigger value="stock" className="rounded-lg font-bold px-6">
              <Package size={16} className="mr-2" /> Stok Saat Ini
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg font-bold px-6">
              <History size={16} className="mr-2" /> Riwayat Keluar-Masuk
            </TabsTrigger>
          </TabsList>

          <Button 
            onClick={() => setDialogOpen(true)} 
            className="bg-[#3d2b1f] hover:bg-black rounded-xl font-bold"
          >
            <PlusCircle size={18} className="mr-2" /> Update Stok
          </Button>
        </div>

        <TabsContent value="stock">
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead className="font-bold text-zinc-500">Menu</TableHead>
                  <TableHead className="font-bold text-zinc-500">Kategori</TableHead>
                  <TableHead className="font-bold text-zinc-500">Stok Tersisa</TableHead>
                  <TableHead className="font-bold text-zinc-500 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menus.map((menu) => (
                  <TableRow key={menu.id}>
                    <TableCell className="font-bold text-[#3d2b1f]">{menu.name}</TableCell>
                    <TableCell className="text-zinc-500">{menu.categories?.name}</TableCell>
                    <TableCell>
                      <span className={`text-xl font-black ${menu.current_stock <= 5 ? 'text-red-500' : 'text-[#3d2b1f]'}`}>
                        {menu.current_stock}
                      </span>
                      <span className="ml-1 text-xs text-zinc-400 font-bold">porsi</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {menu.current_stock <= 0 ? (
                        <Badge variant="destructive" className="uppercase text-[10px]">Habis Total</Badge>
                      ) : menu.current_stock <= 5 ? (
                        <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50 uppercase text-[10px]">Stok Menipis</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 uppercase text-[10px]">Aman</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead className="font-bold text-zinc-500">Waktu</TableHead>
                  <TableHead className="font-bold text-zinc-500">Menu</TableHead>
                  <TableHead className="font-bold text-zinc-500">Tipe</TableHead>
                  <TableHead className="font-bold text-zinc-500 text-center">Jumlah</TableHead>
                  <TableHead className="font-bold text-zinc-500">Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-zinc-400">
                      {new Date(log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="font-bold text-[#3d2b1f]">{log.menus?.name}</TableCell>
                    <TableCell>
                      {log.movement_type === 'IN' && (
                        <span className="flex items-center text-green-600 font-bold text-[10px] uppercase gap-1">
                          <ArrowUpCircle size={14} /> Masuk
                        </span>
                      )}
                      {log.movement_type === 'OUT' && (
                        <span className="flex items-center text-red-500 font-bold text-[10px] uppercase gap-1">
                          <ArrowDownCircle size={14} /> Keluar
                        </span>
                      )}
                      {log.movement_type === 'ADJUSTMENT' && (
                        <span className="flex items-center text-blue-500 font-bold text-[10px] uppercase gap-1">
                          <RefreshCw size={14} /> Koreksi
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-black">
                      {log.movement_type === 'OUT' ? `-${log.quantity}` : `+${log.quantity}`}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500 italic">{log.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#3d2b1f]">Update Stok Barang</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Pilih Menu</Label>
              <Select onValueChange={(v: string | null) => setForm({...form, menuId: v || ""})}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Pilih menu makanan/minuman" />
                </SelectTrigger>
                <SelectContent>
                  {menus.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipe Update</Label>
                <Select defaultValue="IN" onValueChange={v => setForm({...form, type: v as any})}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">Barang Masuk (+)</SelectItem>
                    <SelectItem value="ADJUSTMENT">Atur Total Stok (=)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jumlah</Label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  className="rounded-xl h-12"
                  value={form.quantity}
                  onChange={e => setForm({...form, quantity: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Input 
                placeholder="Contoh: Belanja pagi, Stok rusak, dll" 
                className="rounded-xl h-12"
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} className="bg-[#3d2b1f] hover:bg-black rounded-xl px-8 font-bold">Simpan Stok</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
