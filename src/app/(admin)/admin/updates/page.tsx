import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { CreateUpdateForm, UpdateRowActions } from '@/components/admin/update-forms'

export default async function AdminUpdatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: selfProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (selfProfile?.role !== 'admin') redirect('/')

  const admin = createAdminClient()

  const { data: updates } = await admin
    .from('investor_updates')
    .select('id, title, body, audience, is_published, sent_at, created_at, updated_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-light">Investor Updates</h1>
        <span className="text-sm text-muted-foreground">
          {(updates ?? []).length} {(updates ?? []).length === 1 ? 'update' : 'updates'}
        </span>
      </div>

      <CreateUpdateForm />

      <div className="rounded-lg border border-border overflow-hidden">
        {(updates ?? []).length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Title</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden md:table-cell">Audience</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Published</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden lg:table-cell">Notified</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden xl:table-cell">Updated</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {(updates ?? []).map(update => (
                <tr key={update.id} className="hover:bg-muted/30 transition-colors align-top">
                  <td className="px-5 py-4 max-w-xs">
                    <p className="font-medium leading-snug">{update.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{update.body}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground capitalize hidden md:table-cell">{update.audience}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      update.is_published
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {update.is_published ? 'Published' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground text-xs hidden lg:table-cell">
                    {update.sent_at ? format(new Date(update.sent_at), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground text-xs hidden xl:table-cell">
                    {update.updated_at ? format(new Date(update.updated_at), 'MMM d, yyyy HH:mm') : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <UpdateRowActions
                      id={update.id}
                      title={update.title}
                      body={update.body}
                      audience={update.audience}
                      isPublished={update.is_published}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No updates yet. Use the form above to create one.
          </div>
        )}
      </div>
    </div>
  )
}
