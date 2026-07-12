'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Wallet01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  Loading03Icon,
  Clock01Icon,
  ArrowUpRight01Icon,
  BankIcon,
} from '@hugeicons/core-free-icons'
import { updateSellerPayment } from '@/app/actions/Settings'
import { requestSellerWithdrawal } from '@/app/actions/Payments'

export type SellerPaymentRow = {
  id: string
  seller_id: string
  upi_id: string
  request_amount: number
  amount_status: string
  created_at: string
}

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

export default function PaymentsDashboard({
  totalEarnings,
  sellerUpiId,
  transactions,
}: {
  totalEarnings: number
  sellerUpiId: string
  transactions: SellerPaymentRow[]
}) {
  const router = useRouter()

  // Money Analytics calculation
  const stats = useMemo(() => {
    let withdrawn = 0
    let pending = 0

    for (const t of transactions) {
      const amt = Number(t.request_amount || 0)
      if (t.amount_status === 'completed') {
        withdrawn += amt
      } else if (
        t.amount_status === 'pending' ||
        t.amount_status === 'processing'
      ) {
        pending += amt
      }
    }

    const available = Math.max(0, totalEarnings - withdrawn - pending)
    return {
      totalEarnings,
      withdrawn,
      pending,
      available,
    }
  }, [totalEarnings, transactions])

  // Payment Method Form State
  const [upiId, setUpiId] = useState(sellerUpiId || '')
  const [savingUpi, setSavingUpi] = useState(false)
  const [upiMessage, setUpiMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawMessage, setWithdrawMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleSaveUpi = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingUpi(true)
    setUpiMessage(null)

    try {
      await updateSellerPayment({ upi_id: upiId })
      setUpiMessage({
        type: 'success',
        text: 'UPI ID payment method updated successfully.',
      })
      router.refresh()
    } catch (err) {
      setUpiMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update UPI ID',
      })
    } finally {
      setSavingUpi(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawMessage(null)

    const numericAmount = Number(withdrawAmount)

    if (isNaN(numericAmount) || numericAmount < 250) {
      setWithdrawMessage({
        type: 'error',
        text: 'Withdrawn money should be more than ₹250.',
      })
      return
    }

    if (numericAmount > stats.available + 0.01) {
      setWithdrawMessage({
        type: 'error',
        text: `Requested amount exceeds your available balance of ${formatINR(
          stats.available
        )}.`,
      })
      return
    }

    if (!upiId || upiId.trim() === '') {
      setWithdrawMessage({
        type: 'error',
        text: 'Please save a UPI ID payment method before requesting a withdrawal.',
      })
      return
    }

    setWithdrawing(true)

    try {
      await requestSellerWithdrawal({ request_amount: numericAmount, upi_id: upiId })
      setWithdrawMessage({
        type: 'success',
        text: `Withdrawal request of ${formatINR(
          numericAmount
        )} submitted successfully. Status: pending.`,
      })
      setWithdrawAmount('')
      router.refresh()
    } catch (err) {
      setWithdrawMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Could not submit withdrawal request.',
      })
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ==========================================
          1. MONEY ANALYTICS (TOP OF PAGE)
      ========================================== */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-100 rounded-xl p-5 border border-zinc-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-grotesk font-semibold  tracking-wider">
              Total Earnings
            </span>
            <HugeiconsIcon icon={Wallet01Icon} size={18} />
          </div>
          <p className="text-2xl font-bold font-general text-zinc-900">
            {formatINR(stats.totalEarnings)}
          </p>
          <span className="text-[11px] font-medium text-zinc-400 mt-1">
            Lifetime storefront revenue
          </span>
        </div>

        <div className="bg-zinc-100 rounded-xl p-5 border border-zinc-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-grotesk font-semibold  tracking-wider">
              Withdrawn
            </span>
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} />
          </div>
          <p className="text-2xl font-bold font-general text-blue-600">
            {formatINR(stats.withdrawn)}
          </p>
          <span className="text-[11px] font-medium text-zinc-400 mt-1">
            Completed payouts to UPI
          </span>
        </div>

        <div className="bg-zinc-100 rounded-xl p-5 border border-zinc-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-grotesk font-semibold  tracking-wider">
              Pending Payouts
            </span>
            <HugeiconsIcon icon={Clock01Icon} size={18} />
          </div>
          <p className="text-2xl font-bold font-general text-amber-600">
            {formatINR(stats.pending)}
          </p>
          <span className="text-[11px] font-medium text-zinc-400 mt-1">
            Processing requests
          </span>
        </div>

        <div className="bg-emerald-50/70 rounded-xl p-5 border-2 border-emerald-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-grotesk font-bold  tracking-wider">
              Available Balance
            </span>
            <HugeiconsIcon icon={BankIcon} size={18} />
          </div>
          <p className="text-2xl font-bold font-general text-emerald-700">
            {formatINR(stats.available)}
          </p>
          <span className="text-[11px] font-semibold text-emerald-600/80 mt-1">
            Ready to withdraw (min ₹250)
          </span>
        </div>
      </section>

      {/* ==========================================
          2. WITHDRAW MONEY & PAYMENT METHOD GRID
      ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WITHDRAW MONEY OPTION */}
        <section className="bg-zinc-100 rounded-2xl border border-zinc-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-zinc-200">
              <div>
                <h2 className="text-base font-general font-bold text-zinc-900">
                  Withdraw Money
                </h2>
                <p className="text-xs font-grotesk text-zinc-500">
                  Request a payout to your saved UPI ID
                </p>
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="flex items-center justify-between bg-white rounded-xl p-3.5 border border-zinc-200">
                <div>
                  <p className="text-xs font-grotesk text-zinc-500">
                    Available to withdraw
                  </p>
                  <p className="text-lg font-general font-bold text-zinc-900">
                    {formatINR(stats.available)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-grotesk text-zinc-500">
                    Destination UPI
                  </p>
                  <p className="text-xs font-general font-semibold text-blue-600 truncate max-w-[150px]">
                    {upiId || 'Not set'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-grotesk font-semibold text-zinc-600 mb-1.5">
                  Amount to Withdraw (Minimum ₹250)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 font-general font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="250"
                    max={stats.available}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="250"
                    disabled={withdrawing}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border-2 border-zinc-200 bg-white text-sm font-general font-semibold text-zinc-900 outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {[250, 500, 1000, 2500].map((quickVal) => (
                  <button
                    key={quickVal}
                    type="button"
                    onClick={() =>
                      setWithdrawAmount(
                        Math.min(quickVal, stats.available).toString()
                      )
                    }
                    className="px-3 py-1 rounded-md border border-zinc-200 bg-white text-xs font-general font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                  >
                    ₹{quickVal}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(stats.available.toString())}
                  className="px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-general font-bold hover:bg-emerald-200 cursor-pointer"
                >
                  Max Balance
                </button>
              </div>

              {withdrawMessage && (
                <div
                  className={`p-3 rounded-lg text-xs font-general font-medium flex items-center gap-2 ${
                    withdrawMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}
                >
                  <HugeiconsIcon
                    icon={
                      withdrawMessage.type === 'success'
                        ? CheckmarkCircle02Icon
                        : Alert02Icon
                    }
                    size={16}
                  />
                  {withdrawMessage.text}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={
                    withdrawing ||
                    stats.available < 250 ||
                    !withdrawAmount ||
                    Number(withdrawAmount) < 250
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-600 text-white font-general font-semibold text-xs hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  {withdrawing && (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      size={14}
                      className="animate-spin"
                    />
                  )}
                  Request Withdrawal
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* PAYMENT METHOD UPDATE OPTION */}
        <section className="bg-zinc-100 rounded-2xl border border-zinc-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-zinc-200">
              <div>
                <h2 className="text-base font-general font-bold text-zinc-900">
                  Update Payment Method
                </h2>
                <p className="text-xs font-grotesk text-zinc-500">
                  Manage your UPI ID where funds are credited
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveUpi} className="space-y-4">
              <div>
                <label className="block text-xs font-grotesk font-semibold text-zinc-600 mb-1.5">
                  UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@okaxis or merchant@upi"
                  disabled={savingUpi}
                  className="w-full px-3.5 py-2.5 rounded-lg border-2 border-zinc-200 bg-white text-sm font-general font-medium text-zinc-900 outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Ensure your UPI address is active. Payout requests will be processed to this VPA.
                </p>
              </div>

              {upiMessage && (
                <div
                  className={`p-3 rounded-lg text-xs font-general font-medium flex items-center gap-2 ${
                    upiMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}
                >
                  <HugeiconsIcon
                    icon={
                      upiMessage.type === 'success'
                        ? CheckmarkCircle02Icon
                        : Alert02Icon
                    }
                    size={16}
                  />
                  {upiMessage.text}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingUpi}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 text-white font-general font-medium text-xs hover:bg-zinc-800 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {savingUpi && (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      size={14}
                      className="animate-spin"
                    />
                  )}
                  Save Payment Method
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {/* ==========================================
          3. PAYOUT TRANSACTIONS TABLE (seller_payments)
      ========================================== */}
      <section className="bg-zinc-100/90 rounded-2xl border border-zinc-200/80 overflow-hidden shadow-sm">
        <div className="p-5 sm:p-6 border-b border-zinc-200/80">
          <h2 className="text-base font-general font-semibold text-zinc-900">
            Payout Transactions
          </h2>
          <p className="text-xs font-grotesk text-zinc-500 mt-0.5">
            History of your withdrawal requests from the seller_payments table
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="p-10 text-center text-zinc-500">
            <HugeiconsIcon
              icon={Wallet01Icon}
              size={36}
              className="mx-auto mb-2 text-zinc-400"
            />
            <p className="text-sm font-general font-semibold text-zinc-700">
              No transactions recorded
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              When you submit a withdrawal request, it will appear here with its pending/completed status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-200/40 text-[11px] font-grotesk uppercase text-zinc-500 font-semibold">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">UPI ID</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 text-xs font-general">
                {transactions.map((tx) => {
                  const dateStr = tx.created_at
                    ? new Date(tx.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-'

                  const statusColor =
                    tx.amount_status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : tx.amount_status === 'processing'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : tx.amount_status === 'pending'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-red-100 text-red-800 border-red-200'

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-zinc-200/50 transition-colors"
                    >
                      <td className="py-3.5 px-6 font-medium text-zinc-600">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-zinc-900">
                        {tx.upi_id}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-zinc-900">
                        {formatINR(Number(tx.request_amount || 0))}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${statusColor}`}
                        >
                          {tx.amount_status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
