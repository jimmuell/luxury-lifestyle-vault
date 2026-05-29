'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Photo {
  id: string
  signedUrl: string
  caption: string | null
  photoType: string | null
}

export function ItemPhotoCarousel({ photos }: { photos: Photo[] }) {
  const [current, setCurrent] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (photos.length === 0) {
    return (
      <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No photos</p>
      </div>
    )
  }

  function prev() {
    setCurrent(i => (i - 1 + photos.length) % photos.length)
  }

  function next() {
    setCurrent(i => (i + 1) % photos.length)
  }

  const photo = photos[current]

  return (
    <>
      {/* Main carousel */}
      <div className="space-y-3">
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted group">
          <Image
            src={photo.signedUrl}
            alt={photo.caption ?? 'Item photo'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          {/* Lightbox trigger */}
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute top-3 right-3 p-2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="View full size"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Dot indicators + thumbnail strip */}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setCurrent(i)}
                className={cn(
                  'flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-colors',
                  i === current ? 'border-foreground' : 'border-transparent opacity-60 hover:opacity-100'
                )}
              >
                <Image
                  src={p.signedUrl}
                  alt={`Photo ${i + 1}`}
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative w-full h-[80vh]">
              <Image
                src={photo.signedUrl}
                alt={photo.caption ?? 'Item photo'}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 75vw"
              />
            </div>

            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-3 right-3 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {photos.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {photo.caption && (
              <p className="text-center text-sm text-white/60 mt-3">{photo.caption}</p>
            )}
            <p className="text-center text-xs text-white/40 mt-1">{current + 1} / {photos.length}</p>
          </div>
        </div>
      )}
    </>
  )
}
