'use client'

import { useState, useRef } from 'react'
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
                return (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCat(cat.id)}
                    className={cn(
                      'px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-colors',
                      adminTokens.focus,
                      filterCat === cat.id
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'bg-card border border-border text-muted-foreground hover:bg-muted active:bg-muted/80'
                    )}
                  >
                    {cat.name} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Menu List Header - Grid Layout */}
          <div className="hidden md:grid grid-cols-[60px_1fr_120px_100px_80px_60px_40px_40px] gap-3 px-4 py-3 bg-muted/40 rounded-lg border border-border text-xs font-semibold text-muted-foreground">
            <div></div>
            <div>Nama Menu</div>
            <div>Kategori</div>
            <div className="text-right">Harga</div>
            <div className="text-center">Stok</div>
            <div className="text-center">Status</div>
            <div></div>
            <div></div>
          </div>

          {/* Menu Cards - Grid Layout */}
          <div className="space-y-2">
            {filteredMenus.map((menu) => (
              <div
                key={menu.id}
                className="hidden md:grid grid-cols-[60px_1fr_120px_100px_80px_60px_40px_40px] gap-3 items-center bg-card rounded-xl border border-border p-3 shadow-sm hover:bg-muted/30 transition-colors"
              >
                {/* Thumbnail (60px) */}
                <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden border border-border shrink-0">
                  {menu.image_url ? (
                    <img
                      src={menu.image_url}
                      alt={menu.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon size={16} aria-hidden="true" />
                    </div>
                  )}
                </div>

                {/* Name (1fr) */}
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{menu.name}</p>
                </div>

                {/* Category (120px) */}
                <div className="min-w-0">
                  <span className="text-xs text-muted-foreground truncate block">
                    {menu.categories?.[0]?.name || '(No Category)'}
                  </span>
                </div>

                {/* Price (100px) */}
                <div className="text-right">
                  <span className="text-xs font-semibold text-brand-primary tabular-nums">
                    {formatRupiah(menu.price)}
                  </span>
                </div>

                {/* Stock (80px) */}
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">
                    {menu.current_stock} pcs
                  </span>
                </div>

                {/* Status Badge - Clickable (60px) */}
                <div className="text-center">
                  <button
                    onClick={() => handleToggleSoldOut(menu.id)}
                    disabled={togglingMenuId === menu.id}
                    className={cn(
                      'text-white text-[10px] font-semibold px-2 py-1 rounded-md inline-block',
                      'transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
                      menu.is_sold_out
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-emerald-500 hover:bg-emerald-600'
                    )}
                  >
                    {menu.is_sold_out ? 'Habis' : 'Ready'}
                  </button>
                </div>

                {/* Edit Button (40px) */}
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${menu.name}`}
                    className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-lg hover:bg-blue-50 hover:text-brand-primary active:bg-blue-100 transition-colors"
                    onClick={() => {
                      setEditingMenu(menu)
                      setIsMenuDialogOpen(true)
                    }}
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </Button>
                </div>

                {/* Delete Button (40px) */}
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Hapus ${menu.name}`}
                    className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-lg hover:bg-red-50 hover:text-red-500 active:bg-red-100 transition-colors"
                    onClick={() =>
                      setDeleteTarget({ type: 'menu', id: menu.id, name: menu.name })
                    }
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Mobile Fallback - Flex Layout */}
            <div className="md:hidden space-y-2">
              {filteredMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="flex items-center gap-3 bg-card rounded-xl border border-border p-3 shadow-sm hover:bg-muted/30 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden border border-border shrink-0">
                    {menu.image_url ? (
                      <img
                        src={menu.image_url}
                        alt={menu.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon size={16} aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-foreground truncate">{menu.name}</p>
                      <button
                        onClick={() => handleToggleSoldOut(menu.id)}
                        disabled={togglingMenuId === menu.id}
                        className={cn(
                          'text-white text-[10px] font-semibold px-2 py-1 rounded-md shrink-0',
                          'transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
                          menu.is_sold_out
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-emerald-500 hover:bg-emerald-600'
                        )}
                      >
                        {menu.is_sold_out ? 'Habis' : 'Ready'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span className="truncate">{menu.categories?.[0]?.name || '(No Category)'}</span>
                      <span>•</span>
                      <span className="font-semibold text-brand-primary">
                        {formatRupiah(menu.price)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${menu.name}`}
                      className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-lg hover:bg-blue-50 hover:text-brand-primary active:bg-blue-100 transition-colors"
                      onClick={() => {
                        setEditingMenu(menu)
                        setIsMenuDialogOpen(true)
                      }}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Hapus ${menu.name}`}
                      className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-lg hover:bg-red-50 hover:text-red-500 active:bg-red-100 transition-colors"
                      onClick={() =>
                        setDeleteTarget({ type: 'menu', id: menu.id, name: menu.name })
                      }
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredMenus.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-10 bg-card rounded-2xl border border-dashed border-border">
                {filterCat === 'all'
                  ? 'Belum ada menu. Klik "+ Menu Baru" untuk menambahkan.'
                  : 'Tidak ada menu di kategori ini.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CATEGORY LIST — Compact */}
      {activeTab === 'category' && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-card p-3 rounded-xl shadow-sm border border-border">
            <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center text-brand-secondary shrink-0">
              <Settings2 size={18} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm text-foreground">Pengaturan Kategori</h2>
              <p className="text-xs text-muted-foreground">Atur urutan tampilan di kiosk</p>
            </div>
          </div>

          {initialCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 bg-card rounded-xl border border-border p-3 shadow-sm hover:bg-muted/30 transition-colors"
            >
              <div className="h-9 w-9 rounded-lg bg-brand-primary text-white flex items-center justify-center font-bold text-sm shadow-sm tabular-nums shrink-0">
                {cat.sort_order}
              </div>
              <p className="font-bold text-sm text-foreground flex-1 truncate">{cat.name}</p>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit kategori ${cat.name}`}
                  className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-lg hover:bg-blue-50 hover:text-brand-primary active:bg-blue-100 transition-colors"
                  onClick={() => {
                    setEditingCat(cat)
                    setIsCatDialogOpen(true)
                  }}
                >
                  <Pencil size={16} aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Hapus kategori ${cat.name}`}
                  className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-lg hover:bg-red-50 hover:text-red-500 active:bg-red-100 transition-colors"
                  onClick={() => requestDeleteCategory(cat)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MENU DIALOG */}
      <Dialog open={isMenuDialogOpen} onOpenChange={(open) => {
        setIsMenuDialogOpen(open)
        if (!open) {
          setImageUrl('')
          setEditingMenu(null)
        } else if (editingMenu) {
          setImageUrl(editingMenu.image_url || '')
        }
      }}>
        <DialogContent
          showCloseButton={false}
          className="max-w-lg max-h-[90vh] rounded-2xl bg-card border-border shadow-md p-0 overflow-hidden flex flex-col"
        >
          <form onSubmit={handleSaveMenu} className="flex flex-col flex-1 overflow-hidden">
            <DialogHeader className="p-6 border-b border-border shrink-0">
              <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                {editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4 overflow-y-auto touch-scroll flex-1">
              {/* Image Upload Area */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Foto Menu
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Upload foto menu"
                />
                
                {(imageUrl || editingMenu?.image_url) && !isUploading ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border bg-muted">
                    <img
                      src={imageUrl || editingMenu?.image_url || ''}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white rounded-lg shadow-sm"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Ganti foto"
                      >
                        <Upload size={14} aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-red-50 text-red-500 rounded-lg shadow-sm"
                        onClick={() => setImageUrl('')}
                        aria-label="Hapus foto"
                      >
                        <X size={14} aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={cn(
                      'w-full h-32 rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-2 transition-colors',
                      'hover:border-brand-primary hover:bg-blue-50/50 active:bg-blue-50',
                      isUploading && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={24} className="text-brand-primary animate-spin" aria-hidden="true" />
                        <span className="text-xs font-semibold text-muted-foreground">Mengupload...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={24} className="text-muted-foreground" aria-hidden="true" />
                        <span className="text-xs font-semibold text-muted-foreground">
                          Tap untuk upload foto
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          JPG, PNG, WebP • Maks 5MB
                        </span>
                      </>
                    )}
                  </button>
                )}
                {/* Hidden input for form submission */}
                <input type="hidden" name="image_url" value={imageUrl || editingMenu?.image_url || ''} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nama Menu
                </Label>
                <Input
                  name="name"
                  defaultValue={editingMenu?.name}
                  required
                  className="rounded-xl border border-border h-11 min-h-[44px] text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Kategori
                  </Label>
                  <Select
                    key={editingMenu?.id || 'new'}
                    name="category_id"
                    defaultValue={editingMenu?.category_id || initialCategories[0]?.id}
                  >
                    <SelectTrigger className="rounded-xl border border-border h-11 min-h-[44px]">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border rounded-xl shadow-md">
                      {initialCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="min-h-[44px]">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Harga Jual (Rp)
                  </Label>
                  <Input
                    name="price"
                    type="number"
                    step="1"
                    min="0"
                    inputMode="numeric"
                    defaultValue={editingMenu?.price}
                    required
                    className="rounded-xl border border-border h-11 min-h-[44px] text-base"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Harga Modal / COGS (Rp)
                </Label>
                <Input
                  name="cost_price"
                  type="number"
                  step="1"
                  min="0"
                  inputMode="numeric"
                  defaultValue={editingMenu?.cost_price ?? 0}
                  className="rounded-xl border border-border h-11 min-h-[44px] text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Biaya bahan baku per porsi. Dipakai untuk hitung laba kotor di Ringkasan.
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border min-h-[56px]">
                <div>
                  <Label className="font-semibold text-sm text-foreground">Menu Habis</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sembunyikan dari pelanggan jika stok kosong.
                  </p>
                </div>
                <Switch name="is_sold_out" defaultChecked={editingMenu?.is_sold_out} />
              </div>
            </div>
            <DialogFooter className="p-6 bg-muted/30 border-t border-border flex flex-row gap-3 shrink-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsMenuDialogOpen(false)
                  setImageUrl('')
                }}
                className="flex-1 rounded-xl font-semibold text-sm h-11 min-h-[44px]"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isUploading}
                className="flex-1 bg-brand-primary hover:bg-brand-primary/90 active:bg-brand-primary/80 text-white rounded-xl font-semibold text-sm h-11 min-h-[44px] shadow-sm transition-colors disabled:opacity-60"
              >
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CATEGORY DIALOG */}
      <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-sm rounded-2xl bg-card border-border shadow-md p-0 overflow-hidden"
        >
          <form onSubmit={handleSaveCat}>
            <DialogHeader className="p-6 border-b border-border">
              <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                {editingCat ? 'Edit Kategori' : 'Kategori Baru'}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nama Kategori
                </Label>
                <Input
                  name="name"
                  defaultValue={editingCat?.name}
                  required
                  className="rounded-xl border border-border h-11 min-h-[44px] text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Urutan Tampil (1-99)
                </Label>
                <Input
                  name="sort_order"
                  type="number"
                  min="1"
                  max="99"
                  step="1"
                  inputMode="numeric"
                  defaultValue={editingCat?.sort_order}
                  required
                  className="rounded-xl border border-border h-11 min-h-[44px] text-base"
                />
              </div>
            </div>
            <DialogFooter className="p-6 bg-muted/30 border-t border-border flex flex-row gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCatDialogOpen(false)}
                className="flex-1 rounded-xl font-semibold text-sm h-11 min-h-[44px]"
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
        <AlertDialogContent>
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
