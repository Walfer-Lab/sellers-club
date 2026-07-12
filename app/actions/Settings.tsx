'use server'

import { createClient } from '@/utils/SupabaseServer'
import { revalidatePath } from 'next/cache'

export async function updateSellerProfile({
  name,
  phone_no,
}: {
  name: string
  phone_no: string
}) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized. Please log in.')
  }

  const { error } = await supabase
    .from('sellers')
    .update({
      name: name.trim(),
      phone_no: phone_no.trim(),
    })
    .eq('id', user.id)

  if (error) {
    throw new Error(error.message || 'Failed to update profile')
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateSellerPayment({
  upi_id,
}: {
  upi_id: string
}) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized. Please log in.')
  }

  const cleanUpiId = upi_id.trim()
  if (!cleanUpiId) {
    throw new Error('UPI ID cannot be empty')
  }

  const { error } = await supabase
    .from('sellers')
    .update({
      upi_id: cleanUpiId,
    })
    .eq('id', user.id)

  if (error) {
    throw new Error(error.message || 'Failed to update UPI ID')
  }

  // Also update pending payout requests in seller_payments table
  await supabase
    .from('seller_payments')
    .update({ upi_id: cleanUpiId })
    .eq('seller_id', user.id)
    .eq('amount_status', 'pending')

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteSellerAccount() {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized. Please log in.')
  }

  await supabase.from('sellers').delete().eq('id', user.id)
  await supabase.auth.signOut()

  return { success: true }
}
