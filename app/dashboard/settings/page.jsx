'use client'

import { useEffect, useState } from 'react'
import {
  UserEdit01Icon,
  Delete01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/SupabaseClient'
import EditInfo from '@/components/Settings/EditInfo'

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 font-general font-medium leading-none mb-1 tracking-wide">{label}</p>
        <p className="text-sm text-violet-500/80 font-grotesk font-semibold truncate">{value || '—'}</p>
      </div>
    </div>
  )
}

function FeeRow({ label, value, note }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm text-gray-700 font-general font-medium">{label}</p>
        {note && <p className="text-xs text-gray-500 font-general font-medium mt-1 leading-relaxed max-w-sm">{note}</p>}
      </div>
      <span className="flex-shrink-0 text-sm font-general font-bold text-violet-600/70 bg-violet-50 px-2.5 py-1 rounded-lg h-fit">
        {value}
      </span>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [showEditInfo, setShowEditInfo] = useState(false)
  const [profile, setProfile] = useState({ name: '', email: '', phone_no: '' })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Close account inline state
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return setLoading(false)
      const { data } = await supabase
        .from('sellers')
        .select('name, email, phone_no')
        .eq('id', user.id)
        .single()
      if (data) setProfile({ name: data.name ?? '', email: data.email ?? user.email ?? '', phone_no: data.phone_no ?? '' })
      setLoading(false)
    })
  }, [showEditInfo]) // re-fetch after modal closes

  const isMatch = confirmText.trim() === 'DELETE'

  const cancelConfirm = () => {
    setConfirming(false)
    setConfirmText('')
    setDeleteError('')
  }

  const handleDelete = async () => {
    if (!isMatch || deleting) return
    setDeleting(true)
    setDeleteError('')
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/seller/close-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Failed to close account')
      }

      await supabase.auth.signOut()
      router.replace('/goodbye')
    } catch (err) {
      setDeleteError(err.message || 'Something went wrong. Try again.')
      setDeleting(false)
    }
  }

  return (
    <main
      className={`max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5 transition-all duration-300 ease-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <p className="text-2xl text-black/80 font-general font-semibold tracking-tight">Settings</p>

      <div className="flex flex-col gap-4">

        {/* ── Basic Information ── */}
        <div className="relative bg-gray-100 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-general font-semibold tracking-wider uppercase">
              Basic Information
            </p>
            <button
              onClick={() => setShowEditInfo(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-violet-600 hover:bg-violet-100 transition-colors cursor-pointer text-xs font-general font-semibold"
              aria-label="Edit basic information"
            >
              <HugeiconsIcon icon={UserEdit01Icon} size={14} strokeWidth={2} />
              Edit
            </button>
          </div>

          {loading ? (
            <div className="space-y-3.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="space-y-1.5">
                    <div className="w-16 h-2.5 rounded bg-gray-200 animate-pulse" />
                    <div className="w-32 h-3.5 rounded bg-gray-200 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3.5">
              <InfoRow label="Email" value={profile.email} />
              <InfoRow label="Name" value={profile.name} />
              <InfoRow label="Mobile No." value={profile.phone_no} />
            </div>
          )}
        </div>

        {/* ── Commission & Fees ── */}
        <div className="bg-gray-100 rounded-2xl p-4 sm:p-5">
          <p className="text-xs text-gray-500 font-general font-semibold tracking-wider uppercase mb-1">
            Commission & Platform Fees
          </p>

          <FeeRow
            label="Sales Commission"
            value="5%"
            note="Charged on every successful sale. Covers seller support, fraud protection, and buyer trust guarantees."
          />
          <FeeRow
            label="Platform Fee"
            value="2%"
            note="Covers payment processing, secure cloud storage, and infrastructure costs to keep your store running."
          />
          <FeeRow
            label="Total per Sale"
            value="7%"
            note="Combined deduction applied automatically at the time of payout."
          />
        </div>

        {/* ── Legal ── */}
        <div className="bg-gray-100 rounded-2xl p-4 sm:p-5 space-y-2">
          <p className="text-xs text-gray-500 font-general font-semibold tracking-wider uppercase">Legal</p>
          <p className="text-sm text-gray-600 font-general font-medium">
            By using Sellers Club, you agree to our{' '}
            <a href="/terms-and-condition" className="text-violet-600/80 hover:underline">
              Terms & Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy-policy" className="text-violet-600/80 hover:underline">
              Privacy Policy
            </a>
            . Commission rates are subject to change with 30-day prior notice via registered email.
          </p>
        </div>

        {/* ── Notifications ── */}
        <div className="bg-gray-100 rounded-2xl p-4 sm:p-5 space-y-2.5">
          <p className="text-xs text-gray-500 font-general font-semibold tracking-wider uppercase">Notifications</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="accent-violet-500 w-4 h-4 cursor-pointer"
              defaultChecked disabled
            />
            <p className="text-sm text-gray-800 font-general font-medium">Promotional &amp; Update Emails</p>
          </label>
        </div>

        {/* ── Danger Zone ── */}
        <div className="border border-red-200 bg-red-50 rounded-2xl p-4 sm:p-5 space-y-2.5">
          <p className="text-xs text-red-500 font-general font-semibold uppercase tracking-wider">Danger Zone</p>
          <p className="text-sm text-gray-700 font-general font-medium">
            Permanently deletes your seller account, all product listings, and associated data. This action is <span className="font-semibold text-red-600">irreversible</span>.
          </p>

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="mt-1 flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-general font-medium rounded-xl hover:bg-red-700 transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={Delete01Icon} size={15} strokeWidth={2} />
              Close Account
            </button>
          ) : (
            <div className="mt-1 pt-3 border-t border-red-200 space-y-2.5 animate-[fadeIn_.15s_ease-out]">
              <p className="text-xs text-gray-600 font-general">
                Type <span className="font-bold text-gray-800">DELETE</span> to confirm
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                disabled={deleting}
                autoFocus
                className="w-full sm:w-64 px-3 py-2 rounded-lg border border-red-200 bg-white text-sm font-general focus:outline-none focus:ring-1 focus:ring-red-400 disabled:opacity-60"
              />

              {deleteError && (
                <p className="text-xs text-red-600 font-general font-medium">{deleteError}</p>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={!isMatch || deleting}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-general font-semibold rounded-xl hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Closing…' : 'Confirm Close'}
                </button>
                <button
                  onClick={cancelConfirm}
                  disabled={deleting}
                  className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-general font-semibold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {showEditInfo && (
        <EditInfo onClose={() => setShowEditInfo(false)} />
      )}
    </main>
  )
}