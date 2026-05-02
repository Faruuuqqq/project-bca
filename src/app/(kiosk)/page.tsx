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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f1e7] p-6 text-center">
      {/* Branding */}
      <div className="mb-12">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#d42c2c] text-white">
          <Utensils size={48} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#3d2b1f]">
          AYAM KALINTANG
        </h1>
        <p className="mt-2 text-lg font-medium text-[#7a5c48]">
          Self-Order Kiosk
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-6 md:grid-cols-2">
        {/* Dine-In */}
        <Button
          onClick={() => handleSelectType('dine-in')}
          className="group flex h-64 flex-col items-center justify-center gap-4 rounded-3xl bg-white text-[#d42c2c] shadow-xl transition-all hover:bg-[#d42c2c] hover:text-white"
        >
          <Utensils size={64} className="group-hover:scale-110 transition-transform" />
          <span className="text-3xl font-bold">Makan di Sini</span>
          <span className="text-sm opacity-70">(Dine-In)</span>
        </Button>

        {/* Take-Away */}
        <Button
          onClick={() => handleSelectType('take-away')}
          className="group flex h-64 flex-col items-center justify-center gap-4 rounded-3xl bg-white text-[#d42c2c] shadow-xl transition-all hover:bg-[#d42c2c] hover:text-white"
        >
          <ShoppingBag size={64} className="group-hover:scale-110 transition-transform" />
          <span className="text-3xl font-bold">Bawa Pulang</span>
          <span className="text-sm opacity-70">(Take-Away)</span>
        </Button>
      </div>

      <div className="mt-16 text-[#7a5c48]">
        <p className="animate-pulse font-medium">Sentuh layar untuk memulai pesanan Anda</p>
      </div>
    </div>
  )
}
