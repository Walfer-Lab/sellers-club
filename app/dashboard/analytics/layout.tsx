import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics | Sellers Club',
  description: 'Analyze your product performance, track sales trends, conversion rates, and traffic metrics over time.',
}

export default function AnalyticsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
