import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvestorUpdateDetailPage({ params }: Props) {
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

  // RLS enforces tier-based visibility and published filter
  const { data: update } = await supabase
    .from('investor_updates')
    .select('id, title, body, audience, created_at')
    .eq('is_published', true)
    .eq('id', id)
    .maybeSingle()

  if (!update) notFound()

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link
          href="/investor/updates"
          className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' -ml-2 mb-4 flex items-center gap-2'}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to updates
        </Link>
        <h1 className="font-serif text-3xl font-light leading-snug">{update.title}</h1>
        <p className="text-xs text-muted-foreground mt-2">
          {format(new Date(update.created_at), 'MMMM d, yyyy')}
        </p>
      </div>

      <div className="border border-border rounded-lg bg-card px-6 py-6">
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{update.body}</p>
      </div>
    </div>
  )
}
