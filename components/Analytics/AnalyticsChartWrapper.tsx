'use client'

import dynamic from 'next/dynamic'

// ─── Skeleton (matches the chart card layout) ─────────────────────────────────

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

// ─── Lazy-load the heavy recharts bundle (client-only) ────────────────────────

const SellerAnalyticsChart = dynamic(
  () => import('@/components/Analytics/SellerAnalyticsChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export default function AnalyticsChartWrapper() {
  return <SellerAnalyticsChart />
}
