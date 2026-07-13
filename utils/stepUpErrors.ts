// Shared error types for step-up OTP verification.
// This file has NO 'use server' directive so it can be imported
// by both server actions and client components.

/**
 * Thrown by assertFreshOtp() when the session lacks a recent OTP verification.
 * Client components catch this and show the StepUpModal.
 */
export class StepUpRequiredError extends Error {
  readonly code = 'REQUIRES_STEP_UP' as const
  readonly userEmail: string

  constructor(userEmail: string) {
    super('A fresh OTP verification is required for this action.')
    this.name = 'StepUpRequiredError'
    this.userEmail = userEmail
  }
}

/**
 * Type guard — narrows an unknown catch value to StepUpRequiredError.
 * Safe to use in both server and client code.
 */
export function isStepUpRequired(err: unknown): err is StepUpRequiredError {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as any).code === 'REQUIRES_STEP_UP'
  )
}
