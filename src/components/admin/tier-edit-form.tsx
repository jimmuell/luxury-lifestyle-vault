'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateTierPricing, updateTierConfig, syncTierToStripe, deactivateTier } from '@/actions/tiers'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CheckCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

const SERVICE_TYPE_LABELS: Record<string, string> = {
  dry_cleaning: 'Dry Cleaning',
  wet_cleaning: 'Wet Cleaning',
  hand_wash: 'Hand Wash',
  pressing_steaming: 'Pressing & Steaming',
  alterations: 'Alterations',
  repair: 'Repair',
  storage: 'Storage',
  shoe_care: 'Shoe Care',
  leather_care: 'Leather Care',
}

type Tier = {
  id: string
  name: string
  description: string | null
  tier_type: string
  billing_cycle: string
  monthly_price_cents: number | null
  per_request_base_cents: number | null
  per_item_surcharge_cents: number
  rush_premium_pct: number
  min_lead_time_hours: number
  rush_lead_time_hours: number
  founding_member_discount_pct: number
  founding_member_eligible: boolean
  tier3_billing_mode: string
  included_services: string[]
  addon_options: unknown
  active: boolean
  sort_order: number
  stripe_product_id: string | null
  stripe_price_id_current: string | null
}

type PricingLogEntry = {
  id: string
  field: string
  before_value: string | null
  after_value: string | null
  created_at: string
  actor_profile_id: string | null
}

function centsToDisplay(cents: number | null): string {
  if (cents == null) return ''
  return (cents / 100).toFixed(2)
}

function displayToCents(val: string): number | null {
  const n = parseFloat(val)
  if (isNaN(n) || n < 0) return null
  return Math.round(n * 100)
}

function PricingField({
  label,
  value,
  onChange,
  prefix = '$',
  suffix,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  prefix?: string
  suffix?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs tracking-[0.12em] uppercase text-muted-foreground font-medium">{label}</label>
      <div className="flex items-center gap-1.5">
        {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-32 px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none"
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  )
}

export function TierEditForm({
  tier,
  priceSubCounts,
  pricingLog,
}: {
  tier: Tier
  priceSubCounts: Record<string, number>
  pricingLog: PricingLogEntry[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [syncing, setSyncing] = useState(false)
  const [showLog, setShowLog] = useState(false)

  // Config fields
  const [name, setName] = useState(tier.name)
  const [description, setDescription] = useState(tier.description ?? '')
  const [tierType, setTierType] = useState(tier.tier_type)
  const [billingCycle, setBillingCycle] = useState(tier.billing_cycle)
  const [tier3BillingMode, setTier3BillingMode] = useState(tier.tier3_billing_mode)
  const [active, setActive] = useState(tier.active)
  const [foundingEligible, setFoundingEligible] = useState(tier.founding_member_eligible)
  const [sortOrder, setSortOrder] = useState(String(tier.sort_order))
  const [includedServices, setIncludedServices] = useState<string[]>(tier.included_services ?? [])

  // Pricing fields (stored as dollar strings, sent as cents)
  const [monthlyPrice, setMonthlyPrice] = useState(centsToDisplay(tier.monthly_price_cents))
  const [perRequestBase, setPerRequestBase] = useState(centsToDisplay(tier.per_request_base_cents))
  const [perItemSurcharge, setPerItemSurcharge] = useState(centsToDisplay(tier.per_item_surcharge_cents))
  const [rushPremiumPct, setRushPremiumPct] = useState(String(tier.rush_premium_pct))
  const [minLeadHours, setMinLeadHours] = useState(String(tier.min_lead_time_hours))
  const [rushLeadHours, setRushLeadHours] = useState(String(tier.rush_lead_time_hours))
  const [foundingDiscountPct, setFoundingDiscountPct] = useState(String(tier.founding_member_discount_pct))

  const [configSaved, setConfigSaved] = useState(false)
  const [priceSaved, setPriceSaved] = useState(false)

  function toggleService(svc: string) {
    setIncludedServices(prev =>
      prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]
    )
  }

  function handleSaveConfig() {
    startTransition(async () => {
      try {
        await updateTierConfig(tier.id, {
          name,
          description: description || null,
          tier_type: tierType,
          billing_cycle: billingCycle,
          tier3_billing_mode: tier3BillingMode,
          active,
          founding_member_eligible: foundingEligible,
          sort_order: parseInt(sortOrder) || 0,
          included_services: includedServices,
        })
        setConfigSaved(true)
        setTimeout(() => setConfigSaved(false), 2000)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to save')
      }
    })
  }

  function handleSavePricing() {
    const monthlyPriceCents = displayToCents(monthlyPrice)
    const perRequestBaseCents = displayToCents(perRequestBase)
    const perItemCents = displayToCents(perItemSurcharge)

    if (perItemCents == null) return toast.error('Invalid per-item surcharge')
    if (parseFloat(rushPremiumPct) < 0) return toast.error('Invalid rush premium')

    const pricingFields = {
      monthly_price_cents: monthlyPriceCents,
      per_request_base_cents: perRequestBaseCents,
      per_item_surcharge_cents: perItemCents,
      rush_premium_pct: parseFloat(rushPremiumPct),
      min_lead_time_hours: parseInt(minLeadHours),
      rush_lead_time_hours: parseInt(rushLeadHours),
      founding_member_discount_pct: parseFloat(foundingDiscountPct),
    }

    const priceChanging = monthlyPriceCents !== tier.monthly_price_cents && tierType === 'subscription'

    if (priceChanging) {
      const ok = confirm(
        'This will create a new Stripe price. Existing subscribers will keep their current price unless you migrate them. Continue?'
      )
      if (!ok) return
    }

    startTransition(async () => {
      try {
        await updateTierPricing(tier.id, pricingFields)
        setPriceSaved(true)
        setTimeout(() => setPriceSaved(false), 2000)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to save pricing')
      }
    })
  }

  function handleStripeSync() {
    setSyncing(true)
    startTransition(async () => {
      try {
        const result = await syncTierToStripe(tier.id)
        if (result && 'priceId' in result) {
          toast.success(`Stripe synced — price ${result.priceId}`)
        } else {
          toast.success('Stripe product updated')
        }
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Stripe sync failed')
      } finally {
        setSyncing(false)
      }
    })
  }

  async function handleDeactivate() {
    const ok = confirm('Deactivate this tier? Existing subscribers will not be affected.')
    if (!ok) return
    try {
      await deactivateTier(tier.id)
      toast.success('Tier deactivated')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to deactivate')
    }
  }

  const currentPriceSubCount = priceSubCounts[tier.stripe_price_id_current ?? ''] ?? 0

  return (
    <div className="space-y-10">
      {/* Config section */}
      <section className="space-y-6">
        <h2 className="font-serif text-lg font-light border-b border-border pb-2">Configuration</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs tracking-[0.12em] uppercase text-muted-foreground font-medium">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs tracking-[0.12em] uppercase text-muted-foreground font-medium">Sort order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="w-24 px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs tracking-[0.12em] uppercase text-muted-foreground font-medium">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs tracking-[0.12em] uppercase text-muted-foreground font-medium">Tier type</label>
            <select
              value={tierType}
              onChange={e => setTierType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none"
            >
              <option value="subscription">Subscription</option>
              <option value="on_demand">On-demand</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs tracking-[0.12em] uppercase text-muted-foreground font-medium">Billing cycle</label>
            <select
              value={billingCycle}
              onChange={e => setBillingCycle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none"
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
              <option value="none">None (on-demand)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs tracking-[0.12em] uppercase text-muted-foreground font-medium">On-demand billing</label>
            <select
              value={tier3BillingMode}
              onChange={e => setTier3BillingMode(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none"
            >
              <option value="on_delivery">On delivery</option>
              <option value="monthly_rollup">Monthly rollup</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground font-medium">Included services</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleService(value)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-full border transition-colors',
                  includedServices.includes(value)
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-muted-foreground hover:border-foreground/40'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={e => setActive(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm">Active (visible for new subscriptions)</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={foundingEligible}
              onChange={e => setFoundingEligible(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm">Founding member eligible</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveConfig}
            className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
          >
            {configSaved ? <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> Saved</span> : 'Save configuration'}
          </button>
          {tier.active && (
            <button
              onClick={handleDeactivate}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              Deactivate tier
            </button>
          )}
        </div>
      </section>

      {/* Pricing section */}
      <section className="space-y-6">
        <h2 className="font-serif text-lg font-light border-b border-border pb-2">Pricing</h2>

        <div className="flex flex-wrap gap-6">
          <PricingField label="Monthly price" value={monthlyPrice} onChange={setMonthlyPrice} />
          <PricingField label="Per-request base" value={perRequestBase} onChange={setPerRequestBase} />
          <PricingField label="Per-item surcharge" value={perItemSurcharge} onChange={setPerItemSurcharge} />
        </div>

        <div className="flex flex-wrap gap-6">
          <PricingField label="Rush premium" value={rushPremiumPct} onChange={setRushPremiumPct} prefix="" suffix="%" />
          <PricingField label="Min lead time" value={minLeadHours} onChange={setMinLeadHours} prefix="" suffix="hours" />
          <PricingField label="Rush lead time" value={rushLeadHours} onChange={setRushLeadHours} prefix="" suffix="hours" />
          <PricingField label="Founding member discount" value={foundingDiscountPct} onChange={setFoundingDiscountPct} prefix="" suffix="%" />
        </div>

        {tierType === 'subscription' && (
          <div className="p-4 rounded-lg bg-muted/40 border border-border text-sm space-y-2">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Stripe:</strong>{' '}
              {tier.stripe_price_id_current
                ? <><span className="font-mono text-xs">{tier.stripe_price_id_current}</span> — {currentPriceSubCount} active subscriber{currentPriceSubCount !== 1 ? 's' : ''}</>
                : 'No Stripe price yet — sync to create one.'}
            </p>
            <p className="text-xs text-muted-foreground">
              Saving a new monthly price creates a new Stripe price. Existing subscribers keep their current price unless migrated.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSavePricing}
            className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
          >
            {priceSaved ? <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> Saved</span> : 'Save pricing'}
          </button>
          {tierType === 'subscription' && (
            <button
              onClick={handleStripeSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
              {syncing ? 'Syncing…' : 'Sync to Stripe'}
            </button>
          )}
        </div>
      </section>

      {/* Pricing change log */}
      {pricingLog.length > 0 && (
        <section className="space-y-4">
          <button
            onClick={() => setShowLog(v => !v)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showLog ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Pricing change log ({pricingLog.length})
          </button>
          {showLog && (
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {pricingLog.map(entry => (
                <div key={entry.id} className="px-5 py-3 flex items-start justify-between gap-4 text-sm">
                  <div>
                    <span className="font-mono text-xs text-muted-foreground">{entry.field}</span>
                    <span className="text-muted-foreground"> changed from </span>
                    <span className="font-mono text-xs">{entry.before_value ?? 'null'}</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="font-mono text-xs">{entry.after_value ?? 'null'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(entry.created_at), 'MMM d, HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
