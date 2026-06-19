'use client'

import { useState } from 'react'
import { Search, X, FolderOpen } from 'lucide-react'
import { DocActions } from '@/components/investor/doc-actions'
import type { PublishedDoc } from '@/lib/queries/documents'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface FilterableDocListProps {
  docs: PublishedDoc[]
}

export function FilterableDocList({ docs }: FilterableDocListProps) {
  const [query, setQuery] = useState('')
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const normalizedQuery = query.trim().toLowerCase()

  // Derive ordered section list from pre-sorted docs (category_sort_order is baked in)
  const sectionOrder: string[] = []
  const sectionLabels: Record<string, string> = {}
  for (const doc of docs) {
    if (!sectionLabels[doc.category_key]) {
      sectionOrder.push(doc.category_key)
      sectionLabels[doc.category_key] = doc.category_label
    }
  }

  // Apply filters
  const filteredDocs = docs.filter(doc => {
    if (activeSection && doc.category_key !== activeSection) return false
    if (normalizedQuery && !doc.title.toLowerCase().includes(normalizedQuery)) return false
    return true
  })

  // Group filtered docs by section (maintain order from sectionOrder)
  const filteredGrouped: Record<string, PublishedDoc[]> = {}
  for (const doc of filteredDocs) {
    if (!filteredGrouped[doc.category_key]) filteredGrouped[doc.category_key] = []
    filteredGrouped[doc.category_key].push(doc)
  }
  const filteredSections = sectionOrder.filter(s => (filteredGrouped[s]?.length ?? 0) > 0)

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

        {sectionOrder.length > 1 && (
          <div className="flex flex-wrap gap-2 items-center">
            {sectionOrder.map(s => (
              <button
                key={s}
                onClick={() => setActiveSection(s === activeSection ? null : s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeSection === s
                    ? 'bg-foreground text-background'
                    : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50'
                }`}
              >
                {sectionLabels[s]}
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
      {sectionOrder.length === 0 && (
        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center text-center gap-4">
          <FolderOpen className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">No documents yet</p>
          <p className="text-xs text-muted-foreground/70 max-w-xs">
            Documents will appear here once the data room is populated.
          </p>
        </div>
      )}

      {/* Empty state — no filter matches */}
      {sectionOrder.length > 0 && filteredSections.length === 0 && (
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
              {sectionLabels[section]}
            </h2>
            <div className="space-y-2">
              {filteredGrouped[section].map(doc => (
                <div
                  key={doc.id}
                  className="border border-border rounded-lg bg-card px-5 py-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-serif text-base font-light leading-snug">{doc.title}</p>
                    <p className="text-xs text-muted-foreground/60 uppercase tracking-wide">
                      PDF
                      {doc.published_at ? ` · ${formatDate(doc.published_at)}` : ''}
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
    </div>
  )
}
