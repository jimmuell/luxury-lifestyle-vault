import { createAdminClient } from '@/lib/supabase/admin'
import { SEED_CLIENT_EMAILS } from './seed-clients'
import type { SeedResult } from './types'

interface SeedOutfit {
  client_email: string
  name: string
  notes: string | null
  item_names: string[]  // resolved by (client_id, name) lookup
}

const SEED_OUTFITS: SeedOutfit[] = [
  // ── Margaret Hartwell ─────────────────────────────────────────────────────
  {
    client_email: 'client1@test.llv.com',
    name: 'Country Club Gala',
    notes: 'Full formal look for the Desert Philanthropists Gala and similar black-tie events. Carolina Herrera gown with Cartier tennis bracelet and Judith Leiber clutch.',
    item_names: [
      'Ivory Silk Evening Gown',
      'Diamond Tennis Bracelet',
      'Ivory Minaudière Evening Clutch',
      'Black Satin Evening Pumps',
      'Pearl Strand Necklace',
    ],
  },
  {
    client_email: 'client1@test.llv.com',
    name: 'Sunday Brunch Scottsdale',
    notes: 'Relaxed luxury for weekend brunch at The Phoenician or similar. Light and fresh for the Arizona winter season.',
    item_names: [
      'Navy Crepe Wrap Dress',
      'Tan Hermès Birkin 30',
      'Tan Leather Walking Loafers',
      'Ivory Cashmere Travel Shawl',
    ],
  },
  {
    client_email: 'client1@test.llv.com',
    name: 'Golf with Richard',
    notes: "Matching coordinated resort looks for golf at Desert Mountain or Whisper Rock. Missoni kaftan over the swimsuit works beautifully at the 19th hole.",
    item_names: [
      'Navy Swimsuit Cover-Up Kaftan',
      'White Linen Beach Trousers',
      'Tan Leather Walking Loafers',
    ],
  },
  {
    client_email: 'client1@test.llv.com',
    name: "Richard's Board Meeting",
    notes: 'Richard\'s go-to for board meetings and formal client dinners. Brioni suit with Turnbull & Asser shirt.',
    item_names: [
      "Richard's Charcoal Brioni Suit",
      "Richard's White Tuxedo Dress Shirts (3)",
      "Richard's Allen Edmonds Dress Shoes",
    ],
  },

  // ── Catherine Beaumont ─────────────────────────────────────────────────────
  {
    client_email: 'client2@test.llv.com',
    name: 'Gallery Opening',
    notes: 'Perfect for evening gallery openings and arts galas. The Valentino gown (after repair) will anchor this look. Current placeholder uses the Oscar de la Renta.',
    item_names: [
      'Sapphire Silk Cocktail Dress',
      'Cognac Python Evening Clutch',
      'Blush Satin Strappy Mules',
      'Gold Drop Earrings',
    ],
  },
  {
    client_email: 'client2@test.llv.com',
    name: 'Symphony Night',
    notes: 'Wisconsin formal season — black velvet gown with Graff sapphires for the Milwaukee Symphony gala circuit.',
    item_names: [
      'Black Velvet Evening Gown',
      'Sapphire and Diamond Earrings',
      'Black Satin Ankle Strap Heels',
      'Black Dior Lady Bag',
    ],
  },
  {
    client_email: 'client2@test.llv.com',
    name: 'Winter in Wisconsin',
    notes: 'Polished daytime look for winter events in Milwaukee. The vicuña shawl is the centerpiece.',
    item_names: [
      'Black Chanel Boucle Jacket',
      'Ivory Fine Cashmere Turtleneck',
      'Camel Cashmere Trousers',
      'Winter White Cashmere Shawl',
    ],
  },

  // ── James Thornton ─────────────────────────────────────────────────────────
  {
    client_email: 'client3@test.llv.com',
    name: 'Monday Meeting',
    notes: "James's standard business uniform. Navy suit with Eton shirt and Hermès tie. Works for client meetings and board appearances.",
    item_names: [
      'Navy Worsted Wool Suit',
      'White French-Cuff Dress Shirt',
      'Silk Tie Collection (8 ties)',
      'Black Cap-Toe Oxfords',
    ],
  },
  {
    client_email: 'client3@test.llv.com',
    name: 'Scottsdale Golf',
    notes: 'AZ winter golf at TPC Scottsdale or Desert Highlands. Performance polo with Bonobos shorts.',
    item_names: [
      'Sky Blue Performance Golf Polo',
      'Desert Sand Performance Shorts',
      'FootJoy Traditions Golf Shoes (AZ)',
    ],
  },
  {
    client_email: 'client3@test.llv.com',
    name: 'Resort Evening',
    notes: 'Relaxed elegant look for dinner at FnB or Zinc Bistro after a round of golf.',
    item_names: [
      'Navy Linen Blazer (Resort)',
      'White Linen Resort Shirt',
      'Stone Pleated Resort Trousers',
      'Tan Suede Loafers',
    ],
  },
]

export async function seedOutfits(): Promise<SeedResult> {
  const adminClient = createAdminClient()
  let seeded = 0
  let skipped = 0
  const errors: string[] = []

  // Load profiles
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, email')
    .in('email', SEED_CLIENT_EMAILS)

  if (!profiles?.length) {
    return { seeded: 0, skipped: 0, errors: ['No seed clients found — run seed-clients first'] }
  }

  const clientMap: Record<string, string> = {}
  for (const p of profiles) { clientMap[p.email] = p.id }

  for (const outfit of SEED_OUTFITS) {
    try {
      const clientId = clientMap[outfit.client_email]
      if (!clientId) {
        errors.push(`Outfit "${outfit.name}": client not found`)
        continue
      }

      // Idempotency: check by (client_id, name)
      const { data: existing } = await adminClient
        .from('outfits')
        .select('id')
        .eq('client_id', clientId)
        .eq('name', outfit.name)
        .maybeSingle()

      let outfitId: string

      if (existing) {
        outfitId = existing.id
        skipped++
      } else {
        const { data: newOutfit, error: outfitErr } = await adminClient
          .from('outfits')
          .insert({
            client_id: clientId,
            name: outfit.name,
            notes: outfit.notes,
            is_seed_data: true,
          })
          .select('id')
          .single()

        if (outfitErr) throw new Error(`outfits: ${outfitErr.message}`)
        if (!newOutfit) throw new Error('No outfit returned after insert')
        outfitId = newOutfit.id
        seeded++
      }

      // Resolve item IDs and upsert outfit_items
      for (let i = 0; i < outfit.item_names.length; i++) {
        const itemName = outfit.item_names[i]
        const { data: item } = await adminClient
          .from('items')
          .select('id')
          .eq('client_id', clientId)
          .eq('name', itemName)
          .maybeSingle()

        if (!item) {
          errors.push(`Outfit "${outfit.name}" → item "${itemName}" not found — skipping item`)
          continue
        }

        // Upsert outfit_item (composite PK: outfit_id + item_id)
        const { error: itemErr } = await adminClient
          .from('outfit_items')
          .upsert(
            { outfit_id: outfitId, item_id: item.id, sort_order: i, is_seed_data: true },
            { onConflict: 'outfit_id,item_id' }
          )

        if (itemErr) errors.push(`Outfit "${outfit.name}" item "${itemName}": ${itemErr.message}`)
      }

    } catch (err) {
      errors.push(`Outfit "${outfit.name}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { seeded, skipped, errors }
}
