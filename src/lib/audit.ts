import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/types/database'

export interface AuditParams {
  actorId: string
  action: string
  entityType: string
  entityId?: string
  beforeState?: Record<string, unknown> | null
  afterState?: Record<string, unknown> | null
  metadata?: Record<string, unknown>
}

export async function recordAuditEntry(params: AuditParams): Promise<void> {
  const db = createAdminClient()
  await db.from('admin_audit_log').insert({
    actor_id: params.actorId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    before_state: (params.beforeState ?? null) as Json | null,
    after_state: (params.afterState ?? null) as Json | null,
    metadata: (params.metadata ?? {}) as Json,
  })
}
