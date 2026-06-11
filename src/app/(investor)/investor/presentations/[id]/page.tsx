import { redirect } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInvestorDocSignedUrl } from '@/lib/storage/investor-docs'
import { buttonVariants } from '@/components/ui/button'

const DeckViewer = dynamic(() => import('@/components/investor/DeckViewer'), { ssr: false })

interface Props {
  params: Promise<{ id: string }>
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default async function InvestorPresentationViewerPage({ params }: Props) {
  const { id } = await params

  // 1. Re-verify session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role
  if (role !== 'investor' && role !== 'admin') redirect('/')

  // 2. Fetch the document (include storage_path)
  const { data: doc } = await supabase
    .from('investor_documents')
    .select('id, title, storage_path')
    .eq('id', id)
    .eq('doc_type', 'presentation')
    .eq('is_published', true)
    .maybeSingle()

  if (!doc) redirect('/investor/presentations')

  // 3. Mint signed URLs (audit fires AFTER this succeeds)
  const signedUrl = await getInvestorDocSignedUrl(doc.storage_path)
  const downloadUrl = await getInvestorDocSignedUrl(
    doc.storage_path,
    undefined,
    `${slugify(doc.title)}.pdf`,
  )

  // 4. Audit log — only for investors, only after URLs are successfully minted
  if (role === 'investor') {
    const admin = createAdminClient()
    const { error: auditErr } = await admin.from('investor_document_views').insert({
      profile_id: user.id,
      document_id: doc.id,
      view_type: 'view',
    })
    if (auditErr) console.error('[investor-presentation audit]', auditErr.message)
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Slim header bar */}
      <div className="flex items-center gap-3 pb-4 flex-shrink-0 min-w-0">
        <Link
          href="/investor/presentations"
          className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' gap-1.5 flex-shrink-0'}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Presentations
        </Link>
        <span className="text-muted-foreground flex-shrink-0">/</span>
        <h1 className="font-serif text-base font-light truncate text-foreground">{doc.title}</h1>
      </div>

      {/* DeckViewer — fills remaining height */}
      <div className="flex-1 min-h-0">
        <DeckViewer
          signedUrl={signedUrl}
          title={doc.title}
          downloadUrl={downloadUrl}
        />
      </div>
    </div>
  )
}
