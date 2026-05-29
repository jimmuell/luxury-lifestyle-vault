'use client'

import { useState, useRef, useTransition } from 'react'
import { searchClientWardrobe, type SearchResult } from '@/actions/search'
import { Search, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface WardrobeSearchBarProps {
  onResults: (results: SearchResult[] | null, fallback: boolean) => void
  disabled?: boolean
}

export function WardrobeSearchBar({ onResults, disabled }: WardrobeSearchBarProps) {
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearch(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      onResults(null, false)
      return
    }
    debounceRef.current = setTimeout(() => {
      runSearch(value)
    }, 500)
  }

  function runSearch(q: string) {
    startTransition(async () => {
      try {
        const { results, fallback } = await searchClientWardrobe(q)
        onResults(results, fallback)
        if (fallback) {
          toast.info('AI search unavailable — showing best-effort matches')
        }
      } catch {
        toast.error('Search failed. Please try again.')
        onResults(null, false)
      }
    })
  }

  function clearSearch() {
    setQuery('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    onResults(null, false)
  }

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search your wardrobe — try &quot;black tie dinner&quot; or &quot;golf in Scottsdale&quot;"
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2.5 text-sm border border-border rounded-lg bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />
        {(isPending) && (
          <Loader2 className="absolute right-3 h-4 w-4 text-muted-foreground animate-spin" />
        )}
        {query && !isPending && (
          <button
            onClick={clearSearch}
            className="absolute right-3 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
