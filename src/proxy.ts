import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken, ADMIN_COOKIE_NAME } from '@/lib/admin-auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Guard all /admin routes
  if (pathname.startsWith('/admin')) {
    const pinCookie = request.cookies.get(ADMIN_COOKIE_NAME)
    const isAuthenticated = pinCookie ? verifyToken(pinCookie.value) : false

    if (!isAuthenticated) {
      // Redirect unauthenticated admin access to order-type page (where PIN unlock is available)
      const redirectUrl = new URL('/order-type', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public media files (.png, .jpg, .jpeg, .gif, .webp, .svg)
     * - API webhooks (/api/webhook/*)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
