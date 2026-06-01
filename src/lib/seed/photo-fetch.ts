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

// ── Pexels search ─────────────────────────────────────────────────────────────

const RATELIMIT_FLOOR = 5

type PexelsAttribution = {
  photographer: string
  photographer_url: string
  source_url: string
}

type PexelsSearchResult = {
  imageUrl: string
  attribution: PexelsAttribution
}

// Returns the image URL + attribution on success, null if no results,
// or 'rate_limited' to signal the caller to stop. Never throws — any
// non-success produces either null or 'rate_limited' with console.error
// diagnostics so failures are self-describing in logs.
async function searchPexels(query: string): Promise<PexelsSearchResult | null | { rateLimited: true; reason: string }> {
  const key = process.env.PEXELS_API_KEY
  if (!key) throw new Error('PEXELS_API_KEY not set')

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        Authorization: key, // Pexels: raw key, no "Bearer" or "Client-ID" prefix
        'User-Agent': 'LuxuryLifestyleVault/1.0',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[photo-fetch] Pexels network error: ${msg}`)
    throw err
  }

  const limitHeader  = res.headers.get('X-Ratelimit-Limit')
  const remainingHeader = res.headers.get('X-Ratelimit-Remaining')
  const remaining = remainingHeader !== null ? parseInt(remainingHeader, 10) : null

  // Floor check before acting on the response (same logic as before)
  if (remaining !== null && remaining <= RATELIMIT_FLOOR) {
    const reason = `Pexels quota floor (remaining=${remaining})`
    console.error(`[photo-fetch] ${reason}`)
    return { rateLimited: true, reason }
  }

  if (!res.ok) {
    // Capture the real body snippet so the next run is self-explaining
    const bodySnippet = await res.text().catch(() => '(unreadable)').then(t => t.slice(0, 200))
    const keyFingerprint = `len=${key.length} last4=…${key.slice(-4)}`
    const reason = `Pexels ${res.status} (limit=${limitHeader ?? '?'} remaining=${remainingHeader ?? '?'} key=${keyFingerprint} body=${bodySnippet})`
    console.error(`[photo-fetch] ${reason}`)
    if (res.status === 401) return { rateLimited: true, reason: `Pexels 401 — bad key (${keyFingerprint})` }
    if (res.status === 429 || res.status === 403) return { rateLimited: true, reason: `Pexels ${res.status} (remaining=${remainingHeader ?? '?'})` }
    return { rateLimited: true, reason }
  }

  const data = await res.json() as { photos?: Array<{
    src: { large: string; portrait: string }
    photographer: string
    photographer_url: string
    url: string
  }> }

  const photo = data.photos?.[0]
  if (!photo) return null

  return {
    imageUrl: photo.src.large ?? photo.src.portrait,
    attribution: {
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      source_url: photo.url,
    },
  }
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

  // Pick the next item to process (skip excludeIds for items with no Pexels results)
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
  let attribution: PexelsAttribution | null = null
  for (const query of [primaryQuery, CATEGORY_TERMS[item.category] ?? null]) {
    if (!query || (query === primaryQuery && downloadUrl !== null)) continue
    const result = await searchPexels(query)
    if (result && 'rateLimited' in result) {
      return { uploaded: false, failed: false, rateLimited: true, done: false, remaining, itemName: item.name, itemId: item.id, error: result.reason }
    }
    if (result) { downloadUrl = result.imageUrl; attribution = result.attribution; break }
  }

  if (!downloadUrl) {
    return { uploaded: false, failed: true, rateLimited: false, done: false, remaining, itemName: item.name, itemId: item.id, error: 'No Pexels results' }
  }

  // Download (src.large ≈ 1280px — reasonable size for seed photos)
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

  // Update storage_path + attribution in item_photos
  const { error: dbErr } = await sb
    .from('item_photos')
    .update({ storage_path: storagePath, attribution })
    .eq('id', photo.id)
  if (dbErr) {
    return { uploaded: false, failed: true, rateLimited: false, done: false, remaining, itemName: item.name, itemId: item.id, error: `DB update failed: ${dbErr.message}` }
  }

  return { uploaded: true, failed: false, rateLimited: false, done: remaining - 1 === 0, remaining: remaining - 1, itemName: item.name, itemId: item.id }
}
