import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import { parseLegalMarkdown } from '@/lib/legal/parse-markdown'
import { LegalContent } from '@/lib/legal/render-legal-content'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Privacy Policy — Luxury Lifestyle Vault',
  description: 'Review the Privacy Policy for Luxury Lifestyle Vault.',
}

export default function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'docs/legal/llv_privacy_policy_2026-06-06.md')
  const content = fs.readFileSync(filePath, 'utf-8')
  const nodes = parseLegalMarkdown(content)
  return <LegalContent nodes={nodes} />
}
