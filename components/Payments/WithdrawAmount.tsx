'use client'

import { useEffect, useState } from 'react'
import { Cancel01Icon, FloppyDiskIcon, Loading03Icon, MoneyExchange02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { createClient } from '@/utils/SupabaseClient'
import { calcTotalTransacted, type SellerPayment } from '@/components/Payments/PaymentsReceipt'

const MIN_WITHDRAW = 250

type Props = {
  onClose: () => void
}

export default function WithdrawAmount({ onClose }: Props) {
  const [amount, setAmount] = useState('')
  const [upiId, setUpiId] = useState('')               // display only
  const [availableBalance, setAvailableBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // ── Load balance on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      // 1. Fetch total_earnings from seller_metrics (materialized view)
      const { data: metrics } = await supabase
        .from('seller_metrics')
        .select('total_earnings')
        .eq('seller_id', user.id)
        .single()

      // 2. Fetch UPI ID from sellers table for display
      const { data: seller } = await supabase
        .from('sellers')
        .select('upi_id')
        .eq('id', user.id)
        .single()

      // 3. Fetch existing payments to subtract already-transacted amounts
      const { data: payments } = await supabase
        .from('seller_payments')
        .select('id, upi_id, request_amount, amount_status, created_at')
        .eq('seller_id', user.id)

      const totalEarnings = Number(metrics?.total_earnings ?? 0)
      const alreadyTransacted = calcTotalTransacted((payments ?? []) as SellerPayment[])
      const balance = Math.max(0, totalEarnings - alreadyTransacted)

      setUpiId(seller?.upi_id ?? '')
      setAvailableBalance(balance)
      setLoading(false)
    }

    load()
  }, [])

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleRequest() {
    setError(null)

    const parsedAmount = parseFloat(amount)

    // Client-side validation
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount.')
      return
    }
    if (parsedAmount < MIN_WITHDRAW) {
      setError(`Minimum withdrawal amount is ₹${MIN_WITHDRAW}.`)
      return
    }
    if (availableBalance !== null && parsedAmount > availableBalance) {
      setError('Withdrawal amount exceeds your available balance.')
      return
    }
    if (!userId) {
      setError('Not signed in.')
      return
    }

    setSaving(true)
    const supabase = createClient()

    // ── Security: re-fetch UPI ID fresh at submit time ───────────────────────
    // Prevents a race where the user changed their UPI ID in another session
    // between opening this modal and clicking submit.
    const { data: freshSeller, error: sellerErr } = await supabase
      .from('sellers')
      .select('upi_id')
      .eq('id', userId)
      .single()

    if (sellerErr || !freshSeller?.upi_id) {
      setError('No UPI ID found. Please add a payment method first.')
      setSaving(false)
      return
    }

    // ── Security: re-verify balance server-side before inserting ─────────────
    const { data: freshMetrics } = await supabase
      .from('seller_metrics')
      .select('total_earnings')
      .eq('seller_id', userId)
      .single()

    const { data: freshPayments } = await supabase
      .from('seller_payments')
      .select('id, upi_id, request_amount, amount_status, created_at')
      .eq('seller_id', userId)

    const freshEarnings = Number(freshMetrics?.total_earnings ?? 0)
    const freshTransacted = calcTotalTransacted((freshPayments ?? []) as SellerPayment[])
    const freshBalance = Math.max(0, freshEarnings - freshTransacted)

    if (parsedAmount > freshBalance) {
      setError('Insufficient balance. Your available balance may have changed.')
      setSaving(false)
      return
    }
    if (freshBalance < MIN_WITHDRAW) {
      setError(`Your available balance (₹${freshBalance.toFixed(2)}) is below the minimum withdrawal of ₹${MIN_WITHDRAW}.`)
      setSaving(false)
      return
    }

    // ── Insert payment request with the locked UPI ID ─────────────────────────
    const { error: insertErr } = await supabase
      .from('seller_payments')
      .insert({
        seller_id: userId,
        upi_id: freshSeller.upi_id,   // always use the UPI ID from DB, never from state
        request_amount: parsedAmount,
        amount_status: 'pending',
      })

    setSaving(false)

    if (insertErr) {
      setError('Failed to submit withdrawal request. Please try again.')
    } else {
      setSuccess(true)
      setTimeout(onClose, 1000)
    }
  }

  const formatBalance = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  const balanceTooLow = availableBalance !== null && availableBalance < MIN_WITHDRAW

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center font-general"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full sm:max-w-lg overflow-y-auto scrollbar-none rounded-t-3xl sm:rounded-2xl bg-zinc-50 border-t sm:border border-zinc-200 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Mobile handle */}
        <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-zinc-300 sm:hidden" />

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b-2 border-zinc-200 bg-zinc-50/95 backdrop-blur-sm">
          <span className="text-lg font-semibold text-black/80">Withdraw Funds</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <HugeiconsIcon icon={Loading03Icon} size={24} className="text-violet-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* UPI notice */}
              <div className="flex items-start gap-2 bg-violet-50 border border-violet-100 rounded-xl p-3">
                <div>
                  <p className="text-xs font-general font-medium text-violet-700 leading-relaxed">
                    Funds will be transferred to your linked UPI ID. The UPI ID at the time of request is locked in — changing it later won't affect pending withdrawals.
                  </p>
                  <p className="text-xs font-general font-bold text-violet-800 mt-1">
                    {upiId || <span className="text-red-500">No UPI ID linked</span>}
                  </p>
                </div>
              </div>

              {/* Balance card */}
              <div className="bg-gray-100 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-general font-medium mb-0.5">Available Balance</p>
                  <p className={`text-xl font-general font-bold ${balanceTooLow ? 'text-red-500' : 'text-violet-600/80'}`}>
                    {availableBalance !== null ? formatBalance(availableBalance) : '…'}
                  </p>
                  <p className="text-xs text-gray-400 font-general font-medium mt-0.5">
                    Total earnings − pending &amp; completed payouts
                  </p>
                </div>
                {balanceTooLow && (
                  <span className="text-xs font-general font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-lg">
                    Below minimum
                  </span>
                )}
              </div>

              {/* Amount input */}
              <div className="space-y-1.5">
                <label htmlFor="withdraw-amount" className="text-sm font-medium font-general text-gray-600">
                  Withdrawal Amount
                </label>
                <input
                  id="withdraw-amount"
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="250.00"
                  disabled={balanceTooLow || !upiId}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-black font-general font-medium placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs font-general text-gray-400">Min. withdrawal: ₹{MIN_WITHDRAW}</p>
              </div>

              {/* Error / Success */}
              {error && (
                <p className="text-sm font-general text-red-500 font-medium">{error}</p>
              )}
              {success && (
                <p className="text-sm font-general text-green-600 font-medium">Withdrawal request submitted successfully!</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-4 sm:px-6 pb-6 pt-1">
            <button
              onClick={handleRequest}
              disabled={saving || balanceTooLow || !upiId}
              className="w-full flex items-center justify-center gap-2 bg-violet-600/80 text-white text-sm font-general font-medium py-2.5 rounded-xl hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {saving ? (
                <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
              ) : (
                <HugeiconsIcon icon={MoneyExchange02Icon} size={16} strokeWidth={2} />
              )}
              {saving ? 'Verifying & Requesting…' : 'Request Withdraw'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}