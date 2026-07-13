import type { Metadata } from 'next'
import { createClient } from '@/utils/SupabaseServer'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Home | Sellers Club',
  description: 'Welcome to Sellers Club. Manage your digital products, track sales, and grow your revenue.',
}

export default async function Home() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
