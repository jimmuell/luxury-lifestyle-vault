/**
 * Standalone seed-photo fetch script — downloads Pexels photos for seed items.
 *
 * Usage (from project root):
 *   npx tsx src/scripts/fetch-seed-photos.ts
 *
 * Requires in .env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PEXELS_API_KEY
 *
 * Rate limits: Pexels free tier = 200 req/hr / 20,000/month. Script caps at 45 per run
 * and adds a 1-second delay between requests. Re-run to continue; fully idempotent.
 *
 * Storage note: item-photos bucket is private (public: false). After upload,
 * storage_path is updated to the real path and public_url stays null. The wardrobe
 * display handles null public_url by batch-signing on each page load — same path as
 * real client uploads. Attribution (photographer / Pexels URL) stored in item_photos.attribution.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const ACTIVE_BUCKET = 'item-photos'
const MAX_REQUESTS_PER_RUN = 45
const DELAY_MS = 1000
const RATELIMIT_SAFETY_FLOOR = 5

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const PEXELS_KEY = process.env.PEXELS_API_KEY!

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

function buildQuery(name: string, category: string, color: string | null, brand: string | null): string {
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

// ── Pexels helpers ───────────────────────────────────────────────────────────

type PexelsAttribution = { photographer: string; photographer_url: string; source_url: string }
type PexelsResult = { imageUrl: string; attribution: PexelsAttribution }

async function searchPexels(query: string): Promise<PexelsResult | null> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`

  const res = await fetch(url, {
    headers: {
      Authorization: PEXELS_KEY, // Pexels: raw key, no "Bearer" or "Client-ID" prefix
      'User-Agent': 'LuxuryLifestyleVault/1.0',
    },
  })

  const limitHeader     = res.headers.get('X-Ratelimit-Limit')
  const remainingHeader = res.headers.get('X-Ratelimit-Remaining')
  const remaining = remainingHeader !== null ? parseInt(remainingHeader, 10) : null

  if (remaining !== null && remaining <= RATELIMIT_SAFETY_FLOOR) {
    console.log(`\n⚠️  X-Ratelimit-Remaining = ${remaining} — stopping early for safety`)
    throw new Error('rate_limit:quota_floor')
  }

  if (!res.ok) {
    const bodySnippet = await res.text().catch(() => '(unreadable)').then(t => t.slice(0, 200))
    const keyFingerprint = `len=${PEXELS_KEY.length} last4=…${PEXELS_KEY.slice(-4)}`
    console.error(`Pexels ${res.status} — limit=${limitHeader ?? '?'} remaining=${remainingHeader ?? '?'} key=${keyFingerprint} body=${bodySnippet}`)
    throw new Error(`rate_limit:${res.status}`)
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

// ── Storage + DB helpers ─────────────────────────────────────────────────────

async function uploadAndUpdate(
  sb: any,
  photoId: string,
  clientId: string,
  itemId: string,
  imageUrl: string,
  attribution: PexelsAttribution,
): Promise<void> {
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`)
  const buffer = Buffer.from(await imgRes.arrayBuffer())

  const storagePath = `${clientId}/${itemId}/main.jpg`
  const { error: upErr } = await sb.storage
    .from(ACTIVE_BUCKET)
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })
  if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`)

  const { error: dbErr } = await sb
    .from('item_photos')
    .update({ storage_path: storagePath, attribution })
    .eq('id', photoId)
  if (dbErr) throw new Error(`DB update failed: ${dbErr.message}`)
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const missing = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'PEXELS_API_KEY']
    .filter(k => !process.env[k])
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(', ')}`)
    process.exit(1)
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as any

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

  type ItemRow = { id: string; client_id: string; name: string; category: string; brand: string | null; color: string | null }
  type PhotoRow = {
    id: string; item_id: string; storage_path: string; public_url: string | null
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
        ` Script is idempotent — run again to continue.`,
      )
      break
    }

    const item: ItemRow | null = Array.isArray(photo.items) ? (photo.items[0] ?? null) : photo.items
    if (!item) {
      console.log(`⏭️  Photo row ${photo.id} — no linked item, skipped`)
      continue
    }

    const primaryQuery = buildQuery(item.name, item.category, item.color, item.brand)
    process.stdout.write(`   "${item.name}" → "${primaryQuery}" → `)

    try {
      let result = await searchPexels(primaryQuery)

      if (!result) {
        const fallback = CATEGORY_TERMS[item.category] ?? 'luxury fashion clothing'
        if (fallback !== primaryQuery) {
          process.stdout.write(`no results, trying "${fallback}" → `)
          result = await searchPexels(fallback)
          await sleep(DELAY_MS)
        }
      }

      if (!result) {
        console.log('❌ no results')
        failed++
        await sleep(DELAY_MS)
        continue
      }

      await uploadAndUpdate(sb, photo.id, item.client_id, item.id, result.imageUrl, result.attribution)
      console.log(`✅ uploaded (${result.attribution.photographer})`)
      fetched++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.startsWith('rate_limit:')) {
        const detail = msg.replace('rate_limit:', '')
        console.log(
          `\n🛑 Rate limit / auth error (${detail}). ${fetched} uploaded, ${total - fetched - failed} remaining.`,
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
