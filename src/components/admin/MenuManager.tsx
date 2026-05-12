'use client'

import { useState } from 'react'
import { Category, Menu } from '@/types/database'
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
import { Switch } from '@/components/ui/switch'
import { Plus, Pencil, Trash2, UtensilsCrossed, Settings2, Image as ImageIcon } from 'lucide-react'
import { 
  createMenu, 
  updateMenu, 
  deleteMenu, 
  createCategory,
  updateCategory,
  deleteCategory
} from '@/actions/menu'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface MenuManagerProps {
  initialCategories: Category[]
  initialMenus: any[]
}

export function MenuManager({ initialCategories, initialMenus }: MenuManagerProps) {
  const router = useRouter()
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false)
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<any | null>(null)
  const [editingCat, setEditingCat] = useState<Category | null>(null)

  const handleSaveMenu = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      if (editingMenu) {
        await updateMenu(editingMenu.id, formData)
        toast.success('Menu berhasil diperbarui')
      } else {
        await createMenu(formData)
        toast.success('Menu baru berhasil ditambahkan')
      }
      setIsMenuDialogOpen(false)
      setEditingMenu(null)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteMenu = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus menu ini?')) {
      try {
        await deleteMenu(id)
        toast.success('Menu berhasil dihapus')
        router.refresh()
      } catch (error: any) {
        toast.error(error.message)
      }
    }
  }

  const handleSaveCat = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, formData)
        toast.success('Kategori berhasil diperbarui')
      } else {
        await createCategory(formData)
        toast.success('Kategori baru berhasil ditambahkan')
      }
      setIsCatDialogOpen(false)
      setEditingCat(null)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteCat = async (cat: Category) => {
    // Check if category has menus
    const hasMenus = initialMenus.some(m => m.category_id === cat.id)
    if (hasMenus) {
      toast.error(`Gagal: Kategori "${cat.name}" masih memiliki menu. Hapus atau pindahkan menu terlebih dahulu.`)
      return
    }

    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${cat.name}"?`)) {
      try {
        await deleteCategory(cat.id)
        toast.success('Kategori berhasil dihapus')
        router.refresh()
      } catch (error: any) {
        toast.error(error.message)
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 -mt-4 md:-mt-6">
      {/* SECTION: MENU CATALOG - Minimal Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-[#3d2b1f] uppercase tracking-tighter">
                  Katalog Produk
                </h3>
                <Badge className="bg-brand-primary text-white text-[10px] px-2 py-0 rounded-md font-black shadow-sm">
                  {initialMenus.length} ITEMS
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                 <div className="h-1.5 w-1.5 rounded-full bg-brand-secondary" />
                 <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Management of kiosk menu availability</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => { setEditingCat(null); setIsCatDialogOpen(true); }}
              className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 border-zinc-100 hover:bg-white"
            >
              + Kategori
            </Button>
            <Button 
              onClick={() => { setEditingMenu(null); setIsMenuDialogOpen(true); }}
              className="bg-brand-primary hover:bg-blue-900 h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100"
            >
              + Menu Baru
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-zinc-100">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-none">
                <TableHead className="w-[100px] font-black uppercase text-[10px] tracking-widest text-zinc-400 pl-8">Foto</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Nama Menu</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Kategori</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Harga</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Status</TableHead>
                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-zinc-400 pr-8">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialMenus.map((menu) => (
                <TableRow key={menu.id} className="hover:bg-zinc-50/50 transition-colors border-zinc-50">
                  <TableCell className="pl-8 py-4">
                    <div className="h-12 w-12 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-200">
                      {menu.image_url ? (
                        <img src={menu.image_url} alt={menu.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-300">
                          <ImageIcon size={16} />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-black text-[#3d2b1f] uppercase text-sm tracking-tight">{menu.name}</p>
                      <p className="text-[10px] text-zinc-400 font-medium line-clamp-1 max-w-[200px] italic">{menu.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-blue-50 text-brand-primary border-none font-black text-[9px] uppercase px-2 py-0.5">
                      {menu.categories?.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-black text-brand-primary text-sm">
                    Rp {new Intl.NumberFormat('id-ID').format(menu.price)}
                  </TableCell>
                  <TableCell>
                    <Badge className={menu.is_sold_out ? "bg-red-500" : "bg-green-500"}>
                      {menu.is_sold_out ? 'Habis' : 'Tersedia'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg hover:bg-blue-50 hover:text-brand-primary"
                        onClick={() => { setEditingMenu(menu); setIsMenuDialogOpen(true); }}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg hover:bg-red-50 hover:text-red-500"
                        onClick={() => handleDeleteMenu(menu.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* SECTION: CATEGORY LIST */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-zinc-100">
           <div className="h-12 w-12 bg-brand-secondary/10 rounded-2xl flex items-center justify-center text-brand-secondary">
              <Settings2 size={24} />
           </div>
           <div>
              <h3 className="text-xl font-black text-[#3d2b1f] uppercase tracking-tight">Pengaturan Kategori</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Atur urutan tampilan di Kiosk</p>
           </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-zinc-100">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-none">
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400 pl-8">Urutan</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Nama Kategori</TableHead>
                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-zinc-400 pr-8">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialCategories.map((cat) => (
                <TableRow key={cat.id} className="hover:bg-zinc-50/50 transition-colors border-zinc-50">
                  <TableCell className="pl-8 py-4">
                    <div className="h-8 w-8 rounded-lg bg-brand-primary text-white flex items-center justify-center font-black text-xs shadow-md">
                      {cat.sort_order}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-black text-[#3d2b1f] uppercase text-sm tracking-tight">{cat.name}</p>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg hover:bg-blue-50 hover:text-brand-primary"
                        onClick={() => { setEditingCat(cat); setIsCatDialogOpen(true); }}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg hover:bg-red-50 hover:text-red-500"
                        onClick={() => handleDeleteCat(cat)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* DIALOGS - SOLID & OPAQUE */}
      
      {/* Menu Dialog */}
      <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-md rounded-[2.5rem] bg-white border-none shadow-2xl p-0 overflow-hidden outline-none">
          <form onSubmit={handleSaveMenu}>
            <DialogHeader className="p-8 border-b bg-zinc-50/30">
              <DialogTitle className="text-2xl font-black text-[#3d2b1f] uppercase tracking-tight">
                {editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
              </DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nama Menu</Label>
                <Input name="name" defaultValue={editingMenu?.name} required className="rounded-xl border-2 focus:border-brand-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Kategori</Label>
                  <Select name="category_id" defaultValue={editingMenu?.category_id || initialCategories[0]?.id}>
                    <SelectTrigger className="rounded-xl border-2">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 rounded-xl shadow-xl">
                      {initialCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Harga (Rp)</Label>
                  <Input name="price" type="number" defaultValue={editingMenu?.price} required className="rounded-xl border-2 focus:border-brand-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">URL Foto (Unsplash)</Label>
                <Input name="image_url" defaultValue={editingMenu?.image_url} className="rounded-xl border-2 focus:border-brand-primary" />
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100">
                <div className="space-y-0.5">
                   <Label className="font-black text-[#3d2b1f] uppercase text-xs">Menu Habis</Label>
                   <p className="text-[10px] text-zinc-400 font-medium">Sembunyikan dari pelanggan jika stok kosong.</p>
                </div>
                <Switch name="is_sold_out" defaultChecked={editingMenu?.is_sold_out} />
              </div>
            </div>
            <DialogFooter className="p-8 bg-zinc-50 border-t flex flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsMenuDialogOpen(false)} className="flex-1 rounded-xl font-black text-xs uppercase text-zinc-400">Batalkan</Button>
              <Button type="submit" className="flex-1 bg-brand-primary hover:bg-blue-900 rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-100">Simpan Menu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-sm rounded-[2.5rem] bg-white border-none shadow-2xl p-0 overflow-hidden outline-none">
          <form onSubmit={handleSaveCat}>
            <DialogHeader className="p-8 border-b bg-zinc-50/30">
              <DialogTitle className="text-2xl font-black text-[#3d2b1f] uppercase tracking-tight">
                {editingCat ? 'Edit Kategori' : 'Kategori Baru'}
              </DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nama Kategori</Label>
                <Input name="name" defaultValue={editingCat?.name} required className="rounded-xl border-2 focus:border-brand-primary" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Urutan Tampil (1-99)</Label>
                <Input name="sort_order" type="number" defaultValue={editingCat?.sort_order} required className="rounded-xl border-2 focus:border-brand-primary" />
              </div>
            </div>
            <DialogFooter className="p-8 bg-zinc-50 border-t flex flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsCatDialogOpen(false)} className="flex-1 rounded-xl font-black text-xs uppercase text-zinc-400">Batalkan</Button>
              <Button type="submit" className="flex-1 bg-brand-primary hover:bg-blue-900 rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-100">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
