import { createClient } from '@/lib/supabase/server'
import {
  PreferredChannelForm,
  SignOutEverywhereButton,
  DeleteAccountButton,
} from '@/components/client/account-settings-form'

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileResult, cpResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('client_profiles')
      .select('preferred_channel, founding_member')
      .eq('profile_id', user!.id)
      .single(),
  ])

  const profile = profileResult.data
  const cp = cpResult.data
  const preferredChannel = (cp?.preferred_channel ?? 'email') as 'email' | 'sms' | 'both'

  return (
    <div className="space-y-10">
      {/* Profile (read-only) */}
      <div className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Profile</h2>
        <div className="rounded-lg border border-border divide-y divide-border">
          <div className="flex justify-between items-center px-5 py-4 text-sm">
            <span className="text-muted-foreground">Name</span>
            <span>{profile?.full_name ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center px-5 py-4 text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{profile?.email}</span>
          </div>
          <div className="flex justify-between items-center px-5 py-4 text-sm">
            <span className="text-muted-foreground">Phone</span>
            <span>{profile?.phone ?? '—'}</span>
          </div>
          {cp?.founding_member && (
            <div className="flex justify-between items-center px-5 py-4 text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="text-amber-600 font-medium">Founding Member</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">To update your profile details, contact your concierge.</p>
      </div>

      {/* Communication preference */}
      <div className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Communication preference</h2>
        <PreferredChannelForm preferredChannel={preferredChannel} />
      </div>

      {/* Session */}
      <div className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Sessions</h2>
        <p className="text-sm text-muted-foreground">Sign out of all browsers and devices associated with your account.</p>
        <SignOutEverywhereButton />
      </div>

      {/* Danger zone */}
      <div className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium text-destructive">Danger zone</h2>
        <div className="rounded-lg border border-destructive/30 px-5 py-4 space-y-3">
          <p className="text-sm font-medium">Close account</p>
          <p className="text-xs text-muted-foreground">
            Your wardrobe data is preserved for 90 days before permanent deletion. Physical items in storage remain accessible — contact your concierge to arrange collection.
          </p>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  )
}
