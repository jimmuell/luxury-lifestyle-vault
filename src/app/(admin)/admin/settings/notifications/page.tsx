import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { NotificationConfigPanel, BroadcastForm } from '@/components/admin/notification-config-panel'

export default async function AdminNotificationSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/admin')

  const db = createAdminClient()

  const [templatesResult, tiersResult, broadcastsResult] = await Promise.all([
    db.from('notification_template_config').select('*').order('template_key'),
    db.from('service_tiers').select('id, name').eq('active', true).order('sort_order'),
    db.from('admin_broadcasts')
      .select('id, subject, channel, target, sent_at, recipient_count, sent_by')
      .order('sent_at', { ascending: false })
      .limit(20),
  ])

  const templates = templatesResult.data ?? []
  const tiers = tiersResult.data ?? []
  const broadcasts = broadcastsResult.data ?? []

  // Fetch sender names separately
  const senderIds = [...new Set(broadcasts.map(b => b.sent_by))]
  const { data: senderProfiles } = senderIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', senderIds)
    : { data: [] }
  const senderMap = Object.fromEntries((senderProfiles ?? []).map(p => [p.id, p]))

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-3xl font-light">Notification Settings</h1>

      {/* Global template config */}
      <div className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
          Global notification channels
        </h2>
        <NotificationConfigPanel templates={templates} tiers={tiers} />
      </div>

      {/* Broadcast form */}
      <div className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
          Send broadcast
        </h2>
        <div className="rounded-lg border border-border p-5 bg-card">
          <BroadcastForm tiers={tiers} />
        </div>
      </div>

      {/* Send log */}
      <div className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
          Recent broadcasts
        </h2>
        {broadcasts.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No broadcasts sent yet.</p>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
            {broadcasts.map(b => {
              const sender = senderMap[b.sent_by] ?? null
              return (
                <div key={b.id} className="px-5 py-3.5 bg-card flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-medium truncate">{b.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(b.sent_at), 'MMM d, yyyy HH:mm')} · {sender?.full_name ?? sender?.email} · {b.target} · {b.channel}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {b.recipient_count} recipient{b.recipient_count !== 1 ? 's' : ''}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
