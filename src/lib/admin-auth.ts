const ADMIN_PIN_SECRET = process.env.ADMIN_PIN_SECRET ?? 'kalintang-admin-secret'
const COOKIE_MAX_AGE = 60 * 60 * 12 // 12 hours

export const ADMIN_COOKIE_NAME = 'admin-pin'
export const ADMIN_COOKIE_MAX_AGE = COOKIE_MAX_AGE

export function signToken(): string {
  const timestamp = Date.now().toString()
  const raw = `${ADMIN_PIN_SECRET}:${timestamp}`
  return Buffer.from(raw).toString('base64')
}

export function verifyToken(token: string): boolean {
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
