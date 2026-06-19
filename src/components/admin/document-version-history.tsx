'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { RotateCcw } from 'lucide-react'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { restoreVersion } from '@/actions/admin-documents'

interface Version {
  id: string
  version_no: number
  title: string | null
  audience: string | null
  created_at: string
}

interface DocumentVersionHistoryProps {
  docId: string
  currentVersion: number
  versions: Version[]
}

export function DocumentVersionHistory({ docId, currentVersion, versions }: DocumentVersionHistoryProps) {
  const [pending, startTransition] = useTransition()
  const confirm = useConfirm()

  async function handleRestore(version: Version) {
    const ok = await confirm({
      title: `Restore to version ${version.version_no}?`,
      body: 'This copies the selected version into a new draft version. The document will be set to draft status — re-publish to update the room.',
      confirmLabel: 'Restore',
      tone: 'default',
    })
    if (!ok) return

    startTransition(async () => {
      try {
        const result = await restoreVersion(docId, version.id)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(`Restored to v${version.version_no} as a new draft.`)
        }
      } catch {
        toast.error('An unexpected error occurred.')
      }
    })
  }

  if (versions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground px-1">No versions yet.</p>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Version</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden sm:table-cell">Title</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden md:table-cell">Audience</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Saved</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {versions.map(ver => {
            const isCurrent = ver.version_no === currentVersion
            return (
              <tr key={ver.id} className={`transition-colors ${isCurrent ? 'bg-muted/30' : 'hover:bg-muted/20'}`}>
                <td className="px-4 py-3">
                  <span className="font-medium">v{ver.version_no}</span>
                  {isCurrent && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground/60">current</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] hidden sm:table-cell">
                  <span className="line-clamp-1">{ver.title ?? '—'}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs capitalize hidden md:table-cell">
                  {ver.audience ?? '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                  {format(new Date(ver.created_at), 'MMM d, yyyy HH:mm')}
                </td>
                <td className="px-4 py-3 text-right">
                  {!isCurrent && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleRestore(ver)}
                      className="inline-flex items-center gap-1 rounded border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
