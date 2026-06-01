'use client'

import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export interface ConfirmOptions {
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'destructive'
}

type OpenConfirm = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<OpenConfirm | null>(null)

export function useConfirm(): OpenConfirm {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmDialogProvider')
  return ctx
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState<ConfirmOptions>({ title: '' })
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const openConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setOpts(options)
      resolveRef.current = resolve
      setOpen(true)
    })
  }, [])

  function settle(result: boolean) {
    resolveRef.current?.(result)
    resolveRef.current = null
    setOpen(false)
  }

  return (
    <ConfirmContext.Provider value={openConfirm}>
      {children}
      <Dialog open={open} onOpenChange={(next) => { if (!next) settle(false) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{opts.title}</DialogTitle>
            {opts.body && <DialogDescription>{opts.body}</DialogDescription>}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              {opts.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              variant={opts.tone === 'destructive' ? 'destructive' : 'default'}
              onClick={() => settle(true)}
            >
              {opts.confirmLabel ?? 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}
