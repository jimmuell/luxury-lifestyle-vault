'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Admin access required')
  return { user }
}

export async function createCorridor(data: {
  slug: string
  displayName: string
  originRegionCode: string
  destinationRegionCode: string
  active?: boolean
  fallTransitionStart?: string
  fallTransitionEnd?: string
  springTransitionStart?: string
  springTransitionEnd?: string
  sortOrder?: number
}) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { error } = await adminClient.from('corridors').insert({
    slug: data.slug.toLowerCase().replace(/\s+/g, '_'),
    display_name: data.displayName,
    origin_region_code: data.originRegionCode.toUpperCase(),
    destination_region_code: data.destinationRegionCode.toUpperCase(),
    active: data.active ?? true,
    fall_transition_start_date: data.fallTransitionStart || null,
    fall_transition_end_date: data.fallTransitionEnd || null,
    spring_transition_start_date: data.springTransitionStart || null,
    spring_transition_end_date: data.springTransitionEnd || null,
    sort_order: data.sortOrder ?? 0,
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error(`A corridor for ${data.originRegionCode.toUpperCase()} ↔ ${data.destinationRegionCode.toUpperCase()} already exists.`)
    }
    throw new Error(error.message)
  }
  revalidatePath('/admin/settings/corridors')
}

export async function updateCorridor(corridorId: string, data: {
  displayName?: string
  active?: boolean
  fallTransitionStart?: string | null
  fallTransitionEnd?: string | null
  springTransitionStart?: string | null
  springTransitionEnd?: string | null
  sortOrder?: number
}) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { error } = await adminClient.from('corridors').update({
    ...(data.displayName !== undefined ? { display_name: data.displayName } : {}),
    ...(data.active !== undefined ? { active: data.active } : {}),
    ...(data.fallTransitionStart !== undefined ? { fall_transition_start_date: data.fallTransitionStart } : {}),
    ...(data.fallTransitionEnd !== undefined ? { fall_transition_end_date: data.fallTransitionEnd } : {}),
    ...(data.springTransitionStart !== undefined ? { spring_transition_start_date: data.springTransitionStart } : {}),
    ...(data.springTransitionEnd !== undefined ? { spring_transition_end_date: data.springTransitionEnd } : {}),
    ...(data.sortOrder !== undefined ? { sort_order: data.sortOrder } : {}),
  }).eq('id', corridorId)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/settings/corridors')
  revalidatePath(`/admin/settings/corridors/${corridorId}`)
}

export async function setProviderCorridor(providerId: string, corridorId: string, role: 'origin_provider' | 'destination_provider' | 'both') {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('provider_corridors')
    .upsert({ provider_id: providerId, corridor_id: corridorId, corridor_role: role as never })

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/settings/corridors/${corridorId}`)
}

export async function removeProviderCorridor(providerId: string, corridorId: string) {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('provider_corridors')
    .delete()
    .eq('provider_id', providerId)
    .eq('corridor_id', corridorId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/settings/corridors/${corridorId}`)
}
