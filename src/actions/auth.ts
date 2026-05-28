'use server'

import { cookies } from 'next/headers'
import { signToken, ADMIN_COOKIE_NAME, ADMIN_COOKIE_MAX_AGE } from '@/lib/admin-auth'

const ADMIN_PIN = process.env.ADMIN_PIN ?? '1234'

export async function verifyAdminPin(pin: string): Promise<{ success: boolean }> {
  if (pin !== ADMIN_PIN) {
    return { success: false }
  }

  const token = signToken()
  const cookieStore = await cookies()

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
  })

  return { success: true }
}
