import { notFound } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { SeedRunner } from '@/components/admin/seed-runner'

export default function SeedDataPage() {
  if (process.env.SEED_TOOLS_ENABLED !== 'true') notFound()

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-serif text-3xl font-light">Seed Data Manager</h1>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Populate the database with demo data for development and staging. All seed records are tagged with{' '}
          <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">is_seed_data = true</code>{' '}
          and can be removed without affecting production records.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-yellow-600/30 bg-yellow-500/5 p-3">
        <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-yellow-700 dark:text-yellow-500">Development / Staging Only</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This page requires the server-only env var{' '}
            <code className="font-mono bg-muted px-1 rounded">SEED_TOOLS_ENABLED=true</code>.
            It is absent in production — this page 404s there by design.
            Demo clients log in at <strong>client1–5@test.llv.com</strong> with password <strong>TestLLV2026!</strong>
          </p>
        </div>
      </div>

      <SeedRunner />
    </div>
  )
}
