import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { UploadPresentationForm, UpdatePresentationRow } from '@/components/admin/presentation-forms'

export default async function AdminPresentationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: selfProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (selfProfile?.role !== 'admin') redirect('/')

  const admin = createAdminClient()

  const { data: presentations } = await admin
    .from('investor_documents')
    .select('id, title, description, audience, is_published, sort_order, updated_at')
    .eq('doc_type', 'presentation')
    .order('sort_order', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-light">Presentations</h1>
        <span className="text-sm text-muted-foreground">
          {(presentations ?? []).length} presentation{(presentations ?? []).length !== 1 ? 's' : ''}
        </span>
      </div>

      <UploadPresentationForm />

      <div className="rounded-lg border border-border overflow-hidden">
        {(presentations ?? []).length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Title</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden md:table-cell">Audience</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Published</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden lg:table-cell">Sort Order</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden xl:table-cell">Last Updated</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {(presentations ?? []).map(pres => (
                <tr key={pres.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 font-medium">{pres.title}</td>
                  <td className="px-5 py-4 text-muted-foreground capitalize hidden md:table-cell">{pres.audience ?? 'board'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      pres.is_published
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {pres.is_published ? 'Published' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden lg:table-cell">{pres.sort_order}</td>
                  <td className="px-5 py-4 text-muted-foreground text-xs hidden xl:table-cell">
                    {pres.updated_at ? format(new Date(pres.updated_at), 'MMM d, yyyy HH:mm') : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <UpdatePresentationRow
                      id={pres.id}
                      audience={pres.audience ?? 'board'}
                      isPublished={pres.is_published}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No presentations yet. Use the form above to upload one.
          </div>
        )}
      </div>
    </div>
  )
}
