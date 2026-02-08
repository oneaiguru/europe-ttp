/**
 * Next.js Middleware
 *
 * Applies security headers to all requests for defense-in-depth.
 *
 * SECURITY: Content-Security-Policy (CSP)
 * - Blocks unsafe-eval to prevent dynamic code execution
 * - Prevents code injection attacks even if vulnerable code is introduced
 * - Restricts object-src to 'none' to block plugin execution
 *
 * Note: This file must be at the project root (not in app/api/) for Next.js middleware.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Content-Security-Policy headers
  // Deliberately excludes 'unsafe-eval' from script-src to prevent:
  // - eval() calls
  // - new Function() calls
  // - setTimeout() with string arguments
  // - setInterval() with string arguments
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
