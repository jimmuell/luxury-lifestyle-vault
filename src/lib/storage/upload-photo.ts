'use client'

// Browser-side photo upload — uses the anon Supabase client so Storage RLS
// enforces folder-prefix = auth.uid(). Never call this from a Server Component.
// For server-side URL signing, downloads, or archival, use src/lib/storage/server.ts.

import { createClient } from '@/lib/supabase/client'
import {
  ACTIVE_BUCKET,
  SIGNED_URL_TTL,
  MAX_PHOTO_BYTES,
  ALLOWED_PHOTO_MIME_TYPES,
  type PhotoType,
  type UploadedPhoto,
} from './constants'

export type { PhotoType, UploadedPhoto }

async function toJpeg(file: File): Promise<File> {
  if (!file.type.includes('heic') && !file.type.includes('heif')) return file
  const heic2any = (await import('heic2any')).default
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 }) as Blob
  return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
}

async function downscaleAndEncode(file: File): Promise<File> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const { width, height } = bitmap
  const maxEdge = 2048
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  const targetW = Math.round(width * scale)
  const targetH = Math.round(height * scale)

  if (scale === 1 && file.type === 'image/webp') {
    bitmap.close()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) { bitmap.close(); return file }
  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close()

  const baseName = file.name.replace(/\.[^.]+$/, '')

  const webpBlob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(b => resolve(b), 'image/webp', 0.82)
  )
  if (webpBlob && webpBlob.type === 'image/webp') {
    return new File([webpBlob], `${baseName}.webp`, { type: 'image/webp' })
  }

  const jpegBlob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(b => resolve(b), 'image/jpeg', 0.85)
  )
  if (jpegBlob) {
    return new File([jpegBlob], `${baseName}.jpg`, { type: 'image/jpeg' })
  }

  return file
}

function validate(file: File) {
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error(`File too large — max 10 MB (got ${(file.size / 1024 / 1024).toFixed(1)} MB)`)
  }
  const normalised = file.type.toLowerCase()
  if (!ALLOWED_PHOTO_MIME_TYPES.some(t => normalised.includes(t.split('/')[1]))) {
    throw new Error(`Unsupported file type: ${file.type}`)
  }
}

export async function uploadItemPhoto({
  clientId,
  itemId,
  file,
  photoType,
  sortOrder = 0,
  caption,
}: {
  clientId: string
  itemId: string
  file: File
  photoType: PhotoType
  sortOrder?: number
  caption?: string
}): Promise<UploadedPhoto> {
  const jpeg = await toJpeg(file)
  const converted = await downscaleAndEncode(jpeg)
  validate(converted)

  const ext = converted.name.split('.').pop() ?? 'jpg'
  const uuid = crypto.randomUUID()
  // Path matches storage RLS: first folder segment must equal auth.uid()
  const storagePath = `${clientId}/${itemId}/${uuid}-${photoType}.${ext}`

  const sb = createClient()

  const { error: uploadError } = await sb.storage
    .from(ACTIVE_BUCKET)
    .upload(storagePath, converted, { contentType: converted.type, upsert: false })

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

  const { data: signedData } = await sb.storage
    .from(ACTIVE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL)

  const { data: photoRow, error: dbError } = await sb
    .from('item_photos')
    .insert({
      item_id: itemId,
      uploaded_by: clientId,
      storage_path: storagePath,
      storage_bucket: ACTIVE_BUCKET,
      photo_type: photoType,
      sort_order: sortOrder,
      caption: caption ?? null,
    })
    .select('id')
    .single()

  if (dbError) throw new Error(`DB insert failed: ${dbError.message}`)

  return {
    id: photoRow.id,
    storagePath,
    signedUrl: signedData?.signedUrl ?? '',
    photoType,
  }
}
