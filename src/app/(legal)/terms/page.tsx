import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import { parseLegalMarkdown } from '@/lib/legal/parse-markdown'
import { LegalContent } from '@/lib/legal/render-legal-content'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Terms of Service — Luxury Lifestyle Vault',
  description: 'Review the Terms of Service for Luxury Lifestyle Vault.',
}

export default function TermsPage() {
  const filePath = path.join(process.cwd(), 'docs/legal/llv_terms_of_service_2026-06-06.md')
  const content = fs.readFileSync(filePath, 'utf-8')
  const nodes = parseLegalMarkdown(content)
  return <LegalContent nodes={nodes} />
}
