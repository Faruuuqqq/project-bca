import { ImageResponse } from 'next/og'
import fs from 'node:fs/promises'
import path from 'node:path'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  const logoPath = path.join(process.cwd(), 'public', 'logo-kalintang.png')
  const buf = await fs.readFile(logoPath)
  const dataUrl = `data:image/png;base64,${buf.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0667AC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 22,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt="Ayam Kalintang"
          width={136}
          height={136}
          style={{ objectFit: 'contain' }}
        />
      </div>
    ),
    { ...size }
  )
}
