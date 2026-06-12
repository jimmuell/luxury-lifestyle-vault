import { createAdminClient } from '@/lib/supabase/admin'
import { verifyUnsubscribeToken } from '@/lib/investor/unsubscribe'

interface Props {
  searchParams: Promise<{ id?: string; docId?: string; token?: string; confirmed?: string }>
}

async function confirmUnsubscribe(formData: FormData): Promise<void> {
  'use server'
  const profileId = formData.get('id') as string | null
  const documentId = formData.get('docId') as string | null
  const token = formData.get('token') as string | null

  if (!profileId || !documentId || !token) return
  if (!verifyUnsubscribeToken(profileId, documentId, token)) return

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .update({ investor_notifications_opt_in: false })
    .eq('id', profileId)
    .select('id')

  if (error || !data?.length) return

  const { redirect } = await import('next/navigation')
  redirect(`/unsubscribe?id=${profileId}&docId=${documentId}&token=${token}&confirmed=1`)
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const { id: profileId, docId: documentId, token, confirmed } = await searchParams

  const isValid = !!(profileId && documentId && token && verifyUnsubscribeToken(profileId, documentId, token))

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full rounded-lg border border-border bg-card p-8 text-center space-y-4">
        {confirmed && isValid ? (
          <>
            <h1 className="font-serif text-2xl text-foreground">Unsubscribed</h1>
            <p className="text-sm text-muted-foreground">
              {"You've been unsubscribed from investor document notifications."}
            </p>
          </>
        ) : isValid ? (
          <>
            <h1 className="font-serif text-2xl text-foreground">Unsubscribe</h1>
            <p className="text-sm text-muted-foreground">
              Confirm to stop receiving investor document notifications.
            </p>
            <form action={confirmUnsubscribe}>
              <input type="hidden" name="id" value={profileId} />
              <input type="hidden" name="docId" value={documentId} />
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="mt-2 rounded-md bg-foreground px-5 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
              >
                Confirm Unsubscribe
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="font-serif text-2xl text-foreground">Invalid Link</h1>
            <p className="text-sm text-muted-foreground">Invalid or expired unsubscribe link.</p>
          </>
        )}
      </div>
    </main>
  )
}
