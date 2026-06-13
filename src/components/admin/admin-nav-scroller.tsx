'use client'

import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminNavScroller({ children, className }: { children: ReactNode; className?: string }) {
  const scrollRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const recompute = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    // 8px tolerance so the arrow hides cleanly before the very last pixel
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 8)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    recompute()
    el.addEventListener('scroll', recompute, { passive: true })
    // ResizeObserver on BOTH the scroll element and the inner content div.
    // Observing only the scroll element catches viewport resizes but misses
    // collapsible expand/collapse (which changes content height, not container
    // height). Observing contentRef catches those height changes — this dual
    // observation is the key correctness piece for the AdminNav use case.
    const ro = new ResizeObserver(recompute)
    ro.observe(el)
    if (contentRef.current) ro.observe(contentRef.current)
    return () => {
      el.removeEventListener('scroll', recompute)
      ro.disconnect()
    }
  }, [recompute])

  const scrollDown = () => {
    const el = scrollRef.current
    if (!el) return
    // Respect prefers-reduced-motion: instant jump instead of smooth scroll
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ top: Math.round(el.clientHeight * 0.8), behavior: prefersReduced ? 'instant' : 'smooth' })
  }

  return (
    <div className="relative flex-1 min-h-0">
      {/* canScrollDown starts false and is set in useEffect after mount —
          the button is absent on first paint (no SSR/hydration mismatch).
          This is intentional. */}
      <nav ref={scrollRef} className={cn('h-full overflow-y-auto scrollbar-hide', className)}>
        <div ref={contentRef}>{children}</div>
      </nav>

      <button
        type="button"
        onClick={scrollDown}
        aria-label="Scroll navigation down"
        aria-hidden={!canScrollDown}
        tabIndex={canScrollDown ? 0 : -1}
        className={cn(
          'absolute bottom-2 left-1/2 -translate-x-1/2 grid h-8 w-8 place-items-center rounded-full',
          'border border-border bg-background/80 text-muted-foreground shadow-sm backdrop-blur',
          'transition-opacity duration-200 hover:text-foreground',
          canScrollDown ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  )
}
