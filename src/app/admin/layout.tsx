'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ClipboardList, 
  UtensilsCrossed, 
  Package, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Don't show sidebar on login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Pesanan Aktif', href: '/admin/orders', icon: ClipboardList },
    { name: 'Editor Menu', href: '/admin/menus', icon: UtensilsCrossed },
    { name: 'Inventaris', href: '/admin/inventory', icon: Package },
  ]

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 bottom-0 z-20 flex flex-col bg-[#3d2b1f] text-white transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex h-20 items-center justify-between px-6 border-b border-white/10">
          {!isCollapsed && (
            <h1 className="text-lg font-black tracking-tighter text-[#d42c2c]">
              AYAM KALINTANG
            </h1>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-1 hover:bg-white/10 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-4 rounded-xl px-4 py-3 font-bold transition-all duration-200",
                  isActive 
                    ? "bg-[#d42c2c] text-white shadow-lg" 
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}>
                  <item.icon size={24} className="shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <form action="/auth/signout" method="post">
            <button className={cn(
              "flex w-full items-center gap-4 rounded-xl px-4 py-3 font-bold text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all",
              isCollapsed && "justify-center"
            )}>
              <LogOut size={24} className="shrink-0" />
              {!isCollapsed && <span>Keluar</span>}
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        isCollapsed ? "pl-20" : "pl-64"
      )}>
        {children}
      </main>
    </div>
  )
}
