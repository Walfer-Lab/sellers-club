import { createClient } from '@/utils/SupabaseServer'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProductActionMenu from '@/components/Products/ProductActionMenu'
import {
  PackageIcon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import ProductInfo from "@/components/Products/ProductInfo"

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
}

export default async function ProductsPage() {
  const supabase = createClient()

  // 1. Authenticate the user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch All Products for this Seller
  const { data: products } = await supabase
    .from('products')
    .select('id, title, price, is_live, views, image_urls, created_at')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="font-general text-gray-900">
      <ProductInfo />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-general text-2xl font-semibold text-black/80">Products</h1>
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-general font-medium text-sm hover:bg-zinc-800 transition-colors"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            Add product
          </Link>
        </div>

        {/* Products List */}
        <section className="rounded-xl overflow-hidden">
          {(!products || products.length === 0) ? (
            // EMPTY STATE
            <div className="text-center py-14 px-4">
              <div className="mx-auto flex items-center justify-center mb-4 text-gray-500">
                <HugeiconsIcon icon={PackageIcon} size={60} />
              </div>
              <h3 className="font-general text-md font-semibold text-gray-900 mb-1">
                No products found
              </h3>
              <p className="text-gray-400 text-sm font-general font-medium mb-6 max-w-xs mx-auto">
                You haven&apos;t uploaded any digital assets yet.
              </p>
              <Link
                href="https://blogs.pdflovers.app/learn-how-to-upload-product"
                className="font-medium text-sm text-blue-500/90 hover:underline"
              >
                Learn how to upload product
              </Link>
            </div>
          ) : (
            // POPULATED STATE
            <div className='flex flex-col gap-2'>
              {products.map((product) => {

                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-zinc-200 transition-colors bg-zinc-100 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">

                      {/* Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/products/edit/${product.id}`}
                            className="font-semibold font-general text-black/80 truncate text-sm"
                          >
                            {product.title}
                          </Link>
                          <span className={`text-xs font-general font-medium ${product.is_live
                              ? 'text-green-600'
                              : 'text-amber-600'
                            }`}>
                            {product.is_live ? 'Live' : 'Draft'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-sm font-general text-gray-500 font-medium">
                          <span className="font-medium text-zinc-700">{formatCurrency(product.price)}</span>
                          <span className='font-bold text-zinc-500'>·</span>
                          <span>{product.views || "No"} views</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ProductActionMenu productId={product.id} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}