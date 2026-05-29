import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { objectsToCsv, csvResponse } from '@/lib/csv/export'
import { format } from 'date-fns'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const url = new URL(request.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const entityType = url.searchParams.get('entity_type')

  const db = createAdminClient()
  let query = db
    .from('admin_audit_log')
    .select('created_at, actor_id, action, entity_type, entity_id, before_state, after_state, metadata, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(5000)

  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)
  if (entityType) query = query.eq('entity_type', entityType)

  const { data: rows } = await query
  const csvRows = (rows ?? []).map(r => {
    const actor = r.profiles as { full_name: string | null; email: string } | null
    return {
      timestamp: format(new Date(r.created_at), 'yyyy-MM-dd HH:mm:ss'),
      actor: actor?.full_name ?? actor?.email ?? r.actor_id,
      action: r.action,
      entity_type: r.entity_type,
      entity_id: r.entity_id ?? '',
      before: r.before_state ? JSON.stringify(r.before_state) : '',
      after: r.after_state ? JSON.stringify(r.after_state) : '',
    }
  })

  const filename = `llv-audit-${format(new Date(), 'yyyy-MM-dd')}.csv`
  return csvResponse(objectsToCsv(csvRows as unknown as Record<string, unknown>[]), filename)
}
