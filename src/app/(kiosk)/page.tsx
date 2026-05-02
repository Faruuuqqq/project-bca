'use client'

import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Utensils, ShoppingBag } from 'lucide-react'

export default function WelcomePage() {
  const router = useRouter()
  const setOrderType = useCartStore((state) => state.setOrderType)

  const handleSelectType = (type: 'dine-in' | 'take-away') => {
    setOrderType(type)
    router.push('/menu')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-center overflow-y-auto">
      {/* Branding */}
      <div className="mb-8 md:mb-12 shrink-0 pt-8">
        <div className="mx-auto mb-4 flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg">
          <Utensils size={40} className="md:hidden" />
          <Utensils size={48} className="hidden md:block" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-brand-primary">
          AYAM KALINTANG
        </h1>
        <p className="mt-2 text-base md:text-lg font-bold text-brand-neutral opacity-80 uppercase tracking-widest">
          Self-Order Kiosk
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-4 md:gap-8 px-2 md:grid-cols-2 pb-12">
        {/* Dine-In */}
        <Button
          onClick={() => handleSelectType('dine-in')}
          className="group flex h-48 md:h-80 flex-col items-center justify-center gap-2 md:gap-6 rounded-[2rem] md:rounded-[3rem] bg-white text-brand-primary shadow-2xl transition-all hover:scale-[1.02] active:scale-95 border-none"
        >
          <div className="p-4 md:p-6 bg-blue-50 rounded-full group-hover:bg-brand-primary group-hover:text-white transition-colors">
            <Utensils size={48} className="md:hidden" />
            <Utensils size={64} className="hidden md:block" />
          </div>
          <div className="flex flex-col gap-0 md:gap-1">
            <span className="text-2xl md:text-4xl font-black uppercase tracking-tight text-brand-primary">Makan di Sini</span>
            <span className="text-xs md:text-sm font-bold text-zinc-400 uppercase tracking-widest">Dine-In</span>
          </div>
        </Button>

        {/* Take-Away */}
        <Button
          onClick={() => handleSelectType('take-away')}
          className="group flex h-48 md:h-80 flex-col items-center justify-center gap-2 md:gap-6 rounded-[2rem] md:rounded-[3rem] bg-white text-brand-primary shadow-2xl transition-all hover:scale-[1.02] active:scale-95 border-none"
        >
          <div className="p-4 md:p-6 bg-blue-50 rounded-full group-hover:bg-brand-primary group-hover:text-white transition-colors">
            <ShoppingBag size={48} className="md:hidden" />
            <ShoppingBag size={64} className="hidden md:block" />
          </div>
          <div className="flex flex-col gap-0 md:gap-1">
            <span className="text-2xl md:text-4xl font-black uppercase tracking-tight text-brand-primary">Bawa Pulang</span>
            <span className="text-xs md:text-sm font-bold text-zinc-400 uppercase tracking-widest">Take-Away</span>
          </div>
        </Button>
      </div>

      <div className="mt-auto pb-8 md:pb-12">
        <div className="flex items-center justify-center gap-3 bg-zinc-50 px-6 py-2 rounded-full border border-zinc-100 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-brand-secondary animate-ping" />
          <p className="text-xs md:text-sm font-black uppercase tracking-widest text-brand-neutral">Sentuh layar untuk memulai</p>
        </div>
      </div>
    </div>
  )
}
