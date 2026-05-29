import { createClient } from '@/lib/supabase/server'
import type { ItemStatus, ItemCategory, ItemLocation } from '@/types/app'

export interface ItemFilter {
  categories?: ItemCategory[]
  locations?: ItemLocation[]
  seasons?: string[]
  brand?: string
  sort?: 'recent' | 'name_asc' | 'name_desc' | 'category' | 'location'
  page?: number
  limit?: number
}

export async function getItemsByClient(clientId: string, filter: ItemFilter = {}) {
  const supabase = await createClient()
  const { sort = 'recent', page = 1, limit = 50 } = filter
  const offset = (page - 1) * limit

  let query = supabase
    .from('items')
    .select('id, name, sku, brand, category, status, color, size, season, location_status, location_label, tags, created_at, updated_at', { count: 'exact' })
    .eq('client_id', clientId)

  if (filter.categories?.length) {
    query = query.in('category', filter.categories)
  }
  if (filter.locations?.length) {
    query = query.in('location_status', filter.locations)
  }
  if (filter.seasons?.length) {
    query = query.in('season', filter.seasons)
  }
  if (filter.brand) {
    query = query.ilike('brand', `%${filter.brand}%`)
  }

  switch (sort) {
    case 'name_asc':
      query = query.order('name', { ascending: true })
      break
    case 'name_desc':
      query = query.order('name', { ascending: false })
      break
    case 'category':
      query = query.order('category', { ascending: true }).order('name', { ascending: true })
      break
    case 'location':
      query = query.order('location_status', { ascending: true }).order('name', { ascending: true })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw error
  return { items: data ?? [], total: count ?? 0 }
}

export async function getItemStatusCounts(clientId: string): Promise<Record<ItemStatus, number>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('items')
    .select('status')
    .eq('client_id', clientId)
  if (error) throw error

  const counts = {} as Record<ItemStatus, number>
  for (const row of data ?? []) {
    counts[row.status as ItemStatus] = (counts[row.status as ItemStatus] ?? 0) + 1
  }
  return counts
}

export async function getItemById(itemId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .single()
  if (error) throw error
  return data
}

export async function getItemWithPhotosAndConditions(itemId: string) {
  const supabase = await createClient()

  const [itemResult, photosResult, conditionsResult] = await Promise.all([
    supabase.from('items').select('*').eq('id', itemId).single(),
    supabase
      .from('item_photos')
      .select('*')
      .eq('item_id', itemId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('item_conditions')
      .select('*')
      .eq('item_id', itemId)
      .order('assessed_at', { ascending: false }),
  ])

  if (itemResult.error) throw itemResult.error
  return {
    item: itemResult.data,
    photos: photosResult.data ?? [],
    conditions: conditionsResult.data ?? [],
  }
}

export async function getAllItemStatusCounts(): Promise<Record<ItemStatus, number>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('items').select('status')
  if (error) throw error

  const counts = {} as Record<ItemStatus, number>
  for (const row of data ?? []) {
    counts[row.status as ItemStatus] = (counts[row.status as ItemStatus] ?? 0) + 1
  }
  return counts
}

export async function getRecentItems(limit = 10) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('items')
    .select('id, name, sku, brand, category, status, client_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}
