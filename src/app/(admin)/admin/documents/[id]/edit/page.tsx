import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { ChevronLeft } from 'lucide-react'
import { DocumentEditor } from '@/components/admin/document-editor'
import { DocumentActions } from '@/components/admin/document-actions'
import { DocumentVersionHistory } from '@/components/admin/document-version-history'
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
    { data: categories, error: catError },
    { data: versions },
  ] = await Promise.all([
    admin
      .from('documents')
      .select('id, title, category_id, audience, doc_type, body_markdown, source_kind, status, sort_order, current_version, pdf_path, pdf_generated_at, published_at, updated_at')
      .eq('id', id)
      .single(),
    admin
      .from('categories')
      .select('id, key, label')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    admin
      .from('document_versions')
      .select('id, version_no, title, audience, created_at')
      .eq('document_id', id)
      .order('version_no', { ascending: false }),
  ])

  if (docError) return <AdminLoadError area="document" message={docError.message} />
  if (catError) return <AdminLoadError area="categories" message={catError.message} />
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

      {/* ── editor ─────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border overflow-hidden">
        <DocumentEditor
          categories={categories ?? []}
          doc={{
            id:              doc.id,
            title:           doc.title,
            category_id:     doc.category_id,
            audience:        doc.audience,
            doc_type:        doc.doc_type,
            body_markdown:   doc.body_markdown,
            source_kind:     doc.source_kind,
            status:          doc.status,
            sort_order:      doc.sort_order,
            current_version: doc.current_version,
          }}
        />
      </div>

      {/* ── version history ─────────────────────────────────────────────────── */}
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
    </div>
  )
}
