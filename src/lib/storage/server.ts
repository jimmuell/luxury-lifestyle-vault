// Server-side photo storage service — uses the admin (service role) client so
// it can bypass RLS for URL signing, downloads, and archival operations.
// Never import this from a Client Component.

import { createAdminClient } from '@/lib/supabase/admin'
import {
  ACTIVE_BUCKET,
  ARCHIVE_BUCKET,
  SIGNED_URL_TTL,
  type PhotoStorage,
} from './constants'

async function supabase() {
  return createAdminClient()
}

export const photoStorage: PhotoStorage = {
  async getSignedUrl(path, opts = {}) {
    const bucket = opts.bucket ?? ACTIVE_BUCKET
    const expiresIn = opts.expiresIn ?? SIGNED_URL_TTL
    const sb = await supabase()
    const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, expiresIn)
    if (error) throw new Error(`Failed to sign URL: ${error.message}`)
    return data.signedUrl
  },

  async getSignedUrls(paths, opts = {}) {
    if (paths.length === 0) return {}
    const bucket = opts.bucket ?? ACTIVE_BUCKET
    const expiresIn = opts.expiresIn ?? SIGNED_URL_TTL
    const sb = await supabase()
    const { data } = await sb.storage.from(bucket).createSignedUrls(paths, expiresIn)
    const map: Record<string, string> = {}
    data?.forEach(({ path, signedUrl }) => {
      if (path && signedUrl) map[path] = signedUrl
    })
    return map
  },

  async downloadPhoto(path, opts = {}) {
    const bucket = opts.bucket ?? ACTIVE_BUCKET
    const sb = await supabase()
    const { data, error } = await sb.storage.from(bucket).download(path)
    if (error) throw new Error(`Storage download failed: ${error.message}`)
    return Buffer.from(await data.arrayBuffer())
  },

  async deletePhoto(path, opts = {}) {
    const bucket = opts.bucket ?? ACTIVE_BUCKET
    const sb = await supabase()
    const { error } = await sb.storage.from(bucket).remove([path])
    if (error) throw new Error(`Delete failed: ${error.message}`)
  },

  async listPhotosByItem(clientId, itemId, opts = {}) {
    const bucket = opts.bucket ?? ACTIVE_BUCKET
    const sb = await supabase()
    const prefix = `${clientId}/${itemId}/`
    const { data, error } = await sb.storage.from(bucket).list(prefix)
    if (error) throw new Error(`List failed: ${error.message}`)
    return (data ?? []).map(f => `${prefix}${f.name}`)
  },

  async moveToArchive(path) {
    const sb = await supabase()
    const { data: blob, error: dlErr } = await sb.storage.from(ACTIVE_BUCKET).download(path)
    if (dlErr) throw new Error(`Archive download failed: ${dlErr.message}`)
    const { error: upErr } = await sb.storage
      .from(ARCHIVE_BUCKET)
      .upload(path, blob, { upsert: true })
    if (upErr) throw new Error(`Archive upload failed: ${upErr.message}`)
    const { error: rmErr } = await sb.storage.from(ACTIVE_BUCKET).remove([path])
    if (rmErr) throw new Error(`Archive remove-source failed: ${rmErr.message}`)
    return path
  },
}

// Named re-exports for ergonomic single-function imports
export const { getSignedUrl, getSignedUrls, downloadPhoto, deletePhoto, listPhotosByItem, moveToArchive } = photoStorage
