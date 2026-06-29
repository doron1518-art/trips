'use client'

import { useActionState, useEffect, useState, useRef, useCallback } from 'react'
import { RefreshCw, MapPin } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { createTrip } from '@/lib/actions/trips'

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateTripModal({ open, onClose }: Props) {
  const [state, formAction, isPending] = useActionState(createTrip, null)

  const [destination, setDestination] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imgLoading, setImgLoading] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (state?.success) onClose()
  }, [state, onClose])

  // Reset state whenever modal reopens
  useEffect(() => {
    if (open) return
    setDestination('')
    setPreviewUrl(null)
    setImgLoaded(false)
  }, [open])

  const fetchImage = useCallback(async (query: string) => {
    if (!query.trim()) { setPreviewUrl(null); return }
    setImgLoading(true)
    setImgLoaded(false)
    try {
      const res = await fetch(`/api/destination-image?q=${encodeURIComponent(query)}`)
      const data = await res.json() as { url: string | null }
      setPreviewUrl(data.url ?? null)
    } catch {
      setPreviewUrl(null)
    } finally {
      setImgLoading(false)
    }
  }, [])

  function handleDestinationChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setDestination(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchImage(val), 750)
  }

  return (
    <Modal open={open} onClose={onClose} title="✈️ New trip">
      <form action={formAction} className="space-y-4">

        {/* Destination image preview */}
        <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100">
          {/* Skeleton shimmer while loading */}
          {imgLoading && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-sky-100 via-blue-200 to-sky-100 bg-[length:200%_100%]" />
          )}

          {/* Loaded photo */}
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Destination preview"
              onLoad={() => setImgLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}

          {/* Overlay gradient so the "no image" state looks nice */}
          {!previewUrl && !imgLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sky-400">
              <MapPin className="w-8 h-8 opacity-40" />
              <p className="text-xs font-medium text-sky-500/70">Type a destination to preview a photo</p>
            </div>
          )}

          {/* Dark gradient overlay at bottom for readability */}
          {previewUrl && imgLoaded && (
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
          )}

          {/* Refresh button */}
          {previewUrl && !imgLoading && (
            <button
              type="button"
              onClick={() => fetchImage(destination)}
              title="Try a different photo"
              className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-white text-xs font-medium backdrop-blur-sm transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              New photo
            </button>
          )}
        </div>

        {/* Hidden field carries the image URL into the server action */}
        <input type="hidden" name="cover_image_url" value={previewUrl ?? ''} />

        {state?.error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <Input label="Trip name" name="title" required placeholder="e.g. Summer in Japan" />

        <Input
          label="Destination"
          name="destination"
          placeholder="e.g. Tokyo, Japan"
          value={destination}
          onChange={handleDestinationChange}
          hint={destination && !previewUrl && !imgLoading ? 'No photo found — the gradient will be used instead.' : undefined}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Start date" name="start_date" type="date" />
          <Input label="End date" name="end_date" type="date" />
        </div>

        <Textarea label="Description" name="description" placeholder="What's this trip about?" rows={2} />

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={isPending}>
            Create trip
          </Button>
        </div>
      </form>
    </Modal>
  )
}
