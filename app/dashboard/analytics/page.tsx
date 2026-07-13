import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Last30DaysCard, TotalViewsCard, TotalProductsCard, TotalSalesCard } from '@/components/Analytics/AnalyticsStats'
import AnalyticsChartWrapper from '@/components/Analytics/AnalyticsChartWrapper'

export const metadata: Metadata = {
  title: 'Analytics | Sellers Club',
  description: 'Analyze your product performance, track sales trends, conversion rates, and traffic metrics over time.',
}

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

export default function AnalyticsPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
      <p className="text-black font-general font-semibold text-2xl">Analytics</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Last30DaysCard />
        <TotalViewsCard />
        <TotalProductsCard />
        <TotalSalesCard />
      </div>

      {/* Chart — lazy-loaded via client wrapper so recharts bundle is deferred */}
      <Suspense fallback={<ChartSkeleton />}>
        <AnalyticsChartWrapper />
      </Suspense>
    </main>
  )
}