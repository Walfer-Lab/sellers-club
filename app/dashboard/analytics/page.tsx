import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Last30DaysCard, TotalViewsCard, TotalProductsCard, TotalSalesCard } from '@/components/Analytics/AnalyticsStats'
import AnalyticsChartWrapper from '@/components/Analytics/AnalyticsChartWrapper'
import { createClient } from '@/utils/SupabaseServer'

export const metadata: Metadata = {
  title: 'Analytics | Sellers Club',
  description: 'Analyze your product performance, track sales trends, conversion rates, and traffic metrics over time.',
}

// Always fetch fresh stats
export const dynamic = 'force-dynamic'

// ─── Chart skeleton (server-renderable) ──────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="bg-gray-100 rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="flex gap-2">
          <div className="h-7 w-14 bg-gray-200 rounded-lg" />
          <div className="h-7 w-14 bg-gray-200 rounded-lg" />
          <div className="h-7 w-14 bg-gray-200 rounded-lg" />
        </div>
      </div>
      <div className="h-64 w-full bg-gray-200 rounded-xl" />
    </div>
  )
}

// ─── Page (Server Component) ──────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: metrics, error: metricsError } = user
    ? await supabase
        .from('seller_metrics')
        .select('total_views, total_products, total_sales_count')
        .eq('seller_id', user.id)
        .maybeSingle()
    : { data: null, error: null }

  if (metricsError) {
    console.error('Failed to load seller_metrics:', metricsError)
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
      <p className="text-black font-general font-semibold text-2xl">Analytics</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Last30DaysCard sellerId={user?.id ?? ''} />
        <TotalViewsCard value={metrics?.total_views ?? 0} />
        <TotalProductsCard value={metrics?.total_products ?? 0} />
        <TotalSalesCard value={metrics?.total_sales_count ?? 0} />
      </div>

      {/* Chart — lazy-loaded via client wrapper so recharts bundle is deferred */}
      <Suspense fallback={<ChartSkeleton />}>
        <AnalyticsChartWrapper />
      </Suspense>
    </main>
  )
}