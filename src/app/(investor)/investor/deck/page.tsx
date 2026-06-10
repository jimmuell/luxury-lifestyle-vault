import Link from 'next/link'
import { Presentation, ExternalLink, Download } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function InvestorDeckPage() {
  const supabase = await createClient()

  const { data: deckDoc } = await supabase
    .from('investor_documents')
    .select('id, title, file_type, file_size_bytes')
    .eq('is_published', true)
    .eq('section', 'deck')
    .order('sort_order')
    .limit(1)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-light">Pitch Deck</h1>
      {!deckDoc ? (
        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center text-center gap-4">
          <Presentation className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">The deck will appear here once uploaded</p>
          <p className="text-xs text-muted-foreground/70 max-w-xs">
            Check back soon — the pitch deck will be available as a PDF once it has been uploaded to the data room.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-serif text-xl font-light">{deckDoc.title}</h2>
              {deckDoc.file_size_bytes && (
                <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(deckDoc.file_size_bytes)}</p>
              )}
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <Link
                href={`/api/investor/documents/${deckDoc.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-1.5'}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in new tab
              </Link>
              <Link
                href={`/api/investor/documents/${deckDoc.id}?download=1`}
                className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-1.5'}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-hidden bg-muted/20" style={{ height: '75vh' }}>
            <iframe
              src={`/api/investor/documents/${deckDoc.id}`}
              className="w-full h-full"
              title={deckDoc.title}
            />
          </div>

          <p className="text-xs text-muted-foreground print:hidden">
            Having trouble viewing? Use &quot;Open in new tab&quot; above.
          </p>
        </div>
      )}
    </div>
  )
}
