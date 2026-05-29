/**
 * fetch-seed-photos.ts
 *
 * One-time script: pulls Unsplash photos for seed wardrobe items and
 * uploads them into Supabase Storage at the existing placeholder paths.
 *
 * Run from the project root:
 *   npx tsx --tsconfig tsconfig.json src/scripts/fetch-seed-photos.ts
 *
 * Unsplash free tier: 50 requests/hour. With 2 s between requests,
 * ~99 items takes about 3 min but uses ~100-115 requests. If you hit a
 * 429, increase DELAY_MS to 75_000 (75 s) to stay under the hourly cap.
 *
 * Idempotent: items whose item_photos.public_url is already set are skipped.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.ts'

// ── Env loading ────────────────────────────────────────────────────────────────
// Load .env.local manually — this script runs outside Next.js.
function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}
loadDotEnv()

const UNSPLASH_KEY   = process.env.UNSPLASH_ACCESS_KEY
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY
const DELAY_MS = process.env.DELAY_MS ? parseInt(process.env.DELAY_MS, 10) : 2_000

if (!UNSPLASH_KEY)               throw new Error('UNSPLASH_ACCESS_KEY missing from .env.local')
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Supabase env vars missing')

const db = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Category fallback queries ─────────────────────────────────────────────────
const CATEGORY_FALLBACK: Record<string, string> = {
  eveningwear:    'evening gown formal dress',
  suiting:        'luxury suit formal menswear',
  outerwear:      'luxury cashmere coat fashion',
  knitwear:       'cashmere sweater luxury knitwear',
  footwear:       'luxury leather shoes fashion',
  handbags:       'luxury designer leather handbag',
  accessories:    'luxury jewelry accessories fashion',
  activewear:     'golf polo performance sport shirt',
  dresses:        'fashion dress elegant woman',
  trousers_skirts:'luxury wide-leg trousers fashion',
  shirts_blouses: 'silk blouse dress shirt fashion',
  swimwear:       'resort luxury beach swimwear',
  lingerie:       'luxury silk lingerie fashion',
  other:          'luxury fashion clothing',
}

// ── Color simplification ──────────────────────────────────────────────────────
function simpleColor(raw: string | null | undefined): string {
  if (!raw) return ''
  const c = raw.toLowerCase()
  if (c.includes('black'))                        return 'black'
  if (c.includes('ivory') || c.includes('cream')) return 'ivory'
  if (c.includes('white'))                        return 'white'
  if (c.includes('navy') || c.includes('sapphire')) return 'navy'
  if (c.includes('blue'))                         return 'blue'
  if (c.includes('camel') || c.includes('beige')) return 'camel'
  if (c.includes('tan'))                          return 'tan'
  if (c.includes('charcoal'))                     return 'charcoal'
  if (c.includes('grey') || c.includes('gray'))  return 'grey'
  if (c.includes('blush') || c.includes('pink')) return 'blush'
  if (c.includes('nude'))                         return 'nude'
  if (c.includes('emerald'))                      return 'emerald'
  if (c.includes('olive') || c.includes('green')) return 'green'
  if (c.includes('gold') || c.includes('champagne')) return 'gold'
  if (c.includes('red') || c.includes('burgundy')) return 'red'
  if (c.includes('cognac') || c.includes('sable') || c.includes('brown')) return 'brown'
  if (c.includes('khaki') || c.includes('stone') || c.includes('sand')) return 'khaki'
  return ''
}

// ── Query builder ─────────────────────────────────────────────────────────────
// Returns a 3–5 word Unsplash search query based on item name, category, color.
// Order matters — more specific checks first, category fallback last.
function buildQuery(name: string, category: string, color: string | null | undefined): string {
  const n   = name.toLowerCase()
  const col = simpleColor(color)
  const p   = col ? `${col} ` : ''          // color prefix

  // ── Specific item patterns ─────────────────────────────────────────────────
  if (n.includes('kelly') || n.includes('birkin'))           return 'hermes leather handbag luxury'
  if (n.includes('classic flap'))                            return 'chanel handbag luxury leather'
  if (n.includes('lady') && n.includes('bag'))               return 'dior lady bag luxury'
  if (n.includes('garden party') || n.includes('tote'))      return `${p}leather tote handbag`.trim()
  if (n.includes('minaudière') || n.includes('clutch'))      return `${p}evening clutch handbag`.trim()
  if (n.includes('boucle') || n.includes('bouclé'))          return `${p}boucle chanel jacket`.trim()
  if (n.includes('skirt suit'))                              return `${p}luxury skirt suit`.trim()
  if (n.includes('tuxedo shirt') || (n.includes('tuxedo') && n.includes('shirt')))
                                                             return 'white formal tuxedo shirt'
  if (n.includes('tuxedo'))                                  return `${p}tuxedo jacket formal`.trim()
  if (n.includes('evening gown') || (n.includes('gown') && n.includes('silk')))
                                                             return `${p}evening gown formal`.trim()
  if (n.includes('gown') && n.includes('velvet'))            return `${p}velvet evening gown`.trim()
  if (n.includes('gown') && n.includes('sequin'))            return `${p}sequin gown formal`.trim()
  if (n.includes('gown'))                                    return `${p}evening gown dress`.trim()
  if (n.includes('cocktail dress') || n.includes('column gown'))
                                                             return `${p}cocktail dress formal`.trim()
  if (n.includes('wrap dress'))                              return `${p}wrap dress elegant`.trim()
  if (n.includes('resort dress') || (n.includes('dress') && n.includes('resort')))
                                                             return `${p}resort dress fashion`.trim()
  if (n.includes('dress'))                                   return `${p}fashion dress elegant`.trim()
  if (n.includes('sport coat') || n.includes('herringbone') && n.includes('coat'))
                                                             return `${p}sport coat herringbone`.trim()
  if (n.includes('blazer') && n.includes('linen'))           return `${p}linen blazer resort`.trim()
  if (n.includes('blazer'))                                  return `${p}luxury blazer fashion`.trim()
  if (n.includes('suit'))                                    return `${p}men suit formal`.trim()
  if (n.includes('turtleneck'))                              return `${p}turtleneck cashmere sweater`.trim()
  if (n.includes('cardigan'))                                return `${p}cashmere cardigan fashion`.trim()
  if (n.includes('crewneck'))                                return `${p}crewneck sweater knitwear`.trim()
  if (n.includes('pullover') || n.includes('v-neck sweater'))return `${p}sweater knitwear luxury`.trim()
  if (n.includes('cashmere') && n.includes('sweater'))       return `${p}cashmere sweater luxury`.trim()
  if (n.includes('shearling'))                               return `${p}shearling vest luxury`.trim()
  if (n.includes('cashmere') && n.includes('overcoat'))      return `${p}cashmere overcoat luxury`.trim()
  if (n.includes('topcoat'))                                 return `${p}men cashmere topcoat`.trim()
  if (n.includes('car coat'))                                return `${p}women luxury car coat`.trim()
  if (n.includes('wrap coat'))                               return `${p}cashmere wrap coat`.trim()
  if (n.includes('cocoon coat'))                             return `${p}wool cocoon coat`.trim()
  if (n.includes('waxed') || n.includes('field coat'))       return 'waxed jacket outdoor fashion'
  if (n.includes('coat'))                                    return `${p}luxury coat fashion`.trim()
  if (n.includes('wind jacket') || n.includes('wind shell')) return 'performance wind jacket sport'
  if (n.includes('vest') && n.includes('golf'))              return 'golf vest sport performance'
  if (n.includes('vest'))                                    return `${p}vest fashion luxur`.trim()
  if (n.includes('tennis bracelet') || n.includes('bracelet'))
                                                             return 'diamond bracelet luxury jewelry'
  if (n.includes('pearl') || n.includes('necklace'))         return 'pearl necklace luxury jewelry'
  if (n.includes('earring'))                                 return `${p}luxury earrings jewelry`.trim()
  if (n.includes('twilly') || n.includes('scarf'))           return `${p}silk scarf hermes fashion`.trim()
  if (n.includes('shawl') || n.includes('stole'))            return `${p}cashmere luxury shawl`.trim()
  if (n.includes('tie collection') || n.includes('silk tie') || n.includes('cravat'))
                                                             return 'silk tie luxury menswear'
  if (n.includes('handbag') || n.includes('bag'))            return `${p}luxury designer handbag`.trim()
  if (n.includes('golf polo') || (n.includes('polo') && n.includes('golf')))
                                                             return `${p}golf polo shirt performance`.trim()
  if (n.includes('polo'))                                    return `${p}polo shirt performance sport`.trim()
  if (n.includes('golf shoe'))                               return 'golf shoes leather sport'
  if (n.includes('oxford') || n.includes('derby'))           return `${p}oxford dress shoes leather`.trim()
  if (n.includes('loafer'))                                  return `${p}leather loafer shoes`.trim()
  if (n.includes('pump') || n.includes('stiletto'))          return `${p}women heels pumps fashion`.trim()
  if (n.includes('mule') || n.includes('slingback'))         return `${p}women mules shoes fashion`.trim()
  if (n.includes('dress shoe') || n.includes('dress shoes')) return `${p}men dress shoes leather`.trim()
  if (n.includes('linen') && n.includes('shirt'))            return `${p}linen shirt resort fashion`.trim()
  if (n.includes('oxford shirt') || n.includes('dress shirt') || n.includes('french-cuff'))
                                                             return `${p}dress shirt formal white`.trim()
  if (n.includes('tuxedo shirt') || n.includes('tuxedo') && n.includes('shirt'))
                                                             return 'formal tuxedo dress shirt'
  if (n.includes('silk') && n.includes('blouse'))            return `${p}silk blouse fashion luxury`.trim()
  if (n.includes('blouse'))                                  return `${p}blouse fashion shirt`.trim()
  if (n.includes('kaftan') || n.includes('cover-up'))        return 'resort beach kaftan luxury'
  if (n.includes('linen') && n.includes('trouser'))          return `${p}linen trousers resort`.trim()
  if (n.includes('wide-leg') || n.includes('wide leg'))      return `${p}wide leg trousers fashion`.trim()
  if (n.includes('straight-leg') || n.includes('pleated') && n.includes('trouser'))
                                                             return `${p}luxury trousers pleated`.trim()
  if (n.includes('chino'))                                   return `${p}men chino trousers fashion`.trim()
  if (n.includes('shorts'))                                  return `${p}performance shorts sport`.trim()
  if (n.includes('golf shorts') || n.includes('golf') && n.includes('short'))
                                                             return 'golf shorts performance sport'
  if (n.includes('midi skirt'))                              return `${p}midi skirt fashion`.trim()
  if (n.includes('skirt'))                                   return `${p}skirt fashion elegant`.trim()
  if (n.includes('trouser') || n.includes('pant'))           return `${p}luxury trousers fashion`.trim()
  if (n.includes('linen') && n.includes('beach'))            return 'linen beach trousers resort'
  if (n.includes('beach'))                                   return 'beach resort swimwear fashion'

  return CATEGORY_FALLBACK[category] ?? 'luxury fashion clothing'
}

// ── Unsplash API ───────────────────────────────────────────────────────────────
interface UnsplashPhoto {
  id: string
  urls: { regular: string }
  links: { html: string }
}

async function searchUnsplash(query: string): Promise<UnsplashPhoto | null> {
  const url = new URL('https://api.unsplash.com/search/photos')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', '1')
  url.searchParams.set('orientation', 'portrait')

  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
  })

  if (resp.status === 429) throw new Error('Unsplash rate limit hit — increase DELAY_MS to 75000')
  if (!resp.ok) throw new Error(`Unsplash ${resp.status} ${resp.statusText}`)

  const body = await resp.json() as { results: UnsplashPhoto[] }
  return body.results[0] ?? null
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Load seed photo records that still need a photo URL.
  const { data: photos, error: photosErr } = await db
    .from('item_photos')
    .select('id, item_id, storage_path')
    .eq('is_seed_data', true)
    .is('public_url', null)

  if (photosErr) { console.error('DB error:', photosErr.message); process.exit(1) }
  if (!photos?.length) { console.log('Nothing to do — all seed photos already have public_url set.'); process.exit(0) }

  // 2. Load item details for name/category/color to build search queries.
  const { data: items, error: itemsErr } = await db
    .from('items')
    .select('id, name, category, color, brand')
    .in('id', photos.map(p => p.item_id))

  if (itemsErr) { console.error('DB error:', itemsErr.message); process.exit(1) }

  const itemMap = new Map((items ?? []).map(i => [i.id, i]))

  console.log(`Fetching Unsplash photo URLs for ${photos.length} items (${DELAY_MS / 1000}s delay)\n`)

  let ok = 0, warned = 0, failed = 0

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    const item  = itemMap.get(photo.item_id)

    if (!item) {
      console.log(`⚠️  [${i + 1}/${photos.length}] item ${photo.item_id} not found — skipping`)
      warned++
      continue
    }

    const { name, category, color } = item
    const primaryQuery  = buildQuery(name, category, color)
    const fallbackQuery = CATEGORY_FALLBACK[category] ?? 'luxury fashion clothing'

    let result: UnsplashPhoto | null = null
    let usedQuery   = primaryQuery
    let didFallback = false

    try {
      result = await searchUnsplash(primaryQuery)

      if (!result && primaryQuery !== fallbackQuery) {
        await sleep(DELAY_MS)
        result      = await searchUnsplash(fallbackQuery)
        usedQuery   = fallbackQuery
        didFallback = true
      }

      if (!result) {
        console.log(`⚠️  [${i + 1}/${photos.length}] "${name}" → no results for "${usedQuery}" — skipping`)
        warned++
      } else {
        // Store the Unsplash CDN image URL directly in public_url.
        // The frontend reads public_url and uses it as <Image src> — no signed-URL round-trip needed.
        // Using .select() so a 0-row match surfaces as an error rather than silent success.
        const { data: updated, error: updateErr } = await db
          .from('item_photos')
          .update({ public_url: result.urls.regular })
          .eq('id', photo.id)
          .select('id')

        if (updateErr) throw new Error(`DB update: ${updateErr.message}`)
        if (!updated?.length) throw new Error(`DB update matched 0 rows for photo id ${photo.id}`)

        const note = didFallback ? ` ⤷ fallback: "${fallbackQuery}"` : ''
        console.log(`✅ [${i + 1}/${photos.length}] "${name}" → "${usedQuery}"${note}`)
        ok++
      }
    } catch (err) {
      console.log(`❌ [${i + 1}/${photos.length}] "${name}" → ${err instanceof Error ? err.message : String(err)}`)
      failed++
    }

    if (i < photos.length - 1) await sleep(DELAY_MS)
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Complete: ${ok} set  ${warned} skipped (no results)  ${failed} errors`)
  if (failed > 0) process.exit(1)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
