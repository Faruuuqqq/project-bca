import { cookies } from 'next/headers'

const ENV_SECRET = process.env.ADMIN_PIN_SECRET
const IS_PROD = process.env.NODE_ENV === 'production'

// Fail-closed strategy: Require ADMIN_PIN_SECRET in production.
if (IS_PROD && !ENV_SECRET) {
  console.error('[CRITICAL SECURITY RISK] ADMIN_PIN_SECRET is missing in production environment. All admin authentications will fail closed.')
}

const ADMIN_PIN_SECRET = ENV_SECRET ?? (IS_PROD ? '' : 'kalintang-admin-secret')
const COOKIE_MAX_AGE = 60 * 60 * 12 // 12 hours

export const ADMIN_COOKIE_NAME = 'admin-pin'
export const ADMIN_COOKIE_MAX_AGE = COOKIE_MAX_AGE

export function signToken(): string {
  if (!ADMIN_PIN_SECRET) {
    throw new Error('CRITICAL: Cannot sign admin token because ADMIN_PIN_SECRET is not configured in production.')
  }
  const timestamp = Date.now().toString()
  const raw = `${ADMIN_PIN_SECRET}:${timestamp}`
  return Buffer.from(raw).toString('base64')
}

export function verifyToken(token: string): boolean {
  if (!ADMIN_PIN_SECRET) {
    console.error('[SECURITY ENFORCEMENT] ADMIN_PIN_SECRET is not configured. Rejecting authentication token.')
    return false
  }

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
