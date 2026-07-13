'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/SupabaseClient'

// ─── Types ───────────────────────────────────────────────────────────────────

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export type SellerPayment = {
  id: string
  upi_id: string
  request_amount: number
  amount_status: PaymentStatus
  created_at: string
}

// ─── Exported utility: total of completed + pending ──────────────────────────

export function calcTotalTransacted(payments: SellerPayment[]): number {
  return payments
    .filter(p => p.amount_status === 'completed' || p.amount_status === 'pending')
    .reduce((sum, p) => sum + Number(p.request_amount), 0)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MIN_ROWS = 10

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatAmount(n: number) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

const STATUS_STYLES: Record<PaymentStatus, string> = {
  completed:  'bg-green-100 text-green-700',
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  failed:     'bg-red-100 text-red-600',
  cancelled:  'bg-gray-200 text-gray-500',
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-general font-semibold capitalize ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {[40, 64, 32, 48].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`h-3 w-${w} rounded bg-gray-200 animate-pulse`} />
        </td>
      ))}
    </tr>
  )
}

// ─── Empty row (fills table to MIN_ROWS) ─────────────────────────────────────

function EmptyRow() {
  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-3 text-xs text-gray-300 font-general">—</td>
      <td className="px-4 py-3" />
      <td className="px-4 py-3" />
      <td className="px-4 py-3" />
    </tr>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PaymentsReceipt() {
  const [payments, setPayments] = useState<SellerPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }

      const { data, error: err } = await supabase
        .from('seller_payments')
        .select('id, upi_id, request_amount, amount_status, created_at')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (err) setError('Failed to load payment receipts.')
      else setPayments((data as SellerPayment[]) ?? [])
      setLoading(false)
    })
  }, [])

  const total = calcTotalTransacted(payments)
  const padRows = Math.max(0, MIN_ROWS - payments.length)

  return (
    <div className="bg-gray-100 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <p className="text-sm text-gray-600 font-general font-medium">Payment Receipts</p>
        {!loading && !error && (
          <p className="text-xs text-gray-500 font-general font-medium">
            Total transacted:{' '}
            <span className="text-violet-700 font-semibold">{formatAmount(total)}</span>
          </p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['Date', 'UPI ID', 'Amount', 'Status'].map(h => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-xs font-general font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: MIN_ROWS }).map((_, i) => <SkeletonRow key={i} />)
            ) : error ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-red-500 font-general font-medium">
                  {error}
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <>
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400 font-general font-medium">
                    No payment receipts yet.
                  </td>
                </tr>
                {Array.from({ length: MIN_ROWS - 1 }).map((_, i) => <EmptyRow key={i} />)}
              </>
            ) : (
              <>
                {payments.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-t border-gray-100 ${i % 2 === 0 ? '' : 'bg-white/40'}`}
                  >
                    <td className="px-4 py-3 text-xs text-gray-500 font-general font-medium whitespace-nowrap">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 font-general font-medium max-w-[140px] truncate">
                      {p.upi_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-general font-semibold whitespace-nowrap">
                      {formatAmount(p.request_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.amount_status} />
                    </td>
                  </tr>
                ))}
                {Array.from({ length: padRows }).map((_, i) => <EmptyRow key={i} />)}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
