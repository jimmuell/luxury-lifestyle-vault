import { createAdminClient } from '@/lib/supabase/admin'
import type { SeedResult } from './types'

export interface PhotoFetchResult extends SeedResult {
  fetched: number
  rateLimitHit: boolean
  remaining: number
}

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

function simpleColor(raw: string | null | undefined): string {
  if (!raw) return ''
  const c = raw.toLowerCase()
  if (c.includes('black'))                          return 'black'
  if (c.includes('ivory') || c.includes('cream'))  return 'ivory'
  if (c.includes('white'))                          return 'white'
  if (c.includes('navy') || c.includes('sapphire'))return 'navy'
  if (c.includes('blue'))                           return 'blue'
  if (c.includes('camel') || c.includes('beige'))  return 'camel'
  if (c.includes('tan'))                            return 'tan'
  if (c.includes('charcoal'))                       return 'charcoal'
  if (c.includes('grey') || c.includes('gray'))    return 'grey'
  if (c.includes('blush') || c.includes('pink'))   return 'blush'
  if (c.includes('nude'))                           return 'nude'
  if (c.includes('emerald'))                        return 'emerald'
  if (c.includes('olive') || c.includes('green'))  return 'green'
  if (c.includes('gold') || c.includes('champagne'))return 'gold'
  if (c.includes('red') || c.includes('burgundy')) return 'red'
  if (c.includes('cognac') || c.includes('sable') || c.includes('brown')) return 'brown'
  if (c.includes('khaki') || c.includes('stone') || c.includes('sand'))   return 'khaki'
  return ''
}

function buildQuery(name: string, category: string, color: string | null | undefined): string {
  const n   = name.toLowerCase()
  const col = simpleColor(color)
  const p   = col ? `${col} ` : ''

  if (n.includes('kelly') || n.includes('birkin'))            return 'hermes leather handbag luxury'
  if (n.includes('classic flap'))                             return 'chanel handbag luxury leather'
  if (n.includes('lady') && n.includes('bag'))                return 'dior lady bag luxury'
  if (n.includes('garden party') || n.includes('tote'))       return `${p}leather tote handbag`.trim()
  if (n.includes('minaudière') || n.includes('clutch'))       return `${p}evening clutch handbag`.trim()
  if (n.includes('boucle') || n.includes('bouclé'))           return `${p}boucle chanel jacket`.trim()
  if (n.includes('skirt suit'))                               return `${p}luxury skirt suit`.trim()
  if (n.includes('tuxedo shirt') || (n.includes('tuxedo') && n.includes('shirt')))
                                                              return 'white formal tuxedo shirt'
  if (n.includes('tuxedo'))                                   return `${p}tuxedo jacket formal`.trim()
  if (n.includes('evening gown') || (n.includes('gown') && n.includes('silk')))
                                                              return `${p}evening gown formal`.trim()
  if (n.includes('gown') && n.includes('velvet'))             return `${p}velvet evening gown`.trim()
  if (n.includes('gown') && n.includes('sequin'))             return `${p}sequin gown formal`.trim()
  if (n.includes('gown'))                                     return `${p}evening gown dress`.trim()
  if (n.includes('cocktail dress') || n.includes('column gown'))
                                                              return `${p}cocktail dress formal`.trim()
  if (n.includes('wrap dress'))                               return `${p}wrap dress elegant`.trim()
  if (n.includes('resort dress') || (n.includes('dress') && n.includes('resort')))
                                                              return `${p}resort dress fashion`.trim()
  if (n.includes('dress'))                                    return `${p}fashion dress elegant`.trim()
  if (n.includes('sport coat') || (n.includes('herringbone') && n.includes('coat')))
                                                              return `${p}sport coat herringbone`.trim()
  if (n.includes('blazer') && n.includes('linen'))            return `${p}linen blazer resort`.trim()
  if (n.includes('blazer'))                                   return `${p}luxury blazer fashion`.trim()
  if (n.includes('suit'))                                     return `${p}men suit formal`.trim()
  if (n.includes('turtleneck'))                               return `${p}turtleneck cashmere sweater`.trim()
  if (n.includes('cardigan'))                                 return `${p}cashmere cardigan fashion`.trim()
  if (n.includes('crewneck'))                                 return `${p}crewneck sweater knitwear`.trim()
  if (n.includes('pullover') || n.includes('v-neck sweater'))return `${p}sweater knitwear luxury`.trim()
  if (n.includes('cashmere') && n.includes('sweater'))        return `${p}cashmere sweater luxury`.trim()
  if (n.includes('shearling'))                                return `${p}shearling vest luxury`.trim()
  if (n.includes('cashmere') && n.includes('overcoat'))       return `${p}cashmere overcoat luxury`.trim()
  if (n.includes('topcoat'))                                  return `${p}men cashmere topcoat`.trim()
  if (n.includes('car coat'))                                 return `${p}women luxury car coat`.trim()
  if (n.includes('wrap coat'))                                return `${p}cashmere wrap coat`.trim()
  if (n.includes('cocoon coat'))                              return `${p}wool cocoon coat`.trim()
  if (n.includes('waxed') || n.includes('field coat'))        return 'waxed jacket outdoor fashion'
  if (n.includes('coat'))                                     return `${p}luxury coat fashion`.trim()
  if (n.includes('wind jacket') || n.includes('wind shell'))  return 'performance wind jacket sport'
  if (n.includes('vest') && n.includes('golf'))               return 'golf vest sport performance'
  if (n.includes('vest'))                                     return `${p}vest fashion luxury`.trim()
  if (n.includes('tennis bracelet') || n.includes('bracelet'))return 'diamond bracelet luxury jewelry'
  if (n.includes('pearl') || n.includes('necklace'))          return 'pearl necklace luxury jewelry'
  if (n.includes('earring'))                                  return `${p}luxury earrings jewelry`.trim()
  if (n.includes('twilly') || n.includes('scarf'))            return `${p}silk scarf hermes fashion`.trim()
  if (n.includes('shawl') || n.includes('stole'))             return `${p}cashmere luxury shawl`.trim()
  if (n.includes('tie collection') || n.includes('silk tie') || n.includes('cravat'))
                                                              return 'silk tie luxury menswear'
  if (n.includes('handbag') || n.includes('bag'))             return `${p}luxury designer handbag`.trim()
  if (n.includes('golf polo') || (n.includes('polo') && n.includes('golf')))
                                                              return `${p}golf polo shirt performance`.trim()
  if (n.includes('polo'))                                     return `${p}polo shirt performance sport`.trim()
  if (n.includes('golf shoe'))                                return 'golf shoes leather sport'
  if (n.includes('oxford') || n.includes('derby'))            return `${p}oxford dress shoes leather`.trim()
  if (n.includes('loafer'))                                   return `${p}leather loafer shoes`.trim()
  if (n.includes('pump') || n.includes('stiletto'))           return `${p}women heels pumps fashion`.trim()
  if (n.includes('mule') || n.includes('slingback'))          return `${p}women mules shoes fashion`.trim()
  if (n.includes('dress shoe') || n.includes('dress shoes'))  return `${p}men dress shoes leather`.trim()
  if (n.includes('linen') && n.includes('shirt'))             return `${p}linen shirt resort fashion`.trim()
  if (n.includes('oxford shirt') || n.includes('dress shirt') || n.includes('french-cuff'))
                                                              return `${p}dress shirt formal white`.trim()
  if (n.includes('silk') && n.includes('blouse'))             return `${p}silk blouse fashion luxury`.trim()
  if (n.includes('blouse'))                                   return `${p}blouse fashion shirt`.trim()
  if (n.includes('kaftan') || n.includes('cover-up'))         return 'resort beach kaftan luxury'
  if (n.includes('linen') && n.includes('trouser'))           return `${p}linen trousers resort`.trim()
  if (n.includes('wide-leg') || n.includes('wide leg'))       return `${p}wide leg trousers fashion`.trim()
  if (n.includes('straight-leg') || (n.includes('pleated') && n.includes('trouser')))
                                                              return `${p}luxury trousers pleated`.trim()
  if (n.includes('chino'))                                    return `${p}men chino trousers fashion`.trim()
  if (n.includes('shorts'))                                   return `${p}performance shorts sport`.trim()
  if (n.includes('midi skirt'))                               return `${p}midi skirt fashion`.trim()
  if (n.includes('skirt'))                                    return `${p}skirt fashion elegant`.trim()
  if (n.includes('trouser') || n.includes('pant'))            return `${p}luxury trousers fashion`.trim()
  if (n.includes('beach'))                                    return 'beach resort swimwear fashion'

  return CATEGORY_FALLBACK[category] ?? 'luxury fashion clothing'
}

interface UnsplashPhoto {
  urls: { regular: string }
}

async function searchUnsplash(
  query: string,
  key: string,
): Promise<UnsplashPhoto | null | 'rate_limited'> {
  const url = new URL('https://api.unsplash.com/search/photos')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', '1')
  url.searchParams.set('orientation', 'portrait')

  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${key}` },
  })

  if (resp.status === 429) return 'rate_limited'
  if (!resp.ok) throw new Error(`Unsplash ${resp.status} ${resp.statusText}`)

  const body = await resp.json() as { results: UnsplashPhoto[] }
  return body.results[0] ?? null
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export async function fetchUnsplashPhotos(delayMs = 1500): Promise<PhotoFetchResult> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) {
    return {
      seeded: 0, skipped: 0,
      errors: ['UNSPLASH_ACCESS_KEY not configured — set it in .env.local'],
      fetched: 0, rateLimitHit: false, remaining: 0,
    }
  }

  const db = createAdminClient()

  const { data: photos, error: photosErr } = await db
    .from('item_photos')
    .select('id, item_id')
    .eq('is_seed_data', true)
    .is('public_url', null)

  if (photosErr) {
    return {
      seeded: 0, skipped: 0, errors: [photosErr.message],
      fetched: 0, rateLimitHit: false, remaining: 0,
    }
  }
  if (!photos?.length) {
    return {
      seeded: 0, skipped: 0, errors: [],
      fetched: 0, rateLimitHit: false, remaining: 0,
    }
  }

  const { data: items, error: itemsErr } = await db
    .from('items')
    .select('id, name, category, color')
    .in('id', photos.map(p => p.item_id))

  if (itemsErr) {
    return {
      seeded: 0, skipped: 0, errors: [itemsErr.message],
      fetched: 0, rateLimitHit: false, remaining: photos.length,
    }
  }

  const itemMap = new Map((items ?? []).map(i => [i.id, i]))

  let fetched = 0
  let skipped = 0
  let rateLimitHit = false
  const errors: string[] = []

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    const item  = itemMap.get(photo.item_id)

    if (!item) { skipped++; continue }

    const primaryQuery  = buildQuery(item.name, item.category, item.color)
    const fallbackQuery = CATEGORY_FALLBACK[item.category] ?? 'luxury fashion clothing'

    try {
      let result = await searchUnsplash(primaryQuery, key)

      if (result === 'rate_limited') { rateLimitHit = true; break }

      if (!result && primaryQuery !== fallbackQuery) {
        await sleep(delayMs)
        result = await searchUnsplash(fallbackQuery, key)
        if (result === 'rate_limited') { rateLimitHit = true; break }
      }

      if (!result) {
        skipped++
      } else {
        const { data: updated, error: updateErr } = await db
          .from('item_photos')
          .update({ public_url: result.urls.regular })
          .eq('id', photo.id)
          .select('id')

        if (updateErr) throw new Error(updateErr.message)
        if (!updated?.length) throw new Error(`0 rows matched for photo ${photo.id}`)

        fetched++
      }
    } catch (err) {
      errors.push(`${item.name}: ${err instanceof Error ? err.message : String(err)}`)
    }

    if (i < photos.length - 1) await sleep(delayMs)
  }

  const { count: remaining } = await db
    .from('item_photos')
    .select('*', { count: 'exact', head: true })
    .eq('is_seed_data', true)
    .is('public_url', null)

  return {
    seeded: fetched,
    skipped,
    errors,
    fetched,
    rateLimitHit,
    remaining: remaining ?? 0,
  }
}
