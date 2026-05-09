'use client'

import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Utensils, ShoppingBag } from 'lucide-react'

export default function OrderTypePage() {
  const router = useRouter()
  const setOrderType = useCartStore((state) => state.setOrderType)
  const clearCart = useCartStore((state) => state.clearCart)

  const handleSelectType = (type: 'dine-in' | 'take-away') => {
    // SOLUTION: Clean Start
    // Always clear previous session data before starting a new one
    clearCart()
    setOrderType(type)
    router.push('/menu')
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white p-4 text-center overflow-hidden animate-in fade-in duration-700">
      {/* Optimized Logo Size */}
      <div className="mb-4 md:mb-8 shrink-0 flex flex-col items-center">
        <img 
          src="/logo-kalintang.png" 
          alt="Ayam Kalintang" 
          className="h-32 md:h-[200px] w-auto object-contain drop-shadow-xl" 
        />
        <div className="mt-2 md:mt-3 flex flex-col items-center opacity-40">
          <div className="h-1 w-12 bg-brand-secondary rounded-full mb-2" />
          <p className="text-[10px] md:text-sm font-black text-brand-neutral uppercase tracking-[0.4em]">
            Self-Order Kiosk
          </p>
        </div>
      </div>

      <div className="grid w-full max-w-4xl gap-4 md:gap-8 px-6 md:grid-cols-2">
        {/* Dine-In */}
        <Button
          onClick={() => handleSelectType('dine-in')}
          className="group flex h-40 md:h-64 flex-col items-center justify-center gap-2 md:gap-6 rounded-[2.5rem] bg-white text-brand-primary shadow-xl transition-all hover:scale-[1.02] active:scale-95 border-2 border-zinc-50"
        >
          <div className="p-4 md:p-6 bg-blue-50 rounded-full group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-inner">
            <Utensils size={40} className="md:hidden" />
            <Utensils size={56} className="hidden md:block" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xl md:text-3xl font-black uppercase tracking-tight text-[#3d2b1f] group-hover:text-brand-primary transition-colors">Makan di Sini</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Dine-In Area</span>
          </div>
        </Button>

        {/* Take-Away */}
        <Button
          onClick={() => handleSelectType('take-away')}
          className="group flex h-40 md:h-64 flex-col items-center justify-center gap-2 md:gap-6 rounded-[2.5rem] bg-white text-brand-primary shadow-xl transition-all hover:scale-[1.02] active:scale-95 border-2 border-zinc-50"
        >
          <div className="p-4 md:p-6 bg-blue-50 rounded-full group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-inner">
            <ShoppingBag size={40} className="md:hidden" />
            <ShoppingBag size={56} className="hidden md:block" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xl md:text-3xl font-black uppercase tracking-tight text-[#3d2b1f] group-hover:text-brand-primary transition-colors">Bawa Pulang</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Take-Away Order</span>
          </div>
        </Button>
      </div>

      {/* Footer Interactive Nudge */}
      <div className="mt-8 md:mt-10">
        <div className="flex items-center justify-center gap-3 bg-zinc-50 px-8 py-3 rounded-full border border-zinc-100 shadow-sm animate-bounce cursor-pointer">
          <div className="h-2 w-2 rounded-full bg-brand-secondary animate-ping" />
          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-brand-neutral">Silakan pilih metode makan</p>
        </div>
      </div>
    </div>
  )
}
