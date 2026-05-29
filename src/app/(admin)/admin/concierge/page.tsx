import { createClient } from '@/lib/supabase/server'
import { MessageStatusControl } from '@/components/admin/message-status-control'
import { format } from 'date-fns'
import type { ConciergeMessage } from '@/types/app'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const STATUS_LABELS: Record<ConciergeMessage['status'], string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

const STATUS_COLORS: Record<ConciergeMessage['status'], string> = {
  open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

const ALL_STATUSES: ConciergeMessage['status'][] = ['open', 'in_progress', 'resolved']

export default async function AdminConciergePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('concierge_messages')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status as never)
  } else {
    query = query.in('status', ['open', 'in_progress'])
  }

  if (params.source === 'provider') {
    query = query.eq('is_provider_message', true)
  } else if (params.source === 'client') {
    query = query.eq('is_provider_message', false)
  }

  const { data: messages } = await query

  const buildUrl = (overrides: Record<string, string | null>) => {
    const base: Record<string, string> = {}
    if (params.status) base.status = params.status
    if (params.source) base.source = params.source
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) delete base[k]
      else base[k] = v
    }
    const qs = new URLSearchParams(base).toString()
    return `/admin/concierge${qs ? `?${qs}` : ''}`
  }

  const activeStatus = params.status ?? null
  const activeSource = params.source ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-light">Concierge Queue</h1>
        <p className="text-muted-foreground text-sm mt-1">Client and provider messages.</p>
      </div>

      {/* Status filters */}
      <div className="flex gap-1.5 flex-wrap">
        <Link
          href={buildUrl({ status: null })}
          className={cn(
            'px-3 py-1.5 rounded-md border text-xs transition-colors',
            !activeStatus
              ? 'border-foreground bg-foreground text-background'
              : 'border-border hover:border-foreground/40'
          )}
        >
          Active
        </Link>
        {ALL_STATUSES.map(s => (
          <Link
            key={s}
            href={buildUrl({ status: s })}
            className={cn(
              'px-3 py-1.5 rounded-md border text-xs transition-colors',
              activeStatus === s
                ? 'border-foreground bg-foreground text-background'
                : 'border-border hover:border-foreground/40'
            )}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Source filters */}
      <div className="flex gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground self-center">Source:</span>
        {[
          { label: 'All', value: null },
          { label: 'Client', value: 'client' },
          { label: 'Provider', value: 'provider' },
        ].map(opt => (
          <Link
            key={opt.value ?? 'all'}
            href={buildUrl({ source: opt.value })}
            className={cn(
              'px-3 py-1.5 rounded-md border text-xs transition-colors',
              activeSource === opt.value
                ? 'border-foreground bg-foreground text-background'
                : 'border-border hover:border-foreground/40'
            )}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {messages && messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map(message => (
            <div key={message.id} className="rounded-lg border border-border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{message.subject}</p>
                    {message.is_provider_message && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        Provider
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {message.is_provider_message ? (
                      <span>Provider message</span>
                    ) : (
                      <Link href={`/admin/clients/${message.client_id}`} className="hover:underline">
                        {/* @ts-expect-error — joined relation */}
                        {message.profiles?.full_name ?? message.profiles?.email ?? 'Unknown client'}
                      </Link>
                    )}
                    <span>·</span>
                    <span>{format(new Date(message.created_at), 'MMM d, yyyy · h:mm a')}</span>
                    {message.related_order_id && (
                      <>
                        <span>·</span>
                        <Link
                          href={`/admin/orders/${message.related_order_id}`}
                          className="hover:underline"
                        >
                          View order →
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${STATUS_COLORS[message.status]}`}>
                  {STATUS_LABELS[message.status]}
                </span>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{message.body}</p>

              {message.admin_notes && (
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Internal note</p>
                  <p className="text-sm text-muted-foreground">{message.admin_notes}</p>
                </div>
              )}

              <MessageStatusControl message={message} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground text-sm">
          {activeStatus ? `No ${STATUS_LABELS[activeStatus as ConciergeMessage['status']]?.toLowerCase()} messages` : 'No active messages'}
        </div>
      )}
    </div>
  )
}
