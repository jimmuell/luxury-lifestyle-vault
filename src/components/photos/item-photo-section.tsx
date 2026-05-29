'use client'

import { useRouter } from 'next/navigation'
import { PhotoGallery, type GalleryPhoto } from './photo-gallery'
import { PhotoUpload } from './photo-upload'
import { AiAnalysisBadge } from './ai-analysis-badge'
import { Separator } from '@/components/ui/separator'
import type { Json } from '@/types/database'

interface PhotoWithAnalysis extends GalleryPhoto {
  aiAnalysis?: Json | null
}

interface ItemPhotoSectionProps {
  photos: PhotoWithAnalysis[]
  itemId: string
  clientId: string
}

export function ItemPhotoSection({ photos, itemId, clientId }: ItemPhotoSectionProps) {
  const router = useRouter()

  // Show AI analysis from the first photo that has it
  const analysisPhoto = photos.find(p => p.aiAnalysis)

  return (
    <div className="space-y-4">
      {photos.length > 0 ? (
        <PhotoGallery photos={photos} />
      ) : (
        <div className="aspect-[4/5] bg-muted rounded-md flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No photos yet</p>
        </div>
      )}

      {analysisPhoto?.aiAnalysis && (
        <AiAnalysisBadge analysis={analysisPhoto.aiAnalysis} />
      )}

      <Separator />

      <div className="space-y-2">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
          Add photos
        </p>
        <PhotoUpload
          itemId={itemId}
          clientId={clientId}
          photoType="intake_front"
          existingCount={photos.length}
          onUpload={() => router.refresh()}
        />
      </div>
    </div>
  )
}
