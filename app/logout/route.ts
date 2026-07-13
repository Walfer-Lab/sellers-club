import { createClient } from '@/utils/SupabaseServer'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * GET /logout
 * Signs the user out of Supabase, clears auth cookies, and
 * redirects to /login. Linked from the Navbar.
 */
export async function GET(request: NextRequest) {
  const supabase = createClient()
  await supabase.auth.signOut()

  const origin = request.nextUrl.origin
  return NextResponse.redirect(new URL('/login', origin))
}
