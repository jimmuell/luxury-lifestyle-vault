'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin(): Promise<{ error: string } | { error?: never }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Forbidden' }
  return {}
}

// Updates last_reconciled_at for external-source documents after a manual review.
export async function markDocumentReviewed(docId: string): Promise<{ success: true } | { error: string }> {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()

  const { data: doc, error: fetchErr } = await admin
    .from('investor_documents')
    .select('source_system')
    .eq('id', docId)
    .single()

  if (fetchErr || !doc) return { error: 'Document not found.' }
  if (doc.source_system !== 'external') return { error: 'Mark reviewed is only available for external source documents.' }

  const { error } = await admin
    .from('investor_documents')
    .update({ last_reconciled_at: new Date().toISOString() })
    .eq('id', docId)

  if (error) return { error: error.message }

  revalidatePath('/admin/data-room')
  return { success: true }
}
