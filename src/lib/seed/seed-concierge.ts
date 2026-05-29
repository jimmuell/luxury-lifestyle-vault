import { createAdminClient } from '@/lib/supabase/admin'
import { SEED_CLIENT_EMAILS } from './seed-clients'
import type { SeedResult } from './types'

interface SeedMessage {
  client_email: string
  subject: string
  body: string
  status: 'open' | 'in_progress' | 'resolved'
  admin_notes: string | null
  created_at: string
  // Provider messaging fields
  is_provider_message?: boolean
  author_provider_business_name?: string  // resolved to profile_id at runtime
  related_order_notes_key?: string        // idempotency key used in seed-orders for the order
}

const SEED_MESSAGES: SeedMessage[] = [
  // 1. Margaret: gown ready by the 15th — resolved
  {
    client_email: 'client1@test.llv.com',
    subject: 'Gala gown — please have ready by March 15th',
    body: "Richard and I are attending the Desert Philanthropists Gala on March 15th. We need the Brioni tuxedo jacket and the ivory Carolina Herrera gown cleaned and pressed and ready no later than March 12th. Can RAVE FabriCARE expedite? Please advise on timeline and any rush fees.",
    status: 'resolved',
    admin_notes: 'Confirmed with RAVE FabriCARE March 5th. Rush fee waived for Margaret (founding member). Items delivered to client March 11th, 10am. Client confirmed both pieces in perfect condition.',
    created_at: '2026-03-05T14:22:00Z',
  },

  // 2. Margaret: add Richard's navy blazer — resolved
  {
    client_email: 'client1@test.llv.com',
    subject: "Please add Richard's navy Canali blazer to the AZ rotation",
    body: "Richard just reminded me that his Canali navy blazer needs to come with the spring rotation to Scottsdale — he has several dinners at Whisper Rock this season. Can you pull it from WI storage and include it in the upcoming shipment? Thank you.",
    status: 'resolved',
    admin_notes: "Added Richard's Canali navy blazer to Order 1 (Feb 2026 seasonal rotation). Item confirmed delivered with the main shipment.",
    created_at: '2026-01-30T11:15:00Z',
  },

  // 3. Catherine: Valentino pull on sleeve — in_progress (linked to Order 6)
  {
    client_email: 'client2@test.llv.com',
    subject: 'Urgent — Valentino gown has a pull on the left sleeve',
    body: "I just unpacked the blush Valentino SS2021 gown and noticed a significant pull on the left sleeve at the shoulder seam — approximately 2 inches of the silk tulle is separating from the underlining. This gown needs to be repaired before the Phoenix Art Museum gala on June 8th. Please escalate to European Couture immediately. I trust only Sophia with this piece.",
    status: 'in_progress',
    admin_notes: 'Escalated to European Couture April 22. Sophia confirmed she can repair the tulle seam. Estimated completion May 15. Order #6 created to track this. Update sent to Catherine.',
    created_at: '2026-04-20T16:30:00Z',
    related_order_notes_key: 'Catherine Beaumont Valentino Repair May 2026',
  },

  // 4. Catherine: intake for vintage Chanel — open (no linked order yet)
  {
    client_email: 'client2@test.llv.com',
    subject: 'New intake — 1988 Chanel couture jacket from estate',
    body: "I have just acquired a 1988 Chanel couture jacket from a Sotheby's estate auction. It requires careful intake, condition assessment, and long-term storage. It also needs a gentle clean — it has some very faint yellowing at the lining edges. Please advise on your intake process for vintage couture pieces and whether you work with a textile conservator for pieces of this age.",
    status: 'open',
    admin_notes: null,
    created_at: '2026-05-20T09:45:00Z',
  },

  // 5. James: golf clubs with shipment — resolved
  {
    client_email: 'client3@test.llv.com',
    subject: 'Can golf club head covers come in the WI→AZ shipment?',
    body: "Quick question — I have a set of Titleist TSR3 driver head covers at my Madison home that I left behind from last season. They're folded flat. Can they be included in my upcoming spring rotation shipment without any extra charge? They're essentially fabric accessories. Let me know.",
    status: 'resolved',
    admin_notes: 'Confirmed golf head covers included at no extra charge (non-garment accessories, flat/packable). Included with Order #3 Feb 2026 rotation. James confirmed receipt.',
    created_at: '2026-01-29T10:00:00Z',
  },

  // 6. Provider (RAVE FabriCARE): beading repair on cocktail dress — in_progress
  //    is_provider_message: true, linked to Order 5 (Margaret gown cleaning)
  {
    client_email: 'client1@test.llv.com',
    subject: 'RAVE FabriCARE: Update on Ivory Carolina Herrera gown — beading issue found',
    body: "This is Michael Rave at RAVE FabriCARE with an update on Margaret Hartwell's ivory Carolina Herrera gown (Order AZ-4421). We have completed the wet clean — the silk charmeuse is in excellent condition. However, during our standard beading inspection, we found 3 loose beads on the neckline cowl and one section of approximately 8 beads where the thread is beginning to separate. We recommend a beading repair before return. Our couture repair specialist can address this for an additional $180 and we can have it completed by May 30th. Please advise.",
    status: 'in_progress',
    admin_notes: 'Replied to RAVE May 23: approved beading repair. Updated Margaret. Will notify when complete.',
    created_at: '2026-05-22T11:30:00Z',
    is_provider_message: true,
    author_provider_business_name: 'RAVE FabriCARE',
    related_order_notes_key: 'Margaret Hartwell Gown Cleaning In Progress May 2026',
  },

  // 7. Provider (European Couture): Valentino repaired — resolved
  //    is_provider_message: true, linked to Order 6 (Catherine Valentino repair)
  {
    client_email: 'client2@test.llv.com',
    subject: 'European Couture: Valentino gown repair complete',
    body: "Sophia Marchetti at European Couture Cleaners. I am happy to report that the Valentino SS2021 blush gown repair is complete. We have re-sewn the left sleeve seam using matching silk thread sourced from our archive. The repair is invisible and the tulle drape is fully restored. We have also done a final light press. The gown is in beautiful condition and ready for collection or shipment at your direction. Please let me know how you would like to proceed.",
    status: 'resolved',
    admin_notes: 'Confirmed May 23. Shipped UPS May 24 tracking 1Z999AA20111222333. Catherine notified.',
    created_at: '2026-05-15T14:00:00Z',
    is_provider_message: true,
    author_provider_business_name: 'European Couture Cleaners',
    related_order_notes_key: 'Catherine Beaumont Valentino Repair May 2026',
  },
]

export async function seedConcierge(): Promise<SeedResult> {
  const adminClient = createAdminClient()
  let seeded = 0
  let skipped = 0
  const errors: string[] = []

  // Load client profiles
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, email')
    .in('email', SEED_CLIENT_EMAILS)

  if (!profiles?.length) {
    return { seeded: 0, skipped: 0, errors: ['No seed clients found — run seed-clients first'] }
  }

  const clientMap: Record<string, string> = {}
  for (const p of profiles) { clientMap[p.email] = p.id }

  // Load providers (need profile_id for provider messages)
  const { data: providers } = await adminClient
    .from('providers')
    .select('id, business_name, profile_id')

  const providerProfileMap: Record<string, string | null> = {}
  for (const prov of providers ?? []) {
    providerProfileMap[prov.business_name] = prov.profile_id
  }

  for (const msg of SEED_MESSAGES) {
    try {
      const clientId = clientMap[msg.client_email]
      if (!clientId) {
        errors.push(`Message "${msg.subject}": client not found`)
        continue
      }

      // Idempotency: check by subject + client_id
      const { data: existing } = await adminClient
        .from('concierge_messages')
        .select('id')
        .eq('client_id', clientId)
        .eq('subject', msg.subject)
        .maybeSingle()

      if (existing) {
        skipped++
        continue
      }

      // Resolve related order ID if needed
      let relatedOrderId: string | null = null
      if (msg.related_order_notes_key) {
        const { data: relOrder } = await adminClient
          .from('orders')
          .select('id')
          .eq('client_id', clientId)
          .eq('notes', msg.related_order_notes_key)
          .maybeSingle()
        relatedOrderId = relOrder?.id ?? null
      }

      // Resolve author_profile_id for provider messages
      let authorProfileId: string | null = null
      if (msg.is_provider_message && msg.author_provider_business_name) {
        authorProfileId = providerProfileMap[msg.author_provider_business_name] ?? null
        // If provider has no profile yet, fall back to null (still works for seed data)
      }

      const { error } = await adminClient.from('concierge_messages').insert({
        client_id: clientId,
        subject: msg.subject,
        body: msg.body,
        status: msg.status,
        admin_notes: msg.admin_notes,
        is_seed_data: true,
        created_at: msg.created_at,
        is_provider_message: msg.is_provider_message ?? false,
        author_profile_id: authorProfileId,
        related_order_id: relatedOrderId,
      })

      if (error) throw new Error(error.message)
      seeded++
    } catch (err) {
      errors.push(`"${msg.subject}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { seeded, skipped, errors }
}
