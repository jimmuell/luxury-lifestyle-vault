import { inngest } from '@/lib/inngest/client'
import { withSentryCapture } from '@/lib/inngest/with-sentry'
import { createAdminClient } from '@/lib/supabase/admin'
import { INVESTOR_BUCKET } from '@/lib/storage/constants'
import { processAndMetadataPdf } from '@/actions/admin-documents-pdf'
import {
  createDriveClient,
  CONVERSION_FOLDER_ID,
  ORPHAN_MAX_AGE_MS,
  MIME,
} from '@/lib/drive/client'

// ---------------------------------------------------------------------------
// Orphan sweep — delete temp Docs in "98 Document Conversion" older than 30 min
// ---------------------------------------------------------------------------

async function sweepOrphans() {
  const drive = createDriveClient()
  const cutoff = new Date(Date.now() - ORPHAN_MAX_AGE_MS).toISOString()

  const { data } = await drive.files.list({
    q: `'${CONVERSION_FOLDER_ID}' in parents and createdTime < '${cutoff}' and trashed = false`,
    fields: 'files(id,name,createdTime)',
    pageSize: 50,
  })

  const files = data.files ?? []
  for (const file of files) {
    if (file.id) {
      try {
        await drive.files.delete({ fileId: file.id })
      } catch {
        // best-effort — a file may already be gone
      }
    }
  }
  return files.length
}

// ---------------------------------------------------------------------------
// Per-document sync
// ---------------------------------------------------------------------------

type SyncResult =
  | { result: 'unchanged' }
  | { result: 'synced'; bytes: number; pages: number }
  | { result: 'failed'; message: string }

async function syncOneDocument(docId: string, force: boolean): Promise<SyncResult> {
  const db = createAdminClient()
  const drive = createDriveClient()

  // Load document row
  const { data: doc, error: fetchErr } = await db
    .from('documents')
    .select('id, google_file_id, google_md5_checksum, google_modified_time, strip_first_page, current_version')
    .eq('id', docId)
    .eq('source_type', 'google_drive')
    .single()

  if (fetchErr || !doc?.google_file_id) {
    return { result: 'failed', message: fetchErr?.message ?? 'Document not found or not Drive-linked' }
  }

  const fileId = doc.google_file_id

  // 1. Detect change
  let fileMeta: {
    mimeType?: string | null
    modifiedTime?: string | null
    md5Checksum?: string | null
  }
  try {
    const { data } = await drive.files.get({
      fileId,
      fields: 'id,name,mimeType,modifiedTime,md5Checksum',
    })
    fileMeta = data
  } catch (err) {
    return { result: 'failed', message: `Drive metadata fetch failed: ${String(err)}` }
  }

  const md5Changed = fileMeta.md5Checksum && fileMeta.md5Checksum !== doc.google_md5_checksum
  const modTimeChanged = fileMeta.modifiedTime && fileMeta.modifiedTime !== doc.google_modified_time
  const changed = md5Changed || modTimeChanged || (!fileMeta.md5Checksum && modTimeChanged)

  if (!changed && !force) {
    await db.from('documents').update({ last_checked_at: new Date().toISOString() }).eq('id', docId)
    return { result: 'unchanged' }
  }

  // 2. Mark in-flight
  await db.from('documents').update({
    sync_status: 'syncing',
    last_checked_at: new Date().toISOString(),
  }).eq('id', docId)

  const mimeType = fileMeta.mimeType ?? ''
  let pdfBuffer: Buffer
  let tempDocId: string | null = null

  try {
    // 3. Produce PDF — branch on mimeType
    if (mimeType === MIME.docx) {
      // .docx → temp Google Doc → export → delete temp
      const { data: copied } = await drive.files.copy({
        fileId,
        requestBody: {
          parents: [CONVERSION_FOLDER_ID],
          mimeType: MIME.gDoc,
        },
        fields: 'id',
      })
      tempDocId = copied.id ?? null
      if (!tempDocId) throw new Error('files.copy returned no id')

      const exportRes = await drive.files.export(
        { fileId: tempDocId, mimeType: MIME.pdf },
        { responseType: 'arraybuffer' },
      )
      pdfBuffer = Buffer.from(exportRes.data as ArrayBuffer)

    } else if (mimeType === MIME.pptx) {
      // .pptx → temp Google Slides → export → delete temp
      const { data: copied } = await drive.files.copy({
        fileId,
        requestBody: {
          parents: [CONVERSION_FOLDER_ID],
          mimeType: MIME.gSlides,
        },
        fields: 'id',
      })
      tempDocId = copied.id ?? null
      if (!tempDocId) throw new Error('files.copy returned no id')

      const exportRes = await drive.files.export(
        { fileId: tempDocId, mimeType: MIME.pdf },
        { responseType: 'arraybuffer' },
      )
      pdfBuffer = Buffer.from(exportRes.data as ArrayBuffer)

    } else if (mimeType === MIME.pdf) {
      // External PDF — download directly, no conversion, no strip
      const dlRes = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' },
      )
      pdfBuffer = Buffer.from(dlRes.data as ArrayBuffer)

    } else if (mimeType === MIME.gDoc) {
      // Native Google Doc — export directly (violates house standard; log warning)
      console.warn(`[sync-documents] Document ${docId} has a native Google Doc source — violates .docx house standard (MDS v9 §10)`)
      const exportRes = await drive.files.export(
        { fileId, mimeType: MIME.pdf },
        { responseType: 'arraybuffer' },
      )
      pdfBuffer = Buffer.from(exportRes.data as ArrayBuffer)

    } else {
      throw new Error(`Unsupported Drive mimeType: ${mimeType}`)
    }

  } finally {
    // Always clean up temp Doc regardless of success/failure
    if (tempDocId) {
      try {
        await drive.files.delete({ fileId: tempDocId })
      } catch {
        // best-effort
      }
    }
  }

  // 4. Strip control page (house docs only — not raw PDFs from Drive)
  const shouldStrip = doc.strip_first_page && mimeType !== MIME.pdf
  const { buffer: finalPdf, sha256, fileSize, pageCount } = await processAndMetadataPdf(pdfBuffer, shouldStrip)

  // 5. Upload to storage
  const storagePath = `documents/${docId}/current.pdf`
  const { error: uploadErr } = await createAdminClient().storage
    .from(INVESTOR_BUCKET)
    .upload(storagePath, finalPdf, { contentType: MIME.pdf, upsert: true })

  if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

  // 6. Record success
  await db.from('documents').update({
    google_modified_time: fileMeta.modifiedTime ?? null,
    google_md5_checksum: fileMeta.md5Checksum ?? null,
    sync_status: 'synced',
    last_synced_at: new Date().toISOString(),
    last_checked_at: new Date().toISOString(),
    last_sync_error: null,
    pdf_path: storagePath,
    pdf_sha256: sha256,
    file_size_bytes: fileSize,
    page_count: pageCount,
    pdf_generated_at: new Date().toISOString(),
    current_version: (doc.current_version ?? 1) + 1,
  }).eq('id', docId)

  return { result: 'synced', bytes: fileSize, pages: pageCount }
}

// ---------------------------------------------------------------------------
// Core run logic (shared by cron + manual triggers)
// ---------------------------------------------------------------------------

async function runSync(docIds: string[] | null, trigger: 'cron' | 'manual' | 'manual_all', force: boolean) {
  const db = createAdminClient()
  const now = new Date().toISOString()

  // Orphan sweep before each run
  await sweepOrphans()

  // Insert run row
  const { data: run, error: runErr } = await db
    .from('document_sync_runs')
    .insert({ trigger, started_at: now })
    .select('id')
    .single()

  if (runErr || !run) throw new Error(runErr?.message ?? 'Failed to create sync run')

  const runId = run.id

  // Resolve doc list
  let docs: Array<{ id: string }>
  if (docIds) {
    docs = docIds.map(id => ({ id }))
  } else {
    const { data, error } = await db
      .from('documents')
      .select('id')
      .eq('source_type', 'google_drive')
      .eq('sync_enabled', true)
      .not('google_file_id', 'is', null)
    if (error) throw new Error(error.message)
    docs = data ?? []
  }

  let docsChecked = 0
  let docsSynced = 0
  let docsFailed = 0

  for (const doc of docs) {
    // Skip docs already syncing (guard for <N min)
    const { data: current } = await db
      .from('documents')
      .select('sync_status, last_checked_at')
      .eq('id', doc.id)
      .single()

    if (current?.sync_status === 'syncing' && current.last_checked_at) {
      const age = Date.now() - new Date(current.last_checked_at).getTime()
      if (age < 5 * 60 * 1000) continue // already in-flight < 5 min ago
    }

    docsChecked++
    let syncResult: SyncResult
    try {
      syncResult = await syncOneDocument(doc.id, force)
    } catch (err) {
      syncResult = { result: 'failed', message: String(err) }
      // Update document row to failed state
      await db.from('documents').update({
        sync_status: 'failed',
        last_sync_error: String(err),
        last_checked_at: new Date().toISOString(),
      }).eq('id', doc.id)
    }

    if (syncResult.result === 'synced') docsSynced++
    if (syncResult.result === 'failed') docsFailed++

    // Write sync event
    await db.from('document_sync_events').insert({
      run_id: runId,
      document_id: doc.id,
      result: syncResult.result,
      bytes: syncResult.result === 'synced' ? syncResult.bytes : null,
      pages: syncResult.result === 'synced' ? syncResult.pages : null,
      message: syncResult.result === 'failed' ? syncResult.message : null,
    })
  }

  // Close run row
  await db.from('document_sync_runs').update({
    finished_at: new Date().toISOString(),
    docs_checked: docsChecked,
    docs_synced: docsSynced,
    docs_failed: docsFailed,
  }).eq('id', runId)

  return { runId, docsChecked, docsSynced, docsFailed }
}

// ---------------------------------------------------------------------------
// Inngest function — three triggers
// ---------------------------------------------------------------------------

export const syncDocuments = inngest.createFunction(
  {
    id: 'sync-documents',
    triggers: [
      { cron: '0 9 * * *' },
      { event: 'documents/sync.requested' as never },
      { event: 'documents/sync.requested.all' as never },
    ] as never,
    retries: 2,
  },
  async ({ event }: { event?: { name?: string; data?: { docId?: string; force?: boolean } } }) => {
    return withSentryCapture(async () => {
      const eventName = event?.name ?? ''
      const force = event?.data?.force ?? false

      if (eventName === 'documents/sync.requested') {
        const docId = event?.data?.docId
        if (!docId) throw new Error('documents/sync.requested requires data.docId')
        return runSync([docId], 'manual', force || true)
      }

      if (eventName === 'documents/sync.requested.all') {
        return runSync(null, 'manual_all', force)
      }

      // Cron (or no event name)
      return runSync(null, 'cron', false)
    }, 'sync-documents')
  },
)
