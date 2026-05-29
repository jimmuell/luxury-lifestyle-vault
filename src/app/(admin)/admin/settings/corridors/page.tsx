import { createClient } from '@/lib/supabase/server'
import { CorridorList } from '@/components/admin/corridor-list'

export default async function CorridorsPage() {
  const supabase = await createClient()
  const { data: corridors } = await supabase
    .from('corridors')
    .select('id, slug, display_name, origin_region_code, destination_region_code, active, sort_order')
    .order('sort_order', { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">Settings</p>
        <h1 className="font-serif text-3xl font-light">Corridors</h1>
      </div>
      <CorridorList corridors={corridors ?? []} />
    </div>
  )
}
