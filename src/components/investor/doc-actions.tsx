'use client'

import { useState } from 'react'
import { Eye, Download, Loader2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DocActionsProps {
  docId: string
  title: string
}

export function DocActions({ docId }: DocActionsProps) {
  const [viewLoading, setViewLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)

  function handleView() {
    setViewLoading(true)
    const timer = setTimeout(() => setViewLoading(false), 1500)
    const onFocus = () => {
      clearTimeout(timer)
      setViewLoading(false)
    }
    window.addEventListener('focus', onFocus, { once: true })
  }

  function handleDownload() {
    setDownloadLoading(true)
    const a = document.createElement('a')
    a.href = `/api/investor/documents/${docId}?download=1`
    a.click()
    setTimeout(() => setDownloadLoading(false), 2500)
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0 print:hidden">
      <a
        href={`/investor/documents/${docId}/view`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleView}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'gap-1.5',
          viewLoading && 'pointer-events-none opacity-60'
        )}
      >
        {viewLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
        View
      </a>
      <button
        onClick={handleDownload}
        disabled={downloadLoading}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
      >
        {downloadLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        Download
      </button>
    </div>
  )
}
