import { createClient } from '@/utils/SupabaseServer'
import { redirect } from 'next/navigation'
import CreateProductForm from '@/components/Products/CreateProductForm'

export default async function NewProductPage() {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto px-4 py-4">
        <div className="mb-10">
          <h1
            className="text-black/90 text-2xl font-general font-semibold"
          >
            New product
          </h1>
          <p className="text-gray-400 text-sm font-grotesk font-medium pt-1">
            Upload your digital asset and up to 6 cover images
          </p>
        </div>
        <CreateProductForm />
      </main>
    </div>
  )
}
