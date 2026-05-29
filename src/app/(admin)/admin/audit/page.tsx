import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { Download } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ENTITY_TYPES = [
  { value: '', label: 'All' },
  { value: 'orders', label: 'Orders' },
  { value: 'items', label: 'Items' },
  { value: 'profiles', label: 'Clients' },
  { value: 'service_tiers', label: 'Pricing' },
]

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity_type?: string; from?: string; to?: string; cursor?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/admin')

  const sp = await searchParams
  const { entity_type: entityType, from, to, cursor } = sp

  const db = createAdminClient()
  let query = db
    .from('admin_audit_log')
    .select('id, created_at, actor_id, action, entity_type, entity_id, before_state, after_state, metadata, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(51)

  if (entityType) query = query.eq('entity_type', entityType)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)
  if (cursor) query = query.lt('created_at', cursor)

  const { data: rows } = await query
  const hasMore = (rows?.length ?? 0) > 50
  const entries = hasMore ? (rows ?? []).slice(0, 50) : (rows ?? [])
  const nextCursor = hasMore ? entries[entries.length - 1].created_at : null

  // CSV URL with current filters
  const csvParams = new URLSearchParams()
  if (entityType) csvParams.set('entity_type', entityType)
  if (from) csvParams.set('from', from)
  if (to) csvParams.set('to', to)
  const csvUrl = `/api/admin/audit?${csvParams.toString()}`

  function filterHref(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    const merged = { entity_type: entityType ?? '', from: from ?? '', to: to ?? '', ...overrides }
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
    const qs = p.toString()
    return `/admin/audit${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-serif text-3xl font-light">Audit Log</h1>
        <Link href={csvUrl} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {ENTITY_TYPES.map(et => (
          <Link
            key={et.value}
            href={filterHref({ entity_type: et.value, cursor: '' })}
            className={cn(
              'px-3 py-1.5 text-xs rounded-full border transition-colors',
              (entityType ?? '') === et.value
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
            )}
          >
            {et.label}
          </Link>
        ))}

        <form method="GET" className="flex items-center gap-2 ml-auto">
          {entityType && <input type="hidden" name="entity_type" value={entityType} />}
          <input type="date" name="from" defaultValue={from ?? ''} className="text-xs border border-border rounded px-2 py-1 bg-background" />
          <span className="text-muted-foreground text-xs">–</span>
          <input type="date" name="to" defaultValue={to ?? ''} className="text-xs border border-border rounded px-2 py-1 bg-background" />
          <button type="submit" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Filter</button>
          {(from || to) && (
            <Link href={filterHref({ from: '', to: '', cursor: '' })} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Audit entries */}
      {!cursor && entries.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground italic">No audit entries found.</div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => {
            const actor = entry.profiles as { full_name: string | null; email: string } | null
            const actorLabel = actor?.full_name ?? actor?.email ?? entry.actor_id.slice(0, 8)
            const before = entry.before_state as Record<string, unknown> | null
            const after = entry.after_state as Record<string, unknown> | null

            return (
              <div key={entry.id} className="rounded-lg border border-border bg-card px-5 py-4 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium font-mono">{entry.action}</span>
                      <span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
                        {entry.entity_type}
                      </span>
                      {entry.entity_id && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {entry.entity_id.slice(0, 8)}…
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      by {actorLabel} · {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                {/* Diff view */}
                {(before || after) && (
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {before && (
                      <div className="rounded bg-red-500/10 border border-red-500/20 px-3 py-2 space-y-0.5">
                        <p className="text-[10px] uppercase tracking-widest text-red-500/70 mb-1">Before</p>
                        {Object.entries(before).map(([k, v]) => (
                          <p key={k} className="text-red-600 dark:text-red-400">
                            {k}: {String(v)}
                          </p>
                        ))}
                      </div>
                    )}
                    {after && (
                      <div className="rounded bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 space-y-0.5">
                        <p className="text-[10px] uppercase tracking-widest text-emerald-500/70 mb-1">After</p>
                        {Object.entries(after).map(([k, v]) => (
                          <p key={k} className="text-emerald-600 dark:text-emerald-400">
                            {k}: {String(v)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {nextCursor && (
        <div className="flex justify-center">
          <Link
            href={filterHref({ cursor: nextCursor })}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Load more
          </Link>
        </div>
      )}
    </div>
  )
}
