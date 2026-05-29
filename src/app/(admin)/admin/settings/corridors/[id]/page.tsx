import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CorridorEditForm } from '@/components/admin/corridor-edit-form'
import { buttonVariants } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function CorridorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [corridorResult, providersResult, assignmentsResult] = await Promise.all([
    supabase.from('corridors').select('*').eq('id', id).single(),
    supabase.from('providers').select('id, business_name').eq('is_active', true).order('business_name'),
    supabase.from('provider_corridors').select('provider_id, corridor_role').eq('corridor_id', id),
  ])

  if (!corridorResult.data) notFound()

  const corridor = corridorResult.data
  const providers = providersResult.data ?? []
  const assignments = assignmentsResult.data ?? []

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link href="/admin/settings/corridors" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Corridors
        </Link>
      </div>

      <div>
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">Corridor</p>
        <h1 className="font-serif text-3xl font-light">{corridor.display_name}</h1>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          {corridor.origin_region_code} ↔ {corridor.destination_region_code} · /{corridor.slug}
        </p>
      </div>

      <CorridorEditForm
        corridor={corridor}
        providers={providers}
        assignedProviders={assignments as Array<{ provider_id: string; corridor_role: string }>}
      />
    </div>
  )
}
