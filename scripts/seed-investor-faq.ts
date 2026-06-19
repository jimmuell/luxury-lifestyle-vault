#!/usr/bin/env npx tsx
/**
 * Investor FAQ seeder — idempotent upsert by question text.
 *
 * Usage:
 *   npx tsx scripts/seed-investor-faq.ts
 *
 * Prerequisites:
 *   SEED_TOOLS_ENABLED=true, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   supabase/seed/investor-faq.json present
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

if (process.env.SEED_TOOLS_ENABLED !== 'true') {
  console.error('SEED_TOOLS_ENABLED is not set to true. Aborting.')
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

interface FaqEntry {
  question: string
  answer: string
  audience: string
  sort_order: number
  is_published: boolean
}

const COL = { PATH: 50, ACTION: 10 }
const line = (q: string, action: string) =>
  `  ${q.slice(0, COL.PATH).padEnd(COL.PATH)}  ${action}`

async function main() {
  const manifestPath = path.resolve(process.cwd(), 'supabase/seed/investor-faq.json')
  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as { faq: FaqEntry[] }
  const entries = raw.faq

  const { data: existing, error: fetchError } = await sb
    .from('investor_faq')
    .select('id, question, answer, audience, sort_order, is_published')

  if (fetchError) {
    console.error('Failed to fetch existing FAQ rows:', fetchError.message)
    process.exit(1)
  }

  const byQuestion = new Map((existing ?? []).map(r => [r.question, r]))

  let inserted = 0
  let updated = 0
  let unchanged = 0

  console.log('\nInvestor FAQ Seeder\n')
  console.log(`  ${'QUESTION'.padEnd(COL.PATH)}  ACTION`)
  console.log(`  ${'─'.repeat(COL.PATH + 2 + COL.ACTION)}`)

  for (const entry of entries) {
    const row = byQuestion.get(entry.question)

    if (!row) {
      const { error } = await sb.from('investor_faq').insert({
        question:     entry.question,
        answer:       entry.answer,
        audience:     entry.audience,
        sort_order:   entry.sort_order,
        is_published: entry.is_published,
      })
      if (error) {
        console.log(line(entry.question, 'ERROR') + `  ${error.message}`)
      } else {
        console.log(line(entry.question, '+ INSERT'))
        inserted++
      }
      continue
    }

    const needsUpdate =
      row.answer       !== entry.answer       ||
      row.audience     !== entry.audience     ||
      row.sort_order   !== entry.sort_order   ||
      row.is_published !== entry.is_published

    if (!needsUpdate) {
      console.log(line(entry.question, '  UNCHANGED'))
      unchanged++
      continue
    }

    const { error } = await sb
      .from('investor_faq')
      .update({
        answer:       entry.answer,
        audience:     entry.audience,
        sort_order:   entry.sort_order,
        is_published: entry.is_published,
      })
      .eq('id', row.id)

    if (error) {
      console.log(line(entry.question, 'ERROR') + `  ${error.message}`)
    } else {
      console.log(line(entry.question, '  UPDATE'))
      updated++
    }
  }

  console.log(`\n  ${inserted} inserted, ${updated} updated, ${unchanged} unchanged\n`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
