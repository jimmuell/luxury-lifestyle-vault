import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ArrowRight, Search } from 'lucide-react'

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, phone, created_at, onboarding_complete')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  if (params.onboarding === 'pending') query = query.eq('onboarding_complete', false)
  if (params.onboarding === 'complete') query = query.eq('onboarding_complete', true)

  const { data: clients } = await query

  // Get item counts and tiers in parallel
  const clientIds = (clients ?? []).map(c => c.id)
  const [itemCountsResult, clientProfilesResult] = await Promise.all([
    clientIds.length > 0
      ? supabase.from('items').select('client_id').in('client_id', clientIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase.from('client_profiles').select('profile_id, membership_tier').in('profile_id', clientIds)
      : Promise.resolve({ data: [] }),
  ])

  const itemCounts: Record<string, number> = {}
  for (const row of itemCountsResult.data ?? []) {
    itemCounts[row.client_id] = (itemCounts[row.client_id] ?? 0) + 1
  }

  const tierMap: Record<string, string> = {}
  for (const cp of clientProfilesResult.data ?? []) {
    tierMap[cp.profile_id] = cp.membership_tier
  }

  const filtered = params.q
    ? (clients ?? []).filter(c =>
        (c.full_name ?? '').toLowerCase().includes(params.q!.toLowerCase()) ||
        c.email.toLowerCase().includes(params.q!.toLowerCase())
      )
    : (clients ?? [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-light">Clients</h1>
        <span className="text-sm text-muted-foreground">{filtered.length} member{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <form className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search by name or email…"
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>

        <div className="flex gap-2">
          {[
            { label: 'All', value: undefined },
            { label: 'Onboarding pending', value: 'pending' },
            { label: 'Active', value: 'complete' },
          ].map(({ label, value }) => (
            <Link
              key={label}
              href={value ? `/admin/clients?onboarding=${value}` : '/admin/clients'}
              className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                params.onboarding === value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground/40 text-muted-foreground'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {filtered.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden lg:table-cell">Items</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden lg:table-cell">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden xl:table-cell">Joined</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filtered.map(client => (
                <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium">{client.full_name ?? <span className="text-muted-foreground">—</span>}</p>
                    <p className="text-xs text-muted-foreground md:hidden">{client.email}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-muted-foreground">{client.email}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-muted-foreground tabular-nums">
                    {itemCounts[client.id] ?? 0}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    {client.onboarding_complete ? (
                      <Badge variant="secondary" className="text-[10px]">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        Onboarding
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5 hidden xl:table-cell text-muted-foreground text-xs">
                    {format(new Date(client.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      View <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No clients match your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
