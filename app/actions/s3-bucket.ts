import { S3Client } from '@aws-sdk/client-s3'

const REGION = process.env.AWS_S3_REGION
const ACCESS_KEY_ID = process.env.AWS_S3_ACCESS_KEY_ID
const SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME

if (!REGION || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
  throw new Error(
    'Missing AWS S3 environment variables. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME.'
  )
}

export const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
})

export const S3_BUCKET = BUCKET_NAME

/**
 * Public URL for an S3 key. Use this only for objects meant to be public
 * (product images). Point NEXT_PUBLIC_S3_BASE_URL at a CloudFront domain
 * if you're fronting the bucket with a CDN — recommended over raw S3 URLs.
 */
export function getPublicUrl(key: string) {
  const base = process.env.NEXT_PUBLIC_S3_BASE_URL
  if (!base) {
    return `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${key}`
  }
  return `${base.replace(/\/$/, '')}/${key}`
}