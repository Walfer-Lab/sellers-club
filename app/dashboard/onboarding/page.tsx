'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeSellerOnboarding } from '@/app/actions/Onboarding'

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phoneNo, setPhoneNo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = !loading && name.trim().length >= 2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      await completeSellerOnboarding({ name, phone_no: phoneNo })
      router.refresh()
      router.push('/dashboard')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white items-center justify-center p-8">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="mb-8">
          <div className="font-cabinet text-2xl font-bold text-gray-900 mb-6">
            Sellers Club
          </div>
          <h1 className="font-cabinet font-bold text-3xl tracking-tight text-gray-900">
            Set up your seller profile
          </h1>
          <p className="mt-2 font-general font-medium text-base text-gray-500">
            Just a few details before you start selling.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Full name */}
          <div>
            <label
              htmlFor="onboarding-name"
              className="block text-sm font-general font-medium text-gray-900 mb-1.5"
            >
              Full name
            </label>
            <input
              id="onboarding-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Jordan Lee"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-general font-medium text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition-all focus:border-zinc-900 outline-none"
            />
          </div>

          {/* Phone number */}
          <div>
            <label
              htmlFor="onboarding-phone"
              className="block text-sm font-general font-medium text-gray-900 mb-1.5"
            >
              Phone number
            </label>
            <input
              id="onboarding-phone"
              name="phone_no"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              placeholder="+91 98765 43210"
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-general font-medium text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition-all focus:border-zinc-900 outline-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p role="alert" className="font-general text-sm font-medium text-red-800">
                {error}
              </p>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full justify-center rounded-lg bg-violet-500 px-4 py-3 font-general text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-600 disabled:bg-violet-300 disabled:text-white cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Saving…' : 'Continue to dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
