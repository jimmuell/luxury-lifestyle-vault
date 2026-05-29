'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createItem } from '@/actions/items'
import { PhotoUpload } from '@/components/photos/photo-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ITEM_CATEGORY_LABELS } from '@/types/app'
import type { ItemCategory } from '@/types/app'
import { cn } from '@/lib/utils'

const STEPS = ['Category', 'Details', 'Notes', 'Confirm', 'Photos'] as const
type Step = 0 | 1 | 2 | 3 | 4

const CATEGORIES = Object.entries(ITEM_CATEGORY_LABELS) as [ItemCategory, string][]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Adding to vault…' : 'Add to vault'}
    </Button>
  )
}

export function IntakeForm({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(0)
  const [category, setCategory] = useState<ItemCategory | ''>('')
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [material, setMaterial] = useState('')
  const [description, setDescription] = useState('')
  const [careInstructions, setCareInstructions] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [itemId, setItemId] = useState<string | null>(null)
  const [photoCount, setPhotoCount] = useState(0)

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createItem(formData)
    if (!result || 'error' in result) {
      setError(result?.error ?? 'Unknown error')
      return
    }
    setItemId(result.itemId)
    setStep(4)
  }

  function handleDone() {
    if (itemId) router.push(`/client/wardrobe/${itemId}`)
  }

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 flex-wrap">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                i === step
                  ? 'bg-foreground text-background'
                  : i < step
                  ? 'bg-accent text-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span
              className={cn(
                'text-xs',
                i === step ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="h-px w-6 bg-border mx-1" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm px-4 py-3 rounded-md bg-destructive/10 text-destructive">
          {error}
        </p>
      )}

      {/* Steps 0–3 share the form */}
      {step < 4 && (
        <form action={handleSubmit}>
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="brand" value={brand} />
          <input type="hidden" name="color" value={color} />
          <input type="hidden" name="size" value={size} />
          <input type="hidden" name="material" value={material} />
          <input type="hidden" name="description" value={description} />
          <input type="hidden" name="care_instructions" value={careInstructions} />

          {/* Step 0: Category */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                What type of item is this?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.filter(([key]) => key !== 'other').map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={cn(
                      'px-4 py-3 rounded-md border text-sm text-left transition-colors',
                      category === key
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border hover:border-foreground/50'
                    )}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCategory('other')}
                  className={cn(
                    'px-4 py-3 rounded-md border text-sm text-left transition-colors',
                    category === 'other'
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:border-foreground/50'
                  )}
                >
                  Other
                </button>
              </div>
              <Button
                type="button"
                onClick={() => setStep(1)}
                disabled={!category}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Burberry trench coat"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Burberry"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Camel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g. M, 8, 42"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g. 100% Cashmere"
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1">
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!name}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Notes */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description or notes</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any details you'd like us to know about this item…"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="care_instructions">Care instructions</Label>
                <Textarea
                  id="care_instructions"
                  value={careInstructions}
                  onChange={(e) => setCareInstructions(e.target.value)}
                  placeholder="Dry clean only, hand wash in cold water, etc."
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(3)} className="flex-1">
                  Review
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-md border border-border p-5 space-y-3 bg-card">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <span>{category ? ITEM_CATEGORY_LABELS[category as ItemCategory] : '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span>{name || '—'}</span>
                </div>
                {brand && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Brand</span>
                    <span>{brand}</span>
                  </div>
                )}
                {color && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Color</span>
                    <span>{color}</span>
                  </div>
                )}
                {size && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Size</span>
                    <span>{size}</span>
                  </div>
                )}
                {material && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Material</span>
                    <span>{material}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <div className="flex-1">
                  <SubmitButton />
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {/* Step 4: Photos */}
      {step === 4 && itemId && (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Item added successfully. Upload photos to catalog this piece — you can always add more later.
            </p>
          </div>
          <PhotoUpload
            itemId={itemId}
            clientId={clientId}
            photoType="intake_front"
            onUpload={() => setPhotoCount(c => c + 1)}
          />
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleDone} className="flex-1">
              {photoCount > 0 ? 'Skip' : 'Skip for now'}
            </Button>
            <Button type="button" onClick={handleDone} className="flex-1">
              {photoCount > 0 ? `Done · ${photoCount} photo${photoCount !== 1 ? 's' : ''}` : 'View item'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
