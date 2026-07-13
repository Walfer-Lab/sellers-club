import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /dashboard routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Gate the rest of /dashboard behind onboarding completion. The
  // handle_new_user() trigger creates a bare `sellers` row (name = null)
  // on signup; onboarding fills in the name, so "name is null" means
  // onboarding hasn't been completed yet.
  if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const onOnboardingPage = request.nextUrl.pathname === '/dashboard/onboarding'

    const { data: seller } = await supabase
      .from('sellers')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()

    const needsOnboarding = !seller?.name

    if (needsOnboarding && !onOnboardingPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/onboarding'
      return NextResponse.redirect(url)
    }

    if (!needsOnboarding && onOnboardingPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}