'use client'

import { useRef, useState, useCallback } from 'react'
import { uploadItemPhoto, type PhotoType, type UploadedPhoto } from '@/lib/storage/upload-photo'
import { triggerPhotoAnalysis } from '@/actions/photos'
import { cn } from '@/lib/utils'
import { Upload, X, Check, ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface FileEntry {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
  photo?: UploadedPhoto
}

interface PhotoUploadProps {
  itemId: string
  clientId: string
  photoType?: PhotoType
  existingCount?: number
  maxPhotos?: number
  onUpload?: (photo: UploadedPhoto) => void
  className?: string
}

export function PhotoUpload({
  itemId,
  clientId,
  photoType = 'intake_front',
  existingCount = 0,
  maxPhotos = 8,
  onUpload,
  className,
}: PhotoUploadProps) {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const entriesRef = useRef(entries)
  entriesRef.current = entries

  const remaining = maxPhotos - existingCount - entries.length

  async function processFile(file: File, entryId: string, sortOrder: number) {
    setEntries(prev =>
      prev.map(e => (e.id === entryId ? { ...e, status: 'uploading' } : e))
    )
    try {
      const photo = await uploadItemPhoto({ clientId, itemId, file, photoType, sortOrder })
      setEntries(prev =>
        prev.map(e => (e.id === entryId ? { ...e, status: 'done', photo } : e))
      )
      onUpload?.(photo)
      // Fire AI categorization asynchronously — don't await, don't block UI
      triggerPhotoAnalysis({ photoId: photo.id, storagePath: photo.storagePath, itemId }).catch(() => {})
    } catch (err) {
      setEntries(prev =>
        prev.map(e => (e.id === entryId ? { ...e, status: 'error', error: String(err) } : e))
      )
    }
  }

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const current = entriesRef.current
      const fileArray = Array.from(files).slice(0, maxPhotos - existingCount - current.length)
      if (fileArray.length === 0) return

      const newEntries: FileEntry[] = fileArray.map(file => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const,
      }))

      const startOrder = existingCount + current.length
      setEntries(prev => [...prev, ...newEntries])
      newEntries.forEach((entry, i) => processFile(entry.file, entry.id, startOrder + i))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clientId, itemId, photoType, existingCount, maxPhotos]
  )

  function removeEntry(id: string) {
    setEntries(prev => {
      const entry = prev.find(e => e.id === id)
      if (entry?.preview) URL.revokeObjectURL(entry.preview)
      return prev.filter(e => e.id !== id)
    })
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }
  function onDragLeave() {
    setDragging(false)
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {remaining > 0 && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-8 text-center cursor-pointer transition-colors',
            dragging
              ? 'border-foreground bg-muted/50'
              : 'border-border hover:border-foreground/40 hover:bg-muted/30'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            className="sr-only"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {dragging ? 'Drop photos here' : 'Upload photos'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              JPEG, PNG, WebP, HEIC · up to 10 MB each · {remaining} remaining
            </p>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {entries.map(entry => (
            <div key={entry.id} className="relative aspect-square rounded-md overflow-hidden bg-muted group">
              <Image
                src={entry.preview}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
              <div className={cn(
                'absolute inset-0 flex items-center justify-center transition-colors',
                entry.status === 'uploading' && 'bg-background/40',
                entry.status === 'error' && 'bg-destructive/20',
              )}>
                {entry.status === 'uploading' && (
                  <div className="h-5 w-5 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
                )}
                {entry.status === 'done' && (
                  <div className="h-6 w-6 rounded-full bg-foreground flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-background" />
                  </div>
                )}
                {entry.status === 'error' && (
                  <div className="absolute inset-0 p-1.5 flex items-end">
                    <p className="text-xs text-destructive-foreground bg-destructive/80 rounded px-1.5 py-0.5 line-clamp-2">
                      {entry.error?.replace('Error: ', '')}
                    </p>
                  </div>
                )}
              </div>
              {entry.status !== 'uploading' && (
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {remaining > 0 && entries.length > 0 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-md border-2 border-dashed border-border flex items-center justify-center hover:border-foreground/40 transition-colors"
            >
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
