'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Utensils, ShoppingBag, Lock, Delete, X } from 'lucide-react'
import { verifyAdminPin } from '@/actions/auth'

const PIN_LENGTH = 4

export default function OrderTypePage() {
  const router = useRouter()
  const setOrderType = useCartStore((state) => state.setOrderType)
  const clearCart = useCartStore((state) => state.clearCart)

  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSelectType = (type: 'dine-in' | 'take-away') => {
    clearCart()
    setOrderType(type)
    router.push('/menu')
  }

  const handlePinBackspace = useCallback(() => {
    setError(false)
    setPin((prev) => prev.slice(0, -1))
  }, [])

  const handlePinClear = useCallback(() => {
    setError(false)
    setPin('')
  }, [])

  const handlePinSubmit = useCallback(async (currentPin: string) => {
    if (currentPin.length !== PIN_LENGTH) return
    setIsLoading(true)
    try {
      const result = await verifyAdminPin(currentPin)
      if (result.success) {
        router.push('/admin/orders')
      } else {
        setError(true)
        setPin('')
      }
    } catch {
      setError(true)
      setPin('')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // Auto-submit when PIN is complete
  const handleDigitPress = useCallback((digit: string) => {
    setError(false)
    setPin((prev) => {
      if (prev.length >= PIN_LENGTH) return prev
      const next = prev + digit
      if (next.length === PIN_LENGTH) {
        // Delay to show filled dot, then submit
        setTimeout(() => handlePinSubmit(next), 150)
      }
      return next
    })
  }, [handlePinSubmit])

  const closePin = useCallback(() => {
    setShowPin(false)
    setPin('')
    setError(false)
  }, [])

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white p-4 text-center overflow-hidden animate-in fade-in duration-700">
      {/* Logo */}
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

      {/* Admin Corner Button */}
      <button
        onClick={() => setShowPin(true)}
        aria-label="Admin login"
        className="fixed bottom-6 right-6 h-16 w-16 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-400 opacity-40 hover:opacity-100 transition-opacity duration-300 shadow-md hover:shadow-xl"
      >
        <Lock size={32} />
      </button>

      {/* PIN Modal Overlay */}
      {showPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm mx-4 p-8 animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-primary flex items-center justify-center">
                  <Lock size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#3d2b1f] uppercase tracking-tight">Admin</h2>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Masukkan PIN</p>
                </div>
              </div>
              <button
                onClick={closePin}
                className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* PIN Dots */}
            <div className="flex items-center justify-center gap-4 mb-8">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 w-4 rounded-full transition-all duration-200 ${i < pin.length
                      ? error
                        ? 'bg-red-500 scale-110'
                        : 'bg-brand-primary scale-110'
                      : 'bg-zinc-200'
                    } ${error && i < pin.length ? 'animate-shake' : ''}`}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-center text-xs font-bold text-red-500 mb-4 animate-in fade-in duration-200">
                PIN salah, coba lagi
              </p>
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDigitPress(String(digit))}
                  disabled={isLoading}
                  className="h-16 rounded-2xl bg-zinc-50 text-2xl font-black text-[#3d2b1f] hover:bg-brand-primary hover:text-white active:scale-95 transition-all duration-150 disabled:opacity-50 border border-zinc-100"
                >
                  {digit}
                </button>
              ))}

              {/* Clear */}
              <button
                onClick={handlePinClear}
                disabled={isLoading}
                className="h-16 rounded-2xl bg-zinc-50 text-xs font-black text-zinc-400 uppercase tracking-widest hover:bg-zinc-200 active:scale-95 transition-all duration-150 disabled:opacity-50 border border-zinc-100"
              >
                Hapus
              </button>

              {/* 0 */}
              <button
                onClick={() => handleDigitPress('0')}
                disabled={isLoading}
                className="h-16 rounded-2xl bg-zinc-50 text-2xl font-black text-[#3d2b1f] hover:bg-brand-primary hover:text-white active:scale-95 transition-all duration-150 disabled:opacity-50 border border-zinc-100"
              >
                0
              </button>

              {/* Backspace */}
              <button
                onClick={handlePinBackspace}
                disabled={isLoading}
                className="h-16 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:bg-zinc-200 active:scale-95 transition-all duration-150 disabled:opacity-50 border border-zinc-100"
              >
                <Delete size={22} />
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={closePin}
              className="w-full mt-6 h-14 rounded-2xl bg-zinc-100 text-sm font-black text-zinc-500 uppercase tracking-widest hover:bg-zinc-200 active:scale-[0.98] transition-all"
            >
              Batalkan
            </button>

            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-[2.5rem]">
                <div className="h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
