'use client'

import { useState } from 'react'
import { Search, X, FolderOpen } from 'lucide-react'
import { DocActions } from '@/components/investor/doc-actions'
import type { InvestorDocument } from '@/lib/queries/investor'

const SECTION_ORDER = [
  'concept', 'strategy', 'market', 'financials',
  'product', 'operations', 'launch', 'legal', 'team', 'ip',
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
  team:       'Leadership & Team',
  ip:         'Intellectual Property & Brand',
  deck:       'Pitch Deck',
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function currencyStamp(doc: InvestorDocument): string | null {
  const date = doc.source_revised_at ?? doc.published_at
  if (!date) return null
  const datePart = formatDate(date)
  return doc.source_version ? `As of ${datePart} · ${doc.source_version}` : `As of ${datePart}`
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface FilterableDocListProps {
  docs: InvestorDocument[]
}

export function FilterableDocList({ docs }: FilterableDocListProps) {
  const [query, setQuery] = useState('')
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const normalizedQuery = query.trim().toLowerCase()

  // Determine which sections have documents (preserving fixed + extra ordering)
  const grouped: Record<string, InvestorDocument[]> = {}
  for (const doc of docs) {
    if (!grouped[doc.section]) grouped[doc.section] = []
    grouped[doc.section].push(doc)
  }
  const orderedSections = SECTION_ORDER.filter(s => (grouped[s]?.length ?? 0) > 0)
  const extraSections = Object.keys(grouped).filter(
    s => !SECTION_ORDER.includes(s as typeof SECTION_ORDER[number])
  )
  const allSections = [...orderedSections, ...extraSections]

  // Apply filters
  const filteredDocs = docs.filter(doc => {
    if (activeSection && doc.section !== activeSection) return false
    if (normalizedQuery) {
      const inTitle = doc.title.toLowerCase().includes(normalizedQuery)
      const inDescription = doc.description?.toLowerCase().includes(normalizedQuery) ?? false
      if (!inTitle && !inDescription) return false
    }
    return true
  })

  // Group filtered docs by section in the same order
  const filteredGrouped: Record<string, InvestorDocument[]> = {}
  for (const doc of filteredDocs) {
    if (!filteredGrouped[doc.section]) filteredGrouped[doc.section] = []
    filteredGrouped[doc.section].push(doc)
  }
  const filteredSections = allSections.filter(s => (filteredGrouped[s]?.length ?? 0) > 0)

  const hasActiveFilter = normalizedQuery.length > 0 || activeSection !== null

  function clearFilters() {
    setQuery('')
    setActiveSection(null)
  }

  return (
    <div className="space-y-6">
      {/* Search + section chips */}
      <div className="space-y-3 print:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search documents…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-md border border-border bg-background pl-9 pr-9 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {allSections.length > 1 && (
          <div className="flex flex-wrap gap-2 items-center">
            {allSections.map(s => (
              <button
                key={s}
                onClick={() => setActiveSection(s === activeSection ? null : s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeSection === s
                    ? 'bg-foreground text-background'
                    : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50'
                }`}
              >
                {SECTION_LABELS[s] ?? s}
              </button>
            ))}
            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Empty state — no docs at all */}
      {allSections.length === 0 && (
        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center text-center gap-4">
          <FolderOpen className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">No documents yet</p>
          <p className="text-xs text-muted-foreground/70 max-w-xs">
            Documents will appear here once the data room is populated.
          </p>
        </div>
      )}

      {/* Empty state — no filter matches */}
      {allSections.length > 0 && filteredSections.length === 0 && (
        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center text-center gap-4">
          <Search className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">No documents match your search.</p>
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Document sections */}
      <div className="space-y-8 print:space-y-6">
        {filteredSections.map(section => (
          <div key={section} className="space-y-3">
            <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
              {SECTION_LABELS[section] ?? section}
            </h2>
            <div className="space-y-2">
              {filteredGrouped[section].map(doc => (
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
                    {currencyStamp(doc) && (
                      <p className="font-serif text-xs text-muted-foreground/50 italic">
                        {currencyStamp(doc)}
                      </p>
                    )}
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
    </div>
  )
}
