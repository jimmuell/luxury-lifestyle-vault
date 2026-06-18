import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { AlertTriangle, Clock } from 'lucide-react'
import { AdminLoadError } from '@/components/admin/load-error'
import { MarkReviewedButton } from '@/components/admin/mark-reviewed-button'

const SECTION_LABELS: Record<string, string> = {
  concept: 'The Concept',
  strategy: 'Strategy',
  market: 'Market & Competitive',
  financials: 'Financials',
  product: 'Product & Technology',
  operations: 'Operations',
  launch: 'Launch Plan',
  legal: 'Legal & Risk',
  deck: 'Pitch Deck',
  presentations: 'Presentations',
}

const STATUS_STYLES: Record<string, string> = {
  current:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  stale:          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  source_missing: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  unverified:     'bg-muted text-muted-foreground',
}

const STATUS_LABELS: Record<string, string> = {
  current: 'Current',
  stale: 'Stale',
  source_missing: 'Source missing',
  unverified: 'Unverified',
}

const AUDIENCE_STYLES: Record<string, string> = {
  prospect: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  investor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  board:    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function isReconcileOverdue(lastReconciledAt: string | null): boolean {
  if (!lastReconciledAt) return true
  return Date.now() - new Date(lastReconciledAt).getTime() > SEVEN_DAYS_MS
}

export default async function AdminDataRoomPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: selfProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (selfProfile?.role !== 'admin') redirect('/')

  const admin = createAdminClient()

  const { data: docs, error: docsError } = await admin
    .from('investor_documents')
    .select('id, title, section, audience, content_status, source_system, source_name, source_version, source_revised_at, published_at, published_by, last_reconciled_at')
    .eq('is_published', true)
    .order('section')
    .order('sort_order', { ascending: true })
    .order('title')

  if (docsError) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl font-light">Data Room Currency</h1>
        <AdminLoadError area="data room" message={docsError.message} />
      </div>
    )
  }

  const allDocs = docs ?? []

  // Summary counts
  const counts = allDocs.reduce(
    (acc, d) => {
      acc[d.content_status as keyof typeof acc] = (acc[d.content_status as keyof typeof acc] ?? 0) + 1
      if (isReconcileOverdue(d.last_reconciled_at)) acc.overdue++
      return acc
    },
    { current: 0, stale: 0, source_missing: 0, unverified: 0, overdue: 0 }
  )

  // Group by section in order
  const sectionOrder = ['concept', 'strategy', 'market', 'financials', 'product', 'operations', 'launch', 'legal', 'deck', 'presentations']
  const bySection = new Map<string, typeof allDocs>()
  for (const doc of allDocs) {
    const existing = bySection.get(doc.section) ?? []
    existing.push(doc)
    bySection.set(doc.section, existing)
  }
  const sections = [
    ...sectionOrder.filter(s => bySection.has(s)).map(s => ({ key: s, docs: bySection.get(s)! })),
    ...[...bySection.keys()].filter(s => !sectionOrder.includes(s)).map(s => ({ key: s, docs: bySection.get(s)! })),
  ]

  const hasIssues = counts.stale > 0 || counts.source_missing > 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-light">Data Room Currency</h1>
        <span className="text-sm text-muted-foreground">{allDocs.length} published</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Current',        value: counts.current,        style: 'text-green-600 dark:text-green-400' },
          { label: 'Stale',          value: counts.stale,          style: counts.stale > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground' },
          { label: 'Source missing', value: counts.source_missing, style: counts.source_missing > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground' },
          { label: 'Unverified',     value: counts.unverified,     style: 'text-muted-foreground' },
          { label: 'Reconcile overdue', value: counts.overdue,     style: counts.overdue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground' },
        ].map(({ label, value, style }) => (
          <div key={label} className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.1em]">{label}</p>
            <p className={`text-2xl font-light mt-1 ${style}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Runbook callout */}
      <div className={`rounded-lg border px-5 py-4 text-sm ${hasIssues ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30' : 'border-border bg-muted/30'}`}>
        <p className="font-medium mb-2">How to re-publish a stale document</p>
        <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
          <li>Edit the source in Drive, bump the control-page version and date.</li>
          <li>Export the room PDF (strip the control page). Capture version, revised_at, and the normalized-text SHA-256.</li>
          <li>Drop the PDF into <code className="text-xs bg-muted px-1 rounded">supabase/seed/investor-room/</code>.</li>
          <li>Update <code className="text-xs bg-muted px-1 rounded">manifest.json</code> — set source.version, source.revised_at, source.text_sha256.</li>
          <li>Run <code className="text-xs bg-muted px-1 rounded">npx tsx scripts/seed-investor-docs.ts --check</code>. Confirm no unexpected DRIFT or PRUNE.</li>
          <li>Run <code className="text-xs bg-muted px-1 rounded">npx tsx scripts/seed-investor-docs.ts --publish</code>. Status returns to Current.</li>
        </ol>
      </div>

      {/* Document sections */}
      {sections.map(({ key, docs: sectionDocs }) => (
        <div key={key}>
          <h2 className="font-serif text-xl font-light mb-3">
            {SECTION_LABELS[key] ?? key}
          </h2>
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Document</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Audience</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Source</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Published</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Last reconciled</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {sectionDocs.map(doc => {
                  const overdue = isReconcileOverdue(doc.last_reconciled_at)
                  const statusStyle = STATUS_STYLES[doc.content_status] ?? STATUS_STYLES.unverified
                  const statusLabel = STATUS_LABELS[doc.content_status] ?? doc.content_status
                  const audienceStyle = AUDIENCE_STYLES[doc.audience] ?? ''
                  const sourceLabel = doc.source_name
                    ? `${doc.source_name}${doc.source_version ? ` · ${doc.source_version}` : ''}`
                    : doc.source_system === 'external' ? 'External' : '—'

                  return (
                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 font-medium max-w-[220px]">
                        <span className="line-clamp-2">{doc.title}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${audienceStyle}`}>
                          {doc.audience}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle}`}>
                          {doc.content_status === 'stale' || doc.content_status === 'source_missing'
                            ? <AlertTriangle className="h-3 w-3" />
                            : null}
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs max-w-[180px]">
                        <span className="line-clamp-2">{sourceLabel}</span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs whitespace-nowrap">
                        {doc.published_at ? format(new Date(doc.published_at), 'MMM d, yyyy') : '—'}
                        {doc.published_by && doc.published_by !== 'cowork-pipeline' && (
                          <span className="block text-[10px] text-muted-foreground/60 mt-0.5">via admin upload</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs whitespace-nowrap">
                        <span className={overdue && doc.source_system !== 'external' ? 'text-amber-600 dark:text-amber-400' : ''}>
                          {doc.last_reconciled_at ? format(new Date(doc.last_reconciled_at), 'MMM d, yyyy') : '—'}
                        </span>
                        {overdue && doc.source_system !== 'external' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 block">
                            <Clock className="h-3 w-3 inline" /> Overdue
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {doc.source_system === 'external' ? (
                          <MarkReviewedButton docId={doc.id} />
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
