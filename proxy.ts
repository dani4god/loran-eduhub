// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth/admin') ||
    pathname === '/maintenance'
  ) {
    return NextResponse.next()
  }

  try {
    const res = await fetch(new URL('/api/site-settings', req.url))
    const data = await res.json()

    if (data.maintenanceMode) {
      return NextResponse.rewrite(new URL('/maintenance', req.url))
    }
  } catch {
    // fail open
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|logo.png).*)'],
}