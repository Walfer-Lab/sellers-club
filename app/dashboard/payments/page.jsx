import { createClient } from '@/utils/SupabaseServer'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PaymentsDashboard from '@/components/PaymentsDashboard'

export const revalidate = 0

export default async function PaymentsPage() {
  const supabase = createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch total_earning from seller_metrics
  const { data: metrics } = await supabase
    .from('seller_metrics')
    .select('total_earning')
    .eq('seller_id', user.id)
    .maybeSingle()

  const totalEarnings = Number(metrics?.total_earning || 0)

  // 3. Fetch seller profile upi_id
  const { data: seller } = await supabase
    .from('sellers')
    .select('id, upi_id')
    .eq('id', user.id)
    .maybeSingle()

  const sellerUpiId = seller?.upi_id || ''

  // 4. Fetch seller_payments transactions table
  const { data: paymentsData } = await supabase
    .from('seller_payments')
    .select('id, seller_id, upi_id, request_amount, amount_status, created_at')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const transactions = paymentsData || []

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-general font-bold text-black/90">
            Payments
          </h1>
          <p className="text-sm font-grotesk font-medium text-zinc-500 pt-0.5">
            Manage your store earnings, request withdrawals, and update your UPI payment method
          </p>
        </div>

        <Link
          href="/dashboard/settings"
          className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 text-xs font-general font-semibold hover:bg-zinc-100 transition-colors"
        >
          Account Settings &rarr;
        </Link>
      </div>

      <PaymentsDashboard
        totalEarnings={totalEarnings}
        sellerUpiId={sellerUpiId}
        transactions={transactions}
      />
    </main>
  )
}
