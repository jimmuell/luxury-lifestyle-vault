import { getAllProviders } from '@/lib/queries/providers'
import { ProviderManager } from '@/components/admin/provider-manager'
import type { Provider } from '@/types/app'

export default async function AdminProvidersPage() {
  const providers = await getAllProviders()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-light">Providers</h1>
        <p className="text-muted-foreground mt-1">
          Manage your network of garment care and logistics partners.
        </p>
      </div>

      <ProviderManager providers={providers as Provider[]} />
    </div>
  )
}
