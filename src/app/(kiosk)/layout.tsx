'use client'

import { useIdleTimer } from '@/hooks/use-idle-timer'
import { useCartStore } from '@/store/cart'
import { useRouter, usePathname } from 'next/navigation'

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const clearCart = useCartStore((state) => state.clearCart)

  // Activate idle timer for all kiosk routes except the home screen (attract screen)
  useIdleTimer(() => {
    if (pathname !== '/') {
      console.log('🕒 [Idle Reset] Inactivity detected. Returning to Attract Screen.')
      clearCart()
      router.push('/')
    }
  }, 120000) // 2 minutes

  return <>{children}</>
}
