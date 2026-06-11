import { redirect } from 'next/navigation'
import { FolderOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { tierRank } from '@/lib/investor/tiers'
import { getInvestorDocuments, type InvestorDocument } from '@/lib/queries/investor'
import { PrintButton } from '@/components/investor/print-button'
import { DocActions } from '@/components/investor/doc-actions'

const SECTION_ORDER = [
  'concept', 'strategy', 'market', 'financials',
  'product', 'operations', 'launch', 'legal',
] as const

const SECTION_LABELS: Record<string, string> = {
  concept:    'The Concept',
  strategy:   'Strategy',
  market:     'Market & Competitive',
  financials: 'Financials',
  product:    'Product & Technology',
  operations: 'Operations',
  launch:     'Launch Plan',
  legal:      'Legal & Risk',
  deck:       'Pitch Deck',
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function InvestorDocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileResult, docsResult] = await Promise.all([
    supabase.from('profiles').select('role, investor_tier').eq('id', user.id).maybeSingle(),
    getInvestorDocuments(),
  ])

  const role = profileResult.data?.role
  if (role !== 'investor' && role !== 'admin') redirect('/')

  const tier = profileResult.data?.investor_tier ?? 'prospect'
  if (role === 'investor' && tierRank(tier) < 2) redirect('/investor/presentations')

  const docs = docsResult

  // Group docs by section
  const grouped: Record<string, InvestorDocument[]> = {}
  for (const doc of docs) {
    if (!grouped[doc.section]) grouped[doc.section] = []
    grouped[doc.section].push(doc)
  }

  // Render in fixed section order; skip empty sections
  const orderedSections = SECTION_ORDER.filter(s => (grouped[s]?.length ?? 0) > 0)
  // Also include any sections not in SECTION_ORDER (future-proof)
  const extraSections = Object.keys(grouped).filter(s => !SECTION_ORDER.includes(s as typeof SECTION_ORDER[number]))

  const allSections = [...orderedSections, ...extraSections]

  return (
    <div className="space-y-8 print:space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="font-serif text-3xl font-light">Documents</h1>
        <PrintButton />
      </div>
      <h1 className="hidden print:block font-serif text-3xl font-light">Documents</h1>

      {allSections.length === 0 && (
        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center text-center gap-4">
          <FolderOpen className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">No documents yet</p>
          <p className="text-xs text-muted-foreground/70 max-w-xs">
            Documents will appear here once the data room is populated.
          </p>
        </div>
      )}

      {allSections.map(section => (
        <div key={section} className="space-y-3">
          <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
            {SECTION_LABELS[section] ?? section}
          </h2>
          <div className="space-y-2">
            {grouped[section].map(doc => (
              <div
                key={doc.id}
                className="border border-border rounded-lg bg-card px-5 py-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-serif text-base font-light leading-snug">{doc.title}</p>
                  {doc.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{doc.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground/60 uppercase tracking-wide">
                    {doc.file_type.toUpperCase()}
                    {doc.file_size_bytes ? ` · ${formatBytes(doc.file_size_bytes)}` : ''}
                  </p>
                </div>
                <div className="flex-shrink-0 print:hidden">
                  <DocActions docId={doc.id} title={doc.title} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
