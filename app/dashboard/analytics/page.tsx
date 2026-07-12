import { createClient } from '@/utils/SupabaseServer'
import { redirect } from 'next/navigation'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

export const revalidate = 0

export default async function AnalyticsPage() {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 1. Fetch Seller Metrics safely
  const { data: metricsData } = await supabase
    .from('seller_metrics')
    .select('*')
    .eq('seller_id', user.id)
    .maybeSingle()

  // 2. Fetch all products belonging to this seller
  const { data: productsData } = await supabase
    .from('products')
    .select('id, title, category, price, views, image_urls, is_live, created_at')
    .eq('seller_id', user.id)

  const products = productsData || []
  const productIds = products.map((p) => p.id)

  // 3. Fetch completed sales for seller's products
  let sales: {
    id: string
    product_id: string
    amount_paid: number
    created_at: string
    status: string
  }[] = []

  if (productIds.length > 0) {
    const { data: salesData } = await supabase
      .from('sales')
      .select('id, product_id, amount_paid, created_at, status')
      .in('product_id', productIds)
      .eq('status', 'completed')
      .order('created_at', { ascending: true })

    if (salesData) {
      sales = salesData
    }
  }

  const metrics = {
    no_of_products_live: Number(metricsData?.no_of_products_live || 0),
    total_product_views: Number(metricsData?.total_product_views || 0),
    total_sales: Number(metricsData?.total_sales || 0),
    total_earning: Number(metricsData?.total_earning || 0),
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-black/90 font-general font-semibold text-2xl">
            Analytics & Reports
          </h1>
          <p className="text-sm font-grotesk font-medium text-zinc-500 pt-0.5">
            Track your sales, revenue, and product performance over time
          </p>
        </div>
      </div>

      <AnalyticsDashboard
        metrics={metrics}
        products={products}
        sales={sales}
      />
    </main>
  )
}