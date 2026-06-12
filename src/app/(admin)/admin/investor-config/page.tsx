import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { InvestorConfigForm } from '@/components/admin/investor-config-form'

const DEFAULT_HEADING = 'Welcome to the LLV Investor Room'
const DEFAULT_BODY =
  "Luxury Lifestyle Vault is a concierge wardrobe management platform for affluent clients — we handle storage, seasonal rotation, cleaning coordination, and on-demand delivery of luxury wardrobes. We're building toward an October 2026 soft launch in the Scottsdale market."

export default async function AdminInvestorConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: selfProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (selfProfile?.role !== 'admin') redirect('/')

  const admin = createAdminClient()
  const { data: config } = await admin
    .from('investor_config')
    .select('welcome_heading, welcome_body, updated_at')
    .limit(1)
    .maybeSingle()

  const welcomeHeading = config?.welcome_heading || DEFAULT_HEADING
  const welcomeBody = config?.welcome_body || DEFAULT_BODY

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-light">Investor Welcome Panel</h1>
        {config?.updated_at && (
          <span className="text-sm text-muted-foreground">
            Last updated {new Date(config.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      <InvestorConfigForm welcomeHeading={welcomeHeading} welcomeBody={welcomeBody} />
    </div>
  )
}
