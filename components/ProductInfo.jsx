'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/SupabaseClient'
import {
  Cancel01Icon,
  ShoppingCart01Icon,
  Wallet01Icon,
  ViewIcon,
  PackageIcon,
  Calendar01Icon,
  File02Icon,
  ImageNotFound01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

// Helper to safely extract the first image URL from jsonb
const getFirstImageUrl = (imageUrls) => {
  if (!imageUrls) return null
  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
    return imageUrls[0]
  }
  if (typeof imageUrls === 'string') {
    try {
      const parsed = JSON.parse(imageUrls)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
    } catch (e) {
      // ignore JSON parse error
    }
  }
  return null
}

// Helper to format currency
const formatCurrency = (amount) => {
  const num = Number(amount) || 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
  }).format(num)
}

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (e) {
    return dateString
  }
}

// Statuses that should NOT count toward earnings
const NON_EARNING_STATUSES = new Set(['failed', 'refunded', 'cancelled', 'canceled', 'pending'])

function StatRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-6 py-2.5 px-3">
      <div className="flex items-center gap-2 text-zinc-500">
        <HugeiconsIcon icon={icon} size={15} />
        <span className="text-sm font-medium tracking-wide">{label}</span>
      </div>
      <span className="text-sm font-semibold text-blue-500/90 tabular-nums">{value}</span>
    </div>
  )
}

function ProductInfoModal({ productIdProp, onCloseProp }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlProductId = searchParams
    ? searchParams.get('info') || searchParams.get('productId') || searchParams.get('id')
    : null

  const activeProductId = productIdProp || urlProductId

  const [product, setProduct] = useState(null)
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    if (!activeProductId) {
      setProduct(null)
      setSales([])
      return
    }

    let isMounted = true
    const fetchProductAndSales = async () => {
      setLoading(true)
      setError(null)
      setImageFailed(false)
      const supabase = createClient()

      try {
        // 1. Fetch product details
        const { data: productData, error: productErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', activeProductId)
          .single()

        if (productErr || !productData) {
          throw new Error(productErr?.message || 'Product not found')
        }

        // 2. Fetch sales for this product
        const { data: salesData, error: salesErr } = await supabase
          .from('sales')
          .select('id, amount_paid, status, created_at, user_id')
          .eq('product_id', activeProductId)

        if (salesErr) {
          // Don't block the whole modal if sales fail to load
          console.error('Failed to load sales:', salesErr.message)
        }

        if (isMounted) {
          setProduct(productData)
          setSales(salesData || [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load product details')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProductAndSales()

    return () => {
      isMounted = false
    }
  }, [activeProductId])

  // Handle ESC key press to close
  useEffect(() => {
    if (!activeProductId) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProductId])

  const handleClose = () => {
    if (onCloseProp) {
      onCloseProp()
    } else {
      router.push('/dashboard/products', { scroll: false })
    }
  }

  if (!activeProductId) return null

  // Calculate statistics
  const viewsCount = product?.views || 0
  const salesCount = sales.length
  const totalEarnings = sales.reduce((acc, item) => {
    const status = (item.status || '').toLowerCase()
    if (NON_EARNING_STATUSES.has(status)) return acc
    return acc + (Number(item.amount_paid) || 0)
  }, 0)
  const firstImageUrl = product ? getFirstImageUrl(product.image_urls) : null
  const showImage = firstImageUrl && !imageFailed

  // Parse properties if any
  let parsedProperties = null
  if (product?.properties) {
    if (typeof product.properties === 'object') {
      parsedProperties = product.properties
    } else if (typeof product.properties === 'string') {
      try {
        parsedProperties = JSON.parse(product.properties)
      } catch (e) {}
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center font-general"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal / Drawer Container */}
      <div className="relative z-50 w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-y-auto scrollbar-none rounded-t-3xl sm:rounded-2xl bg-zinc-50 border-t sm:border border-zinc-200 shadow-2xl transition-all origin-bottom sm:origin-center animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Mobile handle indicator */}
        <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-zinc-300 sm:hidden" />

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-black/80">
              Product details
            </span>
            {product && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  product.is_live
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-500 border-zinc-300'
                }`}
              >
                {product.is_live ? 'Live' : 'Draft'}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer"
            aria-label="Close product details"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5">
          {loading ? (
            /* Loading State */
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-500">
              <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
              <p className="text-xs font-medium">Loading product information...</p>
            </div>
          ) : error ? (
            /* Error State */
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-zinc-900 mb-2">{error}</p>
              <button
                onClick={handleClose}
                className="px-4 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 rounded-lg text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : product ? (
            <div className="space-y-5">
              {/* Top Row: Image aside stats — stays side-by-side even on mobile */}
              <div className="grid grid-cols-2 w-full gap-3">
                {/* Image thumbnail */}
                <div className="rounded-xl overflow-hidden bg-zinc-200 border border-zinc-200 relative flex items-center justify-center h-44">
                  {showImage ? (
                    <img
                      key={firstImageUrl}
                      src={firstImageUrl}
                      alt={product.title}
                      loading="lazy"
                      decoding="async"
                      onError={() => setImageFailed(true)}
                      className="object-cover aspect-square"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-600 gap-1 p-2 text-center">
                      <HugeiconsIcon
                        icon={imageFailed ? ImageNotFound01Icon : PackageIcon}
                        size={22}
                      />
                      <span className="text-xs font-medium">
                        {imageFailed ? 'Failed to load' : 'No image'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats aside the image */}
                <div className="flex flex-col justify-center gap-1.5">
                  <StatRow icon={ViewIcon} label="Views" value={viewsCount.toLocaleString()} />
                  <StatRow icon={ShoppingCart01Icon} label="Sales" value={salesCount.toLocaleString()} />
                  <StatRow icon={Wallet01Icon} label="Earnings" value={formatCurrency(totalEarnings)} />
                </div>
              </div>

              <hr className="border-zinc-200" />

              {/* Product Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-bold text-zinc-900 leading-snug break-words">
                    {product.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-zinc-600">
                    <span className="font-semibold text-emerald-600 text-sm">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-zinc-300">·</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-200 font-medium text-zinc-700">
                      <HugeiconsIcon icon={File02Icon} size={13} />
                      {product.file_type || 'PDF'}
                    </span>
                    {product.category && (
                      <>
                        <span className="text-zinc-300">·</span>
                        <span className="font-medium text-blue-500/80">
                          {product.category}
                        </span>
                      </>
                    )}
                    {product.created_at && (
                      <>
                        <span className="text-zinc-300">·</span>
                        <span className="inline-flex items-center gap-1 text-zinc-500 font-medium">
                          <HugeiconsIcon icon={Calendar01Icon} size={13} />
                          {formatDate(product.created_at)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 mb-1.5">
                    Description
                  </p>
                  <div className="rounded-xl border border-zinc-200 p-2 text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap max-h-20 overflow-y-auto scrollbar-none font-general font-medium bg-zinc-200">
                    {product.description || 'No description provided.'}
                  </div>
                </div>

                {/* Properties if present */}
                {parsedProperties && Object.keys(parsedProperties).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-500 mb-1.5">
                      Properties
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(parsedProperties).map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-lg bg-zinc-200 border border-zinc-200 px-3 py-2 text-xs"
                        >
                          <p className="text-blue-500 font-medium truncate">{key}</p>
                          <p className="text-zinc-900 font-semibold truncate mt-0.5">
                            {String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function ProductInfo(props) {
  return (
    <Suspense fallback={null}>
      <ProductInfoModal {...props} />
    </Suspense>
  )
}