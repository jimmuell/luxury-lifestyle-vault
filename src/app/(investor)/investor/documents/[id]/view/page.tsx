import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getInvestorDocSignedUrl } from '@/lib/storage/investor-docs'
import { buttonVariants } from '@/components/ui/button'

export default async function InvestorDocViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: selfProfile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = selfProfile?.role
  if (role !== 'investor' && role !== 'admin') redirect('/')

  const { id } = await params

  // RLS enforces published + tier visibility for investor role
  const { data: doc } = await supabase
    .from('documents')
    .select('id, title, pdf_path')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (!doc || !doc.pdf_path) notFound()

  // TODO: audit logging — investor_document_views references investor_documents;
  // will wire to documents table after Phase 5 retires the old table.

  const signedUrl = await getInvestorDocSignedUrl(doc.pdf_path)

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
