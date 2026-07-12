'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CloudUploadIcon,
  Delete02Icon,
  DragDropVerticalIcon,
  Loading03Icon,
  PlusSignIcon,
  ArrowLeft02Icon,
} from '@hugeicons/core-free-icons'
import { updateProduct } from '@/app/actions/Products'
import { CATEGORIES } from '@/utils/constants'
import { createClient } from '@/utils/SupabaseClient'

const supabase = createClient()

const MAX_IMAGES = 6
const MAX_PROPERTIES = 20
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type ImageItem = {
  id: string
  file?: File
  preview: string
  existingKey?: string
}

type ProductProp = {
  id: string
  title: string
  description: string
  category: string
  price: number
  discount: number
  image_urls?: string[] | string | null
  properties?: Record<string, string> | null
}

function resolveImageUrl(path: string) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
    return path
  }
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data?.publicUrl || path
}

function parseImageUrls(imageUrls: string[] | string | null | undefined): string[] {
  if (!imageUrls) return []
  if (Array.isArray(imageUrls)) return imageUrls
  if (typeof imageUrls === 'string') {
    try {
      const parsed = JSON.parse(imageUrls)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return [imageUrls]
    }
  }
  return []
}

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 60) || 'image'
  )
}

async function uploadImageToSupabase(file: File, title: string, userId: string) {
  const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/)
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg'
  const storagePath = `${userId}/${slugify(title)}-${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('product-images').upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })

  if (error) {
    throw new Error(error.message || 'Image upload failed')
  }

  return `https://ersuemtbcjynjmmmamwa.supabase.co/storage/v1/object/public/product-images/${storagePath}`
}

export default function EditProductForm({ product }: { product: ProductProp }) {
  const router = useRouter()

  const [title, setTitle] = useState(product.title || '')
  const [description, setDescription] = useState(product.description || '')
  const [category, setCategory] = useState(product.category || CATEGORIES[0])
  const [price, setPrice] = useState(product.price !== null && product.price !== undefined ? String(product.price) : '')
  const [discount, setDiscount] = useState(product.discount ? String(product.discount) : '')

  const [properties, setProperties] = useState<{ id: string; key: string; value: string }[]>(() => {
    if (product.properties && typeof product.properties === 'object') {
      const entries = Object.entries(product.properties)
      if (entries.length > 0) {
        return entries.map(([key, value], idx) => ({
          id: `prop-${idx}-${Date.now()}`,
          key,
          value: String(value),
        }))
      }
    }
    return [{ id: `prop-0-${Date.now()}`, key: '', value: '' }]
  })

  const [images, setImages] = useState<ImageItem[]>(() => {
    const rawKeys = parseImageUrls(product.image_urls)
    return rawKeys.map((key, idx) => ({
      id: `existing-${idx}-${Date.now()}`,
      existingKey: key,
      preview: resolveImageUrl(key),
    }))
  })

  const dragIndexRef = useRef<number | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stepText, setStepText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.file) URL.revokeObjectURL(img.preview)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setError(null)

    const remainingSlots = MAX_IMAGES - images.length
    if (remainingSlots <= 0) {
      setError('You can upload up to 6 images.')
      return
    }

    const validFiles = files.slice(0, remainingSlots)
    const newItems: ImageItem[] = []

    for (const file of validFiles) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError('Unsupported image format. Use JPG, PNG, or WebP.')
        continue
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError('An image is over 5MB. Please compress it first.')
        continue
      }
      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
      })
    }

    if (newItems.length) {
      setImages((prev) => [...prev, ...newItems])
    }
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target?.file) URL.revokeObjectURL(target.preview)
      return prev.filter((item) => item.id !== id)
    })
  }

  const addPropertyRow = () => {
    if (properties.length >= MAX_PROPERTIES) return
    setProperties((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, key: '', value: '' }])
  }

  const updatePropertyRow = (id: string, field: 'key' | 'value', value: string) => {
    setProperties((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const removePropertyRow = (id: string) => {
    setProperties((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev))
  }

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    const from = dragIndexRef.current
    if (from === null || from === index) return
    setImages((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(index, 0, moved)
      return next
    })
    dragIndexRef.current = index
  }

  const handleDragEnd = () => {
    dragIndexRef.current = null
  }

  const validate = () => {
    if (title.trim().length < 3) return 'Title must be at least 3 characters.'
    if (!description.trim()) return 'Add a short description.'
    const priceNum = Number(price)
    if (!price || Number.isNaN(priceNum) || priceNum < 0) return 'Enter a valid price.'
    if (discount) {
      const discountNum = Number(discount)
      if (Number.isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
        return 'Discount must be between 0 and 100.'
      }
    }
    if (images.length === 0) return 'Please provide at least 1 image.'

    const filledKeys = new Set<string>()
    for (const row of properties) {
      const key = row.key.trim()
      const value = row.value.trim()
      if (!key && !value) continue
      if (!key || !value) return 'Each property needs both a name and a value.'
      const normalizedKey = key.toLowerCase()
      if (filledKeys.has(normalizedKey)) return `Duplicate property name: "${key}".`
      filledKeys.add(normalizedKey)
    }

    return null
  }

  const buildPropertiesObject = () => {
    const result: Record<string, string> = {}
    for (const row of properties) {
      const key = row.key.trim()
      const value = row.value.trim()
      if (key && value) result[key] = value
    }
    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setIsSubmitting(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Your session has expired. Please log in again.')
        setIsSubmitting(false)
        return
      }

      setStepText('Saving images...')
      const imageKeys: string[] = []
      for (const img of images) {
        if (img.existingKey && !img.file) {
          const normalizedUrl = img.existingKey.startsWith('http')
            ? img.existingKey
            : `https://ersuemtbcjynjmmmamwa.supabase.co/storage/v1/object/public/product-images/${img.existingKey}`
          imageKeys.push(normalizedUrl)
        } else if (img.file) {
          const path = await uploadImageToSupabase(img.file, title, user.id)
          imageKeys.push(path)
        }
      }

      setStepText('Updating product details...')
      await updateProduct({
        id: product.id,
        title,
        description,
        category,
        price: Number(price),
        discount: discount ? Number(discount) : 0,
        imageKeys,
        properties: buildPropertiesObject(),
      })

      router.push('/dashboard/products')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsSubmitting(false)
      setStepText(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 font-general font-medium">
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-grotesk font-semibold text-gray-600 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            disabled={isSubmitting}
            placeholder="Give a name to your product"
            className="w-full px-3.5 py-2 rounded-lg border-2 bg-gray-100 outline-none border-gray-200 text-sm text-black/90 font-medium font-general focus:border-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-grotesk font-semibold text-gray-600 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            rows={5}
            disabled={isSubmitting}
            placeholder="What's included, who it's for, and why it's worth buying."
            className="w-full px-3.5 py-2 rounded-lg border-2 border-gray-200 bg-gray-100 text-sm text-black/90 font-general font-medium outline-none focus:border-blue-400 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-grotesk font-semibold text-gray-600 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 rounded-lg border-2 bg-gray-100 outline-none border-gray-200 text-sm text-black/90 font-medium font-general focus:border-blue-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="text-sm text-black/80 font-grotesk font-semibold">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-grotesk font-semibold text-gray-600 mb-1.5">Price (INR)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={isSubmitting}
              placeholder="99.00"
              className="w-full px-3.5 py-2 rounded-lg border-2 bg-gray-100 outline-none border-gray-200 text-sm text-black/90 font-medium font-general focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-grotesk font-semibold text-gray-600 mb-1.5">Discount %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              disabled={isSubmitting}
              placeholder="0.00"
              className="w-full px-3.5 py-2 rounded-lg border-2 bg-gray-100 outline-none border-gray-200 text-sm text-black/90 font-medium font-general focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      {/* Properties */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-grotesk font-semibold text-gray-600">
            Properties <span className="text-gray-500 italic">(optional)</span>
          </label>
          {properties.length < MAX_PROPERTIES && (
            <button
              type="button"
              onClick={addPropertyRow}
              disabled={isSubmitting}
              className="text-xs font-general font-semibold text-blue-500/90 cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={2}/>
              Add property
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 font-general font-medium mb-3">
          Extra details shown on the product page, e.g. Format: PDF, Pages: 120, Language: English.
        </p>

        <div className="space-y-2">
          {properties.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <input
                type="text"
                value={row.key}
                onChange={(e) => updatePropertyRow(row.id, 'key', e.target.value)}
                disabled={isSubmitting}
                maxLength={60}
                placeholder="e.g. Format"
                className="w-1/3 px-3.5 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-100 text-sm text-black/90 font-general font-medium outline-none focus:border-blue-400"
              />
              <input
                type="text"
                value={row.value}
                onChange={(e) => updatePropertyRow(row.id, 'value', e.target.value)}
                disabled={isSubmitting}
                maxLength={120}
                placeholder="PDF"
                className="flex-1 px-3.5 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-100 text-sm text-black/90 font-general font-medium outline-none focus:border-blue-400"
              />
              <button
                type="button"
                onClick={() => removePropertyRow(row.id)}
                disabled={isSubmitting || properties.length === 1}
                className="p-2.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40 hover:bg-gray-100 flex-shrink-0 cursor-pointer rounded-lg"
                aria-label="Remove property"
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Image uploads */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-grotesk font-semibold text-gray-600">
            Images ({images.length}/{MAX_IMAGES})
          </label>
          {images.length > 1 && (
            <span className="text-xs text-gray-400 font-general font-medium">Drag to reorder, first image is the cover</span>
          )}
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          multiple
          onChange={handleImagesChange}
          disabled={isSubmitting}
          className="hidden"
        />

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img, index) => (
            <div
              key={img.id}
              draggable={!isSubmitting}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group cursor-grab active:cursor-grabbing"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.preview} alt="" className="w-full h-full object-cover pointer-events-none" />
              {index === 0 && (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-semibold">
                  Cover
                </span>
              )}
              <span className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <HugeiconsIcon icon={DragDropVerticalIcon} size={14} />
              </span>
              {!isSubmitting && (
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={14} />
                </button>
              )}
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isSubmitting}
              className="aspect-square rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-100 hover:border-zinc-400 transition-colors flex flex-col items-center justify-center gap-1 text-blue-500 disabled:opacity-50 cursor-pointer"
            >
              <HugeiconsIcon icon={CloudUploadIcon} size={18} />
              <span className="text-sm font-general font-medium text-blue-500">Add image</span>
            </button>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Link
          href="/dashboard/products"
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-general font-medium text-sm hover:bg-gray-100 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black text-white font-general font-medium text-sm hover:bg-zinc-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed min-w-[170px] justify-center"
        >
          {isSubmitting && <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />}
          {isSubmitting ? (stepText || 'Saving...') : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
