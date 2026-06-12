import { inngest } from '@/lib/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { investorUpdatePublishedEmail } from '@/lib/resend/emails/investor-update-published'
import { tierRank } from '@/lib/investor/tiers'
import { generateUnsubscribeToken } from '@/lib/investor/unsubscribe'
import { withSentryCapture } from '@/lib/inngest/with-sentry'

interface UpdatePublishedEvent {
  data: {
    updateId: string
    updateTitle: string
    audience: string
  }
}

export const notifyInvestorUpdate = inngest.createFunction(
  {
    id: 'notify-investor-update',
    triggers: [{ event: 'investor/update.published' as never }],
    retries: 3,
  },
  async ({ event }: { event: UpdatePublishedEvent }) => {
    return withSentryCapture(async () => {
      const { updateId, updateTitle, audience } = event.data
      const db = createAdminClient()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luxurylifestylevault.com'

      // Idempotency: check if notifications were already sent
      const { data: update } = await db
        .from('investor_updates')
        .select('sent_at')
        .eq('id', updateId)
        .single()

      if (!update) return { error: 'Update not found' }
      if (update.sent_at) return { skipped: 'Already notified', sentAt: update.sent_at }

      const requiredRank = tierRank(audience)

      // Query all investors with notifications opted in
      const { data: profiles, error: profilesError } = await db
        .from('profiles')
        .select('id, email, full_name, investor_tier, investor_notifications_opt_in')
        .eq('role', 'investor')
        .eq('investor_notifications_opt_in', true)

      if (profilesError) throw new Error(`Failed to fetch investor profiles: ${profilesError.message}`)

      let totalSent = 0

      for (const profile of profiles ?? []) {
        // Tier check: investor's tier must be >= update's audience tier
        if (tierRank(profile.investor_tier) < requiredRank) continue

        const token = generateUnsubscribeToken(profile.id, updateId)
        const unsubscribeUrl = `${appUrl}/unsubscribe?id=${profile.id}&docId=${updateId}&token=${token}`

        const emailContent = investorUpdatePublishedEmail({
          investorName: profile.full_name ?? profile.email,
          updateTitle,
          appUrl,
          unsubscribeUrl,
        })

        // Dispatch as a separate retryable email job
        await inngest.send({
          name: 'email/send' as never,
          data: {
            recipientProfileId: profile.id,
            to: profile.email,
            template: 'investor_update_published' as const,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          },
        })

        // NOTE: No logging to investor_notification_sends — that table has a FK
        // to investor_documents.id and investor_updates are not documents.

        totalSent++
      }

      // Record the notification timestamp
      if (totalSent > 0) {
        await db
          .from('investor_updates')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', updateId)
      }

      return { totalSent }
    }, 'notify-investor-update')
  }
)
