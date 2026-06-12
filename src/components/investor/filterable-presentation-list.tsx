'use client'

import { useState } from 'react'
import { Search, X, Presentation } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

interface PresentationDoc {
  id: string
  title: string
  description: string | null
}

interface FilterablePresentationListProps {
  docs: PresentationDoc[]
}

export function FilterablePresentationList({ docs }: FilterablePresentationListProps) {
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLowerCase()

  const filtered = normalizedQuery
    ? docs.filter(doc => {
        const inTitle = doc.title.toLowerCase().includes(normalizedQuery)
        const inDescription = doc.description?.toLowerCase().includes(normalizedQuery) ?? false
        return inTitle || inDescription
      })
    : docs

  return (
    <div className="space-y-4">
      {/* Search box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Search presentations…"
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

      {/* Empty state — no docs at all */}
      {docs.length === 0 && (
        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center text-center gap-4">
          <Presentation className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">No presentations yet</p>
          <p className="text-xs text-muted-foreground/70 max-w-xs">
            Presentations will appear here once they have been uploaded to the data room.
          </p>
        </div>
      )}

      {/* Empty state — no filter matches */}
      {docs.length > 0 && filtered.length === 0 && (
        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center text-center gap-4">
          <Search className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">No presentations match your search.</p>
          <button
            onClick={() => setQuery('')}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Presentation list */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(doc => (
            <div
              key={doc.id}
              className="border border-border rounded-lg bg-card px-5 py-4 flex items-start justify-between gap-4"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-serif text-base font-light leading-snug">{doc.title}</p>
                {doc.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{doc.description}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                <Link
                  href={`/investor/presentations/${doc.id}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
