'use client'

import { useIdleTimer } from '@/hooks/use-idle-timer'
import { Toaster } from '@/components/ui/sonner'

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Activate idle timer for all kiosk routes
  useIdleTimer(180000) // 3 minutes

  return (
    <>
      {children}
      <Toaster position="top-center" />
    </>
  )
}
