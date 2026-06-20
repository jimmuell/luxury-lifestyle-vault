'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/lib/inngest/client'

async function assertAdmin(): Promise<
  { error: string } | { error?: never; userId: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Forbidden' }
  return { userId: user.id }
}

export async function triggerDocumentSync(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const docId = (formData.get('id') as string | null)?.trim() ?? ''
  if (!docId) return { error: 'Document ID is required.' }

  // Confirm document is Drive-linked and sync is enabled
  const admin = createAdminClient()
  const { data: doc, error: fetchErr } = await admin
    .from('documents')
    .select('id, source_type, google_file_id, sync_enabled')
    .eq('id', docId)
    .single()

  if (fetchErr || !doc) return { error: fetchErr?.message ?? 'Document not found.' }
  if (doc.source_type !== 'google_drive' || !doc.google_file_id)
    return { error: 'Document is not linked to a Google Drive source.' }
  if (!doc.sync_enabled)
    return { error: 'Sync is disabled for this document.' }

  await inngest.send({
    name: 'documents/sync.requested' as never,
    data: { docId, force: true },
  })

  revalidatePath('/admin/documents')
  revalidatePath(`/admin/documents/${docId}/edit`)

  return { success: true }
}

export async function triggerSyncAll(): Promise<{ success: true } | { error: string }> {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  await inngest.send({
    name: 'documents/sync.requested.all' as never,
    data: { force: false },
  })

  revalidatePath('/admin/documents')

  return { success: true }
}

export async function updateSyncEnabled(
  docId: string,
  enabled: boolean,
): Promise<{ success: true } | { error: string }> {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  if (!docId) return { error: 'Document ID is required.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('documents')
    .update({ sync_enabled: enabled })
    .eq('id', docId)

  if (error) return { error: error.message }

  revalidatePath('/admin/documents')
  revalidatePath(`/admin/documents/${docId}/edit`)

  return { success: true }
}

export async function updateDocumentStripPreference(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const docId = (formData.get('id') as string | null)?.trim() ?? ''
  const strip = formData.get('strip_first_page') === '1'

  if (!docId) return { error: 'Document ID is required.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('documents')
    .update({ strip_first_page: strip })
    .eq('id', docId)

  if (error) return { error: error.message }

  revalidatePath('/admin/documents')
  revalidatePath(`/admin/documents/${docId}/edit`)

  return { success: true }
}
