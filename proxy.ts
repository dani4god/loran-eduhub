// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl

  let res: NextResponse

  // Maintenance mode only needs to gate PUBLIC marketing pages — never
  // dashboards (student/tutor/self-paced) or admin, which have their own
  // auth gates anyway. This is also what was silently adding 1-11 SECONDS
  // to every dashboard page load, since it was fetching site-settings on
  // every single navigation site-wide.
  const isDashboardOrAdmin =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth')

  if (isDashboardOrAdmin || pathname === '/maintenance') {
    res = NextResponse.next()
  } else {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2000) // never block a page for more than 2s

      const settingsRes = await fetch(new URL('/api/site-settings', req.url), {
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        res = data.maintenanceMode
          ? NextResponse.rewrite(new URL('/maintenance', req.url))
          : NextResponse.next()
      } else {
        res = NextResponse.next() // fail open on non-OK response
      }
    } catch {
      res = NextResponse.next() // fail open on timeout, network error, or bad JSON
    }
  }

  const ref = searchParams.get('ref')
  if (ref && !req.cookies.get('loran_ref')) {
    res.cookies.set('loran_ref', ref, { maxAge: 60 * 60 * 24 * 30, path: '/', sameSite: 'lax' })
  }

  return res
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|logo.png|dashboard|admin|auth).*)'],
}