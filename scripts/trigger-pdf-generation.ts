/**
 * Fire document/pdf.requested events for all published markdown docs
 * that are missing a pdf_path.
 *
 * Run:
 *   env $(grep -v '^#' .env | xargs) npx tsx scripts/trigger-pdf-generation.ts
 *
 * Or use dotenv-cli:
 *   npx dotenv -e .env -- npx tsx scripts/trigger-pdf-generation.ts
 */

import { createClient } from '@supabase/supabase-js'
import { Inngest } from 'inngest'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!INNGEST_EVENT_KEY) {
  console.error('Missing INNGEST_EVENT_KEY — cannot send events without it')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const inngest = new Inngest({ id: 'luxury-lifestyle-vault' })

async function main() {
  const { data: docs, error } = await db
    .from('documents')
    .select('id, title')
    .eq('status', 'published')
    .eq('source_kind', 'markdown')
    .is('pdf_path', null)

  if (error) throw new Error(`Failed to query documents: ${error.message}`)

  if (!docs || docs.length === 0) {
    console.log('No markdown docs missing PDFs — nothing to do.')
    return
  }

  console.log(`Firing events for ${docs.length} docs…`)

  for (const doc of docs) {
    await inngest.send({ name: 'document/pdf.requested' as never, data: { documentId: doc.id } })
    console.log(`  EVENT  ${doc.title}`)
  }

  console.log(`\nDone. Inngest will generate PDFs asynchronously.`)
  console.log('Check /admin/documents to verify pdf_path is populated after jobs complete.')
}

main().catch(err => { console.error(err); process.exit(1) })
