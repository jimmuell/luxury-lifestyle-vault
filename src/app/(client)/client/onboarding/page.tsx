import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingFlow } from '@/components/client/onboarding-flow'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileResult, cpResult, tiersResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, phone, email, onboarding_complete')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('client_profiles')
      .select('founding_member')
      .eq('profile_id', user!.id)
      .maybeSingle(),
    supabase
      .from('service_tiers')
      .select('id, name, description, monthly_price_cents, tier_type, founding_member_eligible, stripe_price_id_current, included_services')
      .eq('active', true)
      .order('sort_order', { ascending: true }),
  ])

  const profile = profileResult.data
  if (profile?.onboarding_complete) redirect('/client')

  const tiers = tiersResult.data ?? []
  const isFoundingMember = cpResult.data?.founding_member ?? false

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2">
          Luxury Lifestyle Vault
        </p>
        <h1 className="font-serif text-4xl font-light">Welcome.</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Let&apos;s get your account set up so your concierge team can prepare for your first season.
        </p>
      </div>

      <OnboardingFlow
        initialFullName={profile?.full_name ?? null}
        initialPhone={profile?.phone ?? null}
        initialEmail={profile?.email ?? ''}
        tiers={tiers}
        isFoundingMember={isFoundingMember}
      />
    </div>
  )
}
