'use client'

import { useState, useTransition, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { updateProfile, completeOnboarding, updatePreferredContact } from '@/actions/profile'
import { createAddress } from '@/actions/addresses'
import { createSetupIntent, activateAndComplete } from '@/actions/stripe'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Check, Star } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const STEPS = ['Profile', 'Primary home', 'Seasonal home', 'Your tier', 'Payment', 'Review'] as const
type Step = 0 | 1 | 2 | 3 | 4 | 5

const CONTACT_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'Text / SMS' },
  { value: 'phone', label: 'Phone call' },
]

interface Tier {
  id: string
  name: string
  description: string | null
  monthly_price_cents: number | null
  tier_type: string
  founding_member_eligible: boolean
  stripe_price_id_current: string | null
  included_services: string[]
}

interface OnboardingFlowProps {
  initialFullName: string | null
  initialPhone: string | null
  initialEmail: string
  tiers: Tier[]
  isFoundingMember: boolean
}

// ── Stripe inner form ─────────────────────────────────────────────────────────

function PaymentForm({ onComplete }: { onComplete: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    if (!stripe || !elements) return
    setIsSubmitting(true)

    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: `${window.location.origin}/client` },
      redirect: 'if_required',
    })

    if (error) {
      toast.error(error.message ?? 'Payment setup failed')
      setIsSubmitting(false)
      return
    }

    onComplete()
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <PaymentElement options={{ layout: 'accordion' }} />
      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={!stripe || !elements || isSubmitting}
      >
        {isSubmitting ? 'Confirming…' : 'Save payment method →'}
      </Button>
    </div>
  )
}

// ── Payment step wrapper ──────────────────────────────────────────────────────

function PaymentStep({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    createSetupIntent()
      .then(({ clientSecret }) => setClientSecret(clientSecret))
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to initialize payment'))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-light">Payment method</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Securely add a card for your membership billing. Nothing is charged today.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : !clientSecret ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Preparing secure form…</div>
      ) : (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'flat',
              variables: { colorPrimary: '#1a1a1a', colorBackground: '#ffffff', borderRadius: '8px' },
            },
          }}
        >
          <PaymentForm onComplete={onComplete} />
        </Elements>
      )}

      <button
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back
      </button>
    </div>
  )
}

// ── Main flow ─────────────────────────────────────────────────────────────────

export function OnboardingFlow({
  initialFullName,
  initialPhone,
  initialEmail,
  tiers,
  isFoundingMember,
}: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>(0)
  const [pending, startTransition] = useTransition()

  // Step 0 state
  const [fullName, setFullName] = useState(initialFullName ?? '')
  const [phone, setPhone] = useState(initialPhone ?? '')
  const [contactMethod, setContactMethod] = useState('email')

  // Step 1 — primary address
  const [primaryLabel, setPrimaryLabel] = useState('')
  const [primaryLine1, setPrimaryLine1] = useState('')
  const [primaryLine2, setPrimaryLine2] = useState('')
  const [primaryCity, setPrimaryCity] = useState('')
  const [primaryState, setPrimaryState] = useState('')
  const [primaryPostal, setPrimaryPostal] = useState('')
  const [primaryInstructions, setPrimaryInstructions] = useState('')

  // Step 2 — seasonal address
  const [seasonalLabel, setSeasonalLabel] = useState('')
  const [seasonalLine1, setSeasonalLine1] = useState('')
  const [seasonalLine2, setSeasonalLine2] = useState('')
  const [seasonalCity, setSeasonalCity] = useState('')
  const [seasonalState, setSeasonalState] = useState('')
  const [seasonalPostal, setSeasonalPostal] = useState('')
  const [seasonalInstructions, setSeasonalInstructions] = useState('')

  // Step 3 — tier
  const [selectedTierId, setSelectedTierId] = useState('')

  // Subscription tiers only
  const subscriptionTiers = tiers.filter(t => t.tier_type === 'subscription' && t.stripe_price_id_current)

  function discountedPrice(tier: Tier): number {
    const base = tier.monthly_price_cents ?? 0
    if (isFoundingMember && tier.founding_member_eligible) {
      return Math.round(base * 0.8) // 20% founding member discount
    }
    return base
  }

  async function handleStep0() {
    const formData = new FormData()
    formData.set('full_name', fullName)
    formData.set('phone', phone)
    startTransition(async () => {
      const [profileResult, contactResult] = await Promise.all([
        updateProfile(formData),
        updatePreferredContact(contactMethod),
      ])
      if ('error' in profileResult) { toast.error(profileResult.error); return }
      if ('error' in contactResult) { toast.error(contactResult.error); return }
      setStep(1)
    })
  }

  async function handleStep1() {
    const formData = new FormData()
    formData.set('label', primaryLabel || 'Primary home')
    formData.set('line1', primaryLine1)
    formData.set('line2', primaryLine2)
    formData.set('city', primaryCity)
    formData.set('state', primaryState)
    formData.set('postal_code', primaryPostal)
    formData.set('country', 'US')
    formData.set('delivery_instructions', primaryInstructions)
    formData.set('is_primary', 'true')
    startTransition(async () => {
      const result = await createAddress(formData)
      if ('error' in result) { toast.error(result.error); return }
      setStep(2)
    })
  }

  async function handleStep2(skip: boolean) {
    if (skip || !seasonalLine1 || !seasonalCity || !seasonalState || !seasonalPostal) {
      setStep(3); return
    }
    const formData = new FormData()
    formData.set('label', seasonalLabel || 'Seasonal home')
    formData.set('line1', seasonalLine1)
    formData.set('line2', seasonalLine2)
    formData.set('city', seasonalCity)
    formData.set('state', seasonalState)
    formData.set('postal_code', seasonalPostal)
    formData.set('country', 'US')
    formData.set('delivery_instructions', seasonalInstructions)
    startTransition(async () => {
      const result = await createAddress(formData)
      if ('error' in result) { toast.error(result.error); return }
      setStep(3)
    })
  }

  async function handleActivate() {
    if (!selectedTierId) { toast.error('Please select a tier'); return }
    startTransition(async () => {
      try {
        await activateAndComplete(selectedTierId)
        window.location.href = '/client'
      } catch (e) {
        // Normalize error message regardless of how Next.js serializes server action errors
        const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? String(e)
        console.error('handleActivate: activateAndComplete failed:', msg)
        // Stripe-related failures: complete onboarding anyway; concierge reconciles billing
        if (
          msg.includes('not synced to Stripe') ||
          msg.includes('no stripe customer') ||
          msg.includes('Stripe customer not found')
        ) {
          toast.warning('Membership activated. Billing will be configured by your concierge.')
          await completeOnboarding()
          window.location.href = '/client'
        } else {
          toast.error(msg || 'Failed to activate membership')
        }
      }
    })
  }

  const selectedTier = tiers.find(t => t.id === selectedTierId)

  return (
    <div className="space-y-10">
      {/* Step indicator */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
              i === step ? 'bg-foreground text-background'
                : i < step ? 'bg-foreground/20 text-foreground'
                : 'bg-muted text-muted-foreground'
            )}>
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span className={cn('text-xs hidden sm:inline', i === step ? 'text-foreground' : 'text-muted-foreground')}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px w-3 sm:w-5 bg-border mx-0.5" />}
          </div>
        ))}
      </div>

      {/* Step 0: Profile */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-light">Tell us about yourself</h2>
            <p className="text-sm text-muted-foreground mt-1">Your concierge team will use this to personalize your experience.</p>
          </div>

          {isFoundingMember && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50/60">
              <Star className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">Welcome, founding member — your first 12 months are 20% off.</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name *</Label>
              <Input id="full_name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Alexandra Whitmore" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (414) 555-0100" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Preferred contact method</p>
              <div className="flex gap-2">
                {CONTACT_METHODS.map(m => (
                  <button key={m.value} type="button" onClick={() => setContactMethod(m.value)}
                    className={cn('flex-1 py-2 px-3 rounded-md border text-sm transition-colors',
                      contactMethod === m.value ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40')}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-xs text-muted-foreground">Account email</p>
              <p className="text-sm">{initialEmail}</p>
            </div>
          </div>

          <Button className="w-full" onClick={handleStep0} disabled={!fullName || pending}>
            {pending ? 'Saving…' : 'Continue'}
          </Button>
        </div>
      )}

      {/* Step 1: Primary address */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-light">Your primary home</h2>
            <p className="text-sm text-muted-foreground mt-1">Where should we deliver your wardrobe?</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-label">Address label</Label>
              <Input id="p-label" value={primaryLabel} onChange={e => setPrimaryLabel(e.target.value)} placeholder="e.g. Brookfield primary, Scottsdale winter" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-line1">Street address *</Label>
              <Input id="p-line1" value={primaryLine1} onChange={e => setPrimaryLine1(e.target.value)} placeholder="123 Main Street" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-line2">Apt, suite, unit</Label>
              <Input id="p-line2" value={primaryLine2} onChange={e => setPrimaryLine2(e.target.value)} placeholder="Apt 4B" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="p-city">City *</Label>
                <Input id="p-city" value={primaryCity} onChange={e => setPrimaryCity(e.target.value)} placeholder="Scottsdale" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-state">State *</Label>
                <Input id="p-state" value={primaryState} onChange={e => setPrimaryState(e.target.value)} placeholder="AZ" maxLength={2} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-postal">Postal code *</Label>
              <Input id="p-postal" value={primaryPostal} onChange={e => setPrimaryPostal(e.target.value)} placeholder="85251" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-instructions">Delivery instructions</Label>
              <Textarea id="p-instructions" value={primaryInstructions} onChange={e => setPrimaryInstructions(e.target.value)} placeholder="Gate code, concierge desk, etc." rows={2} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)} className="flex-1" disabled={pending}>Back</Button>
            <Button className="flex-1" onClick={handleStep1} disabled={!primaryLine1 || !primaryCity || !primaryState || !primaryPostal || pending}>
              {pending ? 'Saving…' : 'Continue'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Seasonal address */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-light">Seasonal residence</h2>
            <p className="text-sm text-muted-foreground mt-1">Add your second home for bi-directional wardrobe service. Skip for now if needed.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-label">Address label</Label>
              <Input id="s-label" value={seasonalLabel} onChange={e => setSeasonalLabel(e.target.value)} placeholder="e.g. Scottsdale winter, Brookfield summer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-line1">Street address</Label>
              <Input id="s-line1" value={seasonalLine1} onChange={e => setSeasonalLine1(e.target.value)} placeholder="456 Desert Drive" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-line2">Apt, suite, unit</Label>
              <Input id="s-line2" value={seasonalLine2} onChange={e => setSeasonalLine2(e.target.value)} placeholder="Unit 12" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="s-city">City</Label>
                <Input id="s-city" value={seasonalCity} onChange={e => setSeasonalCity(e.target.value)} placeholder="Scottsdale" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-state">State</Label>
                <Input id="s-state" value={seasonalState} onChange={e => setSeasonalState(e.target.value)} placeholder="AZ" maxLength={2} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-postal">Postal code</Label>
              <Input id="s-postal" value={seasonalPostal} onChange={e => setSeasonalPostal(e.target.value)} placeholder="85251" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-instructions">Delivery instructions</Label>
              <Textarea id="s-instructions" value={seasonalInstructions} onChange={e => setSeasonalInstructions(e.target.value)} placeholder="Gate code, concierge desk, etc." rows={2} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handleStep2(true)} className="flex-1" disabled={pending}>Skip for now</Button>
            <Button className="flex-1" onClick={() => handleStep2(false)} disabled={pending}>
              {pending ? 'Saving…' : 'Continue'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Tier comparison */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-light">Choose your tier</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isFoundingMember
                ? 'As a founding member, your first 12 months are 20% off on eligible tiers.'
                : 'Select the membership that fits your lifestyle.'}
            </p>
          </div>

          <div className="space-y-3">
            {subscriptionTiers.map(tier => {
              const price = discountedPrice(tier)
              const originalPrice = tier.monthly_price_cents ?? 0
              const hasDiscount = isFoundingMember && tier.founding_member_eligible && price < originalPrice
              const isSelected = selectedTierId === tier.id

              return (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTierId(tier.id)}
                  className={cn(
                    'w-full text-left rounded-lg border p-5 transition-all',
                    isSelected ? 'border-foreground bg-foreground/5' : 'border-border bg-card hover:border-foreground/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{tier.name}</p>
                        {isSelected && <Check className="h-3.5 w-3.5 text-foreground" />}
                      </div>
                      {tier.description && (
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{tier.description}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {hasDiscount && (
                        <p className="text-xs text-muted-foreground line-through">${(originalPrice / 100).toFixed(0)}/mo</p>
                      )}
                      <p className={cn('text-sm font-medium', hasDiscount && 'text-amber-700')}>
                        ${(price / 100).toFixed(0)}/mo
                      </p>
                      {hasDiscount && (
                        <p className="text-[10px] text-amber-600 mt-0.5">Founding member</p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}

            {subscriptionTiers.length === 0 && (
              <div className="rounded-lg border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground">
                  Your concierge team will confirm your tier. Continue to complete setup.
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            On-demand requests are available as an add-on with any subscription.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
            <Button
              className="flex-1"
              onClick={() => setStep(4)}
              disabled={subscriptionTiers.length > 0 && !selectedTierId}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 4 && (
        <PaymentStep onComplete={() => setStep(5)} onBack={() => setStep(3)} />
      )}

      {/* Step 5: Review & activate */}
      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-light">Review & activate</h2>
            <p className="text-sm text-muted-foreground mt-1">Confirm your membership details before we begin.</p>
          </div>

          <div className="space-y-3">
            {selectedTier && (
              <div className="rounded-lg border border-border bg-card p-5 space-y-2">
                <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Selected tier</p>
                <p className="font-medium">{selectedTier.name}</p>
                <p className="text-sm text-muted-foreground">{selectedTier.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-sm text-muted-foreground">Monthly billing</p>
                  <p className="text-sm font-medium">
                    ${(discountedPrice(selectedTier) / 100).toFixed(0)}/mo
                    {isFoundingMember && selectedTier.founding_member_eligible && (
                      <span className="ml-1.5 text-amber-600 font-normal text-xs">founding member rate</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {!selectedTier && (
              <div className="rounded-lg border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground">No tier selected — your concierge will confirm billing.</p>
              </div>
            )}

            <div className="rounded-lg border border-border bg-card px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">First charge</p>
                <p className="text-sm">After your first rotation is complete</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(4)} className="flex-1" disabled={pending}>Back</Button>
            <Button
              className="flex-1"
              onClick={handleActivate}
              disabled={pending}
            >
              {pending ? 'Activating…' : 'Confirm & start membership →'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
