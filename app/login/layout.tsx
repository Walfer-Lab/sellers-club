import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login | Sellers Club',
  description: 'Sign in to your Sellers Club account to access your dashboard, manage products, and view analytics.',
}

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
