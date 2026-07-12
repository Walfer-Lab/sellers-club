import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { createClient } from '@/utils/SupabaseServer'
import { s3, S3_BUCKET } from '@/app/actions/s3-bucket'

// Only the digital product file goes through S3 now. Product images
// upload directly to the Supabase 'product-images' bucket from the
// client, guarded by Storage RLS instead of a presigned URL.

// contentType -> value stored in products.file_type
const ALLOWED_ASSET_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/epub+zip': 'EPUB',
  'application/zip': 'ZIP',
  'application/x-zip-compressed': 'ZIP',
  'video/mp4': 'MP4',
  'audio/mpeg': 'MP3',
}

const MAX_ASSET_SIZE = 500 * 1024 * 1024 // 500MB
const URL_EXPIRY_SECONDS = 60

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 60) || 'file'
  )
}

export async function POST(req: NextRequest) {
  // 1. Auth — never trust a seller id from the client
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { kind, fileName, contentType, title } = body as {
    kind?: 'asset'
    fileName?: string
    contentType?: string
    title?: string
  }

  if (kind !== 'asset') {
    return NextResponse.json({ error: 'Invalid upload kind' }, { status: 400 })
  }
  if (!fileName || !contentType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (typeof fileName !== 'string' || fileName.length > 255) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 })
  }

  const fileType = ALLOWED_ASSET_TYPES[contentType]
  if (!fileType) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  // Key is namespaced under the seller's own id — this is what the
  // create-product action later checks to reject spoofed keys.
  const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/)
  const ext = extMatch ? extMatch[1].toLowerCase() : ''
  const slug = slugify(title || fileName.replace(/\.[^/.]+$/, ''))
  const key = `products/${user.id}/asset/${slug}-${randomUUID()}${ext ? `.${ext}` : ''}`

  try {
    const { url, fields } = await createPresignedPost(s3, {
      Bucket: S3_BUCKET,
      Key: key,
      Conditions: [
        ['content-length-range', 1, MAX_ASSET_SIZE],
        ['eq', '$Content-Type', contentType],
      ],
      Fields: {
        'Content-Type': contentType,
      },
      Expires: URL_EXPIRY_SECONDS,
    })

    return NextResponse.json({ url, fields, key, fileType })
  } catch (err) {
    console.error('Presign error:', err)
    return NextResponse.json({ error: 'Could not prepare upload' }, { status: 500 })
  }
}