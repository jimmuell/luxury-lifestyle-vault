import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

const ROLE_PREFIXES = {
  client: '/client',
  provider: '/provider',
  admin: '/admin',
  investor: '/investor',
} as const

const PUBLIC_PREFIXES = ['/auth', '/api/webhooks', '/api/inngest', '/terms', '/privacy']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const redirectResponse = NextResponse.redirect(new URL('/auth/login', request.url))
    // Clear stale session cookies so an invalid refresh token doesn't loop
    request.cookies.getAll().forEach(({ name }) => {
      if (name.startsWith('sb-')) redirectResponse.cookies.delete(name)
    })
    return redirectResponse
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete, nda_acknowledged')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  const prefix = role ? ROLE_PREFIXES[role] : null

  if (pathname === '/') {
    return NextResponse.redirect(new URL(prefix ?? '/auth/login', request.url))
  }

  if (prefix && !pathname.startsWith(prefix)) {
    return NextResponse.redirect(new URL(prefix, request.url))
  }

  // Gate clients: must complete onboarding (which now includes subscription activation)
  if (role === 'client' && !profile?.onboarding_complete && !pathname.startsWith('/client/onboarding')) {
    return NextResponse.redirect(new URL('/client/onboarding', request.url))
  }

  // Gate investors: must acknowledge the NDA before entering the data room
  if (role === 'investor' && !profile?.nda_acknowledged && !pathname.startsWith('/investor/acknowledge')) {
    return NextResponse.redirect(new URL('/investor/acknowledge', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
