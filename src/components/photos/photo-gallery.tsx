'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GalleryPhoto {
  id: string
  signedUrl: string
  photoType: string
  caption?: string | null
}

interface PhotoGalleryProps {
  photos: GalleryPhoto[]
  className?: string
}

export function PhotoGallery({ photos, className }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const close = useCallback(() => setLightboxIndex(null), [])
  const prev = useCallback(() => setLightboxIndex(i => (i !== null ? (i - 1 + photos.length) % photos.length : null)), [photos.length])
  const next = useCallback(() => setLightboxIndex(i => (i !== null ? (i + 1) % photos.length : null)), [photos.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, close, prev, next])

  if (photos.length === 0) return null

  const [primary, ...rest] = photos

  return (
    <>
      <div className={cn('space-y-2', className)}>
        {/* Primary photo */}
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="relative w-full aspect-[4/5] rounded-md overflow-hidden bg-muted block"
        >
          <Image
            src={primary.signedUrl}
            alt={primary.caption ?? primary.photoType}
            fill
            className="object-cover hover:scale-[1.02] transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </button>

        {/* Thumbnail strip */}
        {rest.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {rest.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxIndex(i + 1)}
                className="relative aspect-square rounded-md overflow-hidden bg-muted"
              >
                <Image
                  src={photo.signedUrl}
                  alt={photo.caption ?? photo.photoType}
                  fill
                  className="object-cover hover:scale-[1.05] transition-transform duration-300"
                  sizes="25vw"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          <button
            type="button"
            onClick={e => { e.stopPropagation(); close() }}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); prev() }}
                className="absolute left-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); next() }}
                className="absolute right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </>
          )}

          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={photos[lightboxIndex].signedUrl}
              alt={photos[lightboxIndex].caption ?? photos[lightboxIndex].photoType}
              width={1200}
              height={1500}
              className="max-h-[90vh] w-auto object-contain rounded-md"
              style={{ maxWidth: '90vw' }}
            />
            {photos[lightboxIndex].caption && (
              <p className="text-center text-sm text-white/70 mt-2">
                {photos[lightboxIndex].caption}
              </p>
            )}
            {photos.length > 1 && (
              <p className="text-center text-xs text-white/50 mt-1">
                {lightboxIndex + 1} / {photos.length}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
