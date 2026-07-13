'use client'

import { useEffect, useState } from 'react'
import { Cancel01Icon, FloppyDiskIcon, Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { createClient } from '@/utils/SupabaseClient'

type EditInfoProps = {
  onClose: () => void
}

export default function EditInfo({ onClose }: EditInfoProps) {
  const [name, setName] = useState('')
  const [phoneNo, setPhoneNo] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load current values
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('sellers')
        .select('name, phone_no')
        .eq('id', user.id)
        .single()
      if (data) {
        setName(data.name ?? '')
        setPhoneNo(data.phone_no ?? '')
      }
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setError(null)
    setSuccess(false)

    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length < 2) {
      setError('Name must be at least 2 characters.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in.'); setSaving(false); return }

    const { error: err } = await supabase
      .from('sellers')
      .update({ name: trimmedName, phone_no: phoneNo.trim() })
      .eq('id', user.id)

    setSaving(false)
    if (err) {
      setError('Failed to save.')
    } else {
      setSuccess(true)
      setTimeout(onClose, 800)
    }
  }

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
          <span className="text-lg font-semibold text-black/80">Edit Information</span>
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
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium font-grotesk text-gray-600">
                  Display Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-black font-general font-medium placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="edit-phone" className="text-sm font-grotesk font-medium text-gray-600">
                  Mobile No.
                </label>
                <input
                  id="edit-phone"
                  type="tel"
                  value={phoneNo}
                  onChange={e => setPhoneNo(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-black font-general font-medium placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
                />
              </div>

              {/* Error / Success */}
              {error && (
                <p className="text-sm font-general text-red-500 font-medium">{error}</p>
              )}
              {success && (
                <p className="text-sm font-general text-green-600 font-medium">Saved successfully!</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-4 sm:px-6 pb-6 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-violet-600/80 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-violet-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {saving ? (
                <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
              ) : (
                <HugeiconsIcon icon={FloppyDiskIcon} size={16} strokeWidth={2} />
              )}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}