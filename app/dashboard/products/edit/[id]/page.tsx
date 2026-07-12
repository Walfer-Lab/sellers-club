import { createClient } from '@/utils/SupabaseServer'
import { redirect } from 'next/navigation'
import EditProductForm from '@/components/EditProductForm'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: product, error } = await supabase
    .from('products')
    .select('id, title, description, category, price, discount, image_urls, properties')
    .eq('id', id)
    .eq('seller_id', user.id)
    .single()

  if (error || !product) {
    redirect('/dashboard/products')
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto px-4 py-4">
        <div className="mb-10">
          <h1 className="text-black/90 text-2xl font-general font-semibold">
            Edit product
          </h1>
          <p className="text-gray-400 text-sm font-grotesk font-medium pt-1">
            Update your product details, images, and properties
          </p>
        </div>
        <EditProductForm product={product} />
      </main>
    </div>
  )
}
