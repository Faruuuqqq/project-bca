import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'Ayam Kalintang - Self Order Kiosk',
  description: 'Sistem Pemesanan Mandiri Ayam Kalintang - Bakti BCA',
}

export const viewport: Viewport = {
  themeColor: '#0667AC',
  width: 'device-width',
  initialScale: 1,
  
  
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="h-full scroll-smooth">
      <body className={`${jakarta.variable} font-sans min-h-full flex flex-col overflow-x-hidden selection:bg-brand-primary selection:text-white`}>
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  )
}
