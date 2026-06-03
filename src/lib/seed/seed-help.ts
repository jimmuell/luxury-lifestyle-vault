import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'
import type { SeedResult } from './types'

type TooltipInsert = Database['public']['Tables']['help_tooltips']['Insert']
type ArticleInsert = Database['public']['Tables']['help_articles']['Insert']

export async function seedHelp(): Promise<SeedResult> {
  const supabase = createAdminClient()
  const result: SeedResult = { seeded: 0, skipped: 0, errors: [] }

  // ── Tooltips ────────────────────────────────────────────────────────────────
  const tooltips: TooltipInsert[] = [
    {
      area_key: 'client.ondemand',
      title: 'How on-demand works',
      body: "Request any stored item delivered to your current address within your service tier's lead time. Rush delivery is available for an additional fee.",
      linked_article_slug: 'how-on-demand-fulfillment-works',
      is_published: true,
      is_seed_data: true,
    },
    {
      area_key: 'client.returns',
      title: 'Starting a return',
      body: 'Use the return order type to schedule pickup of items you no longer need in your current location. Items are cleaned and returned to your vault.',
      is_published: true,
      is_seed_data: true,
    },
  ]

  for (const tooltip of tooltips) {
    const { data: existing } = await supabase
      .from('help_tooltips')
      .select('id')
      .eq('area_key', tooltip.area_key)
      .maybeSingle()

    if (existing) {
      result.skipped++
      continue
    }

    const { error } = await supabase.from('help_tooltips').insert(tooltip)
    if (error) {
      result.errors.push(`tooltip ${tooltip.area_key}: ${error.message}`)
    } else {
      result.seeded++
    }
  }

  // ── Articles ─────────────────────────────────────────────────────────────────
  const articles: ArticleInsert[] = [
    {
      slug: 'how-on-demand-fulfillment-works',
      category: 'on_demand',
      title: 'How On-Demand Fulfillment Works',
      body: `On-demand orders let you request any item from your vault delivered to your current address — whether you're in Scottsdale or back in Wisconsin.

When you place a request, your concierge team coordinates with your assigned care provider to inspect, press, and ship the item. Standard lead time is 3–5 business days; rush delivery can often be arranged within 24–48 hours for an additional fee.

Your service tier determines the per-request base fee and any per-item surcharges. Founding members receive a discount on all on-demand orders.`,
      area_key: 'client.ondemand',
      audience: 'client',
      sort_order: 0,
      is_published: true,
      is_seed_data: true,
    },
    {
      slug: 'garment-care-stages',
      category: 'provider',
      title: 'Garment Care Stages',
      body: `Every LLV garment moves through four stages when in your facility:

Received — Log the item into the system and perform a condition assessment. Note any pre-existing damage in the condition record before proceeding.

Cleaning — Apply the care method specified for the garment's fabric and construction. For delicate pieces (silk, beading, structured tailoring), use specialist dry-cleaning protocols. Never use heat on embellishments or structured shoulders.

Pressing — Press according to fabric type. Steam-only for wool and cashmere; light press cloth for silk. Ensure all fold lines from storage are fully removed.

Ready for pickup — Garment is bagged, tagged with the LLV item SKU, and staged for pickup or shipment. Update the order status to trigger client notification.`,
      area_key: 'provider.stages',
      audience: 'provider',
      sort_order: 0,
      is_published: true,
      is_seed_data: true,
    },
  ]

  for (const article of articles) {
    const { data: existing } = await supabase
      .from('help_articles')
      .select('id')
      .eq('slug', article.slug)
      .maybeSingle()

    if (existing) {
      result.skipped++
      continue
    }

    const { error } = await supabase.from('help_articles').insert(article)
    if (error) {
      result.errors.push(`article ${article.slug}: ${error.message}`)
    } else {
      result.seeded++
    }
  }

  return result
}
