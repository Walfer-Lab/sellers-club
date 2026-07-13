import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings | Sellers Club',
  description: 'Manage your profile information, store settings, and preferences on Sellers Club.',
}

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
