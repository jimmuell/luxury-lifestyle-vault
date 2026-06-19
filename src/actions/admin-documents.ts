'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { INVESTOR_BUCKET } from '@/lib/storage/constants'

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

export async function publishDocument(id: string) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()

  const { data: doc, error: fetchErr } = await admin
    .from('documents')
    .select('source_kind')
    .eq('id', id)
    .single()

  if (fetchErr || !doc) return { error: fetchErr?.message ?? 'Document not found.' }

  const { error } = await admin
    .from('documents')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/documents')
  revalidatePath(`/admin/documents/${id}/edit`)
  revalidatePath('/investor/documents')
  return { success: true }
}

export async function unpublishDocument(id: string) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('documents')
    .update({ status: 'draft' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/documents')
  revalidatePath(`/admin/documents/${id}/edit`)
  revalidatePath('/investor/documents')
  return { success: true }
}

export async function archiveDocument(id: string) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('documents')
    .update({ status: 'archived' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/documents')
  revalidatePath(`/admin/documents/${id}/edit`)
  revalidatePath('/investor/documents')
  return { success: true }
}

export async function deleteDocument(id: string) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()

  // Remove generated PDF from storage if present
  const { data: doc } = await admin
    .from('documents')
    .select('pdf_path')
    .eq('id', id)
    .single()

  if (doc?.pdf_path) {
    await admin.storage.from(INVESTOR_BUCKET).remove([doc.pdf_path])
  }

  const { error } = await admin.from('documents').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/documents')
  revalidatePath('/investor/documents')
  return { success: true }
}

export async function restoreVersion(docId: string, versionId: string) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }
  const { userId } = auth as { userId: string; email: string }

  const admin = createAdminClient()

  const { data: ver, error: verErr } = await admin
    .from('document_versions')
    .select('body_markdown, title, category_id, audience')
    .eq('id', versionId)
    .eq('document_id', docId)
    .single()

  if (verErr || !ver) return { error: verErr?.message ?? 'Version not found.' }

  const { data: current, error: fetchErr } = await admin
    .from('documents')
    .select('current_version')
    .eq('id', docId)
    .single()

  if (fetchErr || !current) return { error: fetchErr?.message ?? 'Document not found.' }

  const nextVersion = current.current_version + 1

  await admin
    .from('documents')
    .update({
      title:           ver.title ?? undefined,
      category_id:     ver.category_id ?? undefined,
      audience:        ver.audience ?? undefined,
      body_markdown:   ver.body_markdown,
      current_version: nextVersion,
      status:          'draft',
    })
    .eq('id', docId)

  await admin.from('document_versions').insert({
    document_id:   docId,
    version_no:    nextVersion,
    body_markdown: ver.body_markdown,
    title:         ver.title,
    category_id:   ver.category_id,
    audience:      ver.audience,
    created_by:    userId,
  })

  revalidatePath('/admin/documents')
  revalidatePath(`/admin/documents/${docId}/edit`)
  return { success: true }
}

export async function uploadDocumentPdf(formData: FormData) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const id   = (formData.get('id') as string | null)?.trim() ?? ''
  const file = formData.get('file') as File | null

  if (!id) return { error: 'Document ID is required.' }
  if (!file) return { error: 'A PDF file is required.' }
  if (file.type !== 'application/pdf') return { error: 'File must be a PDF.' }
  if (file.size > 50 * 1024 * 1024) return { error: 'File must be under 50 MB.' }

  const admin = createAdminClient()
  const storagePath = `documents/${id}.pdf`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await admin.storage
    .from(INVESTOR_BUCKET)
    .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true })

  if (uploadErr) return { error: `Upload failed: ${uploadErr.message}` }

  const { error: updateErr } = await admin
    .from('documents')
    .update({
      pdf_path:         storagePath,
      pdf_generated_at: new Date().toISOString(),
      status:           'published',
      published_at:     new Date().toISOString(),
    })
    .eq('id', id)

  if (updateErr) return { error: updateErr.message }

  revalidatePath('/admin/documents')
  revalidatePath(`/admin/documents/${id}/edit`)
  revalidatePath('/investor/documents')
  return { success: true }
}
