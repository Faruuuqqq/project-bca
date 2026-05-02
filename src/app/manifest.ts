import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SOK Ayam Kalintang',
    short_name: 'AyamKalintang',
    description: 'Self-Order Kiosk for Ayam Kalintang',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f1e7',
    theme_color: '#d42c2c',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
