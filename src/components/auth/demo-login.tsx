'use client'

import { useTransition } from 'react'
import { signInAsDemo } from '@/actions/auth'

const DEMO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true'

export function DemoLogin() {
  const [clientPending, startClient] = useTransition()
  const [adminPending, startAdmin] = useTransition()

  if (!DEMO_LOGIN_ENABLED) return null

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

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => startClient(() => { signInAsDemo('client') })}
          disabled={clientPending || adminPending}
          className="px-3 py-2 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
        >
          {clientPending ? 'Signing in…' : '→ Demo client'}
        </button>
        <button
          onClick={() => startAdmin(() => { signInAsDemo('admin') })}
          disabled={clientPending || adminPending}
          className="px-3 py-2 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
        >
          {adminPending ? 'Signing in…' : '→ Demo admin'}
        </button>
      </div>
    </div>
  )
}
