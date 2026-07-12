'use server'

import { createClient } from '@/utils/SupabaseServer'
import { revalidatePath } from 'next/cache'

export async function requestSellerWithdrawal({
  request_amount,
  upi_id,
}: {
  request_amount: number
  upi_id?: string
}) {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized. Please log in.')
  }

  // 1. Fetch current seller record to check existing upi_id
  const { data: existingSeller } = await supabase
    .from('sellers')
    .select('upi_id')
    .eq('id', user.id)
    .maybeSingle()

  const targetUpiId = (upi_id || existingSeller?.upi_id || '').trim()

  if (!targetUpiId) {
    throw new Error('Please save your UPI ID payment method before requesting a withdrawal.')
  }

  // Pure UPDATE query — never attempts an INSERT on sellers
  const { error: updErr } = await supabase
    .from('sellers')
    .update({ upi_id: targetUpiId })
    .eq('id', user.id)

  if (updErr) {
    throw new Error(updErr.message || 'Failed to update UPI ID')
  }

  // 2. Validate minimum withdrawal amount >= 250
  if (request_amount < 250) {
    throw new Error('Minimum withdrawal amount is ₹250.')
  }

  // 3. Fetch seller metrics for total_earning
  const { data: metrics } = await supabase
    .from('seller_metrics')
    .select('total_earning')
    .eq('seller_id', user.id)
    .maybeSingle()

  const totalEarnings = Number(metrics?.total_earning || 0)

  // 4. Fetch all seller_payments to compute withdrawn & pending
  const { data: payments } = await supabase
    .from('seller_payments')
    .select('request_amount, amount_status')
    .eq('seller_id', user.id)

  let withdrawn = 0
  let pending = 0

  if (payments) {
    for (const p of payments) {
      const amt = Number(p.request_amount || 0)
      if (p.amount_status === 'completed') {
        withdrawn += amt
      } else if (p.amount_status === 'pending' || p.amount_status === 'processing') {
        pending += amt
      }
    }
  }

  const availableBalance = totalEarnings - withdrawn - pending

  if (request_amount > availableBalance + 0.01) {
    throw new Error(
      `Requested amount (₹${request_amount}) exceeds your available balance (₹${availableBalance.toFixed(2)}).`
    )
  }

  // 5. Insert withdrawal request into seller_payments table
  const { error: insertError } = await supabase.from('seller_payments').insert({
    seller_id: user.id,
    upi_id: targetUpiId,
    request_amount: Number(request_amount.toFixed(2)),
    amount_status: 'pending',
  })

  if (insertError) {
    throw new Error(insertError.message || 'Failed to submit withdrawal request.')
  }

  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}
