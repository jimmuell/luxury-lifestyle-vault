import { inngest } from '@/lib/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { investorDocumentPublishedEmail } from '@/lib/resend/emails/investor-document-published'
import { tierRank } from '@/lib/investor/tiers'
import { generateUnsubscribeToken } from '@/lib/investor/unsubscribe'
import { withSentryCapture } from '@/lib/inngest/with-sentry'

interface DocumentPublishedEvent {
  data: {
    documentId: string
    documentTitle: string
    documentAudience: string
    docType: string
  }
}

export const notifyInvestorDocument = inngest.createFunction(
  {
    id: 'notify-investor-document',
    triggers: [{ event: 'investor/document.published' as never }],
    retries: 3,
  },
  async ({ event }: { event: DocumentPublishedEvent }) => {
    return withSentryCapture(async () => {
      const { documentId, documentTitle, documentAudience, docType } = event.data
      const db = createAdminClient()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luxurylifestylevault.com'

      const requiredRank = tierRank(documentAudience)

      // Query all investors with notifications opted in
      const { data: profiles, error: profilesError } = await db
        .from('profiles')
        .select('id, email, full_name, investor_tier, investor_notifications_opt_in')
        .eq('role', 'investor')
        .eq('investor_notifications_opt_in', true)

      if (profilesError) throw new Error(`Failed to fetch investor profiles: ${profilesError.message}`)

      let totalSent = 0

      for (const profile of profiles ?? []) {
        // Tier check: investor's tier must be >= document audience tier
        if (tierRank(profile.investor_tier) < requiredRank) continue

        const token = generateUnsubscribeToken(profile.id)
        const unsubscribeUrl = `${appUrl}/investor/unsubscribe?id=${profile.id}&token=${token}`

        const emailContent = investorDocumentPublishedEmail({
          investorName: profile.full_name ?? profile.email,
          documentTitle,
          docType,
          appUrl,
          unsubscribeUrl,
        })

        // Dispatch as a separate retryable email job
        await inngest.send({
          name: 'email/send' as never,
          data: {
            recipientProfileId: profile.id,
            to: profile.email,
            template: 'investor_document_published' as const,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          },
        })

        // Log the send
        await db.from('investor_notification_sends').insert({
          profile_id: profile.id,
          document_id: documentId,
        })

        totalSent++
      }

      return { totalSent }
    }, 'notify-investor-document')
  }
)
