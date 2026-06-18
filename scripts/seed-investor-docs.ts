#!/usr/bin/env npx tsx
/**
 * Data Room Publisher — unified publish + drift-check pipeline.
 *
 * Usage:
 *   npx tsx scripts/seed-investor-docs.ts [--publish | --check | --reconcile]
 *
 *   --publish   (default) Upload PDFs + stamp provenance. Soft-prunes removed entries.
 *   --check     Dry run. Reports ADD/UPDATE/PRUNE/UNCHANGED/DRIFT. Exits non-zero on drift/error.
 *   --reconcile Runs Cowork-side (has Drive access). Stub here — see §C / llv-daily-doc-audit.
 *
 * Prerequisites:
 *   SEED_TOOLS_ENABLED=true, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   PDFs in supabase/seed/investor-room/; manifest.json filled in.
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// ── Safety gate ───────────────────────────────────────────────────────────────

if (process.env.SEED_TOOLS_ENABLED !== 'true') {
  console.error('SEED_TOOLS_ENABLED is not set to true. Aborting.')
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.')
  process.exit(1)
}

// ── Config ────────────────────────────────────────────────────────────────────

const BUCKET = 'investor-room'
const SEED_DIR = path.resolve(__dirname, '../supabase/seed/investor-room')
const MANIFEST_PATH = path.join(SEED_DIR, 'manifest.json')

// ── Arg parsing ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
type Mode = 'publish' | 'check' | 'reconcile'
const mode: Mode = args.includes('--reconcile')
  ? 'reconcile'
  : args.includes('--check')
    ? 'check'
    : 'publish'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ManifestSource {
  system: 'drive' | 'repo' | 'external'
  ref?: string | null
  name?: string | null
  version?: string | null
  revised_at?: string | null
  text_sha256?: string | null
}

interface ManifestEntry {
  file: string
  section: string
  title: string
  description?: string | null
  sort_order?: number
  doc_type?: string
  audience?: string
  source?: ManifestSource
}

interface Manifest {
  documents: ManifestEntry[]
}

interface ExistingDoc {
  id: string
  storage_path: string
  title: string
  description: string | null
  section: string
  sort_order: number
  doc_type: string
  audience: string
  is_published: boolean
  content_sha256: string | null
  source_system: string | null
  source_ref: string | null
  source_name: string | null
  source_version: string | null
  source_revised_at: string | null
}

type DocAction = 'ADD' | 'UPDATE' | 'UNCHANGED' | 'DRIFT' | 'PRUNE' | 'ERROR'

interface DocReport {
  action: DocAction
  path: string
  title: string
  detail?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sha256hex(input: Buffer | string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

// Normalized source text fingerprint: lowercase → keep only [a-z0-9] → SHA-256.
// For external sources, hash the local PDF bytes directly.
function computeFingerprint(entry: ManifestEntry): string | null {
  const src = entry.source
  if (!src) return null
  if (src.system === 'external') {
    const filePath = path.join(SEED_DIR, entry.file)
    if (!fs.existsSync(filePath)) return null
    return sha256hex(fs.readFileSync(filePath))
  }
  return src.text_sha256 ?? null
}

function isUnchanged(entry: ManifestEntry, existing: ExistingDoc, newFingerprint: string | null): boolean {
  if (!existing.is_published) return false
  // If both sides have a hash and they differ → DRIFT (not UNCHANGED)
  if (newFingerprint !== null && existing.content_sha256 !== null && newFingerprint !== existing.content_sha256) return false
  // If we're stamping a fingerprint for the first time → UPDATE
  if (newFingerprint !== null && existing.content_sha256 === null) return false
  const src = entry.source ?? null
  return (
    existing.title         === entry.title &&
    existing.description   === (entry.description ?? null) &&
    existing.section       === entry.section &&
    existing.sort_order    === (entry.sort_order ?? 0) &&
    existing.doc_type      === (entry.doc_type ?? 'document') &&
    existing.audience      === (entry.audience ?? 'board') &&
    existing.source_system === (src?.system ?? null) &&
    existing.source_ref    === (src?.ref ?? null) &&
    existing.source_name   === (src?.name ?? null) &&
    existing.source_version === (src?.version ?? null) &&
    existing.source_revised_at === (src?.revised_at ?? null)
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // §C lives on the Cowork side (needs Drive access); the Node script stubs it.
  if (mode === 'reconcile') {
    console.log('--reconcile runs on the Cowork side as part of llv-daily-doc-audit.')
    console.log('It requires Google Drive access to recompute source fingerprints.')
    console.log('The Cowork pipeline calls the DB status fields + Inngest notify-dataroom-drift.')
    process.exit(0)
  }

  console.log(`\nData Room Publisher — mode: --${mode}\n`)

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

  // Fetch all current investor_documents rows
  const { data: existingRows, error: fetchErr } = await sb
    .from('investor_documents')
    .select('id, storage_path, title, description, section, sort_order, doc_type, audience, is_published, content_sha256, source_system, source_ref, source_name, source_version, source_revised_at')

  if (fetchErr) {
    console.error('Failed to fetch existing documents:', fetchErr.message)
    process.exit(1)
  }

  const manifestPaths = new Set(docs.map(e => `${e.section}/${e.file}`))
  const dbByPath = new Map<string, ExistingDoc>()
  for (const row of (existingRows ?? []) as ExistingDoc[]) {
    dbByPath.set(row.storage_path, row)
  }

  const report: DocReport[] = []
  const counts = { published: 0, updated: 0, pruned: 0, unchanged: 0, drift: 0, errors: 0 }

  // ── Process manifest entries ──────────────────────────────────────────────

  for (const entry of docs) {
    const storagePath = `${entry.section}/${entry.file}`
    const filePath = path.join(SEED_DIR, entry.file)
    const existing = dbByPath.get(storagePath)
    const fingerprint = computeFingerprint(entry)

    if (!fs.existsSync(filePath)) {
      report.push({ action: 'ERROR', path: storagePath, title: entry.title, detail: 'Local file not found in seed dir' })
      counts.errors++
      continue
    }

    // Classify action
    let action: DocAction
    if (!existing) {
      action = 'ADD'
    } else if (
      fingerprint !== null &&
      existing.content_sha256 !== null &&
      fingerprint !== existing.content_sha256
    ) {
      action = 'DRIFT'
    } else if (isUnchanged(entry, existing, fingerprint)) {
      action = 'UNCHANGED'
    } else {
      action = 'UPDATE'
    }

    const detail = action === 'DRIFT'
      ? `stored: ${(existing?.content_sha256 ?? '').slice(0, 8)}… → new: ${fingerprint?.slice(0, 8)}…`
      : undefined

    report.push({ action, path: storagePath, title: entry.title, detail })

    if (mode === 'check') continue
    if (action === 'UNCHANGED') { counts.unchanged++; continue }

    const fileBuffer = fs.readFileSync(filePath)
    const ext = path.extname(entry.file).slice(1).toLowerCase() || 'pdf'
    const src = entry.source ?? null
    const now = new Date().toISOString()
    const contentStatus = fingerprint ? 'current' : 'unverified'

    // Upload to storage (upsert — safe to re-run)
    const { error: uploadErr } = await sb.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, { contentType: 'application/pdf', upsert: true })

    if (uploadErr) {
      console.error(`  [error] Upload failed for ${storagePath}: ${uploadErr.message}`)
      counts.errors++
      continue
    }

    const { error: upsertErr } = await sb
      .from('investor_documents')
      .upsert(
        {
          section:             entry.section,
          title:               entry.title,
          description:         entry.description ?? null,
          storage_path:        storagePath,
          file_type:           ext,
          file_size_bytes:     fileBuffer.length,
          sort_order:          entry.sort_order ?? 0,
          is_published:        true,
          doc_type:            entry.doc_type ?? 'document',
          audience:            entry.audience ?? 'board',
          source_system:       src?.system ?? null,
          source_ref:          src?.ref ?? null,
          source_name:         src?.name ?? null,
          source_version:      src?.version ?? null,
          source_revised_at:   src?.revised_at ?? null,
          content_sha256:      fingerprint,
          content_status:      contentStatus,
          published_at:        now,
          published_by:        'cowork-pipeline',
          last_reconciled_at:  fingerprint ? now : null,
        },
        { onConflict: 'storage_path' }
      )

    if (upsertErr) {
      console.error(`  [error] DB upsert failed for ${storagePath}: ${upsertErr.message}`)
      counts.errors++
      continue
    }

    if (action === 'ADD')        counts.published++
    else if (action === 'DRIFT') counts.drift++
    else                         counts.updated++
  }

  // ── Prune: soft-unpublish docs in DB but missing from manifest ────────────

  for (const [dbPath, dbDoc] of dbByPath.entries()) {
    if (manifestPaths.has(dbPath)) continue
    if (!dbDoc.is_published) continue

    report.push({ action: 'PRUNE', path: dbPath, title: dbDoc.title })

    if (mode === 'check') continue

    const { error } = await sb
      .from('investor_documents')
      .update({ is_published: false })
      .eq('id', dbDoc.id)

    if (error) {
      console.error(`  [error] Prune failed for ${dbPath}: ${error.message}`)
      counts.errors++
    } else {
      counts.pruned++
    }
  }

  // ── Print report ──────────────────────────────────────────────────────────

  const COL_PATH = 50
  const COL_ACT  = 12
  console.log(`  ${'PATH'.padEnd(COL_PATH)} ${'ACTION'.padEnd(COL_ACT)} DETAIL`)
  console.log('  ' + '─'.repeat(85))
  for (const r of report) {
    const marker = r.action === 'ERROR' ? '✗' : r.action === 'DRIFT' ? '!' : r.action === 'PRUNE' ? '-' : r.action === 'ADD' ? '+' : ' '
    console.log(`  ${r.path.padEnd(COL_PATH)} ${(marker + ' ' + r.action).padEnd(COL_ACT)} ${r.detail ?? ''}`)
  }

  // Tally check-mode counts from report
  if (mode === 'check') {
    for (const r of report) {
      if      (r.action === 'ADD')       counts.published++
      else if (r.action === 'UPDATE')    counts.updated++
      else if (r.action === 'PRUNE')     counts.pruned++
      else if (r.action === 'UNCHANGED') counts.unchanged++
      else if (r.action === 'DRIFT')     counts.drift++
      // errors already counted inline
    }
  }

  console.log(
    `\n  ${counts.published} published, ${counts.updated} updated, ${counts.pruned} pruned, ` +
    `${counts.unchanged} unchanged, ${counts.drift} drift, ${counts.errors} errors`
  )

  if (mode === 'check') {
    if (counts.drift > 0 || counts.errors > 0) {
      console.log('\n  ✗ Check failed: unexpected drift or errors detected. Do not publish.')
      process.exit(1)
    }
    console.log('\n  ✓ Check passed — safe to publish.')
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
