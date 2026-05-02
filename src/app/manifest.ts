import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ayam Kalintang - Self Order Kiosk',
    short_name: 'Ayam Kalintang',
    description: 'Sistem Pesan Mandiri Ayam Kalintang',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8f1e7',
    theme_color: '#d42c2c',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
    ],
  }
}
