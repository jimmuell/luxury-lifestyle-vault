/**
 * Phase 5 seed: insert 22 documents from supabase/seed/documents/ into the
 * documents table, fire PDF-generation Inngest events for markdown docs, and
 * upload local PDFs for upload-kind docs.
 *
 * Idempotent: skips any doc whose title already exists in the same category.
 *
 * Run:
 *   env $(grep -v '^#' .env | xargs) npx tsx scripts/seed-documents.ts
 *
 * For PDF generation you need Inngest reachable (either local `inngest-cli dev`
 * or the production INNGEST_EVENT_KEY pointing to the Vercel deployment).
 */

import { createClient } from '@supabase/supabase-js'
import { Inngest } from 'inngest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface DocEntry {
  key:         string
  title:       string
  category:    string
  audience:    string
  doc_type:    string
  source_kind: 'markdown' | 'upload'
  sort_order:  number
  status:      string
  md_file?:    string
  pdf_file?:   string
}

const SUPABASE_URL        = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY!
const INNGEST_EVENT_KEY   = process.env.INNGEST_EVENT_KEY
const INNGEST_BASE_URL    = process.env.INNGEST_BASE_URL  // set to local CLI URL if testing locally

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const inngest = new Inngest({
  id: 'luxury-lifestyle-vault',
  ...(INNGEST_BASE_URL ? { baseUrl: INNGEST_BASE_URL } : {}),
})

const SEED_ROOT = join(process.cwd(), 'supabase', 'seed')

async function main() {
  const { documents } = JSON.parse(
    readFileSync(join(SEED_ROOT, 'documents', 'documents.json'), 'utf-8')
  ) as { documents: DocEntry[] }

  // Category key → id map
  const { data: cats, error: catErr } = await db.from('categories').select('id, key')
  if (catErr) throw new Error(`Failed to load categories: ${catErr.message}`)
  const catMap = new Map((cats ?? []).map(c => [c.key, c.id]))

  let inserted = 0, skipped = 0, errors = 0

  for (const entry of documents) {
    const categoryId = catMap.get(entry.category)
    if (!categoryId) {
      console.error(`  SKIP  no category for key="${entry.category}" — ${entry.title}`)
      errors++
      continue
    }

    // Idempotency: skip if title + category already exists
    const { data: existing } = await db
      .from('documents')
      .select('id')
      .eq('title', entry.title)
      .eq('category_id', categoryId)
      .maybeSingle()

    if (existing) {
      console.log(`  SKIP  (exists) ${entry.title}`)
      skipped++
      continue
    }

    const now = new Date().toISOString()

    if (entry.source_kind === 'markdown') {
      const mdPath = join(SEED_ROOT, entry.md_file!)
      if (!existsSync(mdPath)) {
        console.error(`  SKIP  .md file not found: ${mdPath}`)
        errors++
        continue
      }
      const body = readFileSync(mdPath, 'utf-8')

      const { data: doc, error: insertErr } = await db
        .from('documents')
        .insert({
          title:           entry.title,
          category_id:     categoryId,
          audience:        entry.audience,
          doc_type:        entry.doc_type,
          source_kind:     'markdown',
          body_markdown:   body,
          sort_order:      entry.sort_order,
          status:          'published',
          published_at:    now,
          current_version: 1,
        })
        .select('id')
        .single()

      if (insertErr || !doc) {
        console.error(`  ERROR inserting ${entry.title}: ${insertErr?.message}`)
        errors++
        continue
      }

      await db.from('document_versions').insert({
        document_id:   doc.id,
        version_no:    1,
        body_markdown: body,
        title:         entry.title,
        category_id:   categoryId,
        audience:      entry.audience,
        created_by:    null,
      })

      if (INNGEST_EVENT_KEY) {
        await inngest.send({ name: 'document/pdf.requested' as never, data: { documentId: doc.id } })
        console.log(`  INSERT + EVENT  ${entry.title}`)
      } else {
        console.log(`  INSERT (no INNGEST_EVENT_KEY — PDF pending manual trigger)  ${entry.title}`)
      }
      inserted++

    } else {
      // upload-kind: copy local PDF to storage
      const pdfKey  = entry.pdf_file!.replace('investor-room/', '')
      const pdfPath = join(SEED_ROOT, 'investor-room', pdfKey)

      if (!existsSync(pdfPath)) {
        console.error(`  SKIP  PDF file not found: ${pdfPath}`)
        errors++
        continue
      }

      const { data: doc, error: insertErr } = await db
        .from('documents')
        .insert({
          title:           entry.title,
          category_id:     categoryId,
          audience:        entry.audience,
          doc_type:        entry.doc_type,
          source_kind:     'upload',
          body_markdown:   null,
          sort_order:      entry.sort_order,
          status:          'published',
          published_at:    now,
          current_version: 1,
        })
        .select('id')
        .single()

      if (insertErr || !doc) {
        console.error(`  ERROR inserting ${entry.title}: ${insertErr?.message}`)
        errors++
        continue
      }

      const pdfBuffer  = readFileSync(pdfPath)
      const storagePath = `documents/${doc.id}.pdf`

      const { error: uploadErr } = await db.storage
        .from('investor-room')
        .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

      if (uploadErr) {
        console.error(`  ERROR uploading PDF for ${entry.title}: ${uploadErr.message}`)
        // Row exists but without pdf_path — mark error so operator can retry
        errors++
        continue
      }

      await db.from('documents').update({
        pdf_path:         storagePath,
        pdf_generated_at: now,
      }).eq('id', doc.id)

      console.log(`  INSERT + PDF  ${entry.title}`)
      inserted++
    }
  }

  console.log(`\nSeed complete: ${inserted} inserted, ${skipped} skipped, ${errors} errors`)
  if (!INNGEST_EVENT_KEY && inserted > 0) {
    console.log('\nNote: INNGEST_EVENT_KEY not set. Markdown docs are published but PDFs have not')
    console.log('been requested. To generate PDFs, either:')
    console.log('  1. Re-run with INNGEST_EVENT_KEY set in .env')
    console.log('  2. Use the admin UI — open each doc and click Unpublish, then Publish')
  }
}

main().catch(err => { console.error(err); process.exit(1) })
