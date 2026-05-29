import { createAdminClient } from '@/lib/supabase/admin'
import { SEED_CLIENT_EMAILS } from './seed-clients'
import type { SeedResult } from './types'
import type { Database, Json } from '@/types/database'

type NotificationType = Database['public']['Enums']['notification_type']

interface SeedNotification {
  recipient_email: string
  type: NotificationType
  title: string
  snippet: string | null
  link_target: string | null
  metadata: Json
  read_at: string | null   // null = unread
  created_at: string
}

// Idempotency key = (recipient_profile_id, title, created_at)

const SEED_NOTIFICATIONS: SeedNotification[] = [
  // ── Margaret Hartwell notifications ───────────────────────────────────────

  // Order 1 confirmed (3 months ago — read)
  {
    recipient_email: 'client1@test.llv.com',
    type: 'order_confirmed',
    title: 'Seasonal Rotation Confirmed',
    snippet: 'Your WI→AZ seasonal rotation has been confirmed. 25 items scheduled for delivery Feb 22.',
    link_target: '/client/orders',
    metadata: { order_notes_key: 'Margaret Hartwell Seasonal Rotation Feb 2026' },
    read_at: '2026-01-28T14:00:00Z',
    created_at: '2026-01-28T12:05:00Z',
  },
  // Order 1 shipped (read)
  {
    recipient_email: 'client1@test.llv.com',
    type: 'order_status_changed',
    title: 'Your shipment is on its way',
    snippet: 'FedEx tracking FX29831004720001 — estimated delivery Feb 22.',
    link_target: '/client/orders',
    metadata: { tracking_number: 'FX29831004720001', carrier: 'fedex' },
    read_at: '2026-02-18T10:00:00Z',
    created_at: '2026-02-18T08:05:00Z',
  },
  // Order 1 delivered (read)
  {
    recipient_email: 'client1@test.llv.com',
    type: 'order_status_changed',
    title: 'Seasonal rotation delivered',
    snippet: 'All 25 items delivered to your Scottsdale residence. Welcome back to the sun!',
    link_target: '/client/orders',
    metadata: {},
    read_at: '2026-02-22T18:00:00Z',
    created_at: '2026-02-22T16:10:00Z',
  },
  // Payment for Order 1 (read)
  {
    recipient_email: 'client1@test.llv.com',
    type: 'payment_succeeded',
    title: 'Payment confirmed — Seasonal Premier',
    snippet: '$599.00 charged for February seasonal rotation. Invoice available.',
    link_target: '/client/billing',
    metadata: { stripe_invoice_id: 'in_test_margaret_seasonal_feb2026', amount_cents: 59900 },
    read_at: '2026-01-28T14:30:00Z',
    created_at: '2026-01-28T12:10:00Z',
  },
  // Concierge reply (gala gown resolved — read)
  {
    recipient_email: 'client1@test.llv.com',
    type: 'concierge_reply',
    title: 'Re: Gala gown — please have ready by March 15th',
    snippet: 'Your gown and tuxedo jacket are confirmed for March 11th delivery. Rush fee waived.',
    link_target: '/client/concierge',
    metadata: {},
    read_at: '2026-03-06T09:00:00Z',
    created_at: '2026-03-05T16:00:00Z',
  },
  // Order 5 — gown cleaning confirmed (unread — recent)
  {
    recipient_email: 'client1@test.llv.com',
    type: 'order_confirmed',
    title: 'Gown cleaning order confirmed',
    snippet: 'RAVE FabriCARE will begin wet cleaning your Carolina Herrera gown. Estimated return June 1.',
    link_target: '/client/orders',
    metadata: { order_notes_key: 'Margaret Hartwell Gown Cleaning In Progress May 2026' },
    read_at: null,
    created_at: '2026-05-12T10:05:00Z',
  },
  // Provider message — RAVE beading update (unread — very recent)
  {
    recipient_email: 'client1@test.llv.com',
    type: 'concierge_reply',
    title: 'Update from RAVE FabriCARE — beading repair',
    snippet: 'RAVE found loose beading on your gown neckline. Repair approved and scheduled for May 30.',
    link_target: '/client/concierge',
    metadata: { is_provider_message: true },
    read_at: null,
    created_at: '2026-05-22T11:35:00Z',
  },

  // ── Catherine Beaumont notifications ──────────────────────────────────────

  // Order 2 confirmed (6 weeks ago — read)
  {
    recipient_email: 'client2@test.llv.com',
    type: 'order_confirmed',
    title: 'Gala delivery confirmed',
    snippet: '4 items — cocktail dress, earrings, shoes, clutch — scheduled for April 5th delivery.',
    link_target: '/client/orders',
    metadata: { order_notes_key: 'Catherine Beaumont Gala On-Demand Apr 2026' },
    read_at: '2026-04-03T12:00:00Z',
    created_at: '2026-04-03T10:10:00Z',
  },
  // Order 2 delivered (read)
  {
    recipient_email: 'client2@test.llv.com',
    type: 'order_status_changed',
    title: 'Your items have been delivered',
    snippet: 'All 4 items delivered to Paradise Valley Estate. Enjoy the gala!',
    link_target: '/client/orders',
    metadata: {},
    read_at: '2026-04-05T18:00:00Z',
    created_at: '2026-04-05T17:05:00Z',
  },
  // Payment for Order 2 (read)
  {
    recipient_email: 'client2@test.llv.com',
    type: 'payment_succeeded',
    title: 'Payment confirmed — On-Demand delivery',
    snippet: '$300.00 charged for April gala delivery.',
    link_target: '/client/billing',
    metadata: { stripe_invoice_id: 'in_test_catherine_gala_apr2026', amount_cents: 30000 },
    read_at: '2026-04-03T12:30:00Z',
    created_at: '2026-04-03T10:15:00Z',
  },
  // Valentino repair — concierge reply (read)
  {
    recipient_email: 'client2@test.llv.com',
    type: 'concierge_reply',
    title: 'Re: Valentino gown sleeve repair',
    snippet: 'European Couture has confirmed the repair. Estimated completion May 15.',
    link_target: '/client/concierge',
    metadata: {},
    read_at: '2026-04-22T14:00:00Z',
    created_at: '2026-04-22T11:10:00Z',
  },
  // Order 6 shipped (unread — recent)
  {
    recipient_email: 'client2@test.llv.com',
    type: 'order_status_changed',
    title: 'Your Valentino gown has shipped',
    snippet: 'UPS tracking 1Z999AA20111222333 — expected delivery May 27. Signature required.',
    link_target: '/client/orders',
    metadata: { tracking_number: '1Z999AA20111222333', carrier: 'ups' },
    read_at: null,
    created_at: '2026-05-24T09:05:00Z',
  },
  // Provider message — Valentino repaired (unread — recent)
  {
    recipient_email: 'client2@test.llv.com',
    type: 'concierge_reply',
    title: 'European Couture: Valentino gown repair complete',
    snippet: 'Sophia reports the repair is invisible. Gown is pressed and ready.',
    link_target: '/client/concierge',
    metadata: { is_provider_message: true },
    read_at: null,
    created_at: '2026-05-15T14:05:00Z',
  },

  // ── James Thornton notifications ──────────────────────────────────────────

  // Order 3 confirmed (3 months ago — read)
  {
    recipient_email: 'client3@test.llv.com',
    type: 'order_confirmed',
    title: 'Seasonal Rotation Confirmed',
    snippet: 'Your WI→AZ seasonal rotation confirmed. 20 items scheduled for delivery Feb 17.',
    link_target: '/client/orders',
    metadata: { order_notes_key: 'James Thornton Seasonal Rotation Feb 2026' },
    read_at: '2026-01-30T13:00:00Z',
    created_at: '2026-01-30T11:05:00Z',
  },
  // Order 3 delivered (read)
  {
    recipient_email: 'client3@test.llv.com',
    type: 'order_status_changed',
    title: 'Seasonal rotation delivered',
    snippet: 'All 20 items delivered to your Fountain Hills residence.',
    link_target: '/client/orders',
    metadata: {},
    read_at: '2026-02-17T17:00:00Z',
    created_at: '2026-02-17T15:05:00Z',
  },
  // Payment for Order 3 (read)
  {
    recipient_email: 'client3@test.llv.com',
    type: 'payment_succeeded',
    title: 'Payment confirmed — Seasonal Essentials',
    snippet: '$599.00 charged for February seasonal rotation.',
    link_target: '/client/billing',
    metadata: { stripe_invoice_id: 'in_test_james_seasonal_feb2026', amount_cents: 59900 },
    read_at: '2026-01-30T13:30:00Z',
    created_at: '2026-01-30T11:10:00Z',
  },
  // Order 4 delivered (1 month ago — read)
  {
    recipient_email: 'client3@test.llv.com',
    type: 'order_status_changed',
    title: 'Golf outfit delivered to resort',
    snippet: 'Your golf kit has been delivered to TPC Scottsdale. Enjoy your round!',
    link_target: '/client/orders',
    metadata: {},
    read_at: '2026-04-21T15:00:00Z',
    created_at: '2026-04-21T13:05:00Z',
  },
  // Order 7 requested (unread — today)
  {
    recipient_email: 'client3@test.llv.com',
    type: 'order_confirmed',
    title: 'Rotation request received',
    snippet: 'Your fall AZ→WI rotation has been received. We\'ll confirm details shortly.',
    link_target: '/client/orders',
    metadata: { order_notes_key: 'James Thornton Seasonal Rotation Request Jun 2026' },
    read_at: null,
    created_at: '2026-05-25T08:35:00Z',
  },
]

export async function seedNotifications(): Promise<SeedResult> {
  const adminClient = createAdminClient()
  let seeded = 0
  let skipped = 0
  const errors: string[] = []

  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, email')
    .in('email', SEED_CLIENT_EMAILS)

  if (!profiles?.length) {
    return { seeded: 0, skipped: 0, errors: ['No seed clients found — run seed-clients first'] }
  }

  const clientMap: Record<string, string> = {}
  for (const p of profiles) { clientMap[p.email] = p.id }

  for (const notif of SEED_NOTIFICATIONS) {
    try {
      const recipientId = clientMap[notif.recipient_email]
      if (!recipientId) {
        errors.push(`Notification "${notif.title}": recipient not found`)
        continue
      }

      // Idempotency: (recipient_profile_id, title, created_at)
      const { data: existing } = await adminClient
        .from('notifications')
        .select('id')
        .eq('recipient_profile_id', recipientId)
        .eq('title', notif.title)
        .eq('created_at', notif.created_at)
        .maybeSingle()

      if (existing) {
        skipped++
        continue
      }

      const { error } = await adminClient.from('notifications').insert({
        recipient_profile_id: recipientId,
        type: notif.type,
        title: notif.title,
        snippet: notif.snippet,
        link_target: notif.link_target,
        metadata: notif.metadata,
        read_at: notif.read_at,
        created_at: notif.created_at,
        is_seed_data: true,
      })

      if (error) throw new Error(error.message)
      seeded++
    } catch (err) {
      errors.push(`"${notif.title}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { seeded, skipped, errors }
}
