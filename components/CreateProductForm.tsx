'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CloudUploadIcon,
  Delete02Icon,
  DragDropVerticalIcon,
  File02Icon,
  Loading03Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import { createProduct } from '@/app/actions/Products'
import { createClient } from '@/utils/SupabaseClient'

// Browser Supabase client — used to upload images directly to Storage
// under the signed-in seller's own session (enforced by bucket RLS).
const supabase = createClient()

const CATEGORIES = [ "Online Courses and Workshops",
  "Ebooks and Audiobooks",
  "Workbooks and Guides",
  "Paid Newsletters",
  "Digital Planners and Journals",
  "Software and Plugins",
  "Notion and Spreadsheet Templates",
  "Swipe Files and Cheat Sheets",
  "Graphic Design Elements",
  "Fonts",
  "3D Models",
  "Stock Photography",
  "Presets and LUTs",
  "Music and Sound Effects",
  "Video Footage and Animations",
  "AI Prompts",
  "Memberships and Communities",
  ]
  
const MAX_IMAGES = 6
const MAX_PROPERTIES = 20
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_ASSET_SIZE = 500 * 1024 * 1024 // 500MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_ASSET_TYPES = [
  'application/pdf',
  'application/epub+zip',
  'application/zip',
  'application/x-zip-compressed',
  'video/mp4',
  'audio/mpeg',
]

type ImageItem = {
  id: string
  file: File
  preview: string
}

type Step = 'idle' | 'uploading-asset' | 'uploading-images' | 'saving'

async function uploadAssetToS3(
  file: File,
  title: string,
  onProgress?: (pct: number) => void
) {
  const presignRes = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'asset',
      fileName: file.name,
      contentType: file.type,
      title,
    }),
  })

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to prepare upload')
  }

  const { url, fields, key, fileType } = await presignRes.json()

  const formData = new FormData()
  Object.entries(fields as Record<string, string>).forEach(([k, v]) => formData.append(k, v))
  formData.append('file', file)

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error('Upload failed, please try again'))
    }
    xhr.onerror = () => reject(new Error('Upload failed, please try again'))
    xhr.send(formData)
  })

  return { key: key as string, fileType: fileType as string | null }
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

// Images upload straight to the Supabase 'product-images' bucket using
// the seller's own session — Storage RLS restricts writes to their own
// folder, same principle as the S3 key-prefix check used for the asset.
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

export default function CreateProductForm() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [price, setPrice] = useState('')
  const [discount, setDiscount] = useState('')
  const [properties, setProperties] = useState<{ id: string; key: string; value: string }[]>([
    { id: `${Date.now()}`, key: '', value: '' },
  ])

  const [asset, setAsset] = useState<File | null>(null)
  const [images, setImages] = useState<ImageItem[]>([])
  const dragIndexRef = useRef<number | null>(null)

  const [step, setStep] = useState<Step>('idle')
  const [progress, setProgress] = useState(0)
  const [imageProgress, setImageProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)

  const assetInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const isSubmitting = step !== 'idle'

  // Avoid leaking blob URLs
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAssetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (!ALLOWED_ASSET_TYPES.includes(file.type)) {
      setError('Unsupported file type. Use PDF, EPUB, ZIP, MP4 or MP3.')
      return
    }
    if (file.size > MAX_ASSET_SIZE) {
      setError('File is too large. Max size is 500MB.')
      return
    }
    setAsset(file)
    if (assetInputRef.current) assetInputRef.current.value = ''
  }

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setError(null)

    const remainingSlots = MAX_IMAGES - images.length
    if (remainingSlots <= 0) {
      setError('You can upload up to 6 images.')
      return
    }

    const valid: ImageItem[] = []
    for (const file of files.slice(0, remainingSlots)) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError('Images must be JPG, PNG or WEBP.')
        continue
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError('Each image must be under 5MB.')
        continue
      }
      valid.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      })
    }

    setImages((prev) => [...prev, ...valid])
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((img) => img.id !== id)
    })
  }

  const addPropertyRow = () => {
    if (properties.length >= MAX_PROPERTIES) return
    setProperties((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, key: '', value: '' },
    ])
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
    if (!asset) return 'Upload your product file.'
    if (images.length === 0) return 'Upload at least 1 image.'

    const filledKeys = new Set<string>()
    for (const row of properties) {
      const key = row.key.trim()
      const value = row.value.trim()
      if (!key && !value) continue // empty row, ignored on submit
      if (!key || !value) return 'Each property needs both a name and a value.'
      const normalizedKey = key.toLowerCase()
      if (filledKeys.has(normalizedKey)) return `Duplicate property name: "${key}".`
      filledKeys.add(normalizedKey)
    }

    return null
  }

  // Build a clean { key: value } object from the rows, dropping empty ones
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
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Your session has expired. Please log in again.')
        setStep('idle')
        return
      }

      // 1. Upload the digital asset first (private S3 bucket)
      setStep('uploading-asset')
      setProgress(0)
      const { key: assetKey, fileType } = await uploadAssetToS3(asset as File, title, setProgress)

      // 2. Upload images to Supabase Storage, preserving the order the seller arranged
      setStep('uploading-images')
      setImageProgress({ done: 0, total: images.length })
      const imageKeys: string[] = []
      for (const img of images) {
        const path = await uploadImageToSupabase(img.file, title, user.id)
        imageKeys.push(path)
        setImageProgress((p) => ({ ...p, done: p.done + 1 }))
      }

      // 3. Create the product record (seller_id is derived server-side)
      setStep('saving')
      const result = await createProduct({
        title,
        description,
        category,
        price: Number(price),
        discount: discount ? Number(discount) : 0,
        assetKey,
        fileType: fileType || 'FILE',
        imageKeys,
        properties: buildPropertiesObject(),
      })

      router.push(`/dashboard/products/`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStep('idle')
    }
  }

  const submitLabel = () => {
    if (step === 'uploading-asset') return `Uploading file (${progress}%)`
    if (step === 'uploading-images') return `Uploading images ${imageProgress.done}/${imageProgress.total}`
    if (step === 'saving') return 'Creating product…'
    return 'Publish product'
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
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

      {/* Asset upload */}
      <div>
        <label className="block text-sm font-grotesk font-semibold text-gray-600 mb-1.5">Product file</label>
        <input
          ref={assetInputRef}
          type="file"
          accept={ALLOWED_ASSET_TYPES.join(',')}
          onChange={handleAssetChange}
          disabled={isSubmitting}
          className="hidden"
        />
        {asset ? (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3 min-w-0">
              <HugeiconsIcon icon={File02Icon} size={20} className="text-gray-700 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-general font-semibold text-black/70 truncate">{asset.name}</p>
                <p className="text-xs text-blue-400 font-general font-medium">{(asset.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
            </div>
            {!isSubmitting && (
              <button
                type="button"
                onClick={() => setAsset(null)}
                className="text-gray-500 hover:text-red-600 transition-colors flex-shrink-0 cursor-pointer"
              >
                <HugeiconsIcon icon={Delete02Icon} size={18} />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => assetInputRef.current?.click()}
            disabled={isSubmitting}
            className="w-full flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-lg border-2 border-dashed bg-zinc-100 border-zinc-300 hover:border-blue-400 hover:bg-gray-100 transition-colors text-blue-500 disabled:opacity-50 cursor-pointer"
          >
            <HugeiconsIcon icon={CloudUploadIcon} size={22} />
            <span className="text-sm font-general font-medium">Click to upload your file</span>
            <span className="text-xs text-gray-500 font-grotesk font-medium">PDF, EPUB, ZIP, MP4 or MP3 — up to 500MB</span>
          </button>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black text-white font-general font-medium text-sm hover:bg-zinc-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed min-w-[190px] justify-center"
        >
          {isSubmitting && <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />}
          {submitLabel()}
        </button>
      </div>
    </form>
  )
}