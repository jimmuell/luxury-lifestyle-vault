'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { sendTestEmail } from '@/actions/email'
import { Send } from 'lucide-react'

const DEFAULT_TEST_RECIPIENT = 'jimmuell@aol.com'

export function EmailTestForm() {
  const [to, setTo] = useState(DEFAULT_TEST_RECIPIENT)
  const [subject, setSubject] = useState('LLV Resend test')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await sendTestEmail({ to, subject })
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(`Sent. Resend id: ${result.id}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="test-to">To</Label>
        <Input
          id="test-to"
          type="email"
          value={to}
          onChange={e => setTo(e.target.value)}
          placeholder="recipient@example.com"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="test-subject">Subject</Label>
        <Input
          id="test-subject"
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="LLV Resend test"
        />
      </div>
      <Button type="submit" disabled={isPending} className="gap-2">
        <Send className="h-4 w-4" />
        {isPending ? 'Sending…' : 'Send test email'}
      </Button>
    </form>
  )
}
