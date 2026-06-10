#!/usr/bin/env npx tsx
/**
 * Uploads investor documents from supabase/seed/investor-room/ to the
 * private investor-room Supabase Storage bucket and upserts investor_documents rows.
 *
 * Usage:
 *   npx tsx scripts/seed-investor-docs.ts
 *
 * Prerequisites:
 *   - SEED_TOOLS_ENABLED=true in environment
 *   - supabase/seed/investor-room/manifest.json (copy from manifest.example.json and fill in)
 *   - PDF files present in supabase/seed/investor-room/
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment (.env)
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// ── Safety gate ──────────────────────────────────────────────────────────────

if (process.env.SEED_TOOLS_ENABLED !== 'true') {
  console.error('SEED_TOOLS_ENABLED is not set to true. Aborting.')
  process.exit(1)
}

// ── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.')
  process.exit(1)
}

const BUCKET = 'investor-room'
const SEED_DIR = path.resolve(__dirname, '../supabase/seed/investor-room')
const MANIFEST_PATH = path.join(SEED_DIR, 'manifest.json')

// ── Types ────────────────────────────────────────────────────────────────────

interface ManifestEntry {
  file: string
  section: string
  title: string
  description?: string
  sort_order?: number
}

interface Manifest {
  documents: ManifestEntry[]
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`manifest.json not found at ${MANIFEST_PATH}`)
    console.error('Copy manifest.example.json to manifest.json and fill in your documents.')
    process.exit(1)
  }

  const manifest: Manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  const docs = manifest.documents ?? []

  if (docs.length === 0) {
    console.log('No documents in manifest. Nothing to do.')
    return
  }

  const sb = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!)

  let uploaded = 0
  let skipped = 0
  const errors: string[] = []

  for (const entry of docs) {
    const filePath = path.join(SEED_DIR, entry.file)

    if (!fs.existsSync(filePath)) {
      console.warn(`  [skip] File not found: ${entry.file}`)
      skipped++
      continue
    }

    const fileBuffer = fs.readFileSync(filePath)
    const storagePath = `${entry.section}/${entry.file}`
    const ext = path.extname(entry.file).slice(1).toLowerCase() || 'pdf'
    const fileType = ext
    const fileSizeBytes = fileBuffer.length

    // Upload to storage (upsert — safe to re-run)
    const { error: uploadErr } = await sb.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadErr) {
      console.error(`  [error] Upload failed for ${entry.file}: ${uploadErr.message}`)
      errors.push(entry.file)
      continue
    }

    // Upsert investor_documents row (match on storage_path for idempotency)
    const { error: upsertErr } = await sb
      .from('investor_documents')
      .upsert(
        {
          section: entry.section,
          title: entry.title,
          description: entry.description ?? null,
          storage_path: storagePath,
          file_type: fileType,
          file_size_bytes: fileSizeBytes,
          sort_order: entry.sort_order ?? 0,
          is_published: true,
        },
        { onConflict: 'storage_path' }
      )

    if (upsertErr) {
      console.error(`  [error] DB upsert failed for ${entry.file}: ${upsertErr.message}`)
      errors.push(entry.file)
      continue
    }

    console.log(`  [ok] ${storagePath}`)
    uploaded++
  }

  console.log(`\nDone. ${uploaded} uploaded/updated, ${skipped} skipped, ${errors.length} errors.`)
  if (errors.length > 0) {
    console.error('Errors:', errors)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
