import { cookies } from 'next/headers'

const ENV_SECRET = process.env.ADMIN_PIN_SECRET
const ADMIN_PIN_SECRET = ENV_SECRET || 'kalintang-admin-secret'
const COOKIE_MAX_AGE = 60 * 60 * 12 // 12 hours

export const ADMIN_COOKIE_NAME = 'admin-pin'
export const ADMIN_COOKIE_MAX_AGE = COOKIE_MAX_AGE

export function signToken(): string {
  const timestamp = Date.now().toString()
  const raw = `${ADMIN_PIN_SECRET}:${timestamp}`
  return Buffer.from(raw).toString('base64')
}

export function verifyToken(token: string): boolean {
  if (!token) return false

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [secret, timestampStr] = decoded.split(':')
    if (secret !== ADMIN_PIN_SECRET) return false

    const timestamp = parseInt(timestampStr, 10)
    if (isNaN(timestamp)) return false

    const age = Date.now() - timestamp
    if (age > COOKIE_MAX_AGE * 1000) return false

    return true
  } catch {
    return false
  }
}

/**
 * Server Action authorization guard.
 * Call at the top of every privileged Server Action to enforce authorization independently of route proxy.
 */
export async function requireAdminAuth(): Promise<void> {
  const cookieStore = await cookies()
  const pinCookie = cookieStore.get(ADMIN_COOKIE_NAME)
  const isAuthenticated = pinCookie ? verifyToken(pinCookie.value) : false

  if (!isAuthenticated) {
    throw new Error('UNAUTHORIZED: Akses ditolak. Silakan login admin terlebih dahulu.')
  }
}
