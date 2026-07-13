'use client'

import { useCallback } from 'react'
import OtpFlow from '@/components/CommonUI/OtpFlow'

type StepUpModalProps = {
  userEmail: string
  /** Called after successful OTP verification — should re-run the sensitive action */
  onVerified: () => void | Promise<void>
  onClose: () => void
}

export default function StepUpModal({ userEmail, onVerified, onClose }: StepUpModalProps) {
  const handleSuccess = useCallback(async () => {
    await onVerified()
  }, [onVerified])

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Verify your identity"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-cabinet font-bold text-xl text-gray-900">
              Verify your identity
            </h2>
            <p className="mt-1 font-general text-sm text-gray-500">
              For your security, confirm with a verification code before making this change.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close verification dialog"
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-6" />

        {/* OTP flow — email locked to current user */}
        <OtpFlow
          otpType="reauthentication"
          accountType="seller"
          prefillEmail={userEmail}
          emailLocked={true}
          onSuccess={handleSuccess}
          labels={{
            otpStep: `Code sent to ${userEmail}`,
            verifyButton: 'Confirm & save',
          }}
        />
      </div>
    </div>
  )
}
