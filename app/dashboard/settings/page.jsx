import { createClient } from '@/utils/SupabaseServer'
import { redirect } from 'next/navigation'
import SettingsForm from '@/components/SettingsForm'

export const revalidate = 0

export default async function SettingsPage() {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: seller } = await supabase
    .from('sellers')
    .select('id, name, email, phone_no, upi_id')
    .eq('id', user.id)
    .maybeSingle()

  const sellerData = seller || {
    id: user.id,
    email: user.email,
    name: '',
    phone_no: '',
    upi_id: '',
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-general font-bold text-black/90">
          Account & Store Settings
        </h1>
        <p className="text-sm font-grotesk font-medium text-zinc-500 pt-0.5">
          Manage your seller profile, payout UPI ID, taxes, and security preferences
        </p>
      </div>

      <SettingsForm seller={sellerData} email={user.email || ''} />
    </main>
  )
}
