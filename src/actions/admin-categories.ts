'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin(): Promise<{ error: string } | { error?: never }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Forbidden' }
  return {}
}

export async function createCategory(formData: FormData) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const key       = (formData.get('key') as string | null)?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') ?? ''
  const label     = (formData.get('label') as string | null)?.trim() ?? ''
  const sortRaw   = formData.get('sort_order')
  const sortOrder = sortRaw ? parseInt(sortRaw as string, 10) : 0

  if (!key) return { error: 'Key is required.' }
  if (!label) return { error: 'Label is required.' }

  const admin = createAdminClient()
  const { error } = await admin.from('categories').insert({
    key,
    label,
    sort_order: isNaN(sortOrder) ? 0 : sortOrder,
  })

  if (error) {
    if (error.code === '23505') return { error: `Key "${key}" already exists.` }
    return { error: error.message }
  }

  revalidatePath('/admin/categories')
  revalidatePath('/admin/documents')
  revalidatePath('/investor/documents')
  return { success: true }
}

export async function updateCategory(formData: FormData) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const id        = (formData.get('id') as string | null)?.trim() ?? ''
  const label     = (formData.get('label') as string | null)?.trim() ?? ''
  const sortRaw   = formData.get('sort_order')
  const sortOrder = sortRaw ? parseInt(sortRaw as string, 10) : 0

  if (!id) return { error: 'Category ID is required.' }
  if (!label) return { error: 'Label is required.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('categories')
    .update({ label, sort_order: isNaN(sortOrder) ? 0 : sortOrder })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/categories')
  revalidatePath('/admin/documents')
  revalidatePath('/investor/documents')
  return { success: true }
}

export async function setCategoryActive(id: string, isActive: boolean) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()

  // Guard: cannot deactivate a category that has published documents
  if (!isActive) {
    const { count } = await admin
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
      .eq('status', 'published')

    if ((count ?? 0) > 0)
      return { error: 'Cannot deactivate a category with published documents. Reassign or archive them first.' }
  }

  const { error } = await admin
    .from('categories')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/categories')
  revalidatePath('/admin/documents')
  revalidatePath('/investor/documents')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()

  // Guard: cannot delete a category that has any documents
  const { count } = await admin
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)

  if ((count ?? 0) > 0)
    return { error: 'Cannot delete a category that has documents. Reassign or delete them first.' }

  const { error } = await admin.from('categories').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/categories')
  revalidatePath('/admin/documents')
  return { success: true }
}
