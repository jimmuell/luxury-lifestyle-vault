import { seedProviders } from './seed-providers'
import { seedClients } from './seed-clients'
import { seedSubscriptions } from './seed-subscriptions'
import { seedItems } from './seed-items'
import { seedPhotos } from './seed-photos'
import { seedConditions } from './seed-conditions'
import { seedOutfits } from './seed-outfits'
import { seedOrders } from './seed-orders'
import { seedConcierge } from './seed-concierge'
import { seedNotifications } from './seed-notifications'
import { seedAudit } from './seed-audit'
import { fetchUnsplashPhotos } from './fetch-unsplash-photos'
import type { SeedResult } from './types'
import type { PhotoFetchResult } from './fetch-unsplash-photos'

export interface AllSeedsResult {
  providers: SeedResult
  clients: SeedResult
  subscriptions: SeedResult
  items: SeedResult
  photos: SeedResult
  conditions: SeedResult
  outfits: SeedResult
  orders: SeedResult
  concierge: SeedResult
  notifications: SeedResult
  audit: SeedResult
  unsplashPhotos: PhotoFetchResult
  totalSeeded: number
  totalSkipped: number
  totalErrors: number
}

export async function seedAll(): Promise<AllSeedsResult> {
  // ── Tier 1: Foundation (parallel — no deps on each other) ─────────────────
  const [providers, clients] = await Promise.all([
    seedProviders(),
    seedClients(),
  ])

  // ── Tier 2: Subscriptions (needs clients + service_tiers from migrations) ──
  const subscriptions = await seedSubscriptions()

  // ── Tier 3: Items (needs client profiles) ─────────────────────────────────
  const items = await seedItems()

  // ── Tier 4: Photos + Conditions (need items) — parallel ───────────────────
  const [photos, conditions] = await Promise.all([
    seedPhotos(),
    seedConditions(),
  ])

  // ── Tier 5: Outfits (need items) ──────────────────────────────────────────
  const outfits = await seedOutfits()

  // ── Tier 6: Orders (need items + providers + corridors + addresses) ────────
  const orders = await seedOrders()

  // ── Tier 7: Concierge + Notifications + Audit (need orders) — parallel ─────
  const [concierge, notifications, audit] = await Promise.all([
    seedConcierge(),
    seedNotifications(),
    seedAudit(),
  ])

  // ── Tier 8: Fetch Unsplash photo URLs for seed items ─────────────────────
  // Runs last — requires item_photos rows from Tier 4.
  // Gracefully handles the Unsplash 50 req/hr demo limit: partial results
  // are returned with rateLimitHit=true so the remaining count is visible.
  const unsplashPhotos = await fetchUnsplashPhotos()

  const totalSeeded =
    providers.seeded + clients.seeded + subscriptions.seeded +
    items.seeded + photos.seeded + conditions.seeded +
    outfits.seeded + orders.seeded + concierge.seeded +
    notifications.seeded + audit.seeded + unsplashPhotos.fetched

  const totalSkipped =
    providers.skipped + clients.skipped + subscriptions.skipped +
    items.skipped + photos.skipped + conditions.skipped +
    outfits.skipped + orders.skipped + concierge.skipped +
    notifications.skipped + audit.skipped + unsplashPhotos.skipped

  const totalErrors =
    providers.errors.length + clients.errors.length + subscriptions.errors.length +
    items.errors.length + photos.errors.length + conditions.errors.length +
    outfits.errors.length + orders.errors.length + concierge.errors.length +
    notifications.errors.length + audit.errors.length + unsplashPhotos.errors.length

  return {
    providers, clients, subscriptions,
    items, photos, conditions,
    outfits, orders, concierge,
    notifications, audit,
    unsplashPhotos,
    totalSeeded, totalSkipped, totalErrors,
  }
}
