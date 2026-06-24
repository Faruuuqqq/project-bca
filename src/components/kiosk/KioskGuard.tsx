'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { WifiOff, Lock } from 'lucide-react'

export function KioskGuard() {
  const [isOnline, setIsOnline] = useState(true)
  const [storeStatus, setStoreStatus] = useState<'open' | 'closed'>('open')
  const supabase = createClient()

  // Network offline listener
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Supabase Realtime for store_status
  useEffect(() => {
    // Initial fetch
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('store_configs')
        .select('config_value')
        .eq('config_key', 'store_status')
        .single()
      if (data && (data.config_value === 'open' || data.config_value === 'closed')) {
        setStoreStatus(data.config_value)
      }
    }
    fetchStatus()

    // Realtime subscription
    const channel = supabase
      .channel('store-configs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store_configs',
          filter: "config_key=eq.store_status"
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData && newData.config_value) {
            setStoreStatus(newData.config_value as 'open' | 'closed')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (!isOnline) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#00529C] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
        <Image src="/logo-kalintang.png" alt="Logo" width={200} height={180} unoptimized className="mb-8 drop-shadow-xl" />
        <div className="bg-white/10 p-6 rounded-full mb-6 animate-pulse">
          <WifiOff size={64} className="text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white text-center mb-4 tracking-tight drop-shadow-md">
          Koneksi Terputus
        </h1>
        <p className="text-white/80 text-xl text-center max-w-md">
          Mohon maaf, terminal sedang offline. Silakan panggil kasir untuk bantuan.
        </p>
      </div>
    )
  }

  if (storeStatus === 'closed') {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
        <Image src="/logo-kalintang.png" alt="Logo" width={200} height={180} unoptimized className="mb-8 opacity-50 grayscale drop-shadow-xl" />
        <div className="bg-white/5 p-6 rounded-full mb-6">
          <Lock size={64} className="text-zinc-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white text-center mb-4 tracking-tight">
          TOKO SEDANG TUTUP
        </h1>
        <p className="text-zinc-400 text-xl text-center max-w-md uppercase tracking-widest font-bold">
          Terima kasih atas kunjungannya.
        </p>
      </div>
    )
  }

  return null
}
