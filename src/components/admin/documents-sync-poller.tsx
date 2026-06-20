'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const POLL_INTERVAL_MS = 3000
const MAX_ATTEMPTS = 20

export function DocumentsSyncPoller({ isSyncing }: { isSyncing: boolean }) {
  const router = useRouter()
  const attempts = useRef(0)

  useEffect(() => {
    if (!isSyncing) {
      attempts.current = 0
      return
    }

    const id = setInterval(() => {
      attempts.current++
      router.refresh()
      if (attempts.current >= MAX_ATTEMPTS) clearInterval(id)
    }, POLL_INTERVAL_MS)

    return () => clearInterval(id)
  }, [isSyncing, router])

  return null
}
