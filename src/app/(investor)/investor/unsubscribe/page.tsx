import { createAdminClient } from '@/lib/supabase/admin'
import { verifyUnsubscribeToken } from '@/lib/investor/unsubscribe'

interface Props {
  searchParams: Promise<{ id?: string; token?: string }>
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const { id: profileId, token } = await searchParams

  let success = false

  if (profileId && token && verifyUnsubscribeToken(profileId, token)) {
    const admin = createAdminClient()
    await admin
      .from('profiles')
      .update({ investor_notifications_opt_in: false })
      .eq('id', profileId)
    success = true
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full rounded-lg border border-border bg-card p-8 text-center space-y-4">
        <h1 className="font-serif text-2xl text-foreground">
          {success ? 'Unsubscribed' : 'Invalid Link'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {success
            ? "You've been unsubscribed from investor document notifications."
            : 'Invalid or expired unsubscribe link.'}
        </p>
      </div>
    </main>
  )
}
