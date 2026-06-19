import { inngest } from '@/lib/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { withSentryCapture } from '@/lib/inngest/with-sentry'
import { marked } from 'marked'
import { buildPdfHtml } from '@/lib/docs/house-style'
import { createPdfRenderer } from '@/lib/docs/pdf-renderer'
import { INVESTOR_BUCKET } from '@/lib/storage/constants'

interface GenerateDocumentPdfEvent {
  data: {
    documentId: string
  }
}

export const generateDocumentPdf = inngest.createFunction(
  {
    id: 'generate-document-pdf',
    triggers: [{ event: 'document/pdf.requested' as never }],
    retries: 3,
  },
  async ({ event }: { event: GenerateDocumentPdfEvent }) => {
    return withSentryCapture(async () => {
      const { documentId } = event.data
      const db = createAdminClient()

      const { data: doc, error: fetchErr } = await db
        .from('documents')
        .select('id, title, body_markdown, source_kind')
        .eq('id', documentId)
        .single()

      if (fetchErr || !doc) throw new Error(`Document not found: ${documentId}`)
      if (doc.source_kind !== 'markdown') return { skipped: true, reason: 'not a markdown document' }
      if (!doc.body_markdown) return { skipped: true, reason: 'no markdown body' }

      const bodyHtml = marked.parse(doc.body_markdown, { gfm: true, breaks: false }) as string
      const html = buildPdfHtml({ title: doc.title, bodyHtml })

      const renderer = createPdfRenderer()
      const pdfBuffer = await renderer.generate(html)

      const storagePath = `documents/${documentId}.pdf`
      const { error: uploadErr } = await db.storage
        .from(INVESTOR_BUCKET)
        .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

      if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

      const { error: updateErr } = await db
        .from('documents')
        .update({
          pdf_path: storagePath,
          pdf_generated_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      if (updateErr) throw new Error(`Failed to update document: ${updateErr.message}`)

      return { documentId, storagePath }
    }, 'generate-document-pdf')
  }
)
