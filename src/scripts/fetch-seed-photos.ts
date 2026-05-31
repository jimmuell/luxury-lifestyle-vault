/**
 * Standalone seed-photo fetch script — rebuilds Unsplash photos for seed items.
 *
 * Usage (from project root):
 *   npx tsx src/scripts/fetch-seed-photos.ts
 *
 * Requires in .env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, UNSPLASH_ACCESS_KEY
 *
 * Rate limits: Unsplash free tier = 50 req/hr. Script caps at 45 per run and adds a
 * 2-second delay between requests. Re-run after ~1 hour to continue; fully idempotent.
 *
 * Storage note: item-photos bucket is private (public: false). After upload,
 * storage_path is updated to the real path and public_url stays null. The wardrobe
 * display already handles null public_url by batch-signing on each page load — same
 * path as all real client uploads. No signed-URL expiry issues.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const ACTIVE_BUCKET = 'item-photos'
const MAX_REQUESTS_PER_RUN = 45
const DELAY_MS = 2000
const RATELIMIT_SAFETY_FLOOR = 5

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY!

// ── Category → base search terms ────────────────────────────────────────────

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

// Accessory name-keyword → specific search term (parallels category-glyphs rules)
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

// Well-known luxury brands that improve Unsplash results when included in query
const SEARCHABLE_BRANDS = [
  'Hermès', 'Hermes', 'Chanel', 'Gucci', 'Prada', 'Brioni',
  'Loro Piana', 'Tom Ford', 'Valentino', 'Balenciaga', 'Dior',
  'Louis Vuitton', 'Burberry', 'Versace', 'Armani',
]

function buildQuery(
  name: string,
  category: string,
  color: string | null,
  brand: string | null,
): string {
  // For accessories, try keyword matching on the item name first
  if (category === 'accessories') {
    const lower = name.toLowerCase()
    for (const rule of ACCESSORY_TERMS) {
      if (rule.keywords.some(kw => lower.includes(kw))) {
        return color ? `${color} ${rule.terms}` : rule.terms
      }
    }
  }

  const base = CATEGORY_TERMS[category] ?? 'luxury fashion clothing'

  // Prepend a searchable brand if it's recognisable
  if (brand && SEARCHABLE_BRANDS.some(b => brand.includes(b))) {
    return `${brand} ${base}`.slice(0, 80)
  }

  // Otherwise lead with color for a more targeted result
  if (color) {
    return `${color} ${base}`
  }

  return base
}

// ── Unsplash helpers ─────────────────────────────────────────────────────────

type UnsplashResult = { downloadUrl: string }

/**
 * Returns null if no results. Throws 'rate_limit:{status}' on 429/403.
 * Also returns null (with a console warning) when X-Ratelimit-Remaining drops
 * to the safety floor.
 */
async function searchUnsplash(query: string): Promise<UnsplashResult | null> {
  const url =
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
  })

  // Check remaining quota before deciding what to do with the response
  const remaining = res.headers.get('X-Ratelimit-Remaining')
  if (remaining !== null && parseInt(remaining, 10) <= RATELIMIT_SAFETY_FLOOR) {
    console.log(`\n⚠️  X-Ratelimit-Remaining = ${remaining} — stopping early for safety`)
    throw new Error('rate_limit:quota_floor')
  }

  if (res.status === 429 || res.status === 403) {
    throw new Error(`rate_limit:${res.status}`)
  }
  if (!res.ok) {
    throw new Error(`Unsplash HTTP ${res.status}: ${res.statusText}`)
  }

  const data = await res.json() as {
    results: Array<{ urls: { regular: string } }>
  }
  if (!data.results?.length) return null

  return { downloadUrl: data.results[0].urls.regular }
}

// ── Storage + DB helpers ─────────────────────────────────────────────────────

async function uploadAndUpdate(
  sb: any,
  photoId: string,
  clientId: string,
  itemId: string,
  downloadUrl: string,
): Promise<void> {
  // Download from Unsplash (urls.regular = 1080px)
  const imgRes = await fetch(downloadUrl)
  if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`)
  const buffer = Buffer.from(await imgRes.arrayBuffer())

  // Upload to Supabase Storage, replacing the placeholder path
  const storagePath = `${clientId}/${itemId}/main.jpg`
  const { error: upErr } = await sb.storage
    .from(ACTIVE_BUCKET)
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })
  if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`)

  // Update the item_photos row: new real storage_path, public_url stays null
  // (item-photos bucket is private; wardrobe display uses batch signed-URL signing)
  const { error: dbErr } = await sb
    .from('item_photos')
    .update({ storage_path: storagePath })
    .eq('id', photoId)
  if (dbErr) throw new Error(`DB update failed: ${dbErr.message}`)
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const missing = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'UNSPLASH_ACCESS_KEY']
    .filter(k => !process.env[k])
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(', ')}`)
    process.exit(1)
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as any

  // Load seed item_photos that still have the placeholder storage_path
  const { data: rows, error: qErr } = await sb
    .from('item_photos')
    .select(`
      id,
      item_id,
      storage_path,
      public_url,
      items ( id, client_id, name, category, brand, color )
    `)
    .eq('is_seed_data', true)
    .like('storage_path', '%/seed-main.jpg')
    .is('public_url', null)

  if (qErr) {
    console.error('Query failed:', qErr.message)
    process.exit(1)
  }

  type ItemRow = {
    id: string
    client_id: string
    name: string
    category: string
    brand: string | null
    color: string | null
  }

  type PhotoRow = {
    id: string
    item_id: string
    storage_path: string
    public_url: string | null
    // Supabase returns FK joins as single object or array depending on inference;
    // normalise below
    items: ItemRow | ItemRow[] | null
  }

  const photos = (rows ?? []) as unknown as PhotoRow[]

  if (!photos.length) {
    console.log('✅ All seed items already have photos. Nothing to do.')
    return
  }

  const total = photos.length
  console.log(
    `Found ${total} seed item${total === 1 ? '' : 's'} needing photos.` +
    ` Processing up to ${MAX_REQUESTS_PER_RUN} this run...\n`,
  )

  let fetched = 0
  let failed = 0
  let rateLimited = false

  for (const photo of photos) {
    if (fetched >= MAX_REQUESTS_PER_RUN) {
      const remaining = total - fetched - failed
      console.log(
        `\n🛑 Reached ${MAX_REQUESTS_PER_RUN}-request cap.` +
        ` ${remaining} item${remaining === 1 ? '' : 's'} remaining.` +
        ` Run again in ~1 hour. Script is idempotent.`,
      )
      break
    }

    // Normalise: Supabase may return FK join as single object or array
    const item: ItemRow | null = Array.isArray(photo.items)
      ? (photo.items[0] ?? null)
      : photo.items
    if (!item) {
      console.log(`⏭️  Photo row ${photo.id} — no linked item, skipped`)
      continue
    }

    const primaryQuery = buildQuery(item.name, item.category, item.color, item.brand)
    process.stdout.write(`   "${item.name}" → "${primaryQuery}" → `)

    try {
      let result = await searchUnsplash(primaryQuery)

      if (!result) {
        // Fallback: category base terms only
        const fallback = CATEGORY_TERMS[item.category] ?? 'luxury fashion clothing'
        if (fallback !== primaryQuery) {
          process.stdout.write(`no results, trying "${fallback}" → `)
          result = await searchUnsplash(fallback)
          await sleep(DELAY_MS)
        }
      }

      if (!result) {
        console.log('❌ no results')
        failed++
        await sleep(DELAY_MS)
        continue
      }

      await uploadAndUpdate(sb, photo.id, item.client_id, item.id, result.downloadUrl)
      console.log('✅ uploaded')
      fetched++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.startsWith('rate_limit:')) {
        const detail = msg.replace('rate_limit:', '')
        console.log(
          `\n🛑 Rate limit hit (${detail}). ${fetched} uploaded, ${total - fetched - failed} remaining.` +
          ` Run again in ~1 hour.`,
        )
        rateLimited = true
        break
      }
      console.log(`❌ ${msg}`)
      failed++
    }

    await sleep(DELAY_MS)
  }

  const remaining = total - fetched - failed
  console.log(`\nSummary: ✅ ${fetched} uploaded  ❌ ${failed} failed  ${remaining > 0 ? `${remaining} pending` : '0 pending'}`)
  if (!rateLimited && fetched < MAX_REQUESTS_PER_RUN && remaining > 0) {
    console.log('Run again to continue (script is idempotent).')
  }
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

main().catch(err => {
  console.error('Fatal:', err instanceof Error ? err.message : err)
  process.exit(1)
})
