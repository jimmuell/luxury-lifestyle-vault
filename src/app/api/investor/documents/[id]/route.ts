import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
  // mode: 'download' forces a file download; 'inline' renders the PDF in the
  // browser (used by the admin Data Room View button); default redirects to
  // the investor in-app viewer page.
  const mode = url.searchParams.get('download') === '1'
    ? 'download'
    : url.searchParams.get('inline') === '1'
      ? 'inline'
      : 'view'

  if (mode === 'view') {
    return NextResponse.redirect(new URL(`/investor/documents/${id}/view`, request.url), 302)
  }

  // RLS enforces published + tier visibility for investor role
  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .select('id, pdf_path, title')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (docErr || !doc || !doc.pdf_path) {
    return new NextResponse('Not Found', { status: 404 })
  }

  await supabase.from('investor_document_views').insert({
    document_id: doc.id,
    profile_id: user.id,
    view_type: mode === 'download' ? 'download' : 'view',
  })

  // download -> signed URL with Content-Disposition attachment;
  // inline -> signed URL the browser renders in a tab.
  const signedUrl = mode === 'download'
    ? await getInvestorDocSignedUrl(doc.pdf_path, undefined, `${slugify(doc.title)}.pdf`)
    : await getInvestorDocSignedUrl(doc.pdf_path)
  return NextResponse.redirect(signedUrl, 302)
}
