import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInvestorDocSignedUrl } from '@/lib/storage/investor-docs'

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
    .single()

  const role = profile?.role
  if (role !== 'investor' && role !== 'admin') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { id } = await params

  // Fetch the document — RLS enforces published + investor visibility for investor role
  const { data: doc, error: docErr } = await supabase
    .from('investor_documents')
    .select('id, storage_path, title')
    .eq('id', id)
    .single()

  if (docErr || !doc) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const url = new URL(request.url)
  const isDownload = url.searchParams.get('download') === '1'

  // Log view/download for investors only (not admin previews)
  if (role === 'investor') {
    const admin = createAdminClient()
    await admin.from('investor_document_views').insert({
      profile_id: user.id,
      document_id: doc.id,
      view_type: isDownload ? 'download' : 'view',
    })
  }

  const signedUrl = await getInvestorDocSignedUrl(doc.storage_path)
  return NextResponse.redirect(signedUrl)
}
