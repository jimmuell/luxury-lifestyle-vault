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
  const isDownload = url.searchParams.get('download') === '1'

  if (!isDownload) {
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

  // TODO: audit logging — investor_document_views references investor_documents;
  // will wire to documents table after Phase 5 retires the old table.

  const filename = `${slugify(doc.title)}.pdf`
  const signedUrl = await getInvestorDocSignedUrl(doc.pdf_path, undefined, filename)
  return NextResponse.redirect(signedUrl, 302)
}
