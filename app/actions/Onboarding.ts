'use server'

import { createClient } from '@/utils/SupabaseServer'
import { revalidatePath } from 'next/cache'

export async function completeSellerOnboarding({
  name,
  phone_no,
}: {
  name: string
  phone_no?: string
}) {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized. Please sign in first.')
  }

  const trimmedName = name.trim()
  if (!trimmedName || trimmedName.length < 2) {
    throw new Error('Full name must be at least 2 characters.')
  }

  // 1. Upsert profile (may already exist from trigger)
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        phone: user.phone ?? null,
      },
      { onConflict: 'id' }
    )

  if (profileErr) {
    throw new Error(profileErr.message || 'Failed to create profile.')
  }

  // 2. Upsert sellers row
  const { error: sellerErr } = await supabase
    .from('sellers')
    .upsert(
      {
        id: user.id,
        email: user.email ?? '',
        name: trimmedName,
        phone_no: (phone_no ?? '').trim(),
      },
      { onConflict: 'id' }
    )

  if (sellerErr) {
    throw new Error(sellerErr.message || 'Failed to save seller profile.')
  }

  // 3. Insert seller role (idempotent)
  const { error: roleErr } = await supabase
    .from('user_roles')
    .upsert({ user_id: user.id, role: 'seller' }, { onConflict: 'user_id,role' })

  if (roleErr) {
    throw new Error('Failed to assign seller role.')
  }

  revalidatePath('/dashboard')
  return { success: true }
}
