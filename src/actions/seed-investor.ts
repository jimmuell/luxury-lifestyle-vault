'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { seedDemoAccounts } from '@/lib/seed/seed-demo-accounts'
import { INVESTOR_DOCS_MANIFEST } from '@/lib/seed/investor-docs-manifest'
import type { SeedResult } from '@/lib/seed/types'

async function guardSeedAction(): Promise<{ error: string } | null> {
  if (process.env.SEED_TOOLS_ENABLED !== 'true') {
    return { error: 'Seed tools are disabled in this environment.' }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }
  return null
}

export async function backfillPresentationTiers(): Promise<
  { ok: true; updated: number; skipped: number; errors: string[] } | { error: string }
> {
  const guard = await guardSeedAction()
  if (guard) return guard

  const admin = createAdminClient()
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const entry of INVESTOR_DOCS_MANIFEST) {
    const { data, error } = await admin
      .from('investor_documents')
      .update({ doc_type: entry.docType, audience: entry.audience })
      .eq('storage_path', entry.storagePath)
      .select('id')

    if (error) {
      errors.push(`${entry.storagePath}: ${error.message}`)
    } else if (data && data.length > 0) {
      updated++
    } else {
      skipped++
    }
  }

  return { ok: true, updated, skipped, errors }
}

export async function runDemoAccountsSeed(): Promise<
  { ok: true } & SeedResult | { error: string }
> {
  const guard = await guardSeedAction()
  if (guard) return guard

  const result = await seedDemoAccounts()
  return { ok: true, ...result }
}
