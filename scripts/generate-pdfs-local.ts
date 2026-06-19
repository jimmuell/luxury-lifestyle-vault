/**
 * Generate PDFs for published markdown docs using a local Chrome installation.
 * Does NOT require Inngest or a deployed backend.
 *
 * Run (missing PDFs only):
 *   env $(grep -v '^#' .env | xargs) \
 *     CHROMIUM_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
 *     npx tsx scripts/generate-pdfs-local.ts
 *
 * Force-regenerate all published markdown docs (e.g. after template changes):
 *   ... npx tsx scripts/generate-pdfs-local.ts --force
 */

import { createClient } from '@supabase/supabase-js'
import puppeteer from 'puppeteer-core'
import { marked } from 'marked'
import { buildPdfHtml, PDF_FOOTER_TEMPLATE, PDF_HEADER_TEMPLATE, PDF_MARGIN } from '../src/lib/docs/house-style.js'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CHROME_PATH      = process.env.CHROMIUM_EXECUTABLE_PATH
  ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const FORCE            = process.argv.includes('--force')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

marked.setOptions({ gfm: true, breaks: false })

async function main() {
  let query = db
    .from('documents')
    .select('id, title, body_markdown')
    .eq('status', 'published')
    .eq('source_kind', 'markdown')

  if (!FORCE) {
    query = query.is('pdf_path', null) as typeof query
  }

  const { data: docs, error } = await query

  if (error) throw new Error(`Failed to query documents: ${error.message}`)
  if (!docs || docs.length === 0) {
    console.log('No docs to process — use --force to regenerate existing PDFs.')
    return
  }

  console.log(`Launching Chrome from: ${CHROME_PATH}`)
  console.log(`${FORCE ? 'Force-regenerating' : 'Generating'} PDFs for ${docs.length} docs…\n`)

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  })

  let succeeded = 0, failed = 0

  try {
    for (const doc of docs) {
      if (!doc.body_markdown) {
        console.log(`  SKIP  (no body) ${doc.title}`)
        continue
      }

      try {
        const bodyHtml = marked.parse(doc.body_markdown, { gfm: true, breaks: false }) as string
        const html = buildPdfHtml({ title: doc.title, bodyHtml })

        const page = await browser.newPage()
        await page.setContent(html, { waitUntil: 'load' })
        await page.evaluateHandle('document.fonts.ready')
        const pdfBytes = await page.pdf({
          format: 'Letter',
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: PDF_HEADER_TEMPLATE,
          footerTemplate: PDF_FOOTER_TEMPLATE,
          margin: PDF_MARGIN,
        })
        await page.close()

        const pdfBuffer   = Buffer.from(pdfBytes)
        const storagePath = `documents/${doc.id}.pdf`

        const { error: uploadErr } = await db.storage
          .from('investor-room')
          .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

        if (uploadErr) {
          console.error(`  ERROR  upload failed for "${doc.title}": ${uploadErr.message}`)
          failed++
          continue
        }

        const { error: updateErr } = await db
          .from('documents')
          .update({ pdf_path: storagePath, pdf_generated_at: new Date().toISOString() })
          .eq('id', doc.id)

        if (updateErr) {
          console.error(`  ERROR  db update failed for "${doc.title}": ${updateErr.message}`)
          failed++
          continue
        }

        console.log(`  PDF  ${doc.title}`)
        succeeded++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`  ERROR  "${doc.title}": ${msg}`)
        failed++
      }
    }
  } finally {
    await browser.close()
  }

  console.log(`\nDone: ${succeeded} PDFs generated, ${failed} errors`)
}

main().catch(err => { console.error(err); process.exit(1) })
