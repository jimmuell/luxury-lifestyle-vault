import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { ChevronLeft } from 'lucide-react'

export default async function AdminInvestorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: selfProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (selfProfile?.role !== 'admin') redirect('/')

  const admin = createAdminClient()

  const [profileResult, viewsResult, documentsResult] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, email, investor_tier, nda_acknowledged, created_at')
      .eq('id', id)
      .single(),
    admin
      .from('investor_document_views')
      .select('id, document_id, view_type, viewed_at')
      .eq('profile_id', id)
      .order('viewed_at', { ascending: false }),
    admin
      .from('investor_documents')
      .select('id, title, section'),
  ])

  if (!profileResult.data) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/admin/investors"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Investors
        </Link>
        <p className="text-sm text-muted-foreground">Investor not found.</p>
      </div>
    )
  }

  const profile = profileResult.data
  const views = viewsResult.data ?? []
  const documents = documentsResult.data ?? []

  const docMap: Record<string, { title: string; section: string }> = {}
  for (const doc of documents) {
    docMap[doc.id] = { title: doc.title, section: doc.section }
  }

  const totalViews = views.filter(v => v.view_type === 'view').length
  const totalDownloads = views.filter(v => v.view_type === 'download').length
  const lastSeen = views.length > 0 ? views[0].viewed_at : null
  const uniqueDays = new Set(views.map(v => v.viewed_at.slice(0, 10)))
  const returnVisits = uniqueDays.size

  type DocRow = {
    documentId: string
    title: string
    section: string
    views: number
    downloads: number
    lastViewed: string
  }

  const docActivity: Record<string, DocRow> = {}
  for (const v of views) {
    if (!docActivity[v.document_id]) {
      const doc = docMap[v.document_id]
      docActivity[v.document_id] = {
        documentId: v.document_id,
        title: doc?.title ?? 'Unknown document',
        section: doc?.section ?? '—',
        views: 0,
        downloads: 0,
        lastViewed: v.viewed_at,
      }
    }
    if (v.view_type === 'view') docActivity[v.document_id].views++
    if (v.view_type === 'download') docActivity[v.document_id].downloads++
    if (v.viewed_at > docActivity[v.document_id].lastViewed) {
      docActivity[v.document_id].lastViewed = v.viewed_at
    }
  }

  const docRows = Object.values(docActivity).sort(
    (a, b) => b.lastViewed.localeCompare(a.lastViewed)
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href="/admin/investors"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Investors
        </Link>
      </div>

      <div>
        <h1 className="font-serif text-3xl font-light">{profile.full_name ?? '—'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {profile.email}
          {profile.investor_tier && <> · Tier: {profile.investor_tier}</>}
          {' · '}Invited: {format(new Date(profile.created_at), 'MMM d, yyyy')}
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Engagement Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border px-4 py-4 bg-card">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Views</p>
            <p className="font-serif text-2xl font-light mt-1">{totalViews}</p>
          </div>
          <div className="rounded-lg border border-border px-4 py-4 bg-card">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Downloads</p>
            <p className="font-serif text-2xl font-light mt-1">{totalDownloads}</p>
          </div>
          <div className="rounded-lg border border-border px-4 py-4 bg-card">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Last seen</p>
            <p className="font-serif text-2xl font-light mt-1">
              {lastSeen ? format(new Date(lastSeen), 'MMM d, yyyy') : '—'}
            </p>
          </div>
          <div className="rounded-lg border border-border px-4 py-4 bg-card">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Return visits</p>
            <p className="font-serif text-2xl font-light mt-1">
              {returnVisits} {returnVisits === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Document Activity</h2>
        <div className="rounded-lg border border-border overflow-hidden">
          {docRows.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Document</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden md:table-cell">Section</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Views</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Downloads</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden lg:table-cell">Last viewed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {docRows.map(row => (
                  <tr key={row.documentId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 font-medium">{row.title}</td>
                    <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">{row.section}</td>
                    <td className="px-5 py-4 text-muted-foreground">{row.views}</td>
                    <td className="px-5 py-4 text-muted-foreground">{row.downloads}</td>
                    <td className="px-5 py-4 text-muted-foreground text-xs hidden lg:table-cell">
                      {format(new Date(row.lastViewed), 'MMM d, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No document activity recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
