import { seedProviders } from './seed-providers'
import { seedClients } from './seed-clients'
import { seedDemoAccounts } from './seed-demo-accounts'
import { seedSubscriptions } from './seed-subscriptions'
import { seedItems } from './seed-items'
import { seedPhotos } from './seed-photos'
import { seedConditions } from './seed-conditions'
import { seedOutfits } from './seed-outfits'
import { seedOrders } from './seed-orders'
import { seedConcierge } from './seed-concierge'
import { seedNotifications } from './seed-notifications'
import { seedAudit } from './seed-audit'
import type { SeedResult } from './types'

export interface AllSeedsResult {
  providers: SeedResult
  clients: SeedResult
  demoAccounts: SeedResult
  subscriptions: SeedResult
  items: SeedResult
  photos: SeedResult
  conditions: SeedResult
  outfits: SeedResult
  orders: SeedResult
  concierge: SeedResult
  notifications: SeedResult
  audit: SeedResult
  totalSeeded: number
  totalSkipped: number
  totalErrors: number
}

export async function seedAll(): Promise<AllSeedsResult> {
  // ── Tier 1: Foundation (parallel — no deps on each other) ─────────────────
  const [providers, clients, demoAccounts] = await Promise.all([
    seedProviders(),
    seedClients(),
    seedDemoAccounts(),
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

  const totalSeeded =
    providers.seeded + clients.seeded + demoAccounts.seeded + subscriptions.seeded +
    items.seeded + photos.seeded + conditions.seeded +
    outfits.seeded + orders.seeded + concierge.seeded +
    notifications.seeded + audit.seeded

  const totalSkipped =
    providers.skipped + clients.skipped + demoAccounts.skipped + subscriptions.skipped +
    items.skipped + photos.skipped + conditions.skipped +
    outfits.skipped + orders.skipped + concierge.skipped +
    notifications.skipped + audit.skipped

  const totalErrors =
    providers.errors.length + clients.errors.length + demoAccounts.errors.length + subscriptions.errors.length +
    items.errors.length + photos.errors.length + conditions.errors.length +
    outfits.errors.length + orders.errors.length + concierge.errors.length +
    notifications.errors.length + audit.errors.length

  return {
    providers, clients, demoAccounts, subscriptions,
    items, photos, conditions,
    outfits, orders, concierge,
    notifications, audit,
    totalSeeded, totalSkipped, totalErrors,
  }
}
