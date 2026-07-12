'use server'

import { createClient } from '@/utils/SupabaseServer'
import { revalidatePath } from 'next/cache'
import { CATEGORIES } from '@/utils/constants'

type CreateProductInput = {
  title: string
  description: string
  category: string
  price: number
  discount: number
  assetKey: string
  fileType: string
  imageKeys: string[]
  properties?: Record<string, string>
}

const MAX_PROPERTIES = 20
const MAX_PROPERTY_KEY_LENGTH = 60
const MAX_PROPERTY_VALUE_LENGTH = 120

export async function createProduct(input: CreateProductInput) {
  const supabase = createClient()

  // Re-check auth server-side. seller_id is set from the session, never
  // from anything the client passes in.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const title = input.title?.trim()
  if (!title || title.length < 3 || title.length > 120) {
    throw new Error('Title must be between 3 and 120 characters')
  }

  const description = (input.description || '').trim().slice(0, 5000)
  if (!description) {
    throw new Error('Description is required')
  }

  if (!CATEGORIES.includes(input.category)) {
    throw new Error('Invalid category')
  }

  const price = Number(input.price)
  if (!Number.isFinite(price) || price < 0 || price > 100000) {
    throw new Error('Invalid price')
  }

  const discount = Number(input.discount) || 0
  if (discount < 0 || discount > 100) {
    throw new Error('Invalid discount')
  }

  // The asset file lives in a private S3 bucket, namespaced under this
  // seller's own prefix.
  const expectedAssetPrefix = `products/${user.id}/`
  if (!input.assetKey || !input.assetKey.startsWith(expectedAssetPrefix)) {
    throw new Error('Invalid product file reference')
  }
  if (!input.fileType) {
    throw new Error('Missing file type')
  }

  // Images live in the Supabase 'product-images' bucket, namespaced
  // under this seller's own folder — enforced here AND by the bucket's
  // storage RLS policy at upload time.
  if (!Array.isArray(input.imageKeys) || input.imageKeys.length === 0 || input.imageKeys.length > 6) {
    throw new Error('Upload between 1 and 6 images')
  }
  for (const path of input.imageKeys) {
    const validRelative = path.startsWith(`${user.id}/`)
    const validPublic = path.includes(`/product-images/${user.id}/`)
    if (!validRelative && !validPublic) {
      throw new Error('Invalid image reference')
    }
  }

  // Properties are plain text key/value pairs — re-sanitize server-side
  // rather than trusting whatever object shape the client sent.
  const rawProperties = input.properties
  const properties: Record<string, string> = {}
  if (rawProperties && typeof rawProperties === 'object') {
    const entries = Object.entries(rawProperties)
    if (entries.length > MAX_PROPERTIES) {
      throw new Error(`You can add up to ${MAX_PROPERTIES} properties`)
    }
    for (const [rawKey, rawValue] of entries) {
      const key = String(rawKey).trim().slice(0, MAX_PROPERTY_KEY_LENGTH)
      const value = String(rawValue).trim().slice(0, MAX_PROPERTY_VALUE_LENGTH)
      if (!key || !value) continue
      properties[key] = value
    }
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      title,
      description,
      category: input.category,
      file_type: input.fileType,
      price,
      discount,
      asset_url: input.assetKey,
      image_urls: input.imageKeys,
      properties: Object.keys(properties).length > 0 ? properties : null,
      seller_id: user.id,
      is_live: true,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Create product error:', error)
    throw new Error('Failed to create product')
  }

  revalidatePath('/dashboard/products')

  return { id: data.id as string }
}

type UpdateProductInput = {
  id: string
  title: string
  description: string
  category: string
  price: number
  discount: number
  imageKeys: string[]
  properties?: Record<string, string>
}

export async function updateProduct(input: UpdateProductInput) {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  if (!input.id) {
    throw new Error('Product ID is required')
  }

  const title = input.title?.trim()
  if (!title || title.length < 3 || title.length > 120) {
    throw new Error('Title must be between 3 and 120 characters')
  }

  const description = (input.description || '').trim().slice(0, 5000)
  if (!description) {
    throw new Error('Description is required')
  }

  if (!CATEGORIES.includes(input.category)) {
    throw new Error('Invalid category')
  }

  const price = Number(input.price)
  if (!Number.isFinite(price) || price < 0 || price > 100000) {
    throw new Error('Invalid price')
  }

  const discount = Number(input.discount) || 0
  if (discount < 0 || discount > 100) {
    throw new Error('Invalid discount')
  }

  if (!Array.isArray(input.imageKeys) || input.imageKeys.length === 0 || input.imageKeys.length > 6) {
    throw new Error('Upload between 1 and 6 images')
  }
  for (const path of input.imageKeys) {
    const validRelative = path.startsWith(`${user.id}/`)
    const validPublic = path.includes(`/product-images/${user.id}/`)
    if (!validRelative && !validPublic) {
      throw new Error('Invalid image reference')
    }
  }

  const rawProperties = input.properties
  const properties: Record<string, string> = {}
  if (rawProperties && typeof rawProperties === 'object') {
    const entries = Object.entries(rawProperties)
    if (entries.length > MAX_PROPERTIES) {
      throw new Error(`You can add up to ${MAX_PROPERTIES} properties`)
    }
    for (const [rawKey, rawValue] of entries) {
      const key = String(rawKey).trim().slice(0, MAX_PROPERTY_KEY_LENGTH)
      const value = String(rawValue).trim().slice(0, MAX_PROPERTY_VALUE_LENGTH)
      if (!key || !value) continue
      properties[key] = value
    }
  }

  const { error } = await supabase
    .from('products')
    .update({
      title,
      description,
      category: input.category,
      price,
      discount,
      image_urls: input.imageKeys,
      properties: Object.keys(properties).length > 0 ? properties : null,
    })
    .eq('id', input.id)
    .eq('seller_id', user.id)

  if (error) {
    console.error('Update product error:', error)
    throw new Error('Failed to update product')
  }

  revalidatePath('/dashboard/products')
  revalidatePath(`/dashboard/products/edit/${input.id}`)

  return { success: true }
}
