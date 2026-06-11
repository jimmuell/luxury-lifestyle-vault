import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInvestorDocSignedUrl } from '@/lib/storage/investor-docs'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role
  if (role !== 'investor' && role !== 'admin') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { id } = await params

  const url = new URL(request.url)
  const isDownload = url.searchParams.get('download') === '1'

  // Without ?download=1, redirect to the in-app viewer page
  if (!isDownload) {
    return NextResponse.redirect(new URL(`/investor/documents/${id}/view`, request.url), 302)
  }

  // Fetch the document — RLS enforces published + investor visibility for investor role
  const { data: doc, error: docErr } = await supabase
    .from('investor_documents')
    .select('id, storage_path, title')
    .eq('id', id)
    .single()

  if (docErr || !doc) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // Log download for investors only (not admin previews)
  if (role === 'investor') {
    const admin = createAdminClient()
    const { error: auditErr } = await admin.from('investor_document_views').insert({
      profile_id: user.id,
      document_id: doc.id,
      view_type: 'download',
    })
    if (auditErr) console.error('[investor-docs audit]', auditErr.message)
  }

  const filename = `${slugify(doc.title)}.pdf`
  const signedUrl = await getInvestorDocSignedUrl(doc.storage_path, undefined, filename)
  return NextResponse.redirect(signedUrl, 302)
}
