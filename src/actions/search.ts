'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

const MODEL = process.env.AI_CATEGORIZATION_MODEL ?? 'claude-haiku-4-5-20251001'

export interface SearchResult {
  itemId: string
  score: number
  reason: string
}

export async function searchClientWardrobe(query: string): Promise<{
  results: SearchResult[]
  fallback: boolean
}> {
  if (!query.trim()) return { results: [], fallback: false }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const startMs = Date.now()

  // Fetch all items with AI analysis
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('id, name, brand, category, color, size, season, tags')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (itemsError) throw new Error(itemsError.message)
  if (!items?.length) return { results: [], fallback: false }

  // Fetch AI analysis for each item from photos
  const { data: photos } = await supabase
    .from('item_photos')
    .select('item_id, ai_analysis')
    .in('item_id', items.map(i => i.id))
    .order('sort_order', { ascending: true })

  const analysisMap: Record<string, Record<string, unknown>> = {}
  for (const p of photos ?? []) {
    if (!analysisMap[p.item_id] && p.ai_analysis) {
      analysisMap[p.item_id] = p.ai_analysis as Record<string, unknown>
    }
  }

  // Build item summaries for the prompt (terse to minimize tokens on Haiku)
  const itemSummaries = items.map(item => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    category: item.category,
    color: item.color,
    season: item.season,
    tags: item.tags,
    ai: analysisMap[item.id]
      ? {
          name: analysisMap[item.id].suggestedName,
          brand: analysisMap[item.id].detectedBrand,
          color: analysisMap[item.id].detectedColor,
          flags: analysisMap[item.id].conditionFlags,
        }
      : null,
  }))

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a luxury wardrobe concierge AI. A client has searched their wardrobe.

Query: "${query}"

Items:
${JSON.stringify(itemSummaries, null, 0)}

Return a JSON array of matching items ranked by relevance, best match first.
Only include items that meaningfully match the query.
Format: [{"itemId": "uuid", "score": 0.0-1.0, "reason": "one concise sentence why this matches"}]
Return an empty array [] if nothing matches well.
Return ONLY the JSON array, no other text.`,
        },
      ],
    })

    const latencyMs = Date.now() - startMs
    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'

    let results: SearchResult[] = []
    try {
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
      if (Array.isArray(parsed)) {
        results = parsed.filter(r => r.itemId && typeof r.score === 'number')
      }
    } catch {
      // Parse failed — fall back to substring match below
      throw new Error('parse_failed')
    }

    // Log usage (non-blocking)
    const adminClient = createAdminClient()
    adminClient.from('ai_search_logs').insert({
      client_id: user.id,
      query,
      result_count: results.length,
      input_tokens: message.usage?.input_tokens ?? null,
      output_tokens: message.usage?.output_tokens ?? null,
      latency_ms: latencyMs,
    }).then(() => {}, () => {})

    return { results, fallback: false }
  } catch {
    // Fallback: client-side substring match across name/brand/category/tags
    const q = query.toLowerCase()
    const fallbackResults: SearchResult[] = items
      .filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.brand ?? '').toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.color ?? '').toLowerCase().includes(q) ||
        (item.tags ?? []).some((t: string) => t.toLowerCase().includes(q))
      )
      .map(item => ({
        itemId: item.id,
        score: 0.5,
        reason: `Matches "${query}" in item details`,
      }))

    return { results: fallbackResults, fallback: true }
  }
}
