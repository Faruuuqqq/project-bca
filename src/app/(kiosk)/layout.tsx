'use client'

import { useIdleTimer } from '@/hooks/use-idle-timer'
import { useCartStore } from '@/store/cart'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { KioskGuard } from '@/components/kiosk/KioskGuard'

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
      toast.info('Sesi diulang karena tidak ada aktivitas', { duration: 3000 })
      clearCart()
      router.push('/')
    }
  }, 60000) // 60 seconds

  return (
    <>
      <KioskGuard />
      {children}
    </>
  )
}
