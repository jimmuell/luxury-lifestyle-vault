import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvestorPresentationViewerPage({ params }: Props) {
  const { id } = await params

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

  const { data: doc } = await supabase
    .from('investor_documents')
    .select('id, title')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle()

  if (!doc) redirect('/investor/presentations')

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-light">{doc.title}</h1>
      <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center text-center gap-4">
        <p className="text-sm text-muted-foreground">Viewer loading&hellip;</p>
        <p className="text-xs text-muted-foreground/70">
          The full presentation viewer will be available shortly.
        </p>
      </div>
    </div>
  )
}
