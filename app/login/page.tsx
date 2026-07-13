'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/SupabaseClient'
import { useRouter } from 'next/navigation'
import OtpFlow from '@/components/CommonUI/OtpFlow'

export default function LoginPage() {
  const router = useRouter()

  function handleSuccess() {
    router.refresh()
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel — Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-zinc-950 p-12 text-white">
        <div className="font-cabinet text-4xl font-bold tracking-tight">
          Sellers Club
        </div>

        <div className="max-w-md">
          <h2 className="font-cabinet text-3xl font-semibold leading-tight">
            Manage your storefront, track analytics, and grow your business.
          </h2>
          <p className="mt-4 font-general text-zinc-400">
            Join thousands of sellers who trust Sellers Club to power their daily operations and
            scale their sales channels.
          </p>
        </div>

        <div className="font-general text-sm text-zinc-500">
          © {new Date().getFullYear()} Sellers Club Inc. All rights reserved.
        </div>
      </div>

      {/* Right Panel — OTP form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center p-8 sm:p-12 lg:p-16">
        {/* Mobile header */}
        <div className="lg:hidden font-cabinet text-2xl font-bold text-gray-900 mb-12 self-start">
          Sellers Club
        </div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <OtpFlow
            accountType="seller"
            onSuccess={handleSuccess}
            labels={{
              emailStep: 'Welcome back',
              otpStep: 'Check your email',
              sendButton: 'Send verification code',
              verifyButton: 'Sign in',
            }}
          />

          <p className="mt-8 text-center font-general font-medium text-sm text-gray-500 border-t border-gray-100 pt-6">
            By signing in, you agree to our{' '}
            <a href="/terms" className="font-semibold text-gray-900 hover:underline">
              Terms
            </a>{' '}
            and{' '}
            <a href="/privacy" className="font-semibold text-gray-900 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}