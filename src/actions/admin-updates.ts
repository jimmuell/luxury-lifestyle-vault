'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/lib/inngest/client'

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

export async function createUpdate(formData: FormData) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const body = (formData.get('body') as string | null)?.trim() ?? ''
  const audience = (formData.get('audience') as string | null) ?? 'prospect'
  const isPublished = formData.get('is_published') === 'true'
  const notifyInvestors = formData.get('notify') === 'true'

  if (!title) return { error: 'Title is required.' }
  if (!body) return { error: 'Body is required.' }
  if (!VALID_AUDIENCES.includes(audience as typeof VALID_AUDIENCES[number])) {
    return { error: 'Audience must be prospect, investor, or board.' }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('investor_updates')
    .insert({ title, body, audience, is_published: isPublished })
    .select('id')
    .single()

  if (error || !data) return { error: `Failed to create update: ${error?.message ?? 'Unknown error'}` }

  if (isPublished && notifyInvestors) {
    try {
      await inngest.send({
        name: 'investor/update.published' as never,
        data: { updateId: data.id, updateTitle: title, audience },
      })
    } catch (err) {
      console.error('[admin-updates] failed to enqueue notification:', err)
    }
  }

  revalidatePath('/admin/updates')
  revalidatePath('/investor/updates')
  return { success: true }
}

export async function updateUpdate(formData: FormData) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const id = (formData.get('id') as string | null)?.trim() ?? ''
  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const body = (formData.get('body') as string | null)?.trim() ?? ''
  const audience = (formData.get('audience') as string | null) ?? 'prospect'
  const isPublished = formData.get('is_published') === 'true'

  if (!id) return { error: 'Update ID is required.' }
  if (!title) return { error: 'Title is required.' }
  if (!body) return { error: 'Body is required.' }
  if (!VALID_AUDIENCES.includes(audience as typeof VALID_AUDIENCES[number])) {
    return { error: 'Audience must be prospect, investor, or board.' }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('investor_updates')
    .update({ title, body, audience, is_published: isPublished })
    .eq('id', id)
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Update not found.' }

  revalidatePath('/admin/updates')
  revalidatePath('/investor/updates')
  return { success: true }
}

export async function toggleUpdatePublished(id: string, isPublished: boolean, notify = false) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('investor_updates')
    .update({ is_published: isPublished })
    .eq('id', id)
    .select('id, title, audience')
    .single()

  if (error || !data) return { error: error?.message ?? 'Update not found.' }

  if (isPublished && notify) {
    try {
      await inngest.send({
        name: 'investor/update.published' as never,
        data: { updateId: id, updateTitle: data.title, audience: data.audience },
      })
    } catch (err) {
      console.error('[admin-updates] failed to enqueue notification:', err)
    }
  }

  revalidatePath('/admin/updates')
  revalidatePath('/investor/updates')
  return { success: true }
}

export async function deleteUpdate(id: string) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('investor_updates')
    .delete()
    .eq('id', id)

  if (error) return { error: `Failed to delete update: ${error.message}` }

  revalidatePath('/admin/updates')
  revalidatePath('/investor/updates')
  return { success: true }
}
