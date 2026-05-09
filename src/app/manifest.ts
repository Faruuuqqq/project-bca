import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ayam Kalintang SOK',
    short_name: 'AyamKalintang',
    description: 'Self-Order Kiosk for Ayam Kalintang - Bakti BCA',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FFFFFF',
    theme_color: '#0667AC',
    icons: [
      {
        src: '/logo-kalintang.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo-kalintang.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
