'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/utils/SupabaseClient'
import { useRouter } from 'next/navigation'

// ==========================================
// TYPES
// ==========================================
type AuthView = 'signin' | 'signup' | 'verify'

// ==========================================
// SHARED HELPERS
// ==========================================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string) {
  return EMAIL_REGEX.test(email)
}

function toSafeAuthMessage(rawMessage: string, context: 'signin' | 'signup' | 'verify') {
  const msg = rawMessage.toLowerCase()

  if (context === 'signin') {
    if (msg.includes('invalid login credentials')) return 'Incorrect email or password.'
    if (msg.includes('email not confirmed')) return 'Please verify your email before signing in.'
  }

  if (context === 'signup') {
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return 'If this email can be used, you\u2019ll receive a verification code shortly.'
    }
    if (msg.includes('password')) return 'Password must be at least 8 characters.'
  }

  if (context === 'verify') {
    if (msg.includes('expired')) return 'This code has expired. Request a new one.'
    if (msg.includes('invalid')) return 'That code isn\u2019t right. Check and try again.'
  }

  return 'Something went wrong. Please try again.'
}

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30_000

function useAttemptGuard() {
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil

  const registerFailure = useCallback(() => {
    setAttempts((prev) => {
      const next = prev + 1
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS)
        return 0
      }
      return next
    })
  }, [])

  const registerSuccess = useCallback(() => {
    setAttempts(0)
    setLockedUntil(null)
  }, [])

  return { isLocked, registerFailure, registerSuccess }
}

// ==========================================
// REUSABLE UI PRIMITIVES
// ==========================================
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-general font-medium text-gray-900 mb-1.5">
      {children}
    </label>
  )
}

function TextInput({
  id,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  required = true,
}: {
  id: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  maxLength?: number
  required?: boolean
}) {
  return (
    <input
      id={id}
      name={id}
      type={type}
      required={required}
      autoComplete={autoComplete}
      inputMode={inputMode}
      maxLength={maxLength}
      spellCheck={false}
      autoCapitalize="none"
      placeholder={placeholder}
      className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-general font-medium text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition-all focus:border-blue-500/80 outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function PrimaryButton({
  children,
  disabled,
  type = 'submit',
}: {
  children: React.ReactNode
  disabled?: boolean
  type?: 'submit' | 'button'
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="flex w-full justify-center rounded-lg bg-zinc-900 px-2 sm:px-4 py-3 font-general text-sm font-semibold font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

function ErrorText({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="rounded-md bg-red-50 p-3 mt-4">
      <p role="alert" className="font-general text-sm font-medium text-red-800">
        {message}
      </p>
    </div>
  )
}

function AuthContainer({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="w-full max-w-md px-2 sm:px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="font-cabinet font-medium text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
      <p className="mt-2 font-general font-medium text-base text-gray-500">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  )
}

// ==========================================
// ROOT
// ==========================================
export default function LoginPage() {
  const [view, setView] = useState<AuthView>('signin')
  const [registeredEmail, setRegisteredEmail] = useState('')

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-zinc-950 p-12 text-white">
        <div>
          <div className="flex items-center gap-2 font-cabinet text-4xl font-bold tracking-tight">
            Sellers Club
          </div>
        </div>
        
        <div className="max-w-md">
          <h2 className="font-cabinet text-3xl font-semibold leading-tight">
            Manage your storefront, track analytics, and grow your business.
          </h2>
          <p className="mt-4 font-general text-zinc-400">
            Join thousands of sellers who trust Sellers Club to power their daily operations and scale their sales channels.
          </p>
        </div>

        <div className="font-general text-sm text-zinc-500">
          © {new Date().getFullYear()} Sellers Club Inc. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center p-8 sm:p-12 lg:p-16">
        {/* Mobile Header (Hidden on desktop) */}
        <div className="lg:hidden flex items-center gap-2 font-cabinet text-2xl font-bold text-gray-900 mb-12">
          Sellers Club
        </div>

        {view === 'signin' && <SignInView setView={setView} />}
        {view === 'signup' && (
          <SignUpView setView={setView} setRegisteredEmail={setRegisteredEmail} />
        )}
        {view === 'verify' && <VerifyView email={registeredEmail} setView={setView} />}
      </div>
    </div>
  )
}

// ==========================================
// SIGN IN
// ==========================================
function SignInView({ setView }: { setView: (v: AuthView) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { isLocked, registerFailure, registerSuccess } = useAttemptGuard()

  const canSubmit = !loading && !isLocked && isValidEmail(email) && password.length > 0

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    })

    if (authError) {
      registerFailure()
      setError(toSafeAuthMessage(authError.message, 'signin'))
      setLoading(false)
      return
    }

    registerSuccess()
    router.refresh()
    router.push('/dashboard')
  }

  return (
    <AuthContainer title="Welcome back" subtitle="Sign in to your seller dashboard.">
      <form onSubmit={handleLogin} className="space-y-5" noValidate>
        <div>
          <FieldLabel htmlFor="email">Email address</FieldLabel>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <FieldLabel htmlFor="current-password">Password</FieldLabel>
            <button
              type="button"
              className="font-general text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Forgot password?
            </button>
          </div>
          <TextInput
            id="current-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
          />
        </div>

        <ErrorText
          message={
            isLocked ? 'Too many attempts. Please wait 30 seconds and try again.' : error
          }
        />

        <div className="pt-2">
          <PrimaryButton disabled={!canSubmit}>
            {loading ? 'Signing in…' : 'Sign in'}
          </PrimaryButton>
        </div>
      </form>

      <p className="mt-8 text-center font-general font-medium text-sm text-gray-600">
        New to Sellers Club?{' '}
        <button
          type="button"
          onClick={() => setView('signup')}
          className="font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer"
        >
          Create an account
        </button>
      </p>
    </AuthContainer>
  )
}

// ==========================================
// SIGN UP
// ==========================================
function SignUpView({
  setView,
  setRegisteredEmail,
}: {
  setView: (v: AuthView) => void
  setRegisteredEmail: (email: string) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [website, setWebsite] = useState('')

  const supabase = useMemo(() => createClient(), [])

  const passwordsMatch = password === confirmPassword
  const passwordStrongEnough = password.length >= 8

  const canSubmit =
    !loading &&
    name.trim().length > 1 &&
    isValidEmail(email) &&
    passwordStrongEnough &&
    passwordsMatch

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (website) return

    if (!passwordStrongEnough) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const normalizedEmail = normalizeEmail(email)

    const { error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { 
          full_name: name.trim(),
          account_type: 'seller',
        },
      },
    })

    if (authError) {
      setError(toSafeAuthMessage(authError.message, 'signup'))
      setLoading(false)
      return
    }

    setRegisteredEmail(normalizedEmail)
    setView('verify')
  }

  return (
    <AuthContainer title="Create your account" subtitle="Start selling in minutes.">
      <form onSubmit={handleSignUp} className="space-y-5" noValidate>
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />

        <div>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <TextInput
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Jordan Lee"
            value={name}
            onChange={setName}
          />
        </div>

        <div>
          <FieldLabel htmlFor="signup-email">Work email</FieldLabel>
          <TextInput
            id="signup-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@company.com"
            value={email}
            onChange={setEmail}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="new-password">Password</FieldLabel>
            <TextInput
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="8+ characters"
              value={password}
              onChange={setPassword}
            />
          </div>

          <div>
            <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
            <TextInput
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          </div>
        </div>

        <ErrorText message={error} />

        <div className="pt-2">
          <PrimaryButton disabled={!canSubmit}>
            {loading ? 'Creating account…' : 'Create account'}
          </PrimaryButton>
        </div>

        <p className="text-center font-general font-medium text-sm text-gray-500 mt-4">
          By signing up, you agree to our{' '}
          <a href="/terms" className="font-semibold text-gray-900 hover:underline">Terms</a>{' '}
          and{' '}
          <a href="/privacy" className="font-semibold text-gray-900 hover:underline">Privacy Policy</a>.
        </p>
      </form>

      <p className="mt-8 text-center font-general font-medium text-sm text-gray-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => setView('signin')}
          className="font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Sign in
        </button>
      </p>
    </AuthContainer>
  )
}

// ==========================================
// VERIFY OTP
// ==========================================
function VerifyView({ email, setView }: { email: string; setView: (v: AuthView) => void }) {
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Email missing. Please sign up again.')
      return
    }

    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    })

    if (authError) {
      setError(toSafeAuthMessage(authError.message, 'verify'))
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/dashboard')
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    await supabase.auth.resend({ type: 'signup', email })
    setResendCooldown(30)
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  return (
    <AuthContainer
      title="Check your email"
      subtitle={`We sent a 6-digit verification code to ${email || 'your email'}.`}
    >
      <form onSubmit={handleVerify} className="space-y-5" noValidate>
        <div>
          <FieldLabel htmlFor="otp">Verification code</FieldLabel>
          <input
            id="otp"
            type="text"
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-4 text-center text-3xl font-medium tracking-[0.5em] text-gray-900 shadow-sm transition-all focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        <ErrorText message={error} />

        <div className="pt-2">
          <PrimaryButton disabled={loading || token.length !== 6}>
            {loading ? 'Verifying…' : 'Verify email'}
          </PrimaryButton>
        </div>
      </form>

      <div className="mt-8 flex items-center justify-between font-general text-sm border-t border-gray-100 pt-6">
        <button
          type="button"
          onClick={() => setView('signup')}
          className="font-semibold text-gray-600 hover:text-gray-900"
        >
          ← Back to sign up
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="font-semibold text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
        </button>
      </div>
    </AuthContainer>
  )
}