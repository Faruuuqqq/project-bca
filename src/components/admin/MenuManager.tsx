'use client'

import { useState, useEffect, useRef } from 'react'
import { Category } from '@/types/database'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
'use client'

import { useState, useEffect, useRef } from 'react'
import { Category } from '@/types/database'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Pencil, Trash2, Settings2, Image as ImageIcon, Upload, X, Loader2 } from 'lucide-react'
import {
  createMenu,
  updateMenu,
  deleteMenu,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadMenuImage,
  toggleMenuSoldOut,
  swapCategoryOrder,
} from '@/actions/menu'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { cn, formatRupiah } from '@/lib/utils'
import { adminTokens } from '@/components/admin/_tokens'

interface MenuItem {
  id: string
  name: string
  price: number
  cost_price?: number | null
  category_id: string
  image_url?: string | null
  is_sold_out: boolean
  current_stock: number
  description?: string
  categories?: Array<{ name: string }>
  menu_options?: MenuOptionItem[]
}

interface MenuOptionItem {
  id: string
  name: string
  is_required: boolean
  selection_type: 'single' | 'multiple'
  menu_option_values?: MenuOptionValueItem[]
}

interface MenuOptionValueItem {
  id: string
  label: string
  extra_price: number
}

interface MenuManagerProps {
  initialCategories: Category[]
  initialMenus: MenuItem[]
}

type DeleteTarget =
  | { type: 'menu'; id: string; name: string }
  | { type: 'category'; id: string; name: string }
  | null

export function MenuManager({ initialCategories, initialMenus }: MenuManagerProps) {
  const router = useRouter()
  const [menus, setMenus] = useState<MenuItem[]>(initialMenus)
  
  // Sync state when props change via router.refresh()
  useEffect(() => {
    setMenus(initialMenus)
  }, [initialMenus])

  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false)
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)
  const [activeTab, setActiveTab] = useState<'menu' | 'category'>('menu')
  const [filterCat, setFilterCat] = useState<string>('all')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [togglingMenuId, setTogglingMenuId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filtered menus by category
  const filteredMenus = filterCat === 'all'
    ? menus
    : menus.filter((m) => m.category_id === filterCat)

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const url = await uploadMenuImage(formData)
      setImageUrl(url)
      toast.success('Foto berhasil diupload')
    } catch (error: unknown) {
      toast.error((error as Error).message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageUpload(file)
  }

  const handleSaveMenu = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    // Override image_url with uploaded URL if available
    if (imageUrl) {
      formData.set('image_url', imageUrl)
    }

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
      setImageUrl('')
      router.refresh()
    } catch (error: unknown) {
      toast.error((error as Error).message)
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
    } catch (error: unknown) {
      toast.error((error as Error).message)
    }
  }

  const requestDeleteCategory = (cat: Category) => {
    const hasMenus = menus.some((m) => m.category_id === cat.id)
    if (hasMenus) {
      toast.error(
        `Gagal: Kategori "${cat.name}" masih memiliki menu. Hapus atau pindahkan menu terlebih dahulu.`
      )
      return
    }
    setDeleteTarget({ type: 'category', id: cat.id, name: cat.name })
  }

  const handleSwapCategory = async (id1: string, order1: number, id2: string, order2: number) => {
    try {
      await swapCategoryOrder(id1, order1, id2, order2)
      router.refresh()
    } catch (error: unknown) {
      toast.error((error as Error).message)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'menu') {
        await deleteMenu(deleteTarget.id)
        toast.success('Menu berhasil dihapus')
      } else {
        await deleteCategory(deleteTarget.id)
        toast.success('Kategori berhasil dihapus')
      }
      router.refresh()
    } catch (error: unknown) {
      toast.error((error as Error).message)
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleToggleSoldOut = async (menuId: string) => {
    try {
      setTogglingMenuId(menuId)
      
      // Optimistic UI - update local state immediately
      setMenus((prev) =>
        prev.map((m) =>
          m.id === menuId ? { ...m, is_sold_out: !m.is_sold_out } : m
        )
      )

      // Call server action
      const result = await toggleMenuSoldOut(menuId)
      
      if (result.success) {
        toast.success(result.is_sold_out ? 'Menu ditandai habis' : 'Menu tersedia kembali')
        router.refresh()
      }
    } catch (error: unknown) {
      // Revert optimistic UI on error
      setMenus(initialMenus)
      toast.error((error as Error).message)
    } finally {
      setTogglingMenuId(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={adminTokens.pageTitle}>Katalog Produk</h1>
             <Badge className="bg-brand-primary text-white text-xs px-2 py-0.5 font-bold rounded-md">
               {menus.length} ITEM
             </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-secondary" aria-hidden="true" />
            <p className={adminTokens.pageSubtitle}>Manajemen menu kiosk</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingCat(null)
              setIsCatDialogOpen(true)
            }}
            className={cn(
              'h-11 min-h-[44px] px-5 rounded-xl font-semibold text-sm border-border active:bg-muted transition-colors',
              adminTokens.focus
            )}
          >
            + Kategori
          </Button>
          <Button
            onClick={() => {
              setEditingMenu(null)
              setIsMenuDialogOpen(true)
            }}
            className={cn(
              'bg-brand-primary hover:bg-brand-primary/90 active:bg-brand-primary/80 text-white h-11 min-h-[44px] px-5 rounded-xl font-semibold text-sm shadow-sm transition-colors',
              adminTokens.focus
            )}
          >
            + Menu Baru
          </Button>
        </div>
      </div>

      {/* TAB SWITCHER */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('menu')}
          className={cn(
            'px-4 py-2 min-h-[44px] rounded-lg text-sm font-semibold transition-colors',
            adminTokens.focus,
            activeTab === 'menu'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-muted-foreground hover:bg-muted active:bg-muted/80'
          )}
        >
          Menu ({initialMenus.length})
        </button>
        <button
          onClick={() => setActiveTab('category')}
          className={cn(
            'px-4 py-2 min-h-[44px] rounded-lg text-sm font-semibold transition-colors',
            adminTokens.focus,
            activeTab === 'category'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-muted-foreground hover:bg-muted active:bg-muted/80'
          )}
        >
          Kategori ({initialCategories.length})
        </button>
      </div>

      {/* MENU LIST — Compact Card Layout */}
      {activeTab === 'menu' && (
        <div className="space-y-3">
          {/* Category Filter - Moved to header */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Kategori</h2>
            <div className="flex gap-2 flex-wrap justify-start md:justify-end">
               <button
                 onClick={() => setFilterCat('all')}
                 className={cn(
                   'px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-colors',
                   adminTokens.focus,
                   filterCat === 'all'
                     ? 'bg-brand-primary text-white shadow-sm'
                     : 'bg-card border border-border text-muted-foreground hover:bg-muted active:bg-muted/80'
                 )}
               >
                 Semua ({menus.length})
               </button>
               {initialCategories.map((cat) => {
                 const count = menus.filter((m) => m.category_id === cat.id).length
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-brand-primary hover:bg-brand-primary/90 active:bg-brand-primary/80 text-white rounded-xl font-semibold text-sm h-11 min-h-[44px] shadow-sm transition-colors"
              >
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === 'menu' ? 'Hapus menu?' : 'Hapus kategori?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Aksi ini tidak dapat dibatalkan. ${deleteTarget.type === 'menu' ? 'Menu' : 'Kategori'} "${deleteTarget.name}" akan dihapus permanen.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
