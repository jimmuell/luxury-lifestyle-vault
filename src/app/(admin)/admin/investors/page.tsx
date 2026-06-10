import { createAdminClient } from '@/lib/supabase/admin'
import { InviteInvestorForm } from '@/components/admin/invite-investor-form'
import { format } from 'date-fns'
import { ShieldCheck, ShieldOff, Eye } from 'lucide-react'

export default async function AdminInvestorsPage() {
  const admin = createAdminClient()

  // Fetch all investor profiles
  const { data: investors } = await admin
    .from('profiles')
    .select('id, full_name, email, nda_acknowledged, created_at')
    .eq('role', 'investor')
    .order('created_at', { ascending: false })

  const investorIds = (investors ?? []).map(i => i.id)

  // Fetch NDA acknowledgments and view counts in parallel
  const [ndaResult, viewResult] = await Promise.all([
    investorIds.length > 0
      ? admin
          .from('investor_nda_acknowledgments')
          .select('profile_id, acknowledged_at')
          .in('profile_id', investorIds)
      : Promise.resolve({ data: [] }),
    investorIds.length > 0
      ? admin
          .from('investor_document_views')
          .select('profile_id, viewed_at')
          .in('profile_id', investorIds)
          .order('viewed_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  // Build lookup maps
  const ndaMap: Record<string, string> = {}
  for (const row of (ndaResult.data ?? []) as { profile_id: string; acknowledged_at: string }[]) {
    ndaMap[row.profile_id] = row.acknowledged_at
  }

  const viewCounts: Record<string, number> = {}
  const lastActivity: Record<string, string> = {}
  for (const row of (viewResult.data ?? []) as { profile_id: string; viewed_at: string }[]) {
    viewCounts[row.profile_id] = (viewCounts[row.profile_id] ?? 0) + 1
    if (!lastActivity[row.profile_id]) lastActivity[row.profile_id] = row.viewed_at
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-light">Investors</h1>
        <span className="text-sm text-muted-foreground">
          {(investors ?? []).length} investor{(investors ?? []).length !== 1 ? 's' : ''}
        </span>
      </div>

      <InviteInvestorForm />

      <div className="rounded-lg border border-border overflow-hidden">
        {(investors ?? []).length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">NDA</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden lg:table-cell">Views</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden xl:table-cell">Last activity</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden xl:table-cell">Invited</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {(investors ?? []).map(investor => (
                <tr key={investor.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 font-medium">{investor.full_name ?? '—'}</td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">{investor.email}</td>
                  <td className="px-5 py-4">
                    {ndaMap[investor.id] ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {format(new Date(ndaMap[investor.id]), 'MMM d, yyyy')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ShieldOff className="h-3.5 w-3.5" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      {viewCounts[investor.id] ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground text-xs hidden xl:table-cell">
                    {lastActivity[investor.id]
                      ? format(new Date(lastActivity[investor.id]), 'MMM d, yyyy HH:mm')
                      : '—'}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground text-xs hidden xl:table-cell">
                    {format(new Date(investor.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No investors yet. Use the form above to invite one.
          </div>
        )}
      </div>
    </div>
  )
}
