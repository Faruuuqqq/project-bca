'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Package,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
  Menu as MenuIcon,
  History,
} from 'lucide-react'
import { useEffect, useState, startTransition } from 'react'
import { cn } from '@/lib/utils'
import { adminTokens } from '@/components/admin/_tokens'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { StoreStatusSwitch } from '@/components/admin/StoreStatusSwitch'

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Ringkasan', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Pesanan Aktif', href: '/admin/orders', icon: ClipboardList },
  { name: 'Katalog Menu', href: '/admin/menus', icon: UtensilsCrossed },
  { name: 'Stok Barang', href: '/admin/inventory', icon: Package },

  { name: 'Riwayat Pesanan', href: '/admin/orders/history', icon: History },
]

// Routes that should auto-collapse the desktop sidebar (KDS needs full canvas).
const AUTO_COLLAPSE_ROUTES = ['/admin/orders']

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Auto-collapse on KDS route. Manual toggle still allowed.
  useEffect(() => {
    if (AUTO_COLLAPSE_ROUTES.some((route) => pathname.startsWith(route))) {
      startTransition(() => setIsCollapsed(true))
    }
  }, [pathname])

  // Close mobile drawer on route change.
  useEffect(() => {
    startTransition(() => setIsMobileOpen(false))
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-[#f0f7ff]">
      {/* Mobile top bar (<lg) */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-brand-primary text-white flex items-center gap-3 px-4 shadow-md">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger
            aria-label="Buka menu navigasi"
            className={cn(
              'h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors',
              adminTokens.focus
            )}
          >
            <MenuIcon size={18} aria-hidden />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 bg-brand-primary text-white border-r-0 p-0"
          >
            <SheetTitle className="sr-only">Navigasi admin</SheetTitle>
            <SheetDescription className="sr-only">
              Pilih halaman pengelolaan
            </SheetDescription>
            <SidebarBody
              isCollapsed={false}
              showCollapseToggle={false}
              onNavigate={() => setIsMobileOpen(false)}
              pathname={pathname}
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative h-8 w-8 shrink-0">
            <Image
              src="/logo-kalintang.png"
              alt="Ayam Kalintang"
              fill
              sizes="32px"
              className="object-contain"
              priority
            />
          </div>
          <span className="text-sm font-bold uppercase tracking-wide truncate">
            Management
          </span>
        </div>
      </header>

      {/* Desktop sidebar (lg+) */}
      <aside
        className={cn(
          'hidden lg:flex fixed left-0 top-0 bottom-0 z-20 flex-col bg-brand-primary text-white transition-all duration-300 ease-in-out shadow-lg border-r border-white/5',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <SidebarBody
          isCollapsed={isCollapsed}
          showCollapseToggle
          onCollapseToggle={() => setIsCollapsed(!isCollapsed)}
          pathname={pathname}
        />
      </aside>

      {/* Main content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300 ease-in-out min-h-screen',
          'pt-14 lg:pt-0',
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        <div className="p-4 sm:p-5 lg:p-6 xl:p-8">{children}</div>
      </main>
    </div>
  )
}

function SidebarBody({
  isCollapsed,
  showCollapseToggle,
  onCollapseToggle,
  onNavigate,
  pathname,
}: {
  isCollapsed: boolean
  showCollapseToggle: boolean
  onCollapseToggle?: () => void
  onNavigate?: () => void
  pathname: string
}) {
  return (
    <>
      {/* Branding */}
      <div className="flex h-20 items-center gap-3 px-5 border-b border-white/10 overflow-hidden">
        <div
          className={cn(
            'shrink-0 flex items-center justify-center transition-all duration-300 relative',
            isCollapsed ? 'w-9 h-9' : 'w-14 h-14'
          )}
        >
          <Image
            src="/logo-kalintang.png"
            alt="Ayam Kalintang"
            fill
            sizes="56px"
            className="object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
            priority
          />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300 min-w-0">
            <span className="text-xs font-bold text-brand-secondary uppercase tracking-wider leading-none">
              Management
            </span>
            <span className="text-[10px] text-blue-100/60 font-medium mt-1 truncate">
              Ayam Kalintang
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 mt-2 overflow-y-auto" aria-label="Navigasi admin">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? item.name : undefined}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 min-h-[44px] font-semibold text-sm transition-colors duration-200',
                adminTokens.focus,
                isActive
                  ? 'bg-brand-secondary text-brand-primary shadow-md'
                  : 'text-blue-100/70 hover:bg-white/10 hover:text-white active:bg-white/20'
              )}
            >
              <item.icon size={20} className="shrink-0" aria-hidden />
              {!isCollapsed && (
                <span className="animate-in fade-in duration-300 truncate">
                  {item.name}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {showCollapseToggle && (
        <button
          onClick={onCollapseToggle}
          aria-label={isCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          aria-expanded={!isCollapsed}
          className={cn(
            'absolute -right-3 top-24 h-7 w-7 bg-brand-secondary text-brand-primary rounded-full flex items-center justify-center shadow-md border-2 border-[#f0f7ff] hover:scale-105 active:scale-95 transition-transform z-30',
            adminTokens.focus
          )}
        >
          {isCollapsed ? (
            <ChevronRight size={14} strokeWidth={3} aria-hidden />
          ) : (
            <ChevronLeft size={14} strokeWidth={3} aria-hidden />
          )}
        </button>
      )}

      {/* User / Logout */}
      <div className="p-3 border-t border-white/10 bg-black/10 shrink-0">
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2 mb-2',
            isCollapsed && 'justify-center'
          )}
        >
          <div className="h-8 w-8 rounded-full bg-blue-400/20 flex items-center justify-center border border-white/10 text-brand-secondary shrink-0">
            <Store size={14} aria-hidden />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <p className="text-xs font-bold text-white leading-none uppercase tracking-wide">
                Administrator
              </p>
              <div className="text-[10px] font-medium text-blue-200/60 mt-1.5 flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"
                  aria-hidden
                />
                Sistem Aktif
              </div>
            </div>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger
            aria-label="Keluar"
            title={isCollapsed ? 'Keluar' : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-3 min-h-[44px] font-semibold text-sm text-blue-100/70 hover:bg-red-500 hover:text-white active:bg-red-600 transition-colors duration-200',
              adminTokens.focus,
              isCollapsed && 'justify-center'
            )}
          >
            <LogOut size={18} className="shrink-0" aria-hidden />
            {!isCollapsed && <span>Keluar</span>}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Keluar dari sistem?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda akan diarahkan kembali ke halaman login. Pastikan tidak ada
                pekerjaan yang belum disimpan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <form action="/auth/signout" method="post" className="contents">
                <AlertDialogAction
                  render={
                    <button
                      type="submit"
                      className="bg-destructive text-white hover:bg-destructive/90"
                    />
                  }
                >
                  Ya, Keluar
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}
