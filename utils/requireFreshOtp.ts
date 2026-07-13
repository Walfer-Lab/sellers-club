import { createClient } from '@/utils/SupabaseServer'
import { StepUpRequiredError } from '@/utils/stepUpErrors'

// ============================================================
// Step-up OTP assertion (server-only helper)
// ============================================================
// Checks whether the current session was established (or
// refreshed) by a recent OTP verification within the last
// FRESHNESS_WINDOW_SECONDS seconds.
//
// Supabase stores Authentication Methods References (AMR)
// in the JWT. After signInWithOtp / verifyOtp the AMR contains
// { method: 'otp', timestamp: <unix_seconds> }.
//
// Throws StepUpRequiredError if:
//  - No authenticated session exists, OR
//  - The most recent OTP in the AMR is older than the window
//
// Usage in a server action:
//   import { assertFreshOtp } from '@/utils/requireFreshOtp'
//   export async function sensitiveAction() {
//     const { user } = await assertFreshOtp()   // throws if stale
//     // ... proceed safely
//   }
// ============================================================

const FRESHNESS_WINDOW_SECONDS = 5 * 60 // 5 minutes

/**
 * Asserts a fresh OTP in the current session's AMR claim.
 * Must only be called from server-side code (Server Actions, Route Handlers).
 */
export async function assertFreshOtp(): Promise<{
  user: NonNullable<Awaited<ReturnType<ReturnType<typeof createClient>['auth']['getUser']>>['data']['user']>
}> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new StepUpRequiredError('')
  }

  // Read the full session to access AMR claim
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // AMR is inside session.user in Supabase's JWT structure
  const amr: Array<{ method: string; timestamp: number }> =
    (session as any)?.user?.amr ?? []

  const now = Math.floor(Date.now() / 1000)
  const freshOtp = amr.find(
    (entry) =>
      entry.method === 'otp' &&
      now - entry.timestamp <= FRESHNESS_WINDOW_SECONDS
  )

  if (!freshOtp) {
    throw new StepUpRequiredError(user.email ?? '')
  }

  return { user }
}
