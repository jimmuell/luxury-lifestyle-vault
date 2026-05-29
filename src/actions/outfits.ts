'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return { supabase, user }
}

export async function createOutfit(data: { name: string; notes?: string; itemIds: string[] }) {
  const { supabase, user } = await getAuthUser()

  const { data: outfit, error } = await supabase
    .from('outfits')
    .insert({ client_id: user.id, name: data.name, notes: data.notes ?? null })
    .select('id')
    .single()

  if (error || !outfit) return { error: error?.message ?? 'Failed to create outfit' }

  if (data.itemIds.length > 0) {
    await supabase.from('outfit_items').insert(
      data.itemIds.map((itemId, i) => ({ outfit_id: outfit.id, item_id: itemId, sort_order: i }))
    )
  }

  revalidatePath('/client/outfits')
  return { id: outfit.id }
}

export async function updateOutfit(
  outfitId: string,
  data: { name?: string; notes?: string; itemIds?: string[] }
) {
  const { supabase, user } = await getAuthUser()

  // Verify ownership
  const { data: existing } = await supabase
    .from('outfits')
    .select('id')
    .eq('id', outfitId)
    .eq('client_id', user.id)
    .single()
  if (!existing) return { error: 'Not found' }

  if (data.name !== undefined || data.notes !== undefined) {
    await supabase
      .from('outfits')
      .update({ name: data.name, notes: data.notes })
      .eq('id', outfitId)
  }

  if (data.itemIds !== undefined) {
    await supabase.from('outfit_items').delete().eq('outfit_id', outfitId)
    if (data.itemIds.length > 0) {
      await supabase.from('outfit_items').insert(
        data.itemIds.map((itemId, i) => ({ outfit_id: outfitId, item_id: itemId, sort_order: i }))
      )
    }
  }

  revalidatePath(`/client/outfits/${outfitId}`)
  revalidatePath('/client/outfits')
  return { success: true }
}

export async function deleteOutfit(outfitId: string) {
  const { supabase, user } = await getAuthUser()

  const { error } = await supabase
    .from('outfits')
    .delete()
    .eq('id', outfitId)
    .eq('client_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/client/outfits')
  redirect('/client/outfits')
}

export async function addItemToOutfit(outfitId: string, itemId: string) {
  const { supabase, user } = await getAuthUser()

  // Verify outfit ownership
  const { data: outfit } = await supabase
    .from('outfits')
    .select('id')
    .eq('id', outfitId)
    .eq('client_id', user.id)
    .single()
  if (!outfit) return { error: 'Not found' }

  // Verify item ownership
  const { data: item } = await supabase
    .from('items')
    .select('id')
    .eq('id', itemId)
    .eq('client_id', user.id)
    .single()
  if (!item) return { error: 'Item not found' }

  const { count } = await supabase
    .from('outfit_items')
    .select('*', { count: 'exact', head: true })
    .eq('outfit_id', outfitId)

  await supabase.from('outfit_items').upsert({
    outfit_id: outfitId,
    item_id: itemId,
    sort_order: count ?? 0,
  })

  revalidatePath(`/client/outfits/${outfitId}`)
  return { success: true }
}
