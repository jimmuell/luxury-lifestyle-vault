'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Play, Trash2, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { runSeedScript, runAllSeeds, clearAllSeeds, getSeedStatus, previewTestAccountCleanup, clearAllTestAccounts } from '@/actions/seed'
import type { SeedResult } from '@/lib/seed/types'
import type { AllSeedsResult } from '@/lib/seed/seed-all'
import { SEED_MANIFEST } from '@/lib/seed/manifest'

interface StatusCounts {
  profiles: number
  items: number
  providers: number
  concierge_messages: number
  item_conditions: number
  item_photos: number
  orders: number
  order_items: number
  order_status_history: number
  order_shipments: number
  provider_order_assignments: number
  outfits: number
  outfit_items: number
  client_subscriptions: number
  notifications: number
  admin_audit_log: number
  addresses: number
  total: number
}

interface LogEntry {
  timestamp: string
  label: string
  result: SeedResult | AllSeedsResult | null
  error: string | null
}

function formatResult(result: SeedResult) {
  const parts = []
  if (result.seeded > 0) parts.push(`${result.seeded} seeded`)
  if (result.skipped > 0) parts.push(`${result.skipped} skipped`)
  if (result.errors.length > 0) parts.push(`${result.errors.length} error(s)`)
  return parts.join(', ') || 'nothing to do'
}

function ResultBadge({ result }: { result: SeedResult }) {
  const hasErrors = result.errors.length > 0
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', hasErrors ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground')}>
      {formatResult(result)}
    </span>
  )
}

const DEMO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true'

export function SeedRunner() {
  const [status, setStatus] = useState<StatusCounts | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])
  const [expandedLog, setExpandedLog] = useState<number | null>(null)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [clearTimer, setClearTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [isPending, startTransition] = useTransition()
  const [activeScript, setActiveScript] = useState<string | null>(null)

  // Test account cleanup state
  const [testPreview, setTestPreview] = useState<{ count: number; emails: string[] } | null>(null)
  const [testCleanupConfirm, setTestCleanupConfirm] = useState(false)

  async function refreshStatus() {
    try {
      const s = await getSeedStatus()
      setStatus(s)
    } catch {
      // silently fail — admin page will show error state
    }
  }

  useEffect(() => {
    void getSeedStatus().then(setStatus).catch(() => {})
  }, [])

  function addLog(label: string, result: SeedResult | AllSeedsResult | null, error: string | null) {
    setLog(prev => [{ timestamp: new Date().toLocaleTimeString(), label, result, error }, ...prev].slice(0, 20))
  }

  function handleRunScript(id: string, name: string) {
    setActiveScript(id)
    startTransition(async () => {
      try {
        const result = await runSeedScript(id)
        addLog(name, result, null)
        await refreshStatus()
      } catch (err) {
        addLog(name, null, err instanceof Error ? err.message : String(err))
      } finally {
        setActiveScript(null)
      }
    })
  }

  function handleSeedAll() {
    setActiveScript('all')
    startTransition(async () => {
      try {
        const result = await runAllSeeds()
        addLog('Seed All', result as never, null)
        await refreshStatus()
      } catch (err) {
        addLog('Seed All', null, err instanceof Error ? err.message : String(err))
      } finally {
        setActiveScript(null)
      }
    })
  }

  function handleClearClick() {
    if (!clearConfirm) {
      setClearConfirm(true)
      const t = setTimeout(() => setClearConfirm(false), 5000)
      setClearTimer(t)
      return
    }
    if (clearTimer) clearTimeout(clearTimer)
    setClearConfirm(false)
    setActiveScript('clear')
    startTransition(async () => {
      try {
        const result = await clearAllSeeds()
        addLog('Clear All', result, null)
        await refreshStatus()
      } catch (err) {
        addLog('Clear All', null, err instanceof Error ? err.message : String(err))
      } finally {
        setActiveScript(null)
      }
    })
  }

  function handleTestPreview() {
    setActiveScript('test-preview')
    setTestCleanupConfirm(false)
    startTransition(async () => {
      try {
        const preview = await previewTestAccountCleanup()
        setTestPreview(preview)
      } catch (err) {
        addLog('Preview Test Accounts', null, err instanceof Error ? err.message : String(err))
      } finally {
        setActiveScript(null)
      }
    })
  }

  function handleTestCleanup() {
    if (!testCleanupConfirm) {
      setTestCleanupConfirm(true)
      return
    }
    setTestCleanupConfirm(false)
    setTestPreview(null)
    setActiveScript('test-cleanup')
    startTransition(async () => {
      try {
        const result = await clearAllTestAccounts()
        addLog('Clear Test Accounts', result, null)
        await refreshStatus()
      } catch (err) {
        addLog('Clear Test Accounts', null, err instanceof Error ? err.message : String(err))
      } finally {
        setActiveScript(null)
      }
    })
  }

  const isRunning = isPending || activeScript !== null

  return (
    <div className="space-y-8">
      {/* Status table */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Current Seed State</p>
          <button
            onClick={refreshStatus}
            disabled={isRunning}
            className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-40"
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        {status ? (
          <div className="space-y-4">
            {/* Core */}
            <div>
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground/60 mb-2">Core</p>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: 'Clients', value: status.profiles },
                  { label: 'Addresses', value: status.addresses },
                  { label: 'Items', value: status.items },
                  { label: 'Photos', value: status.item_photos },
                  { label: 'Providers', value: status.providers },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-2xl font-light font-serif tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Operations */}
            <div className="pt-3 border-t border-border/50">
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground/60 mb-2">Operations</p>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: 'Orders', value: status.orders },
                  { label: 'Order Items', value: status.order_items },
                  { label: 'Shipments', value: status.order_shipments },
                  { label: 'Status Steps', value: status.order_status_history },
                  { label: 'Assignments', value: status.provider_order_assignments },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-2xl font-light font-serif tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Engagement */}
            <div className="pt-3 border-t border-border/50">
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground/60 mb-2">Engagement</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Outfits', value: status.outfits },
                  { label: 'Outfit Items', value: status.outfit_items },
                  { label: 'Messages', value: status.concierge_messages },
                  { label: 'Notifications', value: status.notifications },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-2xl font-light font-serif tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* System */}
            <div className="pt-3 border-t border-border/50">
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground/60 mb-2">System</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Subscriptions', value: status.client_subscriptions },
                  { label: 'Conditions', value: status.item_conditions },
                  { label: 'Audit Log', value: status.admin_audit_log },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-2xl font-light font-serif tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        )}
        {status && status.total > 0 && (
          <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
            {status.total} total seed records in database
          </p>
        )}
      </div>

      {/* Individual scripts */}
      <div className="space-y-3">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Individual Scripts</p>
        <div className="grid gap-3">
          {SEED_MANIFEST.map((script) => (
            <div key={script.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{script.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{script.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRunScript(script.id, script.name)}
                disabled={isRunning}
                className="flex-shrink-0 gap-1.5"
              >
                {activeScript === script.id ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Run
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleSeedAll}
          disabled={isRunning}
          className="flex-1 gap-2"
        >
          {activeScript === 'all' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Seed All
        </Button>
        <Button
          variant="destructive"
          onClick={handleClearClick}
          disabled={isRunning}
          className="flex-1 gap-2"
        >
          {activeScript === 'clear' ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {clearConfirm ? 'Confirm Clear? (click again)' : 'Clear All Seed Data'}
        </Button>
      </div>

      {clearConfirm && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive leading-relaxed">
            This will delete all seed clients, items, photos, conditions, concierge messages, and providers — and remove the 5 demo auth users. Click <strong>Confirm Clear</strong> again to proceed.
          </p>
        </div>
      )}

      {/* Test account cleanup — dev/demo environments only */}
      {DEMO_LOGIN_ENABLED && (
        <div className="rounded-lg border border-dashed border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] tracking-widest uppercase font-mono text-muted-foreground border border-border rounded px-1 py-0.5">
              DEV
            </span>
            <p className="text-sm font-medium">Test Account Cleanup</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Removes all non-admin auth users and their associated data. Does not touch seed data or admin accounts. Preview first to see which accounts will be removed.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleTestPreview}
              disabled={isRunning}
              className="flex-1 gap-2"
            >
              {activeScript === 'test-preview' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Preview test accounts
            </Button>
            <Button
              variant="destructive"
              onClick={handleTestCleanup}
              disabled={isRunning || !testPreview}
              className="flex-1 gap-2"
            >
              {activeScript === 'test-cleanup' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {testCleanupConfirm ? 'Confirm — delete all test accounts' : 'Delete all test accounts'}
            </Button>
          </div>

          {testCleanupConfirm && testPreview && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive leading-relaxed">
                This will permanently delete <strong>{testPreview.count} account{testPreview.count !== 1 ? 's' : ''}</strong> and all their associated data. This cannot be undone. Click <strong>Confirm</strong> again to proceed.
              </p>
            </div>
          )}

          {testPreview && !testCleanupConfirm && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-medium">
                {testPreview.count} account{testPreview.count !== 1 ? 's' : ''} would be removed:
              </p>
              {testPreview.count === 0 ? (
                <p className="text-xs text-muted-foreground">No test accounts found.</p>
              ) : (
                <ul className="space-y-1">
                  {testPreview.emails.map(email => (
                    <li key={email} className="font-mono text-xs text-muted-foreground">{email}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Output log */}
      {log.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Output Log</p>
          <div className="space-y-2">
            {log.map((entry, i) => (
              <div key={i} className={cn('rounded-lg border bg-card overflow-hidden', entry.error ? 'border-destructive/30' : 'border-border')}>
                <button
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedLog(expandedLog === i ? null : i)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground flex-shrink-0">{entry.timestamp}</span>
                    <span className="text-sm font-medium truncate">{entry.label}</span>
                    {entry.error && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium flex-shrink-0">
                        error
                      </span>
                    )}
                    {entry.result && !('totalSeeded' in entry.result) && (
                      <ResultBadge result={entry.result as SeedResult} />
                    )}
                    {entry.result && 'totalSeeded' in entry.result && (() => {
                      const r = entry.result as AllSeedsResult
                      return (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium flex-shrink-0">
                          {r.totalSeeded} seeded · {r.totalSkipped} skipped
                        </span>
                      )
                    })()}
                  </div>
                  {expandedLog === i ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                </button>
                {expandedLog === i && (
                  <div className="border-t border-border bg-muted/30 p-3 space-y-2">
                    {entry.error && (
                      <p className="font-mono text-xs text-destructive">{entry.error}</p>
                    )}
                    {entry.result && 'totalSeeded' in entry.result && (
                      <div className="space-y-1">
                        {Object.entries(entry.result as AllSeedsResult)
                          .filter(([k]) => !['totalSeeded', 'totalSkipped', 'totalErrors'].includes(k))
                          .map(([key, val]) => {
                            const r = val as SeedResult
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground w-24 flex-shrink-0">{key}</span>
                                <ResultBadge result={r} />
                                {r.errors.map((e, ei) => (
                                  <span key={ei} className="font-mono text-xs text-destructive">{e}</span>
                                ))}
                              </div>
                            )
                          })}
                      </div>
                    )}
                    {entry.result && !('totalSeeded' in entry.result) && (
                      <div className="space-y-1">
                        {(entry.result as SeedResult).errors.length > 0 && (
                          (entry.result as SeedResult).errors.map((e, ei) => (
                            <p key={ei} className="font-mono text-xs text-destructive">{e}</p>
                          ))
                        )}
                        {(entry.result as SeedResult).errors.length === 0 && (
                          <p className="font-mono text-xs text-muted-foreground">No errors.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
