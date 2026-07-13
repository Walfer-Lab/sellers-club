import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Payments & Payouts | Sellers Club',
  description: 'Manage your payment methods, track earnings, and request payouts on Sellers Club.',
}

export default function PaymentsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
