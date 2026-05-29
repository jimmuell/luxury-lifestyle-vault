import { createClient } from '@/lib/supabase/server'
import { ConciergeMessageForm } from '@/components/client/concierge-message-form'
import { Separator } from '@/components/ui/separator'
import { MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import type { ConciergeMessage } from '@/types/app'

const STATUS_LABELS: Record<ConciergeMessage['status'], string> = {
  open: 'Received',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

const STATUS_COLORS: Record<ConciergeMessage['status'], string> = {
  open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

export default async function ClientConciergePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: messages } = await supabase
    .from('concierge_messages')
    .select('*')
    .eq('client_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-serif text-3xl font-light">Concierge</h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Reach your personal concierge directly. We typically respond within 4 hours.
        </p>
      </div>

      <ConciergeMessageForm />

      {messages && messages.length > 0 && (
        <>
          <Separator />

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-light">Your Messages</h2>

            <div className="space-y-3">
              {messages.map(message => (
                <div key={message.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="font-medium text-sm truncate">{message.subject}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${STATUS_COLORS[message.status]}`}>
                      {STATUS_LABELS[message.status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-6">{message.body}</p>
                  <p className="text-xs text-muted-foreground pl-6">
                    {format(new Date(message.created_at), 'MMM d, yyyy · h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
