'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'

export function MenuHeader() {
  const orderType = useCartStore((state) => state.orderType)
  const [currentTime, setCurrentTime] = useState('')
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // 1. Time Update
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)

    // 2. Internet Connectivity Monitor
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    setIsOnline(navigator.onLine)

    return () => {
      clearInterval(timer)
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-brand-primary px-4 md:px-8 py-3 shrink-0 shadow-lg border-b border-white/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Sisi Kiri: Logo & Navigasi */}
        <div className="flex items-center gap-3 md:gap-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all active:scale-90 border border-white/20">
              <ChevronLeft size={20} className="stroke-[3]" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-5">
            <img 
              src="/logo-kalintang.png" 
              alt="Logo" 
              className="h-14 md:h-18 w-auto object-contain drop-shadow-md py-1" 
            />
            
            <div className="flex flex-col gap-1">
              <Badge className="bg-brand-secondary text-brand-primary border-none text-[9px] md:text-[11px] font-black uppercase px-3 py-1 rounded-lg shadow-lg">
                {orderType === 'dine-in' ? 'Makan di Sini' : 'Bawa Pulang'}
              </Badge>
              <div className="flex items-center gap-1.5 text-white font-black uppercase tracking-widest text-[9px]">
                {isOnline ? (
                  <Wifi size={10} className="text-brand-secondary animate-pulse fill-brand-secondary" />
                ) : (
                  <WifiOff size={10} className="text-red-400" />
                )}
                <span>Kiosk Terminal #01</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sisi Kanan: Live Info - High Contrast */}
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col text-right pr-6 border-r border-white/30">
            <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] leading-none mb-1.5">Status Sistem</p>
            <div className="flex items-center justify-end gap-2">
              <div className={`h-2 w-2 rounded-full shadow-[0_0_12px] animate-pulse ${isOnline ? 'bg-brand-secondary shadow-[#FEB914]' : 'bg-red-500 shadow-red-500'}`} />
              <span className="text-[11px] font-black text-white uppercase tracking-wider">
                {isOnline ? 'Aktif & Terkoneksi' : 'Koneksi Terputus'}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-2xl md:text-3xl font-black text-brand-secondary tracking-tighter tabular-nums leading-none drop-shadow-md">
              {currentTime || '--:--'}
            </p>
            <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] mt-1.5 opacity-90">Waktu WIB</p>
          </div>
        </div>

      </div>
    </header>
  )
}
