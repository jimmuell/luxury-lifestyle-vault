'use client'

import { useState, useTransition } from 'react'
import { sendConciergeMessage } from '@/actions/concierge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Send } from 'lucide-react'

export function ConciergeMessageForm() {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [pending, startTransition] = useTransition()

  function submit() {
    if (!subject.trim() || !body.trim()) {
      toast.error('Please fill in both fields.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('subject', subject)
      formData.set('body', body)

      const result = await sendConciergeMessage(formData)
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Message sent. Your concierge will respond within 4 hours.')
        setSubject('')
        setBody('')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">New Message</p>

      <div className="space-y-2">
        <Label htmlFor="concierge-subject" className="text-xs">Subject</Label>
        <Input
          id="concierge-subject"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="e.g. Seasonal rotation request, pickup scheduling…"
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="concierge-body" className="text-xs">Message</Label>
        <Textarea
          id="concierge-body"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="How can we assist you today?"
          rows={4}
          disabled={pending}
        />
      </div>

      <Button type="button" onClick={submit} disabled={pending} size="sm">
        <Send className="h-3.5 w-3.5 mr-1.5" />
        {pending ? 'Sending…' : 'Send message'}
      </Button>
    </div>
  )
}
