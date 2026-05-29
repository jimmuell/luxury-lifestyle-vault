// Central registry for storage configuration.
// All bucket names and photo constants live here so a future R2 cold-archival
// tier is a swap in server.ts, not a search-and-replace across the codebase.

export const ACTIVE_BUCKET = 'item-photos' as const
export const ARCHIVE_BUCKET = 'item-photos-archive' as const

export type StorageBucket = typeof ACTIVE_BUCKET | typeof ARCHIVE_BUCKET

export const SIGNED_URL_TTL = 3600 // seconds — 1 hour

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024
export const ALLOWED_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]

export type PhotoType =
  | 'intake_front'
  | 'intake_back'
  | 'intake_detail'
  | 'intake_label'
  | 'condition_issue'
  | 'post_cleaning'
  | 'storage'
  | 'delivery'

export interface UploadedPhoto {
  id: string
  storagePath: string
  signedUrl: string
  photoType: PhotoType
}

// Interface contract — implementing a different provider (R2, GCS) means
// writing a new object that satisfies this shape.
export interface PhotoStorage {
  getSignedUrl(path: string, opts?: { bucket?: StorageBucket; expiresIn?: number }): Promise<string>
  getSignedUrls(paths: string[], opts?: { bucket?: StorageBucket; expiresIn?: number }): Promise<Record<string, string>>
  downloadPhoto(path: string, opts?: { bucket?: StorageBucket }): Promise<Buffer>
  deletePhoto(path: string, opts?: { bucket?: StorageBucket }): Promise<void>
  listPhotosByItem(clientId: string, itemId: string, opts?: { bucket?: StorageBucket }): Promise<string[]>
  moveToArchive(path: string): Promise<string>
}
