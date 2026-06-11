'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { INVESTOR_BUCKET } from '@/lib/storage/constants'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return user
}

export async function uploadInvestorPresentation(formData: FormData) {
  await assertAdmin()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null
  const audience = (formData.get('audience') as string | null) ?? 'board'
  const sortOrderRaw = formData.get('sort_order')
  const sortOrder = sortOrderRaw ? parseInt(sortOrderRaw as string, 10) : 0
  const file = formData.get('file') as File | null

  if (!title) return { error: 'Title is required.' }
  if (!file) return { error: 'A PDF file is required.' }
  if (file.type !== 'application/pdf') return { error: 'File must be a PDF (application/pdf).' }
  if (!['prospect', 'board'].includes(audience)) return { error: 'Audience must be prospect or board.' }

  const storagePath = `presentations/${crypto.randomUUID()}.pdf`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const admin = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from(INVESTOR_BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) return { error: `Storage upload failed: ${uploadError.message}` }

  const { error: insertError } = await admin
    .from('investor_documents')
    .insert({
      title,
      description,
      storage_path: storagePath,
      file_type: 'pdf',
      file_size_bytes: file.size,
      doc_type: 'presentation',
      audience,
      sort_order: isNaN(sortOrder) ? 0 : sortOrder,
      is_published: true,
      section: 'presentations',
    })

  if (insertError) {
    // Clean up the uploaded file if the DB insert fails
    await admin.storage.from(INVESTOR_BUCKET).remove([storagePath])
    return { error: `Database insert failed: ${insertError.message}` }
  }

  revalidatePath('/admin/presentations')
  return { success: true }
}

export async function updatePresentation(formData: FormData) {
  await assertAdmin()

  const id = (formData.get('id') as string | null)?.trim() ?? ''
  const audience = (formData.get('audience') as string | null) ?? 'board'
  // Checkbox: present with value 'true' when checked, absent when unchecked.
  // We rely on is_published_sent sentinel to distinguish "unchecked" from "not submitted".
  const isPublished = formData.get('is_published') === 'true'

  if (!id) return { error: 'Presentation ID is required.' }
  if (!['prospect', 'board'].includes(audience)) return { error: 'Audience must be prospect or board.' }

  const admin = createAdminClient()

  const { error } = await admin
    .from('investor_documents')
    .update({ audience, is_published: isPublished })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/presentations')
  return { success: true }
}
