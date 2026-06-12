import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'

export default async function InvestorUpdatesPage() {
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

  // RLS automatically filters updates to those the user's tier can see.
  const { data: updates } = await supabase
    .from('investor_updates')
    .select('id, title, body, audience, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const items = updates ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light">Investor Updates</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Latest news and updates from the Luxury Lifestyle Vault team.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center text-center gap-4">
          <Newspaper className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">No updates yet</p>
          <p className="text-xs text-muted-foreground/70 max-w-xs">
            Investor updates will appear here once they are published.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(update => {
            const excerpt = update.body.length > 200
              ? update.body.slice(0, 200).trimEnd() + '…'
              : update.body
            return (
              <Link
                key={update.id}
                href={`/investor/updates/${update.id}`}
                className="block border border-border rounded-lg bg-card px-6 py-5 space-y-2 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-serif text-base font-light leading-snug">{update.title}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
                    {format(new Date(update.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{excerpt}</p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
