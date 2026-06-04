import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FROM_EMAIL, FROM_NAME } from '@/lib/resend/client'
import { EmailTestForm } from '@/components/admin/email-test-form'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function AdminEmailPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminEmail = user?.email ?? ''
  const apiKeyConfigured = !!process.env.RESEND_API_KEY

  const adminSupabase = createAdminClient()
  const { data: recentSends } = await adminSupabase
    .from('email_sends')
    .select('id, to_address, subject, status, resend_id, error_message, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="font-serif text-3xl font-light">Email (Resend)</h1>

      {/* Config panel */}
      <div className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Configuration</h2>
        <div className="rounded-lg border border-border divide-y divide-border">
          <div className="flex justify-between items-center px-5 py-4 text-sm">
            <span className="text-muted-foreground">From name</span>
            <span className="font-medium">{FROM_NAME}</span>
          </div>
          <div className="flex justify-between items-center px-5 py-4 text-sm">
            <span className="text-muted-foreground">From address</span>
            <span className="font-mono text-xs">{FROM_EMAIL}</span>
          </div>
          <div className="flex justify-between items-center px-5 py-4 text-sm">
            <span className="text-muted-foreground">API key configured</span>
            <span className={cn('font-medium', apiKeyConfigured ? 'text-emerald-600' : 'text-destructive')}>
              {apiKeyConfigured ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Set via <code className="font-mono">RESEND_FROM_EMAIL</code> and <code className="font-mono">RESEND_API_KEY</code> environment variables — not editable here.
        </p>
      </div>

      {/* Test send form */}
      <div className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Send test email</h2>
        <div className="rounded-lg border border-border bg-card p-5">
          <EmailTestForm adminEmail={adminEmail} />
        </div>
      </div>

      {/* Recent sends */}
      <div className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Recent sends</h2>
        {!recentSends?.length ? (
          <div className="rounded-lg border border-border px-5 py-6 text-center text-sm text-muted-foreground italic">
            No sends recorded yet.
          </div>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
            {recentSends.map(send => {
              const StatusIcon =
                send.status === 'sent' ? CheckCircle2
                : send.status === 'failed' ? XCircle
                : Clock
              const iconClass =
                send.status === 'sent' ? 'text-emerald-600'
                : send.status === 'failed' ? 'text-destructive'
                : 'text-muted-foreground'

              return (
                <div key={send.id} className="flex items-start gap-3 px-5 py-4 bg-card">
                  <StatusIcon className={cn('h-4 w-4 mt-0.5 shrink-0', iconClass)} />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-medium truncate">{send.to_address}</p>
                    <p className="text-xs text-muted-foreground truncate">{send.subject}</p>
                    {send.error_message && (
                      <p className="text-xs text-destructive truncate">{send.error_message}</p>
                    )}
                    {send.resend_id && (
                      <p className="text-xs text-muted-foreground font-mono">{send.resend_id}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 pt-0.5">
                    {format(new Date(send.created_at), 'MMM d, h:mm a')}
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
