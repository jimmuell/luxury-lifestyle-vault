import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { H1, Caption } from '@/components/ui/typography'
import { format } from 'date-fns'

export default async function DevEmailInboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const adminSupabase = createAdminClient()
  const { data: emails } = await adminSupabase
    .from('dev_email_inbox')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Caption as="p" className="text-muted-foreground mb-1">Dev Tools</Caption>
        <H1>Email Inbox</H1>
        <p className="text-sm text-muted-foreground mt-1">Emails captured in dev mode (RESEND_DEV_MODE=true).</p>
      </div>

      {(!emails || emails.length === 0) ? (
        <div className="py-12 text-center rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No emails captured yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {emails.map(email => (
            <details key={email.id} className="rounded-lg border border-border overflow-hidden group">
              <summary className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors list-none">
                <div>
                  <p className="text-sm font-medium">{email.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">To: {email.recipient}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(email.created_at), 'MMM d, HH:mm')}
                </span>
              </summary>
              <div className="border-t border-border">
                <iframe
                  srcDoc={email.html ?? `<pre style="font-family:monospace;padding:16px">${email.text ?? '(no content)'}</pre>`}
                  className="w-full h-96 border-none"
                  title={email.subject}
                />
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
