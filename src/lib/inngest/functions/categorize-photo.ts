import { inngest } from '@/lib/inngest/client'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { downloadPhoto } from '@/lib/storage/server'
import { withSentryCapture } from '@/lib/inngest/with-sentry'

const MODEL = process.env.AI_CATEGORIZATION_MODEL ?? 'claude-haiku-4-5-20251001'

export const categorizeItemPhoto = inngest.createFunction(
  {
    id: 'categorize-item-photo',
    triggers: [{ event: 'item/photo.uploaded' as never }],
  },
  async ({ event, step }: { event: { data: { photoId: string; storagePath: string; itemId: string } }; step: { run: <T>(name: string, fn: () => Promise<T>) => Promise<T> } }) => {
    return withSentryCapture(async () => {
      const { photoId, storagePath, itemId } = event.data

      const imageData = await step.run('download-image', async () => {
        const buffer = await downloadPhoto(storagePath)
        return buffer.toString('base64')
      })

      const analysis = await step.run('analyze-with-claude', async () => {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

        const message = await client.messages.create({
          model: MODEL,
          max_tokens: 512,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: imageData,
                  },
                },
                {
                  type: 'text',
                  text: `You are analyzing a luxury wardrobe item photo for a high-end concierge service.
Respond with a JSON object only — no markdown, no explanation.

{
  "suggestedCategory": one of: outerwear|suiting|shirts_blouses|trousers_skirts|dresses|knitwear|activewear|footwear|handbags|accessories|swimwear|lingerie|eveningwear|other,
  "suggestedName": a short, elegant item name (e.g. "Navy Cashmere Blazer"),
  "detectedBrand": brand name if visible or recognizable, otherwise null,
  "detectedColor": primary color(s),
  "conditionFlags": array of visible issues like ["light staining"], empty array if pristine,
  "confidence": 0.0 to 1.0 float
}`,
                },
              ],
            },
          ],
        })

        const text = message.content[0].type === 'text' ? message.content[0].text : ''
        try {
          return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
        } catch {
          return {
            suggestedCategory: 'other',
            suggestedName: null,
            detectedBrand: null,
            detectedColor: null,
            conditionFlags: [],
            confidence: 0,
          }
        }
      })

      await step.run('save-analysis', async () => {
        const supabase = createAdminClient()
        const { error } = await supabase
          .from('item_photos')
          .update({ ai_analysis: analysis })
          .eq('id', photoId)
        if (error) throw new Error(`DB update failed: ${error.message}`)
      })

      return { photoId, itemId, analysis }
    }, 'categorize-item-photo')
  }
)
