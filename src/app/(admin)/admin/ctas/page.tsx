import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CreateCtaForm, CtaRowActions } from '@/components/admin/cta-forms'

export default async function AdminCtasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: selfProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (selfProfile?.role !== 'admin') redirect('/')

  const admin = createAdminClient()

  const { data: ctas } = await admin
    .from('investor_ctas')
    .select('id, label, action_type, action_value, sort_order, is_active, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-light">Investor CTAs</h1>
        <span className="text-sm text-muted-foreground">
          {(ctas ?? []).length} {(ctas ?? []).length === 1 ? 'button' : 'buttons'}
        </span>
      </div>

      <CreateCtaForm />

      <div className="rounded-lg border border-border overflow-hidden">
        {(ctas ?? []).length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Label</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden md:table-cell">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden lg:table-cell">Value</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden md:table-cell">Order</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {(ctas ?? []).map(cta => (
                <tr key={cta.id} className="hover:bg-muted/30 transition-colors align-top">
                  <td className="px-5 py-4 font-medium">{cta.label}</td>
                  <td className="px-5 py-4 text-muted-foreground capitalize hidden md:table-cell">{cta.action_type}</td>
                  <td className="px-5 py-4 text-muted-foreground text-xs max-w-xs truncate hidden lg:table-cell">
                    {cta.action_value || '—'}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">{cta.sort_order}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      cta.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {cta.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <CtaRowActions
                      id={cta.id}
                      label={cta.label}
                      actionType={cta.action_type}
                      actionValue={cta.action_value}
                      sortOrder={cta.sort_order}
                      isActive={cta.is_active}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No CTAs yet. Use the form above to create one.
          </div>
        )}
      </div>
    </div>
  )
}
