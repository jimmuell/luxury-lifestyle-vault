'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ItemCategory, ItemUpdate } from '@/types/app'

export async function createItem(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: item, error } = await supabase
    .from('items')
    .insert({
      client_id: user.id,
      name: formData.get('name') as string,
      category: formData.get('category') as ItemCategory,
      brand: (formData.get('brand') as string) || null,
      color: (formData.get('color') as string) || null,
      size: (formData.get('size') as string) || null,
      material: (formData.get('material') as string) || null,
      description: (formData.get('description') as string) || null,
      care_instructions: (formData.get('care_instructions') as string) || null,
      tags: formData.getAll('tags') as string[],
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/client/wardrobe')
  return { itemId: item.id }
}

export async function updateItem(itemId: string, updates: ItemUpdate) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Clients cannot change status — enforce here in addition to RLS
  const { status: _status, ...clientSafeUpdates } = updates

  const { error } = await supabase
    .from('items')
    .update(clientSafeUpdates)
    .eq('id', itemId)
    .eq('client_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/client/wardrobe/${itemId}`)
  return { success: true }
}

export async function adminUpdateItemStatus(itemId: string, status: string) {
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

  if (profile?.role !== 'admin') throw new Error('Forbidden')

  const { error } = await supabase
    .from('items')
    .update({ status: status as ItemUpdate['status'] })
    .eq('id', itemId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/inventory/${itemId}`)
  revalidatePath('/admin/inventory')
  return { success: true }
}
