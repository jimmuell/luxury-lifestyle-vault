import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ChevronLeft } from 'lucide-react'
import { DocumentEditor } from '@/components/admin/document-editor'
import { AdminLoadError } from '@/components/admin/load-error'

export default async function NewDocumentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: selfProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (selfProfile?.role !== 'admin') redirect('/')

  const admin = createAdminClient()
  const { data: categories, error } = await admin
    .from('categories')
    .select('id, key, label')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) return <AdminLoadError area="categories" message={error.message} />

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/documents" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-serif text-3xl font-light">New Document</h1>
      </div>

      <DocumentEditor categories={categories ?? []} />
    </div>
  )
}
