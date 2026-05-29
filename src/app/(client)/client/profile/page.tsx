import { createClient } from '@/lib/supabase/server'

export default async function ClientProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone')
    .eq('id', user!.id)
    .single()

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('profile_id', user!.id)
    .order('is_primary', { ascending: false })

  return (
    <div className="max-w-2xl space-y-10">
      <h1 className="font-serif text-3xl font-light">Profile</h1>

      <div className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
          Account
        </h2>
        <div className="rounded-md border border-border divide-y divide-border">
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
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
          Delivery addresses
        </h2>
        {addresses && addresses.length > 0 ? (
          <div className="rounded-md border border-border divide-y divide-border">
            {addresses.map((addr) => (
              <div key={addr.id} className="px-5 py-4 text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{addr.label}</p>
                    <p className="text-muted-foreground mt-0.5">
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                      {addr.city}, {addr.state} {addr.postal_code}
                    </p>
                  </div>
                  {addr.is_primary && (
                    <span className="text-xs text-muted-foreground border border-border rounded px-2 py-0.5">
                      Primary
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No addresses added yet.</p>
        )}
      </div>
    </div>
  )
}
