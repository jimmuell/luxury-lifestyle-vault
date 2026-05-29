import { createAdminClient } from '@/lib/supabase/admin'
import { SEED_CLIENT_EMAILS } from './seed-clients'
import { ACTIVE_BUCKET } from '@/lib/storage/constants'
import type { SeedResult } from './types'

// AI analysis templates for different categories
function makeAnalysis(category: string, name: string, brand: string | null, color: string | null) {
  const categoryMap: Record<string, string> = {
    suiting: 'suiting',
    eveningwear: 'eveningwear',
    outerwear: 'outerwear',
    knitwear: 'knitwear',
    footwear: 'footwear',
    handbags: 'handbags',
    accessories: 'accessories',
    activewear: 'activewear',
    dresses: 'dresses',
    trousers_skirts: 'trousers_skirts',
    shirts_blouses: 'shirts_blouses',
    swimwear: 'swimwear',
    lingerie: 'lingerie',
  }

  return {
    suggestedCategory: categoryMap[category] ?? 'other',
    suggestedName: name,
    detectedBrand: brand,
    detectedColor: color,
    conditionFlags: [],
    confidence: 0.94,
  }
}

export async function seedPhotos(): Promise<SeedResult> {
  const adminClient = createAdminClient()
  let seeded = 0
  let skipped = 0
  const errors: string[] = []

  // Load all seed items
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, email')
    .in('email', SEED_CLIENT_EMAILS)

  if (!profiles?.length) {
    return { seeded: 0, skipped: 0, errors: ['No seed clients found — run seed-clients first'] }
  }

  const clientIdSet = new Set(profiles.map(p => p.id))
  const emailById: Record<string, string> = {}
  for (const p of profiles) { emailById[p.id] = p.email }

  const { data: items, error: itemsErr } = await adminClient
    .from('items')
    .select('id, client_id, name, category, brand, color')
    .eq('is_seed_data', true)

  if (itemsErr) return { seeded: 0, skipped: 0, errors: [`Failed to load seed items: ${itemsErr.message}`] }
  if (!items?.length) return { seeded: 0, skipped: 0, errors: ['No seed items found — run seed-items first'] }

  for (const item of items) {
    if (!clientIdSet.has(item.client_id)) continue

    try {
      // Idempotency: check if photo record already exists for this item
      const { data: existing } = await adminClient
        .from('item_photos')
        .select('id')
        .eq('item_id', item.id)
        .eq('is_seed_data', true)
        .maybeSingle()

      if (existing) {
        skipped++
        continue
      }

      // Placeholder storage path — file does not actually exist in bucket
      const storagePath = `${item.client_id}/${item.id}/seed-main.jpg`

      const { error } = await adminClient.from('item_photos').insert({
        item_id: item.id,
        uploaded_by: item.client_id,
        storage_path: storagePath,
        storage_bucket: ACTIVE_BUCKET,
        photo_type: 'gallery',
        sort_order: 0,
        caption: null,
        ai_analysis: makeAnalysis(item.category, item.name, item.brand, item.color),
        is_seed_data: true,
      })

      if (error) throw new Error(error.message)
      seeded++
    } catch (err) {
      errors.push(`Photo for ${item.name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { seeded, skipped, errors }
}
