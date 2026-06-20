import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { Plus, FileText, PauseCircle } from 'lucide-react'
import { AdminLoadError } from '@/components/admin/load-error'
import { buttonVariants } from '@/components/ui/button'
import { DocumentDriveSourceForm } from '@/components/admin/document-drive-source-form'
import { DocumentSyncButton } from '@/components/admin/document-sync-button'
import { DocumentSyncAllButton } from '@/components/admin/document-sync-all-button'
import { DocumentSyncToggle } from '@/components/admin/document-sync-toggle'
import { DocumentsSyncPoller } from '@/components/admin/documents-sync-poller'

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-muted text-muted-foreground',
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  archived:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

const AUDIENCE_STYLES: Record<string, string> = {
  prospect: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  investor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  board:    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
}

const SYNC_STATUS_STYLES: Record<string, string> = {
  synced:      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  syncing:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  failed:      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  changed:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  manual_only: 'bg-muted text-muted-foreground',
}

export default async function AdminDocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: selfProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (selfProfile?.role !== 'admin') redirect('/')

  const admin = createAdminClient()

  const [{ data: docs, error: docsError }, { data: categories }] = await Promise.all([
    admin
      .from('documents')
      .select('id, title, status, audience, doc_type, source_kind, sort_order, current_version, published_at, updated_at, category_id, source_type, google_web_view_link, sync_status, sync_enabled, last_synced_at, last_sync_error, file_size_bytes, page_count')
      .order('status')
      .order('sort_order', { ascending: true })
      .order('title'),
    admin
      .from('categories')
      .select('id, key, label, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ])

  const catMap = new Map((categories ?? []).map(c => [c.id, c]))

  // Group docs by category in category sort order
  const grouped = new Map<string, typeof docs>()
  for (const doc of docs ?? []) {
    const catId = doc.category_id
    if (!grouped.has(catId)) grouped.set(catId, [])
    grouped.get(catId)!.push(doc)
  }
  const sortedCatIds = [...grouped.keys()].sort((a, b) => {
    const aOrder = catMap.get(a)?.sort_order ?? 999
    const bOrder = catMap.get(b)?.sort_order ?? 999
    return aOrder - bOrder
  })

  const total = docs?.length ?? 0
  const published = docs?.filter(d => d.status === 'published').length ?? 0
  const driveLinked = docs?.filter(d => d.source_type === 'google_drive').length ?? 0
  const isSyncing = docs?.some(d => d.sync_status === 'syncing') ?? false

  return (
    <div className="space-y-6">
      <DocumentsSyncPoller isSyncing={isSyncing} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {published} published · {total} total
            {driveLinked > 0 && ` · ${driveLinked} Drive-linked`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {driveLinked > 0 && <DocumentSyncAllButton />}
          <Link href="/admin/documents/new" className={buttonVariants({ variant: 'default', size: 'sm' })}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Document
          </Link>
        </div>
      </div>

      {docsError ? (
        <AdminLoadError area="documents" message={docsError.message} />
      ) : total === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 flex flex-col items-center gap-4 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">No documents yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Create your first document to get started.</p>
          </div>
          <Link href="/admin/documents/new" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            New Document
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedCatIds.map(catId => {
            const cat = catMap.get(catId)
            const catDocs = grouped.get(catId) ?? []
            return (
              <div key={catId}>
                <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-3">
                  {cat?.label ?? catId}
                </h2>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Title</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden md:table-cell">Audience</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden lg:table-cell">Source</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden xl:table-cell">PDF</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden lg:table-cell">Version</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden xl:table-cell">Updated</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {catDocs.map(doc => (
                        <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-medium leading-snug">{doc.title}</p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5 capitalize">
                              {doc.source_kind}
                              {doc.sync_status && doc.sync_status !== 'manual_only' && (
                                <>
                                  {' · '}
                                  <span className={`inline-flex items-center rounded px-1 py-px text-[10px] font-medium ${SYNC_STATUS_STYLES[doc.sync_status] ?? ''}`}>
                                    {doc.sync_status.replace(/_/g, ' ')}
                                  </span>
                                  {doc.last_synced_at && (
                                    <span className="ml-1 text-muted-foreground/40">
                                      {format(new Date(doc.last_synced_at), 'MMM d')}
                                    </span>
                                  )}
                                </>
                              )}
                              {` · sort ${doc.sort_order}`}
                            </p>
                            {doc.source_type === 'google_drive' && !doc.sync_enabled && (
                              <p className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                <PauseCircle className="h-3 w-3 shrink-0" />
                                <span title="Excluded from Sync all — pending table-border fix.">Sync paused</span>
                              </p>
                            )}
                            {doc.last_sync_error && (
                              <p className="text-[10px] text-red-500 mt-0.5 truncate max-w-xs" title={doc.last_sync_error}>
                                {doc.last_sync_error}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-3.5 hidden md:table-cell">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${AUDIENCE_STYLES[doc.audience] ?? ''}`}>
                              {doc.audience}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs hidden lg:table-cell">
                            {doc.source_type === 'google_drive' && doc.google_web_view_link ? (
                              <a href={doc.google_web_view_link} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">Drive</a>
                            ) : (
                              <span className="text-muted-foreground">Manual</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[doc.status] ?? STATUS_STYLES.draft}`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 hidden xl:table-cell">
                            {doc.page_count != null ? (
                              <span className="text-muted-foreground text-xs">
                                {doc.page_count}p
                                {doc.file_size_bytes != null && (
                                  <span className="text-muted-foreground/60"> · {(doc.file_size_bytes / 1024).toFixed(0)} KB</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/60 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">
                            v{doc.current_version}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground text-xs whitespace-nowrap hidden xl:table-cell">
                            {doc.updated_at ? format(new Date(doc.updated_at), 'MMM d, yyyy') : '—'}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <DocumentDriveSourceForm
                                docId={doc.id}
                                currentLink={doc.google_web_view_link ?? null}
                              />
                              {doc.source_type === 'google_drive' && (
                                <>
                                  <DocumentSyncButton
                                    docId={doc.id}
                                    syncStatus={doc.sync_status}
                                    syncEnabled={doc.sync_enabled}
                                  />
                                  <DocumentSyncToggle
                                    docId={doc.id}
                                    syncEnabled={doc.sync_enabled}
                                  />
                                </>
                              )}
                              <Link
                                href={`/admin/documents/${doc.id}/edit`}
                                className="rounded border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              >
                                Edit
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
