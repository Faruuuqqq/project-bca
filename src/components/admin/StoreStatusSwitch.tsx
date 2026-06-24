'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Store } from 'lucide-react'
import { toast } from 'sonner'

export function StoreStatusSwitch({ isCollapsed }: { isCollapsed?: boolean }) {
  const [status, setStatus] = useState<'open' | 'closed'>('open')
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('store_configs')
        .select('config_value')
        .eq('config_key', 'store_status')
        .single()
      if (data && (data.config_value === 'open' || data.config_value === 'closed')) {
        setStatus(data.config_value)
      }
      setIsLoading(false)
    }
    fetchStatus()
  }, [supabase])

  const toggleStatus = async () => {
    const newStatus = status === 'open' ? 'closed' : 'open'
    setIsLoading(true)
    const { error } = await supabase
      .from('store_configs')
      .update({ config_value: newStatus })
      .eq('config_key', 'store_status')

    if (error) {
      toast.error('Gagal mengubah status toko')
    } else {
      setStatus(newStatus)
      toast.success(newStatus === 'open' ? 'Toko kini DIBUKA' : 'Toko kini DITUTUP')
    }
    setIsLoading(false)
  }

  if (isLoading) return <div className="h-12 animate-pulse bg-zinc-100 rounded-xl" />

  return (
    <button
      onClick={toggleStatus}
      disabled={isLoading}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border-2 ${
        status === 'open' 
          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
          : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <Store size={20} className={status === 'open' ? 'text-green-600' : 'text-red-600'} />
        {!isCollapsed && (
          <span className="font-bold text-sm uppercase tracking-wide">
            {status === 'open' ? 'Toko Buka' : 'Toko Tutup'}
          </span>
        )}
      </div>
      {!isCollapsed && (
        <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${
          status === 'open' ? 'bg-green-500' : 'bg-zinc-300'
        }`}>
          <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
            status === 'open' ? 'translate-x-4' : 'translate-x-0'
          }`} />
        </div>
      )}
    </button>
  )
}
