'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_ACTION_TYPES = ['url', 'email', 'log'] as const

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

function revalidateCtas() {
  revalidatePath('/investor')
  revalidatePath('/admin/ctas')
}

export async function createCta(formData: FormData): Promise<{ error: string } | { success: true }> {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const label = (formData.get('label') as string | null)?.trim() ?? ''
  const actionType = (formData.get('action_type') as string | null) ?? ''
  const actionValue = (formData.get('action_value') as string | null)?.trim() ?? ''
  const sortOrder = parseInt((formData.get('sort_order') as string | null) ?? '0', 10)
  const isActive = formData.get('is_active') === 'true'

  if (!label) return { error: 'Label is required.' }
  if (!VALID_ACTION_TYPES.includes(actionType as typeof VALID_ACTION_TYPES[number])) {
    return { error: 'Action type must be url, email, or log.' }
  }
  if (actionType !== 'log' && !actionValue) {
    return { error: 'Action value is required for url and email types.' }
  }
  if (actionType === 'url') {
    try {
      const u = new URL(actionValue)
      if (u.protocol !== 'https:' && u.protocol !== 'http:') {
        return { error: 'URL must use http or https scheme.' }
      }
    } catch {
      return { error: 'Invalid URL.' }
    }
  }
  if (actionType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(actionValue)) {
    return { error: 'Invalid email address.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('investor_ctas')
    .insert({
      label,
      action_type: actionType,
      action_value: actionValue,
      sort_order: isNaN(sortOrder) ? 0 : sortOrder,
      is_active: isActive,
    })

  if (error) return { error: `Failed to create CTA: ${error.message}` }

  revalidateCtas()
  return { success: true }
}

export async function updateCta(formData: FormData): Promise<{ error: string } | { success: true }> {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const id = (formData.get('id') as string | null)?.trim() ?? ''
  const label = (formData.get('label') as string | null)?.trim() ?? ''
  const actionType = (formData.get('action_type') as string | null) ?? ''
  const actionValue = (formData.get('action_value') as string | null)?.trim() ?? ''
  const sortOrder = parseInt((formData.get('sort_order') as string | null) ?? '0', 10)
  const isActive = formData.get('is_active') === 'true'

  if (!id) return { error: 'CTA ID is required.' }
  if (!label) return { error: 'Label is required.' }
  if (!VALID_ACTION_TYPES.includes(actionType as typeof VALID_ACTION_TYPES[number])) {
    return { error: 'Action type must be url, email, or log.' }
  }
  if (actionType !== 'log' && !actionValue) {
    return { error: 'Action value is required for url and email types.' }
  }
  if (actionType === 'url') {
    try {
      const u = new URL(actionValue)
      if (u.protocol !== 'https:' && u.protocol !== 'http:') {
        return { error: 'URL must use http or https scheme.' }
      }
    } catch {
      return { error: 'Invalid URL.' }
    }
  }
  if (actionType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(actionValue)) {
    return { error: 'Invalid email address.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('investor_ctas')
    .update({
      label,
      action_type: actionType,
      action_value: actionValue,
      sort_order: isNaN(sortOrder) ? 0 : sortOrder,
      is_active: isActive,
    })
    .eq('id', id)

  if (error) return { error: `Failed to update CTA: ${error.message}` }

  revalidateCtas()
  return { success: true }
}

export async function toggleCtaActive(id: string, isActive: boolean): Promise<{ error: string } | { success: true }> {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('investor_ctas')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { error: `Failed to update CTA: ${error.message}` }

  revalidateCtas()
  return { success: true }
}

export async function deleteCta(id: string): Promise<{ error: string } | { success: true }> {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('investor_ctas')
    .delete()
    .eq('id', id)

  if (error) return { error: `Failed to delete CTA: ${error.message}` }

  revalidateCtas()
  return { success: true }
}
