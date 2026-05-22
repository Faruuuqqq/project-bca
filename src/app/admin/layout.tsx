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
  ChevronRight,
  Store
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const navItems = [
    { name: 'Ringkasan', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Antrean Dapur', href: '/admin/orders', icon: ClipboardList },
    { name: 'Katalog Menu', href: '/admin/menus', icon: UtensilsCrossed },
    { name: 'Stok Barang', href: '/admin/inventory', icon: Package },
  ]

  return (
    <div className="flex min-h-screen bg-[#f0f7ff]">
      {/* Sidebar - Enhanced Premium Design */}
      <aside 
        className={cn(
          "fixed left-0 top-0 bottom-0 z-20 flex flex-col bg-brand-primary text-white transition-all duration-500 ease-in-out shadow-[10px_0_40px_rgba(6,103,172,0.1)] border-r border-white/5",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        {/* Branding Area - Logo Only, No Text, Transparent BG */}
        <div className="flex h-24 items-center gap-4 px-6 border-b border-white/10 overflow-hidden">
          <div className={cn(
            "shrink-0 flex items-center justify-center transition-all duration-500",
            isCollapsed ? "w-8 h-8" : "w-24 h-16 md:w-32 md:h-20"
          )}>
            <img 
              src="/logo-kalintang.png" 
              alt="Ayam Kalintang Logo" 
              className="w-full h-full object-contain drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)]" 
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
               <span className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.4em] leading-none">Management</span>
               <div className="h-0.5 w-8 bg-brand-secondary mt-1.5 rounded-full opacity-50" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 p-4 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-4 rounded-2xl px-4 py-3.5 font-black text-sm transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "bg-brand-secondary text-brand-primary shadow-xl shadow-orange-400/10 translate-x-1" 
                    : "text-blue-100/40 hover:bg-white/5 hover:text-white"
                )}>
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-primary/20" />
                  )}
                  <item.icon size={22} className={cn("shrink-0 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                  {!isCollapsed && (
                    <span className="uppercase tracking-wider animate-in fade-in duration-500">{item.name}</span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-28 h-8 w-8 bg-brand-secondary text-brand-primary rounded-full flex items-center justify-center shadow-xl border-4 border-[#f0f7ff] hover:scale-110 active:scale-95 transition-all z-30"
        >
          {isCollapsed ? <ChevronRight size={16} strokeWidth={3} /> : <ChevronLeft size={16} strokeWidth={3} />}
        </button>

        {/* User / Logout */}
        <div className="p-4 border-t border-white/10 bg-black/5">
          <div className={cn("flex items-center gap-4 px-4 py-3 mb-2", isCollapsed && "justify-center")}>
             <div className="h-8 w-8 rounded-full bg-blue-400/20 flex items-center justify-center border border-white/10 text-brand-secondary">
                <Store size={16} />
             </div>
             {!isCollapsed && (
               <div className="flex flex-col">
                  <p className="text-[10px] font-black text-white leading-none uppercase tracking-widest">Administrator</p>
                  <div className="text-[8px] font-bold text-blue-200/40 uppercase tracking-tighter mt-1.5 flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                    Sistem Aktif
                  </div>
               </div>
             )}
          </div>
          <form action="/auth/signout" method="post">
            <button className={cn(
              "flex w-full items-center gap-4 rounded-xl px-4 py-3 font-bold text-blue-100/20 hover:bg-red-500 hover:text-white transition-all duration-300",
              isCollapsed && "justify-center"
            )}>
              <LogOut size={20} className="shrink-0" />
              {!isCollapsed && <span className="uppercase tracking-[0.2em] text-[10px]">Keluar Sistem</span>}
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-500 ease-in-out min-h-screen",
        isCollapsed ? "pl-20" : "pl-72"
      )}>
        <div className="p-8 md:p-12">
           {children}
        </div>
      </main>
    </div>
  )
}
