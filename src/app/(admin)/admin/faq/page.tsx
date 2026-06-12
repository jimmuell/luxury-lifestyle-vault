import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { CreateFaqForm, FaqRowActions } from '@/components/admin/faq-forms'

export default async function AdminFaqPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: selfProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (selfProfile?.role !== 'admin') redirect('/')

  const admin = createAdminClient()

  const { data: entries } = await admin
    .from('investor_faq')
    .select('id, question, answer, audience, sort_order, is_published, updated_at')
    .order('audience', { ascending: true })
    .order('sort_order', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-light">Investor FAQ</h1>
        <span className="text-sm text-muted-foreground">
          {(entries ?? []).length} {(entries ?? []).length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <CreateFaqForm />

      <div className="rounded-lg border border-border overflow-hidden">
        {(entries ?? []).length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Question</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden md:table-cell">Audience</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Published</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden lg:table-cell">Sort</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden xl:table-cell">Updated</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {(entries ?? []).map(entry => (
                <tr key={entry.id} className="hover:bg-muted/30 transition-colors align-top">
                  <td className="px-5 py-4 max-w-xs">
                    <p className="font-medium leading-snug">{entry.question}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{entry.answer}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground capitalize hidden md:table-cell">{entry.audience}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      entry.is_published
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {entry.is_published ? 'Published' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden lg:table-cell">{entry.sort_order}</td>
                  <td className="px-5 py-4 text-muted-foreground text-xs hidden xl:table-cell">
                    {entry.updated_at ? format(new Date(entry.updated_at), 'MMM d, yyyy HH:mm') : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <FaqRowActions
                      id={entry.id}
                      question={entry.question}
                      answer={entry.answer}
                      audience={entry.audience}
                      sortOrder={entry.sort_order}
                      isPublished={entry.is_published}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No FAQ entries yet. Use the form above to add one.
          </div>
        )}
      </div>
    </div>
  )
}
