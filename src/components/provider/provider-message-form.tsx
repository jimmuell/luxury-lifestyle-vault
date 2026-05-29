'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { providerSendMessage } from '@/actions/concierge'
import { MessageSquare } from 'lucide-react'

export function ProviderMessageForm({
  orderId,
  isDamageReport = false,
}: {
  orderId: string
  isDamageReport?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState(isDamageReport ? 'Damage observed on item' : '')
  const [body, setBody] = useState('')
  const [, startTransition] = useTransition()
  const [sending, setSending] = useState(false)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    startTransition(async () => {
      try {
        const result = await providerSendMessage({ orderId, subject, body, isDamageReport })
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Message sent to LLV operations')
          setOpen(false)
          setSubject(isDamageReport ? 'Damage observed on item' : '')
          setBody('')
          router.refresh()
        }
      } catch {
        toast.error('Failed to send message')
      } finally {
        setSending(false)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageSquare className="h-4 w-4" />
        {isDamageReport ? 'Report damage to LLV' : 'Message LLV operations'}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border p-4 bg-card">
      <p className="text-sm font-medium">
        {isDamageReport ? 'Damage report' : 'Message LLV operations'}
      </p>
      <input
        type="text"
        value={subject}
        onChange={e => setSubject(e.target.value)}
        placeholder="Subject"
        required
        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none"
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={isDamageReport
          ? 'Describe the damage in detail — item name, location, nature of damage…'
          : 'Describe your question or request…'
        }
        required
        rows={4}
        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none resize-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={sending}
          className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-60"
        >
          {sending ? 'Sending…' : 'Send message'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
