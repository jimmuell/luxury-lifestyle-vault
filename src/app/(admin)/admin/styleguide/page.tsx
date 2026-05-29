import { Display, H1, H2, H3, Body, BodySmall, Caption, Mono } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <caption className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-medium">{title}</caption>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Sample({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-baseline gap-6">
      <span className="text-[10px] tracking-wider uppercase text-muted-foreground font-mono shrink-0">{label}</span>
      <div>{children}</div>
    </div>
  )
}

export default function StyleguidePage() {
  return (
    <div className="max-w-3xl space-y-12 pb-16">
      <div>
        <H1>Typography</H1>
        <BodySmall className="text-muted-foreground mt-2">
          LLV type scale — Cormorant Garamond (serif), Inter (sans), Geist Mono (mono).
          <br />
          Source: <Mono className="text-xs">src/components/ui/typography.tsx</Mono>
        </BodySmall>
      </div>

      <Separator />

      {/* Serif scale */}
      <Section title="Serif — Cormorant Garamond">
        <Sample label="Display">
          <Display>The art of dressing well.</Display>
        </Sample>
        <Sample label="Display italic">
          <Display italic>The art of dressing well.</Display>
        </Sample>
        <Sample label="H1">
          <H1>Wardrobe Management</H1>
        </Sample>
        <Sample label="H1 italic">
          <H1 italic>Welcome back, Sarah.</H1>
        </Sample>
        <Sample label="H2">
          <H2>Seasonal Collection</H2>
        </Sample>
        <Sample label="H3">
          <H3>Outerwear</H3>
        </Sample>
        <Sample label="H3 italic">
          <H3 italic>Coming this fall.</H3>
        </Sample>
      </Section>

      <Separator />

      {/* Sans scale */}
      <Section title="Sans — Inter">
        <Sample label="Body">
          <Body>Your wardrobe is expertly managed by our team. We handle pickup, cleaning, and seasonal storage so every piece is ready when you need it.</Body>
        </Sample>
        <Sample label="Body small">
          <BodySmall>Your wardrobe is expertly managed by our team. We handle pickup, cleaning, and seasonal storage so every piece is ready when you need it.</BodySmall>
        </Sample>
        <Sample label="Body muted">
          <Body className="text-muted-foreground">Secondary and helper text uses this treatment.</Body>
        </Sample>
        <Sample label="Caption">
          <Caption>Status · Last updated</Caption>
        </Sample>
        <Sample label="Caption muted">
          <Caption className="text-muted-foreground">Table header · Eyebrow label</Caption>
        </Sample>
      </Section>

      <Separator />

      {/* Mono scale */}
      <Section title="Mono — Geist Mono">
        <Sample label="Mono">
          <Mono>LLV-000042</Mono>
        </Sample>
        <Sample label="Mono xs">
          <Mono className="text-xs text-muted-foreground">LLV-000042 · $4,800 · 2024-03-15</Mono>
        </Sample>
      </Section>

      <Separator />

      {/* Polymorphic as prop */}
      <Section title="Polymorphic as prop">
        <Sample label="H2 as h1">
          <H2 as="h1">Rendered as h1, H2 treatment</H2>
        </Sample>
        <Sample label="Body as span">
          <Body as="span">Rendered as span, body treatment</Body>
        </Sample>
        <Sample label="Caption as p">
          <Caption as="p" className="text-muted-foreground">Rendered as p, caption treatment</Caption>
        </Sample>
      </Section>

      <Separator />

      {/* Colors */}
      <Section title="Text colors">
        <Sample label="Foreground">
          <Body>Primary text — obsidian / ivory</Body>
        </Sample>
        <Sample label="Muted">
          <Body className="text-muted-foreground">Secondary text — stone / fog</Body>
        </Sample>
        <Sample label="Gold accent">
          <Body className="text-accent">Accent text — gold. Use sparingly.</Body>
        </Sample>
        <Sample label="Destructive">
          <Body className="text-destructive">Error and destructive states only.</Body>
        </Sample>
      </Section>
    </div>
  )
}
