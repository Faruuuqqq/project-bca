'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  PlusCircle, 
  LayoutGrid, 
  UtensilsCrossed,
  Settings2,
  Image as ImageIcon,
  X
} from 'lucide-react'
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
import { 
  addMenu, 
  updateMenu, 
  deleteMenu, 
  addCategory, 
  updateCategory, 
  deleteCategory 
} from '@/actions/menu'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export function MenuManager({ initialMenus, initialCategories }: { initialMenus: any[], initialCategories: any[] }) {
  const [menus] = useState(initialMenus)
  const [categories] = useState(initialCategories)
  
  const [menuDialogOpen, setMenuDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  const [menuForm, setMenuForm] = useState({
    name: '',
    price: '',
    description: '',
    category_id: '',
    image_url: '',
    current_stock: '0'
  })
  
  const [categoryName, setCategoryName] = useState('')

  const handleOpenMenuDialog = (item: any = null) => {
    if (item) {
      setEditingItem(item)
      setMenuForm({
        name: item.name,
        price: item.price.toString(),
        description: item.description || '',
        category_id: item.category_id || '',
        image_url: item.image_url || '',
        current_stock: (item.current_stock || 0).toString()
      })
    } else {
      setEditingItem(null)
      setMenuForm({
        name: '',
        price: '',
        description: '',
        category_id: '', // Empty for new menu
        image_url: '',
        current_stock: '0'
      })
    }
    setMenuDialogOpen(true)
  }

  const handleSaveMenu = async () => {
    try {
      if (!menuForm.category_id) {
        toast.error('Pilih kategori terlebih dahulu')
        return
      }

      const data = {
        ...menuForm,
        price: parseFloat(menuForm.price),
        current_stock: parseInt(menuForm.current_stock)
      }

      if (editingItem) {
        await updateMenu(editingItem.id, data)
        toast.success('Menu diperbarui')
      } else {
        await addMenu(data)
        toast.success('Menu baru ditambahkan')
      }
      window.location.reload()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleSaveCategory = async () => {
    try {
      if (editingItem) {
        await updateCategory(editingItem.id, categoryName)
        toast.success('Kategori diperbarui')
      } else {
        await addCategory(categoryName)
        toast.success('Kategori baru ditambahkan')
      }
      window.location.reload()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-8 bg-zinc-50/50 p-8 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-[#3d2b1f] tracking-tight">Manajemen Menu</h2>
          <p className="text-zinc-500 font-medium">Atur katalog produk dan kustomisasi menu Anda.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              setEditingItem(null)
              setCategoryName('')
              setCategoryDialogOpen(true)
            }}
            className="rounded-xl border-2 font-bold bg-white"
          >
            <LayoutGrid size={18} className="mr-2 text-brand-primary" /> Kategori Baru
          </Button>
          <Button 
            onClick={() => handleOpenMenuDialog()} 
            className="bg-brand-primary hover:bg-blue-900 rounded-xl font-bold shadow-lg shadow-blue-100 px-6"
          >
            <PlusCircle size={18} className="mr-2" /> Tambah Menu
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[400px] font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400 py-6 pl-8">Informasi Menu</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400">Kategori</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400 text-center">Harga</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400 text-center">Stok</TableHead>
              <TableHead className="text-right font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400 pr-8">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menus.map((menu) => (
              <TableRow key={menu.id} className="group hover:bg-zinc-50/50 border-zinc-50 transition-colors">
                <TableCell className="py-4 pl-8">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-zinc-100 overflow-hidden border shadow-sm group-hover:scale-105 transition-transform text-zinc-300 flex items-center justify-center font-black text-[8px] uppercase text-center p-1">
                      {menu.image_url ? (
                        <img src={menu.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span>Ayam Kalintang</span>
                      )}
                    </div>
                    <div>
                      <p className="font-black text-[#3d2b1f] text-lg leading-tight uppercase tracking-tight">{menu.name}</p>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-1 max-w-[250px] italic">{menu.description || 'Tidak ada deskripsi'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-zinc-100 text-zinc-600 border-none font-bold px-3 py-1 rounded-lg uppercase text-[10px]">
                    {menu.categories?.name}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-black text-brand-primary text-lg">
                    Rp {new Intl.NumberFormat('id-ID').format(menu.price)}
                  </span>
                </TableCell>
                <TableCell className="text-center font-bold text-zinc-500">
                  {menu.current_stock}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleOpenMenuDialog(menu)}
                      className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-md transition-all text-zinc-400 hover:text-brand-primary"
                    >
                      <Settings2 size={18} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={async () => {
                        if (confirm('Hapus menu ini?')) {
                          await deleteMenu(menu.id)
                          window.location.reload()
                        }
                      }}
                      className="h-10 w-10 rounded-xl hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Menu Dialog */}
      <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[650px] rounded-[2.5rem] bg-white border-none shadow-2xl p-0 overflow-hidden outline-none">
          <DialogHeader className="p-8 pb-4 bg-zinc-50/50 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-2xl font-black text-[#3d2b1f] uppercase tracking-tight">
              {editingItem ? 'Edit Produk' : 'Tambah Menu Baru'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nama Makanan/Minuman</Label>
                <Input value={menuForm.name} onChange={e => setMenuForm({...menuForm, name: e.target.value})} className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 focus:bg-white focus:border-brand-primary transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Kategori</Label>
                <Select value={menuForm.category_id} onValueChange={(v: string | null) => setMenuForm({...menuForm, category_id: v || ""})}>
                  <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-bold">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Harga Jual (Rp)</Label>
                <Input type="number" value={menuForm.price} onChange={e => setMenuForm({...menuForm, price: e.target.value})} className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Stok Inventaris</Label>
                <Input type="number" value={menuForm.current_stock} onChange={e => setMenuForm({...menuForm, current_stock: e.target.value})} className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-bold" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Deskripsi Menu</Label>
              <Input value={menuForm.description} onChange={e => setMenuForm({...menuForm, description: e.target.value})} placeholder="Contoh: Ayam goreng dengan bumbu rahasia..." className="h-14 rounded-2xl bg-zinc-50 border-zinc-100" />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">URL Gambar Produk</Label>
              <Input value={menuForm.image_url} onChange={e => setMenuForm({...menuForm, image_url: e.target.value})} placeholder="https://..." className="h-14 rounded-2xl bg-zinc-50 border-zinc-100" />
            </div>
            
            {editingItem && (
              <div className="p-5 bg-blue-50 rounded-2xl border-2 border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-brand-primary">
                  <Settings2 size={20} />
                  <p className="text-xs font-black uppercase tracking-tight">Pengaturan Kustomisasi Lanjut</p>
                </div>
                <Button variant="link" className="text-brand-primary font-black text-xs uppercase" onClick={() => toast.info('Fitur kustomisasi segera hadir!')}>Kelola →</Button>
              </div>
            )}
          </div>

          <DialogFooter className="p-8 bg-zinc-50/50 border-t flex flex-row gap-4 sm:justify-between">
            <Button variant="ghost" onClick={() => setMenuDialogOpen(false)} className="rounded-2xl font-bold text-zinc-400 h-14 px-8">Batalkan</Button>
            <Button onClick={handleSaveMenu} className="h-14 bg-brand-primary hover:bg-blue-900 rounded-2xl px-12 font-black text-lg text-white shadow-xl shadow-blue-100 active:scale-[0.98] transition-all">SIMPAN PERUBAHAN</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md rounded-[2.5rem] bg-white border-none shadow-2xl p-0 overflow-hidden outline-none">
          <DialogHeader className="p-8 pb-4 bg-zinc-50/50 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-black text-[#3d2b1f] uppercase tracking-tight">Kelola Kategori</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nama Kategori</Label>
              <Input value={categoryName} onChange={e => setCategoryName(e.target.value)} className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 font-bold text-lg" placeholder="Contoh: Snack, Dessert" />
            </div>
            <Button onClick={handleSaveCategory} className="w-full h-16 bg-brand-primary hover:bg-blue-900 rounded-2xl font-black text-lg text-white shadow-xl shadow-blue-100">SIMPAN KATEGORI</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
