import { seedHelp } from './seed-help'
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
import type { SeedScript } from './types'

export const SEED_MANIFEST: SeedScript[] = [
  {
    id: 'providers',
    name: 'Providers',
    description: '5 service providers — 3 Scottsdale AZ (RAVE FabriCARE, European Couture, Mastel) + 2 Wisconsin (Milwaukee Garment Care, Madison Premium)',
    script: seedProviders,
  },
  {
    id: 'clients',
    name: 'Demo Clients',
    description: '5 luxury snowbird client profiles with WI + AZ addresses (client1–5@test.llv.com / TestLLV2026!). Clients 1–3 fully onboarded; 4–5 in progress.',
    script: seedClients,
  },
  {
    id: 'demo-accounts',
    name: 'Demo Accounts',
    description: 'Quick-login demo accounts: demo.admin@llv.dev + demo.client@llv.dev + demo.investor@llv.dev (password: demo1234). Demo client is fully onboarded with 6 wardrobe items and 1 completed order. Demo investor has role=investor, onboarding_complete=true.',
    script: seedDemoAccounts,
  },
  {
    id: 'subscriptions',
    name: 'Client Subscriptions',
    description: 'Active subscriptions for clients 1–3. Margaret → Seasonal Premier; Catherine + James → Seasonal Essentials. Sets founding_member: true, stripe_customer_id.',
    script: seedSubscriptions,
  },
  {
    id: 'items',
    name: 'Wardrobe Items',
    description: '~118 luxury wardrobe items: Margaret (~48, incl. Richard\'s items), Catherine (~38), James (~32), + 11 intake-pending items for clients 4–5.',
    script: seedItems,
  },
  {
    id: 'photos',
    name: 'Item Photos',
    description: 'Placeholder photo records with realistic AI analysis JSON for each seeded item.',
    script: seedPhotos,
  },
  {
    id: 'conditions',
    name: 'Condition Records',
    description: '11 condition audit records covering key lifecycle events for items past intake.',
    script: seedConditions,
  },
  {
    id: 'outfits',
    name: 'Saved Outfits',
    description: '10 curated outfits: 4 Margaret (incl. Richard\'s board meeting), 3 Catherine, 3 James. All item links resolved dynamically.',
    script: seedOutfits,
  },
  {
    id: 'orders',
    name: 'Order History',
    description: '7 orders across lifecycle stages: 4 completed (seasonal rotations + on-demand), 2 in progress (gown cleaning + Valentino repair), 1 just requested.',
    script: seedOrders,
  },
  {
    id: 'concierge',
    name: 'Concierge Messages',
    description: '7 messages: 5 client messages (mix of open/in-progress/resolved), 2 provider messages from RAVE FabriCARE and European Couture with is_provider_message: true.',
    script: seedConcierge,
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: '19 in-app notifications across 3 clients — order confirmations, status changes, payment receipts, and concierge replies. Mix of read and unread.',
    script: seedNotifications,
  },
  {
    id: 'audit',
    name: 'Admin Audit Log',
    description: '15 audit log entries spanning 6 months of order lifecycle events plus client onboarding records.',
    script: seedAudit,
  },
  {
    id: 'help',
    name: 'Help Content',
    description: '2 tooltips (client.ondemand, client.returns) + 2 articles (on-demand fulfillment + garment care stages). Proves the framework; other area keys intentionally empty.',
    script: seedHelp,
  },
]
