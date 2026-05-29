import { createClient } from '@/lib/supabase/server'
import { IntakeForm } from '@/components/client/intake-form'

export default async function IntakePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light">Add an item</h1>
        <p className="text-muted-foreground mt-1">
          Tell us about the item you&apos;d like to add to your vault.
        </p>
      </div>
      <IntakeForm clientId={user!.id} />
    </div>
  )
}
