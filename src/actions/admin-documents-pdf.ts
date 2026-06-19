'use server'

import { createHash } from 'crypto'
import { revalidatePath } from 'next/cache'
import { PDFDocument } from 'pdf-lib'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { INVESTOR_BUCKET } from '@/lib/storage/constants'

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

async function assertAdmin(): Promise<
  { error: string } | { error?: never; userId: string; email: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Forbidden' }
  return { userId: user.id, email: user.email ?? 'admin' }
}

async function processAndMetadataPdf(
  buffer: Buffer,
  stripFirst: boolean,
): Promise<{ buffer: Buffer; sha256: string; fileSize: number; pageCount: number }> {
  const doc = await PDFDocument.load(buffer)
  if (stripFirst && doc.getPageCount() > 1) {
    doc.removePage(0)
  }
  const stripped = Buffer.from(await doc.save())
  const sha256 = createHash('sha256').update(stripped).digest('hex')
  return {
    buffer: stripped,
    sha256,
    fileSize: stripped.length,
    pageCount: doc.getPageCount(),
  }
}

function parseGoogleDriveLink(link: string): { fileId: string; webViewLink: string } | null {
  const trimmed = link.trim()
  if (!trimmed) return null
  // Match /d/<ID>/ pattern in Google URLs
  const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]{10,})(\/|$)/)
  if (match) return { fileId: match[1], webViewLink: trimmed }
  // Bare file ID (alphanumeric, 28–44 chars)
  if (/^[a-zA-Z0-9_-]{28,44}$/.test(trimmed)) {
    return {
      fileId: trimmed,
      webViewLink: `https://drive.google.com/file/d/${trimmed}/view`,
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Action 1: createDocumentFromPdf
// ---------------------------------------------------------------------------

const VALID_AUDIENCES = ['prospect', 'investor', 'board'] as const

export async function createDocumentFromPdf(
  formData: FormData,
): Promise<{ success: true; id: string } | { error: string }> {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  // --- Parse inputs ---
  const file         = formData.get('file') as File | null
  const title        = (formData.get('title') as string | null)?.trim() ?? ''
  const categoryId   = (formData.get('category_id') as string | null)?.trim() ?? ''
  const audience     = (formData.get('audience') as string | null) ?? 'investor'
  const status       = (formData.get('status') as string | null) ?? 'draft'
  const sortOrderRaw = formData.get('sort_order')
  const sortOrder    = sortOrderRaw ? parseInt(sortOrderRaw as string, 10) : 0
  const gdLink       = (formData.get('google_drive_link') as string | null) ?? ''
  const stripFirst   = formData.get('strip_first_page') === '1'

  // --- Validate ---
  if (!file) return { error: 'A PDF file is required.' }
  if (file.type !== 'application/pdf') return { error: 'File must be a PDF.' }
  if (file.size > 50 * 1024 * 1024) return { error: 'File must be under 50 MB.' }
  if (!title) return { error: 'Title is required.' }
  if (!categoryId) return { error: 'Category is required.' }
  if (!VALID_AUDIENCES.includes(audience as typeof VALID_AUDIENCES[number]))
    return { error: 'Invalid audience.' }

  // --- Process PDF ---
  const rawBuffer = Buffer.from(await file.arrayBuffer())
  const { buffer, sha256: pdf_sha256, fileSize: file_size_bytes, pageCount: page_count } =
    await processAndMetadataPdf(rawBuffer, stripFirst)

  // --- Parse Google Drive link ---
  let source_type: string
  let googleFileId: string | null = null
  let googleWebViewLink: string | null = null
  let syncStatus: string

  const gdParsed = gdLink ? parseGoogleDriveLink(gdLink) : null
  if (gdParsed) {
    source_type        = 'google_drive'
    googleFileId       = gdParsed.fileId
    googleWebViewLink  = gdParsed.webViewLink
    syncStatus         = 'synced'
  } else {
    source_type = 'manual_upload'
    syncStatus  = 'manual_only'
  }

  const admin = createAdminClient()

  // --- Insert document row ---
  const { data: doc, error: insertErr } = await admin
    .from('documents')
    .insert({
      title,
      category_id: categoryId,
      audience,
      status,
      doc_type: 'document',
      source_kind: 'upload',
      sort_order: isNaN(sortOrder) ? 0 : sortOrder,
      current_version: 1,
      source_type,
      google_file_id: googleFileId ?? null,
      google_web_view_link: googleWebViewLink ?? null,
      sync_status: syncStatus,
      pdf_sha256,
      file_size_bytes,
      page_count,
      ...(status === 'published' ? { published_at: new Date().toISOString() } : {}),
    })
    .select('id')
    .single()

  if (insertErr || !doc) return { error: insertErr?.message ?? 'Failed to create document.' }

  // --- Upload PDF to storage ---
  const storagePath = `documents/${doc.id}/current.pdf`

  const { error: uploadErr } = await admin.storage
    .from(INVESTOR_BUCKET)
    .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true })

  if (uploadErr) {
    await admin.from('documents').delete().eq('id', doc.id)
    return { error: `Upload failed: ${uploadErr.message}` }
  }

  // --- Update pdf_path + pdf_generated_at ---
  const { error: updateErr } = await admin
    .from('documents')
    .update({
      pdf_path: storagePath,
      pdf_generated_at: new Date().toISOString(),
    })
    .eq('id', doc.id)

  if (updateErr) {
    await admin.from('documents').delete().eq('id', doc.id)
    return { error: updateErr.message }
  }

  revalidatePath('/admin/documents')
  revalidatePath('/investor/documents')

  return { success: true, id: doc.id }
}

// ---------------------------------------------------------------------------
// Action 2: replaceDocumentPdf
// ---------------------------------------------------------------------------

export async function replaceDocumentPdf(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  // --- Parse inputs ---
  const id         = (formData.get('id') as string | null)?.trim() ?? ''
  const file       = formData.get('file') as File | null
  const stripFirst = formData.get('strip_first_page') === '1'

  // --- Validate ---
  if (!id) return { error: 'Document ID is required.' }
  if (!file) return { error: 'A PDF file is required.' }
  if (file.type !== 'application/pdf') return { error: 'File must be a PDF.' }
  if (file.size > 50 * 1024 * 1024) return { error: 'File must be under 50 MB.' }

  const admin = createAdminClient()

  // --- Check if doc is Google Drive linked ---
  const { data: existing, error: fetchErr } = await admin
    .from('documents')
    .select('source_type')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) return { error: fetchErr?.message ?? 'Document not found.' }

  const googleDriveLinked = existing.source_type === 'google_drive'

  // --- Process PDF ---
  const rawBuffer = Buffer.from(await file.arrayBuffer())
  const { buffer, sha256: pdf_sha256, fileSize: file_size_bytes, pageCount: page_count } =
    await processAndMetadataPdf(rawBuffer, stripFirst)

  // --- Upload to storage ---
  const storagePath = `documents/${id}/current.pdf`

  const { error: uploadErr } = await admin.storage
    .from(INVESTOR_BUCKET)
    .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true })

  if (uploadErr) return { error: `Upload failed: ${uploadErr.message}` }

  // --- Update document metadata ---
  const { error: updateErr } = await admin
    .from('documents')
    .update({
      pdf_path: storagePath,
      pdf_generated_at: new Date().toISOString(),
      pdf_sha256,
      file_size_bytes,
      page_count,
      sync_status: googleDriveLinked ? 'synced' : 'manual_only',
      last_synced_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateErr) return { error: updateErr.message }

  revalidatePath('/admin/documents')
  revalidatePath(`/admin/documents/${id}/edit`)
  revalidatePath('/investor/documents')

  return { success: true }
}
