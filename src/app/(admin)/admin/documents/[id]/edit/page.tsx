import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { ChevronLeft } from 'lucide-react'
import { DocumentActions } from '@/components/admin/document-actions'
import { DocumentVersionHistory } from '@/components/admin/document-version-history'
import { DocumentReplaceForm } from '@/components/admin/document-replace-form'
import { AdminLoadError } from '@/components/admin/load-error'

export default async function EditDocumentPage({
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

  const [
    { data: doc, error: docError },
    { data: versions },
  ] = await Promise.all([
    admin
      .from('documents')
      .select('id, title, category_id, audience, doc_type, body_markdown, source_kind, status, sort_order, current_version, pdf_path, pdf_generated_at, published_at, updated_at, source_type, google_web_view_link, google_file_id, sync_status, pdf_sha256, file_size_bytes, page_count')
      .eq('id', id)
      .single(),
    admin
      .from('document_versions')
      .select('id, version_no, title, audience, created_at')
      .eq('document_id', id)
      .order('version_no', { ascending: false }),
  ])

  if (docError) return <AdminLoadError area="document" message={docError.message} />
  if (!doc) notFound()

  return (
    <div className="space-y-5">
      {/* ── breadcrumb + status row ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin/documents" className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-light leading-tight">{doc.title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              v{doc.current_version}
              {doc.published_at && ` · Published ${format(new Date(doc.published_at), 'MMM d, yyyy')}`}
              {doc.updated_at && ` · Saved ${format(new Date(doc.updated_at), 'MMM d, yyyy HH:mm')}`}
            </p>
          </div>
        </div>
      </div>

      {/* ── lifecycle actions ───────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card px-5 py-3.5">
        <DocumentActions
          docId={doc.id}
          status={doc.status}
          sourceKind={doc.source_kind}
          pdfPath={doc.pdf_path}
        />
      </div>

      {/* ── PDF source metadata ─────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Document Info</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Title</dt>
            <dd className="font-medium mt-0.5">{doc.title}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Audience</dt>
            <dd className="mt-0.5 capitalize">{doc.audience}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Source</dt>
            <dd className="mt-0.5 capitalize">{doc.source_type?.replace('_', ' ') ?? 'manual upload'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Sync status</dt>
            <dd className="mt-0.5 capitalize">{doc.sync_status?.replace('_', ' ') ?? '—'}</dd>
          </div>
          {doc.page_count != null && (
            <div>
              <dt className="text-xs text-muted-foreground">Pages</dt>
              <dd className="mt-0.5">{doc.page_count}</dd>
            </div>
          )}
          {doc.file_size_bytes != null && (
            <div>
              <dt className="text-xs text-muted-foreground">File size</dt>
              <dd className="mt-0.5">{(doc.file_size_bytes / 1024).toFixed(0)} KB</dd>
            </div>
          )}
          {doc.google_web_view_link && (
            <div className="col-span-2 md:col-span-3">
              <dt className="text-xs text-muted-foreground">Google Drive</dt>
              <dd className="mt-0.5">
                <a href={doc.google_web_view_link} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline text-xs break-all">
                  {doc.google_web_view_link}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* ── replace PDF ──────────────────────────────────────────────────────── */}
      <DocumentReplaceForm docId={doc.id} />

      {/* ── version history ─────────────────────────────────────────────────── */}
      {doc.source_kind !== 'upload' && (
        <div className="space-y-3">
          <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
            Version History
          </h2>
          <DocumentVersionHistory
            docId={doc.id}
            currentVersion={doc.current_version}
            versions={versions ?? []}
          />
        </div>
      )}
    </div>
  )
}
