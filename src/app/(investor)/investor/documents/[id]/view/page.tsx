import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInvestorDocSignedUrl } from '@/lib/storage/investor-docs'
import { buttonVariants } from '@/components/ui/button'

export default async function InvestorDocViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // 1. Re-verify session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: selfProfile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = selfProfile?.role
  if (role !== 'investor' && role !== 'admin') redirect('/')

  // 2. Await params (Next.js 16 — params is a Promise)
  const { id } = await params

  // 3. Fetch the document
  const { data: doc } = await supabase
    .from('investor_documents')
    .select('id, title, storage_path')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle()

  if (!doc) notFound()

  // 4. Log view for investors only (not admin previews)
  if (role === 'investor') {
    const admin = createAdminClient()
    const { error: auditErr } = await admin.from('investor_document_views').insert({
      profile_id: user.id,
      document_id: doc.id,
      view_type: 'view',
    })
    if (auditErr) console.error('[investor-view audit]', auditErr.message)
  }

  // 5. Mint signed URL (1 hour TTL is fine)
  const signedUrl = await getInvestorDocSignedUrl(doc.storage_path)

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Slim header bar */}
      <div className="flex items-center justify-between gap-4 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/investor/documents"
            className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' gap-1.5 flex-shrink-0'}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Documents
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="font-serif text-base font-light truncate">{doc.title}</h1>
        </div>
        <Link
          href={`/api/investor/documents/${doc.id}?download=1`}
          className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-1.5 flex-shrink-0 print:hidden'}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Link>
      </div>

      {/* PDF iframe — fills remaining height */}
      <div className="flex-1 rounded-lg border border-border overflow-hidden">
        <iframe
          src={signedUrl}
          title={doc.title}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}
