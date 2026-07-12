'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ShoppingCart01Icon,
  Wallet01Icon,
  ViewIcon,
  PackageIcon,
  Calendar01Icon,
} from '@hugeicons/core-free-icons'
import { createClient } from '@/utils/SupabaseClient'

const supabase = createClient()

export type ProductAnalyticsItem = {
  id: string
  title: string
  category: string
  price: number
  views: number
  image_urls: string[] | string | null
  is_live: boolean
  created_at: string
}

export type SaleItem = {
  id: string
  product_id: string
  amount_paid: number
  created_at: string
  status: string
}

export type SellerMetrics = {
  no_of_products_live: number
  total_product_views: number
  total_sales: number
  total_earning: number
}

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

function resolveImageUrl(path: string) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
    return path
  }
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data?.publicUrl || path
}

function getFirstImageUrl(imageUrls: string[] | string | null | undefined): string | null {
  if (!imageUrls) return null
  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
    return resolveImageUrl(imageUrls[0])
  }
  if (typeof imageUrls === 'string') {
    try {
      const parsed = JSON.parse(imageUrls)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return resolveImageUrl(parsed[0])
      }
    } catch {
      return resolveImageUrl(imageUrls)
    }
  }
  return null
}

type TimeRange = '7D' | '30D' | '90D' | 'ALL'

export default function AnalyticsDashboard({
  metrics,
  products,
  sales,
}: {
  metrics: SellerMetrics
  products: ProductAnalyticsItem[]
  sales: SaleItem[]
}) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30D')
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [sortField, setSortField] = useState<'revenue' | 'sales' | 'views'>('revenue')

  // Calculate aggregated stats across products and sales
  const stats = useMemo(() => {
    const totalEarning =
      metrics?.total_earning ??
      sales.reduce((acc, s) => acc + Number(s.amount_paid || 0), 0)
    const totalSales = metrics?.total_sales ?? sales.length
    const totalViews =
      metrics?.total_product_views ??
      products.reduce((acc, p) => acc + Number(p.views || 0), 0)
    const liveCount =
      metrics?.no_of_products_live ??
      products.filter((p) => p.is_live).length
    const conversionRate =
      totalViews > 0 ? ((totalSales / totalViews) * 100).toFixed(1) : '0.0'

    return {
      totalEarning,
      totalSales,
      totalViews,
      liveCount,
      conversionRate,
    }
  }, [metrics, products, sales])

  // Aggregate time series data based on selected timeRange
  const chartPoints = useMemo(() => {
    const now = new Date()
    let days = 30
    if (timeRange === '7D') days = 7
    else if (timeRange === '30D') days = 30
    else if (timeRange === '90D') days = 90
    else if (timeRange === 'ALL') days = 180

    const dayMap = new Map<string, { dateStr: string; label: string; revenue: number; orders: number }>()

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      dayMap.set(key, { dateStr: key, label, revenue: 0, orders: 0 })
    }

    // Populate actual sales
    for (const sale of sales) {
      if (!sale.created_at) continue
      const dateKey = new Date(sale.created_at).toISOString().split('T')[0]
      if (dayMap.has(dateKey)) {
        const item = dayMap.get(dateKey)!
        item.revenue += Number(sale.amount_paid || 0)
        item.orders += 1
      }
    }

    return Array.from(dayMap.values())
  }, [sales, timeRange])

  // Calculate SVG Chart coordinates
  const svgData = useMemo(() => {
    if (chartPoints.length === 0) return null

    const values = chartPoints.map((p) => (chartMetric === 'revenue' ? p.revenue : p.orders))
    const maxVal = Math.max(...values, 10)
    const minVal = 0

    const width = 800
    const height = 240
    const paddingLeft = 50
    const paddingRight = 20
    const paddingTop = 20
    const paddingBottom = 30

    const plotWidth = width - paddingLeft - paddingRight
    const plotHeight = height - paddingTop - paddingBottom

    const points = chartPoints.map((p, idx) => {
      const val = chartMetric === 'revenue' ? p.revenue : p.orders
      const x = paddingLeft + (idx / Math.max(chartPoints.length - 1, 1)) * plotWidth
      const y = paddingTop + plotHeight - ((val - minVal) / (maxVal - minVal)) * plotHeight
      return { x, y, val, label: p.label, raw: p }
    })

    const pathD = points
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
      .join(' ')

    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${
      paddingTop + plotHeight
    } L ${points[0].x.toFixed(1)} ${paddingTop + plotHeight} Z`

    return {
      width,
      height,
      paddingLeft,
      paddingTop,
      plotHeight,
      points,
      pathD,
      areaD,
      maxVal,
    }
  }, [chartPoints, chartMetric])

  // Compute product-level performance
  const productStats = useMemo(() => {
    const salesByProduct = new Map<string, { orders: number; revenue: number }>()

    for (const sale of sales) {
      const current = salesByProduct.get(sale.product_id) || { orders: 0, revenue: 0 }
      current.orders += 1
      current.revenue += Number(sale.amount_paid || 0)
      salesByProduct.set(sale.product_id, current)
    }

    const result = products.map((prod) => {
      const sData = salesByProduct.get(prod.id) || { orders: 0, revenue: 0 }
      const conversion =
        prod.views > 0 ? ((sData.orders / prod.views) * 100).toFixed(1) : '0.0'
      return {
        ...prod,
        salesCount: sData.orders,
        revenue: sData.revenue,
        conversionRate: conversion,
      }
    })

    return result.sort((a, b) => {
      if (sortField === 'revenue') return b.revenue - a.revenue
      if (sortField === 'sales') return b.salesCount - a.salesCount
      return (b.views || 0) - (a.views || 0)
    })
  }, [products, sales, sortField])

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Overview Stat Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-100 rounded-xl p-4 border border-zinc-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-grotesk font-semibold uppercase tracking-wider">Total Earnings</span>
            <HugeiconsIcon icon={Wallet01Icon} size={18} />
          </div>
          <p className="text-2xl font-bold font-general text-emerald-600">
            {formatINR(stats.totalEarning)}
          </p>
          <span className="text-[11px] font-medium text-zinc-400 mt-1">
            From {stats.totalSales} completed sales
          </span>
        </div>

        <div className="bg-zinc-100 rounded-xl p-4 border border-zinc-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-grotesk font-semibold uppercase tracking-wider">Total Sales</span>
            <HugeiconsIcon icon={ShoppingCart01Icon} size={18} />
          </div>
          <p className="text-2xl font-bold font-general text-blue-600">
            {stats.totalSales}
          </p>
          <span className="text-[11px] font-medium text-zinc-400 mt-1">
            Orders across all products
          </span>
        </div>

        <div className="bg-zinc-100 rounded-xl p-4 border border-zinc-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-grotesk font-semibold uppercase tracking-wider">Total Views</span>
            <HugeiconsIcon icon={ViewIcon} size={18} />
          </div>
          <p className="text-2xl font-bold font-general text-zinc-900">
            {stats.totalViews.toLocaleString()}
          </p>
          <span className="text-[11px] font-medium text-zinc-400 mt-1">
            Product page visitors
          </span>
        </div>

        <div className="bg-zinc-100 rounded-xl p-4 border border-zinc-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-grotesk font-semibold uppercase tracking-wider">Conversion Rate</span>
            <HugeiconsIcon icon={PackageIcon} size={18} />
          </div>
          <p className="text-2xl font-bold font-general text-purple-600">
            {stats.conversionRate}%
          </p>
          <span className="text-[11px] font-medium text-zinc-400 mt-1">
            {stats.liveCount} live products
          </span>
        </div>
      </section>

      {/* 2. Interactive Chart Card */}
      <section className="bg-zinc-100/90 rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-general font-semibold text-zinc-900">
              Sales & Revenue Performance
            </h2>
            <p className="text-xs font-grotesk text-zinc-500 mt-0.5">
              Visualize your daily performance trends over time
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Toggle */}
            <div className="flex items-center rounded-lg bg-zinc-200/80 p-1">
              <button
                type="button"
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1 rounded-md text-xs font-general font-semibold transition-all cursor-pointer ${
                  chartMetric === 'revenue'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Revenue (₹)
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('orders')}
                className={`px-3 py-1 rounded-md text-xs font-general font-semibold transition-all cursor-pointer ${
                  chartMetric === 'orders'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Orders
              </button>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center rounded-lg bg-zinc-200/80 p-1">
              {(['7D', '30D', '90D', 'ALL'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded-md text-xs font-general font-semibold transition-all cursor-pointer ${
                    timeRange === range
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SVG Interactive Chart */}
        {svgData && svgData.points.length > 0 ? (
          <div className="relative w-full overflow-hidden select-none">
            <svg
              viewBox={`0 0 ${svgData.width} ${svgData.height}`}
              className="w-full h-56 sm:h-64 overflow-visible"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.5, 1].map((ratio, i) => {
                const y = svgData.paddingTop + ratio * svgData.plotHeight
                const val = svgData.maxVal * (1 - ratio)
                return (
                  <g key={i}>
                    <line
                      x1={svgData.paddingLeft}
                      y1={y}
                      x2={svgData.width - 20}
                      y2={y}
                      stroke="#e4e4e7"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={svgData.paddingLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[10px] fill-zinc-400 font-general font-medium"
                    >
                      {chartMetric === 'revenue'
                        ? `₹${Math.round(val).toLocaleString()}`
                        : Math.round(val)}
                    </text>
                  </g>
                )
              })}

              {/* Area path */}
              <path d={svgData.areaD} fill="url(#revenueGradient)" />

              {/* Stroke line */}
              <path
                d={svgData.pathD}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive invisible columns & points */}
              {svgData.points.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIndex === idx ? 6 : 3}
                    className={`transition-all ${
                      hoveredIndex === idx
                        ? 'fill-blue-600 stroke-white stroke-2'
                        : 'fill-blue-500 opacity-70'
                    }`}
                  />
                  {/* Invisible hit zone */}
                  <rect
                    x={pt.x - 12}
                    y={0}
                    width={24}
                    height={svgData.height}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                  />
                </g>
              ))}

              {/* Hover Crosshair line */}
              {hoveredIndex !== null && svgData.points[hoveredIndex] && (
                <line
                  x1={svgData.points[hoveredIndex].x}
                  y1={svgData.paddingTop}
                  x2={svgData.points[hoveredIndex].x}
                  y2={svgData.paddingTop + svgData.plotHeight}
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredIndex !== null && svgData.points[hoveredIndex] && (
              <div className="absolute top-2 right-4 bg-zinc-900/95 text-white px-3.5 py-2 rounded-xl shadow-lg border border-zinc-700 pointer-events-none transition-all">
                <p className="text-[11px] text-zinc-400 font-grotesk font-medium">
                  {svgData.points[hoveredIndex].label}
                </p>
                <p className="text-sm font-general font-bold text-blue-400 mt-0.5">
                  {formatINR(svgData.points[hoveredIndex].raw.revenue)}
                </p>
                <p className="text-xs text-zinc-300 font-medium">
                  {svgData.points[hoveredIndex].raw.orders} order
                  {svgData.points[hoveredIndex].raw.orders === 1 ? '' : 's'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-zinc-400">
            <p className="text-sm font-general font-medium">No sales data recorded yet</p>
            <p className="text-xs text-zinc-400 mt-1">
              Your sales performance graph will appear here automatically
            </p>
          </div>
        )}
      </section>

      {/* 3. Top Performing Products Section */}
      <section className="bg-zinc-100/90 rounded-2xl border border-zinc-200/80 overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-zinc-200/80">
          <div>
            <h2 className="text-base font-general font-semibold text-zinc-900">
              Top Products & Revenue
            </h2>
            <p className="text-xs font-grotesk text-zinc-500 mt-0.5">
              Performance breakdown of your live products
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-general font-medium">
            <span className="text-zinc-400">Sort by:</span>
            {(['revenue', 'sales', 'views'] as const).map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => setSortField(field)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  sortField === field
                    ? 'bg-black text-white font-semibold'
                    : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                }`}
              >
                {field === 'sales' ? 'Orders' : field}
              </button>
            ))}
          </div>
        </div>

        {productStats.length === 0 ? (
          <div className="p-10 text-center text-zinc-500">
            <HugeiconsIcon icon={PackageIcon} size={36} className="mx-auto mb-2 text-zinc-400" />
            <p className="text-sm font-general font-semibold text-zinc-700">No products yet</p>
            <p className="text-xs text-zinc-400 mt-1 mb-4">
              Create your first digital product to start tracking analytics
            </p>
            <Link
              href="/dashboard/products/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white text-xs font-general font-medium hover:bg-zinc-800 transition-colors"
            >
              Add Product
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200/80">
            {productStats.map((prod, index) => {
              const coverUrl = getFirstImageUrl(prod.image_urls)
              return (
                <div
                  key={prod.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-6 hover:bg-zinc-200/60 transition-colors"
                >
                  {/* Rank & Product Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-6 text-xs font-general font-bold text-zinc-400 shrink-0">
                      #{index + 1}
                    </span>

                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-200 border border-zinc-200 shrink-0 relative flex items-center justify-center">
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <HugeiconsIcon icon={PackageIcon} size={18} className="text-zinc-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/products/edit/${prod.id}`}
                          className="font-general font-semibold text-sm text-zinc-900 truncate hover:underline"
                        >
                          {prod.title}
                        </Link>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                            prod.is_live
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {prod.is_live ? 'Live' : 'Draft'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                        <span className="text-blue-600 font-medium">{prod.category}</span>
                        <span>·</span>
                        <span>{formatINR(prod.price)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Columns */}
                  <div className="grid grid-cols-3 sm:flex items-center sm:gap-8 text-left sm:text-right text-xs font-general pt-2 sm:pt-0 border-t sm:border-0 border-zinc-200">
                    <div>
                      <p className="text-zinc-400 text-[10px] uppercase font-semibold">Orders</p>
                      <p className="text-sm font-bold text-zinc-900 mt-0.5">
                        {prod.salesCount}
                      </p>
                    </div>

                    <div>
                      <p className="text-zinc-400 text-[10px] uppercase font-semibold">Views</p>
                      <p className="text-sm font-bold text-zinc-900 mt-0.5">
                        {prod.views || 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-zinc-400 text-[10px] uppercase font-semibold">Revenue</p>
                      <p className="text-sm font-bold text-emerald-600 mt-0.5">
                        {formatINR(prod.revenue)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
