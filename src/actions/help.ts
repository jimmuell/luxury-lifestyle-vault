'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  return supabase
}

// ── Tooltips ────────────────────────────────────────────────────────────────

export async function createTooltip(data: {
  area_key: string
  title: string
  body: string
  linked_article_slug?: string | null
  is_published?: boolean
}) {
  const supabase = await requireAdmin()
  const { data: created, error } = await supabase
    .from('help_tooltips')
    .insert(data)
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/admin/help')
  return { success: true, data: created }
}

export async function updateTooltip(
  id: string,
  data: {
    area_key?: string
    title?: string
    body?: string
    linked_article_slug?: string | null
    is_published?: boolean
  }
) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('help_tooltips').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/help')
  return { success: true }
}

export async function deleteTooltip(id: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('help_tooltips').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/help')
  return { success: true }
}

// ── Articles ─────────────────────────────────────────────────────────────────

export async function createArticle(data: {
  slug: string
  category: string
  title: string
  body: string
  area_key?: string | null
  audience?: string
  sort_order?: number
  is_published?: boolean
}) {
  const supabase = await requireAdmin()
  const { data: created, error } = await supabase
    .from('help_articles')
    .insert(data)
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/admin/help')
  return { success: true, data: created }
}

export async function updateArticle(
  id: string,
  data: {
    slug?: string
    category?: string
    title?: string
    body?: string
    area_key?: string | null
    audience?: string
    sort_order?: number
    is_published?: boolean
  }
) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('help_articles').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/help')
  return { success: true }
}

export async function deleteArticle(id: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('help_articles').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/help')
  return { success: true }
}
