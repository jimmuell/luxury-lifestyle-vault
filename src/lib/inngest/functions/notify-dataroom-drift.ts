import { inngest } from '@/lib/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { dataroomDriftEmail, type DriftedDoc } from '@/lib/resend/emails/dataroom-drift'
import { withSentryCapture } from '@/lib/inngest/with-sentry'

interface DataroomDriftEvent {
  data: {
    driftedDocs: DriftedDoc[]
    runAt: string
  }
}

export const notifyDataroomDrift = inngest.createFunction(
  {
    id: 'notify-dataroom-drift',
    triggers: [{ event: 'dataroom/drift.detected' as never }],
    retries: 3,
  },
  async ({ event }: { event: DataroomDriftEvent }) => {
    return withSentryCapture(async () => {
      const { driftedDocs, runAt } = event.data
      const db = createAdminClient()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luxurylifestylevault.com'
      const dataRoomUrl = `${appUrl}/admin/data-room`

      const { data: admins, error: adminsError } = await db
        .from('profiles')
        .select('id, email, full_name')
        .eq('role', 'admin')
        .is('deleted_at', null)

      if (adminsError) throw new Error(`Failed to fetch admin profiles: ${adminsError.message}`)

      let totalSent = 0

      for (const admin of admins ?? []) {
        const emailContent = dataroomDriftEmail({
          adminName: admin.full_name ?? admin.email,
          driftedDocs,
          runAt,
          dataRoomUrl,
        })

        await inngest.send({
          name: 'email/send' as never,
          data: {
            recipientProfileId: admin.id,
            to: admin.email,
            template: 'dataroom_drift_detected' as const,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          },
        })

        totalSent++
      }

      return { totalSent, docCount: driftedDocs.length }
    }, 'notify-dataroom-drift')
  }
)
