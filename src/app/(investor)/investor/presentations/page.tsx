import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Presentation } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function InvestorPresentationsPage() {
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

  const { data: presentations } = await supabase
    .from('investor_documents')
    .select('id, title, description')
    .eq('doc_type', 'presentation')
    .eq('is_published', true)
    .order('sort_order')

  const docs = presentations ?? []

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-light">Presentations</h1>

      {docs.length === 0 ? (
        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center text-center gap-4">
          <Presentation className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">No presentations yet</p>
          <p className="text-xs text-muted-foreground/70 max-w-xs">
            Presentations will appear here once they have been uploaded to the data room.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <div
              key={doc.id}
              className="border border-border rounded-lg bg-card px-5 py-4 flex items-start justify-between gap-4"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-serif text-base font-light leading-snug">{doc.title}</p>
                {doc.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{doc.description}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                <Link
                  href={`/investor/presentations/${doc.id}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
