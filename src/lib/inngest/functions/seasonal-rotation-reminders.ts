import { inngest } from '@/lib/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { seasonalRotationReminderEmail } from '@/lib/resend/emails/seasonal-rotation-reminder'
import { isWithinInterval, addDays, parseISO } from 'date-fns'
import { withSentryCapture } from '@/lib/inngest/with-sentry'

export const seasonalRotationReminders = inngest.createFunction(
  {
    id: 'seasonal-rotation-reminders',
    triggers: [{ cron: '0 9 * * *' }] as never,
    retries: 1,
  },
  async () => {
    return withSentryCapture(async () => {
      const db = createAdminClient()
      const now = new Date()
      const year = now.getFullYear()

      // Load settings
      const { data: settings } = await db
        .from('admin_settings')
        .select('key, value')
        .in('key', ['seasonal_reminder_days_before', 'seasonal_reminder_enabled'])

      const settingsMap = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))
      if (settingsMap['seasonal_reminder_enabled'] === false) return { skipped: true }

      const daysBefore = Number(settingsMap['seasonal_reminder_days_before'] ?? 14)

      // Load active corridors with transition dates
      const { data: corridors } = await db
        .from('corridors')
        .select('id, display_name, fall_transition_start_date, spring_transition_start_date')
        .eq('active', true)

      if (!corridors?.length) return { noCorridors: true }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      let totalSent = 0

      for (const corridor of corridors) {
        for (const [reminderType, dateStr] of [
          ['fall_transition', corridor.fall_transition_start_date],
          ['spring_transition', corridor.spring_transition_start_date],
        ] as const) {
          if (!dateStr) continue

          const transitionDate = parseISO(dateStr)
          const reminderWindowStart = addDays(transitionDate, -daysBefore)
          const reminderWindowEnd = addDays(transitionDate, -1)

          if (!isWithinInterval(now, { start: reminderWindowStart, end: reminderWindowEnd })) continue

          // Find active clients (those with active subscriptions)
          const { data: activeSubs } = await db
            .from('client_subscriptions')
            .select('client_id')
            .eq('status', 'active')

          const clientIds = activeSubs?.map(s => s.client_id) ?? []
          if (!clientIds.length) continue

          for (const clientId of clientIds) {
            // Check if already sent this year for this corridor + type
            const { data: existing } = await db
              .from('reminder_sends')
              .select('id')
              .eq('client_id', clientId)
              .eq('corridor_id', corridor.id)
              .eq('reminder_type', reminderType)
              .eq('reminder_year', year)
              .maybeSingle()

            if (existing) continue

            // Get item count for personalization
            const { count: itemCount } = await db
              .from('items')
              .select('id', { count: 'exact', head: true })
              .eq('client_id', clientId)

            // Resolve client profile for email
            const { data: profile } = await db
              .from('profiles')
              .select('email, full_name')
              .eq('id', clientId)
              .single()

            const seasonLabel = reminderType === 'fall_transition' ? 'fall' : 'spring'
            const title = `Your ${seasonLabel} rotation window is opening`
            const snippet = `The ${corridor.display_name} corridor opens in ~${daysBefore} days.${itemCount ? ` You have ${itemCount} item${itemCount !== 1 ? 's' : ''} in the vault.` : ''}`

            // Create in-app notification
            await createNotification({
              recipientProfileId: clientId,
              type: 'system',
              title,
              snippet,
              linkTarget: '/client/rotations/new',
              metadata: {
                corridorId: corridor.id,
                reminderType,
                transitionDate: dateStr,
              } as unknown as import('@/types/database').Json,
            })

            // Send email (preference-gated via sendEmail → seasonal_reminders pref key)
            if (profile?.email) {
              const emailContent = seasonalRotationReminderEmail({
                clientName: profile.full_name ?? profile.email,
                daysUntilTransition: daysBefore,
                season: seasonLabel,
                itemCount: itemCount ?? 0,
                corridorLabel: corridor.display_name,
                appUrl,
              })
              await inngest.send({
                name: 'email/send' as never,
                data: {
                  recipientProfileId: clientId,
                  to: profile.email,
                  template: 'seasonal_rotation_reminder' as const,
                  subject: emailContent.subject,
                  html: emailContent.html,
                  text: emailContent.text,
                },
              })
            }

            // Record send for idempotency (covers both in-app + email)
            await db.from('reminder_sends').insert({
              client_id: clientId,
              corridor_id: corridor.id,
              reminder_type: reminderType,
              reminder_year: year,
            })

            totalSent++
          }
        }
      }

      return { totalSent }
    }, 'seasonal-rotation-reminders')
  }
)
