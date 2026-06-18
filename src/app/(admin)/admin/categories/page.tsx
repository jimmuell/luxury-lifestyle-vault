import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CategoryManager } from '@/components/admin/category-manager'
import { AdminLoadError } from '@/components/admin/load-error'

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: selfProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (selfProfile?.role !== 'admin') redirect('/')

  const admin = createAdminClient()
  const { data: categories, error } = await admin
    .from('categories')
    .select('id, key, label, sort_order, is_active')
    .order('sort_order', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Room section groupings — adding a category creates a new section automatically.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {(categories ?? []).filter(c => c.is_active).length} active
        </span>
      </div>

      {error ? (
        <AdminLoadError area="categories" message={error.message} />
      ) : (
        <CategoryManager categories={categories ?? []} />
      )}
    </div>
  )
}
