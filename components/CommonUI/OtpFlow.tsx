'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { createClient } from '@/utils/SupabaseClient'

// ============================================================
// Config
// ============================================================
const RESEND_COOLDOWN_SEC = 60
const MAX_VERIFY_ATTEMPTS = 5
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ============================================================
// Error mappers
// ============================================================
function mapSendError(error: { status?: number; message?: string }): string {
  const s = error?.status
  if (s === 429) return 'Too many requests. Please wait a minute and try again.'
  if (s === 422 || s === 400) return 'That email address looks invalid. Please double-check it.'
  if (s != null && s >= 500) return 'Our messaging service is having issues. Please try again shortly.'
  return "Couldn't send the verification code. Please try again in a moment."
}

function mapVerifyError(error: { status?: number; message?: string }): string {
  const s = error?.status
  if (s === 429) return 'Too many attempts. Please wait a moment and try again.'
  if (s === 403 || s === 401) return 'That code is incorrect or has expired. Please try again.'
  return 'Invalid code. Please check and try again.'
}

// ============================================================
// Props
// ============================================================
export type OtpFlowProps = {
  /** Supabase OTP type used when sending — 'email' for signInWithOtp */
  otpType?: 'email' | 'reauthentication'
  /** user_metadata.account_type to set on signInWithOtp */
  accountType?: 'seller' | 'buyer'
  /** Called after successful OTP verification. Receives the Supabase session user. */
  onSuccess: () => void
  /** Optional: pre-fill the email field (e.g. for step-up re-auth) */
  prefillEmail?: string
  /** If true, hides the email input and goes straight to OTP entry */
  emailLocked?: boolean
  /** Custom labels */
  labels?: {
    emailStep?: string
    otpStep?: string
    sendButton?: string
    verifyButton?: string
  }
}

// ============================================================
// Component
// ============================================================
export default function OtpFlow({
  otpType = 'email',
  accountType = 'seller',
  onSuccess,
  prefillEmail = '',
  emailLocked = false,
  labels = {},
}: OtpFlowProps) {
  const supabase = useMemo(() => createClient(), [])

  const [step, setStep] = useState<'email' | 'otp'>(emailLocked ? 'otp' : 'email')
  const [email, setEmail] = useState(prefillEmail)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [verifyAttempts, setVerifyAttempts] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
      return
    }
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1))
    }, 1000)
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [cooldown])

  // Auto-send OTP if email is pre-filled and locked
  useEffect(() => {
    if (emailLocked && prefillEmail && EMAIL_REGEX.test(prefillEmail)) {
      handleSendOtp(prefillEmail)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSendOtp = useCallback(async (targetEmail?: string) => {
    const addr = (targetEmail ?? email).trim()
    setErrorMsg('')

    if (!EMAIL_REGEX.test(addr)) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    if (cooldown > 0 || loading) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: addr,
        options: {
          shouldCreateUser: true,
          data: { account_type: accountType },
        },
      })
      if (error) {
        setErrorMsg(mapSendError(error))
        return
      }
      setOtp(['', '', '', '', '', ''])
      setVerifyAttempts(0)
      setStep('otp')
      setCooldown(RESEND_COOLDOWN_SEC)
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [email, cooldown, loading, supabase, accountType])

  const handleVerifyOtp = useCallback(async () => {
    const code = otp.join('')
    setErrorMsg('')

    if (code.length < 6) {
      setErrorMsg('Please enter the complete 6-digit code.')
      return
    }
    if (verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
      setErrorMsg('Too many incorrect attempts. Please request a new code.')
      return
    }

    const addr = (prefillEmail || email).trim()
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: addr,
        token: code,
        type: otpType,
      })
      if (error) {
        setVerifyAttempts((a) => a + 1)
        setErrorMsg(mapVerifyError(error))
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        return
      }
      onSuccess()
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [otp, verifyAttempts, email, prefillEmail, supabase, otpType, onSuccess])

  // OTP input handlers
  const handleOtpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/\D/g, '')
    if (!value) {
      const next = [...otp]; next[index] = ''; setOtp(next); return
    }
    if (value.length > 1) {
      const digits = value.slice(0, 6).split('')
      const next = ['', '', '', '', '', '']
      digits.forEach((d, i) => { next[i] = d })
      setOtp(next)
      const last = Math.min(digits.length, 6) - 1
      inputRefs.current[last]?.focus()
      return
    }
    const next = [...otp]; next[index] = value; setOtp(next)
    if (index < 5) inputRefs.current[index + 1]?.focus()
  }, [otp])

  const handleOtpKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter') handleVerifyOtp()
  }, [otp, handleVerifyOtp])

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    e.preventDefault()
    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((d, i) => { next[i] = d })
    setOtp(next)
    const last = Math.min(pasted.length, 6) - 1
    inputRefs.current[last]?.focus()
  }, [])

  const isOtpComplete = otp.join('').length === 6

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div>
        <p className="font-cabinet font-medium text-3xl font-bold tracking-tight text-gray-900">
          {step === 'email'
            ? (labels.emailStep ?? 'Sign in to Sellers Club')
            : (labels.otpStep ?? 'Check your email')}
        </p>
        {step === 'otp' && (
          <p className="mt-2 font-general font-medium text-base text-gray-500">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-gray-900">{prefillEmail || email}</span>.
          </p>
        )}
        {step === 'email' && (
          <p className="mt-2 font-general font-medium text-base text-gray-500">
            Enter your email and we&apos;ll send you a verification code. No password needed.
          </p>
        )}
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="rounded-md bg-red-50 p-3">
          <p role="alert" className="font-general text-sm font-medium text-red-800">
            {errorMsg}
          </p>
        </div>
      )}

      {/* Email step */}
      {step === 'email' && !emailLocked && (
        <div className="space-y-5">
          <div>
            <label
              htmlFor="otp-email"
              className="block text-sm font-general font-medium text-gray-900 mb-1.5"
            >
              Email address
            </label>
            <input
              id="otp-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendOtp() }}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-general font-medium text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition-all focus:border-zinc-900 outline-none"
            />
          </div>
          <div className="pt-2">
            <button
              type="button"
              disabled={loading || !EMAIL_REGEX.test(email.trim())}
              onClick={() => handleSendOtp()}
              className="flex w-full justify-center rounded-lg bg-zinc-900 px-4 py-3 font-general text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending code…' : (labels.sendButton ?? 'Send verification code')}
            </button>
          </div>
        </div>
      )}

      {/* OTP step */}
      {step === 'otp' && (
        <div className="space-y-5">
          {/* 6-box digit inputs */}
          <div>
            <label className="block text-sm font-general font-medium text-gray-900 mb-3">
              Verification code
            </label>
            <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  id={`otp-digit-${index}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  maxLength={6}
                  className="w-full h-14 text-center text-2xl font-semibold font-general text-gray-900 bg-white border border-gray-300 rounded-lg focus:border-zinc-900 outline-none transition-all"
                />
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={loading || !isOtpComplete || verifyAttempts >= MAX_VERIFY_ATTEMPTS}
              onClick={handleVerifyOtp}
              className="flex w-full justify-center rounded-lg bg-zinc-900 px-4 py-3 font-general text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying…' : (labels.verifyButton ?? 'Verify & sign in')}
            </button>
          </div>

          <div className="flex items-center justify-between font-general text-sm border-t border-gray-100 pt-4">
            {!emailLocked && (
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setErrorMsg('')
                  setOtp(['', '', '', '', '', ''])
                  setCooldown(0)
                  setVerifyAttempts(0)
                }}
                className="font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Change email
              </button>
            )}
            <button
              type="button"
              disabled={cooldown > 0 || loading}
              onClick={() => handleSendOtp()}
              className="font-semibold text-gray-900 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed ml-auto"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
