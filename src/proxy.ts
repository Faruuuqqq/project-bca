import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken, ADMIN_COOKIE_NAME } from '@/lib/admin-auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    const pinCookie = request.cookies.get(ADMIN_COOKIE_NAME)
    const isAuthenticated = pinCookie ? verifyToken(pinCookie.value) : false

    if (!isAuthenticated) {
      // Not authenticated — redirect to kiosk home
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
