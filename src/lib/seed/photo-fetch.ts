// Server-side photo fetch for seed items — shared by the server action (UI button)
// and importable by the standalone script.
//
// Processes one seed item per call (the caller loops). Uses the admin Supabase client
// so no env bootstrapping needed; env vars are already present in the server context.
// For the standalone script, load dotenv BEFORE importing this module.

import { createAdminClient } from '@/lib/supabase/admin'
import { ACTIVE_BUCKET } from '@/lib/storage/constants'

// ── Category search term mapping ─────────────────────────────────────────────

const CATEGORY_TERMS: Record<string, string> = {
  suiting:         "men's suit formal luxury",
  eveningwear:     'evening gown formal luxury',
  outerwear:       'luxury coat women fashion',
  knitwear:        'cashmere sweater luxury knitwear',
  footwear:        'luxury dress shoes leather',
  handbags:        'luxury leather handbag designer',
  accessories:     'luxury accessories fashion',
  activewear:      'luxury activewear athletic fashion',
  dresses:         'elegant dress luxury fashion',
  trousers_skirts: 'luxury trousers fashion elegant',
  shirts_blouses:  'luxury shirt blouse fashion',
  swimwear:        'luxury swimwear resort fashion',
  lingerie:        'luxury silk lingerie fashion',
  other:           'luxury clothing fashion elegant',
}

const ACCESSORY_TERMS: { keywords: string[]; terms: string }[] = [
  { keywords: ['bow tie', 'bowtie', 'bow-tie'], terms: 'bow tie formal luxury' },
  { keywords: ['necktie', 'neck tie', 'tie'],   terms: 'silk necktie luxury formal' },
  { keywords: ['necklace', 'pendant', 'strand'], terms: 'luxury necklace jewelry gold' },
  { keywords: ['scarf', 'shawl', 'wrap', 'stole'], terms: 'luxury silk scarf fashion' },
  { keywords: ['watch', 'timepiece'],            terms: 'luxury watch timepiece men' },
  { keywords: ['belt'],                          terms: 'luxury leather belt fashion' },
  { keywords: ['sunglasses', 'glasses'],         terms: 'luxury sunglasses fashion' },
  { keywords: ['bracelet', 'bangle'],            terms: 'luxury bracelet jewelry gold' },
  { keywords: ['earring', 'earrings'],           terms: 'luxury earrings jewelry fashion' },
  { keywords: ['gloves', 'glove'],               terms: 'luxury leather gloves fashion' },
  { keywords: ['hat', 'cap', 'visor'],           terms: 'luxury hat fashion' },
  { keywords: ['cufflinks', 'cufflink'],         terms: 'luxury cufflinks formal silver' },
]

const SEARCHABLE_BRANDS = [
  'Hermès', 'Hermes', 'Chanel', 'Gucci', 'Prada', 'Brioni',
  'Loro Piana', 'Tom Ford', 'Valentino', 'Balenciaga', 'Dior',
  'Louis Vuitton', 'Burberry', 'Versace', 'Armani',
]

function buildSearchQuery(
  name: string,
  category: string,
  color: string | null,
  brand: string | null,
): string {
  if (category === 'accessories') {
    const lower = name.toLowerCase()
    for (const rule of ACCESSORY_TERMS) {
      if (rule.keywords.some(kw => lower.includes(kw))) {
        return color ? `${color} ${rule.terms}` : rule.terms
      }
    }
  }
  const base = CATEGORY_TERMS[category] ?? 'luxury fashion clothing'
  if (brand && SEARCHABLE_BRANDS.some(b => brand.includes(b))) {
    return `${brand} ${base}`.slice(0, 80)
  }
  return color ? `${color} ${base}` : base
}

// ── Unsplash search ──────────────────────────────────────────────────────────

const RATELIMIT_FLOOR = 5

async function searchUnsplash(query: string): Promise<string | null | 'rate_limited'> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) throw new Error('UNSPLASH_ACCESS_KEY not set')

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } })

  const remaining = res.headers.get('X-Ratelimit-Remaining')
  if (remaining !== null && parseInt(remaining, 10) <= RATELIMIT_FLOOR) return 'rate_limited'
  if (res.status === 429 || res.status === 403) return 'rate_limited'
  if (!res.ok) throw new Error(`Unsplash HTTP ${res.status}`)

  const data = await res.json() as { results: Array<{ urls: { small: string } }> }
  return data.results?.[0]?.urls?.small ?? null
}

// ── Result type ───────────────────────────────────────────────────────────────

export interface PhotoFetchItemResult {
  uploaded: boolean
  failed: boolean
  rateLimited: boolean
  done: boolean
  remaining: number
  itemName: string
  itemId?: string
  error?: string
}

// ── Core: fetch one item ──────────────────────────────────────────────────────

export async function fetchOnePhoto(excludeIds: string[] = []): Promise<PhotoFetchItemResult> {
  const sb = createAdminClient()

  // Count total remaining (used in all return paths)
  const countQuery = sb
    .from('item_photos')
    .select('*', { count: 'exact', head: true })
    .eq('is_seed_data', true)
    .like('storage_path', '%/seed-main.jpg')
    .is('public_url', null)

  // Pick the next item to process (skip excludeIds for items with no Unsplash results)
  let itemQuery = sb
    .from('item_photos')
    .select('id, item_id, items ( id, client_id, name, category, brand, color )')
    .eq('is_seed_data', true)
    .like('storage_path', '%/seed-main.jpg')
    .is('public_url', null)
    .order('item_id')
    .limit(1)

  if (excludeIds.length > 0) {
    itemQuery = itemQuery.not('item_id', 'in', `(${excludeIds.join(',')})`)
  }

  const [{ count: rawCount }, { data: rows }] = await Promise.all([countQuery, itemQuery])
  const remaining = rawCount ?? 0

  if (!rows?.length) {
    return { uploaded: false, failed: false, rateLimited: false, done: true, remaining: 0, itemName: '' }
  }

  type ItemRow = { id: string; client_id: string; name: string; category: string; brand: string | null; color: string | null }
  const photo = rows[0] as { id: string; item_id: string; items: ItemRow | ItemRow[] | null }
  const rawItem = photo.items
  const item: ItemRow | null = Array.isArray(rawItem) ? (rawItem[0] ?? null) : rawItem

  if (!item) {
    return { uploaded: false, failed: true, rateLimited: false, done: false, remaining, itemName: photo.item_id, itemId: photo.item_id, error: 'No linked item' }
  }

  const primaryQuery = buildSearchQuery(item.name, item.category, item.color, item.brand)

  // Try primary query, then category-only fallback
  let downloadUrl: string | null = null
  for (const query of [primaryQuery, CATEGORY_TERMS[item.category] ?? null]) {
    if (!query || (query === primaryQuery && downloadUrl !== null)) continue
    const result = await searchUnsplash(query)
    if (result === 'rate_limited') {
      return { uploaded: false, failed: false, rateLimited: true, done: false, remaining, itemName: item.name, itemId: item.id }
    }
    if (result) { downloadUrl = result; break }
  }

  if (!downloadUrl) {
    return { uploaded: false, failed: true, rateLimited: false, done: false, remaining, itemName: item.name, itemId: item.id, error: 'No Unsplash results' }
  }

  // Download (urls.small = 400px — keeps server action well under Vercel timeout)
  const imgRes = await fetch(downloadUrl)
  if (!imgRes.ok) {
    return { uploaded: false, failed: true, rateLimited: false, done: false, remaining, itemName: item.name, itemId: item.id, error: `Image download failed: ${imgRes.status}` }
  }
  const buffer = Buffer.from(await imgRes.arrayBuffer())

  // Upload to Supabase Storage
  const storagePath = `${item.client_id}/${item.id}/main.jpg`
  const { error: upErr } = await sb.storage
    .from(ACTIVE_BUCKET)
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })
  if (upErr) {
    return { uploaded: false, failed: true, rateLimited: false, done: false, remaining, itemName: item.name, itemId: item.id, error: `Storage upload failed: ${upErr.message}` }
  }

  // Update storage_path in item_photos (public_url stays null — private bucket, signing handles display)
  const { error: dbErr } = await sb
    .from('item_photos')
    .update({ storage_path: storagePath })
    .eq('id', photo.id)
  if (dbErr) {
    return { uploaded: false, failed: true, rateLimited: false, done: false, remaining, itemName: item.name, itemId: item.id, error: `DB update failed: ${dbErr.message}` }
  }

  return { uploaded: true, failed: false, rateLimited: false, done: remaining - 1 === 0, remaining: remaining - 1, itemName: item.name, itemId: item.id }
}
