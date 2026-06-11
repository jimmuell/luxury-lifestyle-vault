'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { buttonVariants } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
} from 'lucide-react'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Must be set at module level — not inside a component or useEffect
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface DeckViewerProps {
  /** Supabase signed URL — passed directly to <Document file={...}> */
  signedUrl: string
  /** Document title for ARIA */
  title: string
  /** Signed URL with download=true for the Download button */
  downloadUrl: string
}

export default function DeckViewer({ signedUrl, title, downloadUrl }: DeckViewerProps) {
  const [pageNumber, setPageNumber] = useState(1)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const viewerRef = useRef<HTMLDivElement>(null)

  // Stable keyboard handler — must not capture stale numPages
  const numPagesRef = useRef<number | null>(null)

  useEffect(() => {
    numPagesRef.current = numPages
  }, [numPages])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setPageNumber((prev) => Math.max(1, prev - 1))
    } else if (e.key === 'ArrowRight') {
      setPageNumber((prev) => {
        const total = numPagesRef.current
        return total ? Math.min(total, prev + 1) : prev
      })
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Track fullscreen changes (e.g. user presses Esc)
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const handleFullscreen = () => {
    if (!viewerRef.current) return
    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const goToPrev = () => setPageNumber((prev) => Math.max(1, prev - 1))
  const goToNext = () => setPageNumber((prev) => (numPages ? Math.min(numPages, prev + 1) : prev))

  return (
    <div ref={viewerRef} className="flex flex-col gap-3 h-full" aria-label={title}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-shrink-0">
        <span className="font-serif text-base font-light truncate text-foreground">{title}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={downloadUrl}
            download
            className={
              buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-1.5'
            }
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={
              buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-1.5'
            }
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open as PDF
          </a>
        </div>
      </div>

      {/* Slide area */}
      <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-border bg-card overflow-hidden min-h-0">
        {loadError ? (
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground" style={{ minHeight: '60vh' }}>
            <p>Unable to load the presentation. Please try downloading it instead.</p>
          </div>
        ) : loading ? (
          <div className="rounded-lg bg-muted animate-pulse" style={{ minHeight: '60vh' }} />
        ) : null}
        {!loadError && (
          <Document
            file={signedUrl}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n)
              setLoading(false)
            }}
            onLoadError={() => { setLoading(false); setLoadError(true) }}
            loading={null}
            className="flex items-center justify-center w-full h-full"
          >
            <Page
              key={pageNumber}
              pageNumber={pageNumber}
              loading={null}
              onRenderSuccess={() => setLoading(false)}
              onRenderError={console.error}
              className={loading ? 'invisible' : 'visible'}
            />
          </Document>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-4 flex-shrink-0">
        <button
          onClick={goToPrev}
          disabled={pageNumber === 1}
          aria-label="Previous slide"
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>

        <span className="text-sm text-muted-foreground tabular-nums min-w-[5rem] text-center">
          {pageNumber} / {numPages ?? '…'}
        </span>

        <button
          onClick={goToNext}
          disabled={pageNumber === numPages}
          aria-label="Next slide"
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          onClick={handleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border bg-card hover:bg-muted transition-colors"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}
