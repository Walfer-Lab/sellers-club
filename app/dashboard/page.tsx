import { createClient } from '@/utils/SupabaseServer'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProductActionMenu from '@/components/ProductActionMenu'
import {
  ArrowRight01Icon,
  Wallet01Icon,
  ShoppingCart01Icon,
  ViewIcon,
  PackageIcon,
  PlusSignIcon,
  BookOpen01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

export const revalidate = 0

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

function resolveImageUrl(path: string, supabase: any): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
    return path
  }
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data?.publicUrl || path
}

function getFirstImageUrl(imageUrls: any, supabase: any): string | null {
  if (!imageUrls) return null
  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
    return resolveImageUrl(imageUrls[0], supabase)
  }
  if (typeof imageUrls === 'string') {
    try {
      const parsed = JSON.parse(imageUrls)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return resolveImageUrl(parsed[0], supabase)
      }
    } catch {
      return resolveImageUrl(imageUrls, supabase)
    }
  }
  return null
}

export default async function DashboardPage() {
  const supabase = createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch seller metrics
  const { data: metrics } = await supabase
    .from('seller_metrics')
    .select('*')
    .eq('seller_id', user.id)
    .maybeSingle()

  // 3. Fetch recent products
  const { data: recentProducts } = await supabase
    .from('products')
    .select('id, title, category, price, is_live, views, image_urls, created_at')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })
    .limit(4)

  const products = recentProducts || []

  const stats = {
    earnings: Number(metrics?.total_earning || 0),
    sales: Number(metrics?.total_sales || 0),
    views: Number(metrics?.total_product_views || 0),
    liveProducts: Number(metrics?.no_of_products_live || 0),
  }

  const sellerName = user.email ? user.email.split('@')[0] : 'Seller'

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 pb-16">
      {/* ==========================================
          HEADER
      ========================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-general font-bold text-black/90">
            Welcome back, {sellerName}
          </h1>
          <p className="text-gray-500 text-sm font-grotesk font-medium mt-0.5">
            Here&apos;s an overview of your store&apos;s performance today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-general font-medium text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <HugeiconsIcon icon={PackageIcon} size={16} />
            All Products
          </Link>
          <Link
            href="/dashboard/products/new"
            className="px-4 py-2 rounded-lg bg-black text-white font-general font-medium text-sm hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            Add Product
          </Link>
        </div>
      </div>

      {/* ==========================================
          1. SELLER METRICS
      ========================================== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-gray-200 bg-zinc-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-grotesk font-semibold uppercase tracking-wider">Total Earnings</span>
            <HugeiconsIcon icon={Wallet01Icon} size={18} />
          </div>
          <p className="font-general text-2xl font-bold text-emerald-600">
            {formatINR(stats.earnings)}
          </p>
          <span className="text-[11px] font-medium text-gray-400 mt-1">Lifetime revenue</span>
        </div>

        <div className="p-5 rounded-xl border border-gray-200 bg-zinc-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-grotesk font-semibold uppercase tracking-wider">Total Orders</span>
            <HugeiconsIcon icon={ShoppingCart01Icon} size={18} />
          </div>
          <p className="font-general text-2xl font-bold text-blue-600">
            {stats.sales}
          </p>
          <span className="text-[11px] font-medium text-gray-400 mt-1">Completed sales</span>
        </div>

        <div className="p-5 rounded-xl border border-gray-200 bg-zinc-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-grotesk font-semibold uppercase tracking-wider">Store Views</span>
            <HugeiconsIcon icon={ViewIcon} size={18} />
          </div>
          <p className="font-general text-2xl font-bold text-black/90">
            {stats.views.toLocaleString()}
          </p>
          <span className="text-[11px] font-medium text-gray-400 mt-1">Product visits</span>
        </div>

        <div className="p-5 rounded-xl border border-gray-200 bg-zinc-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-grotesk font-semibold uppercase tracking-wider">Active Products</span>
            <HugeiconsIcon icon={PackageIcon} size={18} />
          </div>
          <p className="font-general text-2xl font-bold text-purple-600">
            {stats.liveProducts}
          </p>
          <span className="text-[11px] font-medium text-gray-400 mt-1">Published items</span>
        </div>
      </section>

      {/* ==========================================
          2. RECENT PRODUCTS IN A ROW
      ========================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-general font-semibold text-black/90">
              Recent Products
            </h2>
            <p className="text-xs font-grotesk text-gray-500">
              Latest items uploaded to your storefront
            </p>
          </div>
          {products.length > 0 && (
            <Link
              href="/dashboard/products"
              className="text-xs font-general font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
            >
              View all
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </Link>
          )}
        </div>

        {products.length === 0 ? (
          // EMPTY STATE: CREATE PRODUCT UNDER A LEARN GUIDE LINK
          <div className="rounded-2xl border border-dashed border-gray-300 bg-zinc-100/70 p-8 sm:p-12 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4 text-blue-500 shadow-sm">
              <HugeiconsIcon icon={PackageIcon} size={24} />
            </div>
            <h3 className="text-base font-general font-bold text-black/90 mb-1">
              No products uploaded yet
            </h3>
            <p className="text-sm font-grotesk text-gray-500 max-w-md mx-auto mb-6">
              Start selling by creating your first digital product. Need help preparing your files?
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard/products/new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-black text-white font-general font-medium text-sm hover:bg-zinc-800 transition-colors shadow-sm"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={16} />
                Create your first product
              </Link>

              <Link
                href="https://blogs.pdflovers.app/learn-how-to-upload-product"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-general font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                <HugeiconsIcon icon={BookOpen01Icon} size={16} className="text-blue-500" />
                Read step-by-step upload guide
              </Link>
            </div>
          </div>
        ) : (
          // POPULATED ROW / GRID OF RECENT PRODUCTS
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const coverUrl = getFirstImageUrl(product.image_urls, supabase)
              return (
                <div
                  key={product.id}
                  className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Image */}
                    <Link
                      href={`/dashboard/products/edit/${product.id}`}
                      className="block aspect-[16/10] bg-zinc-100 relative overflow-hidden"
                    >
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverUrl}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <HugeiconsIcon icon={PackageIcon} size={28} />
                        </div>
                      )}
                      <span
                        className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          product.is_live
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {product.is_live ? 'Live' : 'Draft'}
                      </span>
                    </Link>

                    {/* Content */}
                    <div className="p-4">
                      <p className="text-xs font-grotesk font-semibold text-blue-600 mb-1">
                        {product.category || 'Digital Asset'}
                      </p>
                      <Link
                        href={`/dashboard/products/edit/${product.id}`}
                        className="font-general font-semibold text-sm text-black/90 line-clamp-1 group-hover:text-blue-600 transition-colors"
                      >
                        {product.title}
                      </Link>
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500 font-general">
                        <span className="font-bold text-black/90">
                          {formatINR(product.price)}
                        </span>
                        <span>{product.views || 0} views</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <Link
                      href={`/dashboard/products/edit/${product.id}`}
                      className="text-xs font-general font-semibold text-gray-600 hover:text-black"
                    >
                      Edit details
                    </Link>
                    <ProductActionMenu productId={product.id} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ==========================================
          3. GUIDE BOOKS ABOUT SELLING
      ========================================== */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-lg font-general font-semibold text-black/90">
              Seller Playbooks & Guides
            </h2>
            <p className="text-xs font-grotesk text-gray-500">
              Curated guides and handbooks on selling more digital products
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Guide Book 1 */}
          <Link
            href="https://blogs.pdflovers.app/learn-how-to-upload-product"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-5 rounded-xl border border-gray-200 bg-zinc-100 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-general font-semibold bg-blue-100 text-blue-700 mb-3">
                Getting Started
              </span>
              <h3 className="font-general font-bold text-base text-black/90 group-hover:text-blue-600 transition-colors mb-2">
                The Ultimate Guide to Selling Digital Products
              </h3>
              <p className="text-xs font-grotesk text-gray-600 leading-relaxed mb-4">
                Learn how to prepare, package, and launch digital downloads, PDF guides, ebooks, and templates.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200/80 text-xs font-general font-semibold text-gray-700 group-hover:text-blue-600">
              <span>Read playbook</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
            </div>
          </Link>

          {/* Guide Book 2 */}
          <Link
            href="https://blogs.pdflovers.app/learn-how-to-upload-product"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-5 rounded-xl border border-gray-200 bg-zinc-100 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-general font-semibold bg-purple-100 text-purple-700 mb-3">
                Pricing Strategy
              </span>
              <h3 className="font-general font-bold text-base text-black/90 group-hover:text-purple-600 transition-colors mb-2">
                How to Price Your Digital Storefront
              </h3>
              <p className="text-xs font-grotesk text-gray-600 leading-relaxed mb-4">
                Master tiered pricing, bundles, and discount techniques to double your average order value.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200/80 text-xs font-general font-semibold text-gray-700 group-hover:text-purple-600">
              <span>Read playbook</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
            </div>
          </Link>

          {/* Guide Book 3 */}
          <Link
            href="https://blogs.pdflovers.app/learn-how-to-upload-product"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-5 rounded-xl border border-gray-200 bg-zinc-100 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-general font-semibold bg-emerald-100 text-emerald-700 mb-3">
                Traffic & Growth
              </span>
              <h3 className="font-general font-bold text-base text-black/90 group-hover:text-emerald-600 transition-colors mb-2">
                Driving Buyers to Your Store
              </h3>
              <p className="text-xs font-grotesk text-gray-600 leading-relaxed mb-4">
                Proven organic social media frameworks and newsletter strategies to turn audience into daily sales.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200/80 text-xs font-general font-semibold text-gray-700 group-hover:text-emerald-600">
              <span>Read playbook</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
            </div>
          </Link>
        </div>
      </section>
    </main>
  )
}
