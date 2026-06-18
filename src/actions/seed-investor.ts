'use server'

import fs from 'fs'
import path from 'path'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { seedDemoAccounts } from '@/lib/seed/seed-demo-accounts'
import type { SeedResult } from '@/lib/seed/types'

interface ManifestEntry {
  file: string
  section: string
  doc_type?: string
  audience?: string
}

function readManifest(): ManifestEntry[] {
  const manifestPath = path.resolve(process.cwd(), 'supabase/seed/investor-room/manifest.json')
  try {
    const raw = fs.readFileSync(manifestPath, 'utf-8')
    const parsed = JSON.parse(raw) as { documents?: ManifestEntry[] }
    return parsed.documents ?? []
  } catch {
    throw new Error('manifest.json not found — ensure it exists in supabase/seed/investor-room/ with SEED_TOOLS_ENABLED=true')
  }
}

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

  const entries = readManifest()
  const admin = createAdminClient()
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const entry of entries) {
    const storagePath = `${entry.section}/${entry.file}`
    const { data, error } = await admin
      .from('investor_documents')
      .update({ doc_type: entry.doc_type ?? 'document', audience: entry.audience ?? 'board' })
      .eq('storage_path', storagePath)
      .select('id')

    if (error) {
      errors.push(`${storagePath}: ${error.message}`)
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
