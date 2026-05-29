import { cn } from '@/lib/utils'
import type { ComponentPropsWithoutRef, ElementType } from 'react'

type PolymorphicProps<T extends ElementType> = ComponentPropsWithoutRef<T> & {
  as?: T
  className?: string
}

// Serif components accept an italic prop — italic Cormorant is the signature voice
type SerifProps<T extends ElementType> = PolymorphicProps<T> & {
  italic?: boolean
}

export function Display<T extends ElementType = 'p'>({
  as,
  italic,
  className,
  ...props
}: SerifProps<T>) {
  const Tag = (as ?? 'p') as ElementType
  return (
    <Tag
      className={cn('text-5xl font-serif font-light leading-snug tracking-tight', italic && 'italic', className)}
      {...props}
    />
  )
}

export function H1<T extends ElementType = 'h1'>({
  as,
  italic,
  className,
  ...props
}: SerifProps<T>) {
  const Tag = (as ?? 'h1') as ElementType
  return (
    <Tag
      className={cn('text-4xl font-serif font-normal leading-snug', italic && 'italic', className)}
      {...props}
    />
  )
}

export function H2<T extends ElementType = 'h2'>({
  as,
  italic,
  className,
  ...props
}: SerifProps<T>) {
  const Tag = (as ?? 'h2') as ElementType
  return (
    <Tag
      className={cn('text-2xl font-serif font-normal leading-snug', italic && 'italic', className)}
      {...props}
    />
  )
}

export function H3<T extends ElementType = 'h3'>({
  as,
  italic,
  className,
  ...props
}: SerifProps<T>) {
  const Tag = (as ?? 'h3') as ElementType
  return (
    <Tag
      className={cn('text-xl font-serif font-medium leading-snug', italic && 'italic', className)}
      {...props}
    />
  )
}

export function Body<T extends ElementType = 'p'>({
  as,
  className,
  ...props
}: PolymorphicProps<T>) {
  const Tag = (as ?? 'p') as ElementType
  return (
    <Tag
      className={cn('text-base leading-relaxed', className)}
      {...props}
    />
  )
}

export function BodySmall<T extends ElementType = 'p'>({
  as,
  className,
  ...props
}: PolymorphicProps<T>) {
  const Tag = (as ?? 'p') as ElementType
  return (
    <Tag
      className={cn('text-sm leading-relaxed', className)}
      {...props}
    />
  )
}

export function Caption<T extends ElementType = 'span'>({
  as,
  className,
  ...props
}: PolymorphicProps<T>) {
  const Tag = (as ?? 'span') as ElementType
  return (
    <Tag
      className={cn('text-xs font-medium uppercase tracking-wider', className)}
      {...props}
    />
  )
}

export function Mono<T extends ElementType = 'span'>({
  as,
  className,
  ...props
}: PolymorphicProps<T>) {
  const Tag = (as ?? 'span') as ElementType
  return (
    <Tag
      className={cn('font-mono text-sm', className)}
      {...props}
    />
  )
}
