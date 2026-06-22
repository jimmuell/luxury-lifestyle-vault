import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { ExternalLink, FileText, AlertCircle, Eye, Download } from 'lucide-react'
import { AdminLoadError } from '@/components/admin/load-error'

const AUDIENCE_STYLES: Record<string, string> = {
  prospect: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  investor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  board:    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
}

const SOURCE_STYLES: Record<string, string> = {
  markdown: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  upload:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export default async function AdminDataRoomPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: selfProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (selfProfile?.role !== 'admin') redirect('/')

  const admin = createAdminClient()

  const [{ data: categories, error: catError }, { data: docs, error: docsError }] = await Promise.all([
    admin
      .from('categories')
      .select('id, key, label, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    admin
      .from('documents')
      .select('id, title, category_id, audience, status, source_kind, current_version, pdf_path, pdf_generated_at, published_at')
      .in('status', ['published', 'draft', 'archived'])
      .order('sort_order', { ascending: true }),
  ])

  if (catError) return <AdminLoadError area="categories" message={catError.message} />
  if (docsError) return <AdminLoadError area="data room" message={docsError.message} />

  const allDocs = docs ?? []
  const allCats = categories ?? []

  // Summary counts
  const published  = allDocs.filter(d => d.status === 'published').length
  const withPdf    = allDocs.filter(d => d.status === 'published' && d.pdf_path).length
  const pendingPdf = allDocs.filter(d => d.status === 'published' && !d.pdf_path).length
  const drafts     = allDocs.filter(d => d.status === 'draft').length

  // Group by category in category sort_order
  const catById = new Map(allCats.map(c => [c.id, c]))
  type DocRow = typeof allDocs[number]
  const byCategory = new Map<string, DocRow[]>()
  for (const doc of allDocs) {
    const existing = byCategory.get(doc.category_id) ?? []
    existing.push(doc)
    byCategory.set(doc.category_id, existing)
  }
  const sections = allCats
    .filter(c => byCategory.has(c.id))
    .map(c => ({ cat: c, docs: byCategory.get(c.id)! }))
  // Append any docs whose category is inactive (shouldn't happen, but safe)
  for (const [catId, catDocs] of byCategory) {
    if (!catById.has(catId)) {
      sections.push({ cat: { id: catId, key: catId, label: catId, sort_order: 999 }, docs: catDocs })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light">Data Room</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Published documents managed in the dashboard.{' '}
            <Link href="/admin/documents" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Edit in Documents →
            </Link>
          </p>
        </div>
        <span className="text-sm text-muted-foreground">{published} published</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Published',    value: published,  style: 'text-green-600 dark:text-green-400' },
          { label: 'With PDF',     value: withPdf,    style: 'text-green-600 dark:text-green-400' },
          { label: 'PDF pending',  value: pendingPdf, style: pendingPdf > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground' },
          { label: 'Drafts',       value: drafts,     style: 'text-muted-foreground' },
        ].map(({ label, value, style }) => (
          <div key={label} className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.1em]">{label}</p>
            <p className={`text-2xl font-light mt-1 ${style}`}>{value}</p>
          </div>
        ))}
      </div>

      {pendingPdf > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-5 py-4 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">
              {pendingPdf} document{pendingPdf > 1 ? 's' : ''} published without a PDF
            </p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              PDFs are generated by Inngest after publishing. If a PDF is missing, open the document,
              click Unpublish, then Publish to re-trigger generation.
            </p>
          </div>
        </div>
      )}

      {/* Document sections */}
      {sections.map(({ cat, docs: sectionDocs }) => (
        <div key={cat.id}>
          <h2 className="font-serif text-xl font-light mb-3">{cat.label}</h2>
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Document</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Audience</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Source</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Ver.</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">PDF</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Published</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {sectionDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 font-medium max-w-[220px]">
                      <span className="line-clamp-2">{doc.title}</span>
                      {doc.status !== 'published' && (
                        <span className="block text-[10px] uppercase tracking-wide text-muted-foreground/60 mt-0.5">
                          {doc.status}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${AUDIENCE_STYLES[doc.audience] ?? ''}`}>
                        {doc.audience}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${SOURCE_STYLES[doc.source_kind] ?? ''}`}>
                        {doc.source_kind}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground text-xs">
                      v{doc.current_version}
                    </td>
                    <td className="px-5 py-4">
                      {doc.pdf_path ? (
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                            <FileText className="h-3 w-3" />
                            {doc.pdf_generated_at ? format(new Date(doc.pdf_generated_at), 'MMM d') : 'Ready'}
                          </span>
                          <span className="inline-flex items-center gap-3">
                            <a
                              href={`/api/investor/documents/${doc.id}?inline=1`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </a>
                            <a
                              href={`/api/investor/documents/${doc.id}?download=1`}
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </a>
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground text-xs whitespace-nowrap">
                      {doc.published_at ? format(new Date(doc.published_at), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/documents/${doc.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
