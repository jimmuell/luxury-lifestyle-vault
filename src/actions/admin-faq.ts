'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_AUDIENCES = ['prospect', 'investor', 'board'] as const

async function assertAdmin(): Promise<{ error: string } | { error?: never }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { error: 'Forbidden' }
  return {}
}

export async function createFaqEntry(formData: FormData) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const question = (formData.get('question') as string | null)?.trim() ?? ''
  const answer = (formData.get('answer') as string | null)?.trim() ?? ''
  const audience = (formData.get('audience') as string | null) ?? 'prospect'
  const sortOrderRaw = formData.get('sort_order')
  const sortOrder = sortOrderRaw ? parseInt(sortOrderRaw as string, 10) : 0
  const isPublished = formData.get('is_published') === 'true'

  if (!question) return { error: 'Question is required.' }
  if (!answer) return { error: 'Answer is required.' }
  if (!VALID_AUDIENCES.includes(audience as typeof VALID_AUDIENCES[number])) {
    return { error: 'Audience must be prospect, investor, or board.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('investor_faq')
    .insert({
      question,
      answer,
      audience,
      sort_order: isNaN(sortOrder) ? 0 : sortOrder,
      is_published: isPublished,
    })

  if (error) return { error: `Failed to create FAQ entry: ${error.message}` }

  revalidatePath('/admin/faq')
  revalidatePath('/investor/faq')
  return { success: true }
}

export async function updateFaqEntry(formData: FormData) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const id = (formData.get('id') as string | null)?.trim() ?? ''
  const question = (formData.get('question') as string | null)?.trim() ?? ''
  const answer = (formData.get('answer') as string | null)?.trim() ?? ''
  const audience = (formData.get('audience') as string | null) ?? 'prospect'
  const sortOrderRaw = formData.get('sort_order')
  const sortOrder = sortOrderRaw ? parseInt(sortOrderRaw as string, 10) : 0
  const isPublished = formData.get('is_published') === 'true'

  if (!id) return { error: 'FAQ entry ID is required.' }
  if (!question) return { error: 'Question is required.' }
  if (!answer) return { error: 'Answer is required.' }
  if (!VALID_AUDIENCES.includes(audience as typeof VALID_AUDIENCES[number])) {
    return { error: 'Audience must be prospect, investor, or board.' }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('investor_faq')
    .update({
      question,
      answer,
      audience,
      sort_order: isNaN(sortOrder) ? 0 : sortOrder,
      is_published: isPublished,
    })
    .eq('id', id)
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'FAQ entry not found.' }

  revalidatePath('/admin/faq')
  revalidatePath('/investor/faq')
  return { success: true }
}

export async function toggleFaqPublished(id: string, isPublished: boolean) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('investor_faq')
    .update({ is_published: isPublished })
    .eq('id', id)
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'FAQ entry not found.' }

  revalidatePath('/admin/faq')
  revalidatePath('/investor/faq')
  return { success: true }
}

export async function deleteFaqEntry(id: string) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('investor_faq')
    .delete()
    .eq('id', id)

  if (error) return { error: `Failed to delete FAQ entry: ${error.message}` }

  revalidatePath('/admin/faq')
  revalidatePath('/investor/faq')
  return { success: true }
}
