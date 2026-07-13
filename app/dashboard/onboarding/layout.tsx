import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Seller Onboarding | Sellers Club',
  description: 'Complete your seller profile and onboarding to start listing and selling products on Sellers Club.',
}

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
