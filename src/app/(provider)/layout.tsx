import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'provider') redirect('/')

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-8">{children}</div>
    </div>
  )
}
