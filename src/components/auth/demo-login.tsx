'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signInAsDemo } from '@/actions/auth'

const DEMO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true'

export function DemoLogin() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [clientPending, startClient] = useTransition()
  const [adminPending, startAdmin] = useTransition()
  const [investorPending, startInvestor] = useTransition()
  const [boardPending, startBoard] = useTransition()

  if (!DEMO_LOGIN_ENABLED) return null

  const anyPending = clientPending || adminPending || investorPending || boardPending

  function go(role: 'client' | 'admin' | 'investor' | 'board', start: React.TransitionStartFunction) {
    setError(null)
    start(async () => {
      const r = await signInAsDemo(role)
      if (r?.error) { setError(r.error); return }
      router.push('/')
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dashed border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground">
            dev shortcuts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => go('client', startClient)}
          disabled={anyPending}
          className="px-3 py-2 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
        >
          {clientPending ? 'Signing in…' : '→ Demo client'}
        </button>
        <button
          onClick={() => go('admin', startAdmin)}
          disabled={anyPending}
          className="px-3 py-2 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
        >
          {adminPending ? 'Signing in…' : '→ Demo admin'}
        </button>
        <button
          onClick={() => go('investor', startInvestor)}
          disabled={anyPending}
          className="px-3 py-2 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
        >
          {investorPending ? 'Signing in…' : '→ Demo investor'}
        </button>
        <button
          onClick={() => go('board', startBoard)}
          disabled={anyPending}
          className="px-3 py-2 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
        >
          {boardPending ? 'Signing in…' : '→ Demo board'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-center px-4 py-3 rounded-md bg-destructive/10 text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
