'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { HELP_CATEGORY_LABELS } from '@/types/app'
import type { HelpArticle } from '@/types/app'

interface HelpCenterContentProps {
  grouped: Record<string, HelpArticle[]>
}

export function HelpCenterContent({ grouped }: HelpCenterContentProps) {
  const [query, setQuery] = useState('')

  const categories = Object.keys(grouped)

  const filtered: Record<string, HelpArticle[]> = {}
  for (const cat of categories) {
    const matches = query.trim()
      ? grouped[cat].filter(
          (a) =>
            a.title.toLowerCase().includes(query.toLowerCase()) ||
            a.body.toLowerCase().includes(query.toLowerCase())
        )
      : grouped[cat]
    if (matches.length > 0) filtered[cat] = matches
  }

  const hasResults = Object.keys(filtered).length > 0

  return (
    <div className="space-y-8">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles…"
          className="pl-8"
        />
      </div>

      {!hasResults && query.trim() && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No articles match &quot;{query}&quot;.
        </p>
      )}

      {Object.entries(filtered).map(([cat, articles]) => (
        <section key={cat} className="space-y-4">
          <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium border-b border-border pb-2">
            {HELP_CATEGORY_LABELS[cat] ?? cat}
          </h2>
          <div className="space-y-6">
            {articles.map((article) => (
              <section key={article.id} id={article.slug} className="space-y-2 scroll-mt-4">
                <h3 className="font-medium text-sm">{article.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {article.body}
                </p>
              </section>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
