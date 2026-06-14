import { AlertTriangle } from 'lucide-react'

export function AdminLoadError({ area, message }: { area: string; message?: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-10 text-center">
      <AlertTriangle className="mx-auto h-5 w-5 text-destructive" />
      <p className="mt-2 text-sm font-medium text-destructive">Couldn&apos;t load {area}.</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {message ?? 'Please refresh, or check that database migrations are applied.'}
      </p>
    </div>
  )
}
