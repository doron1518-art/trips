'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { RefreshCw, MapPin } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { updateTrip } from '@/lib/actions/trips'
import type { Database } from '@/types/database'

type Trip = Database['public']['Tables']['trips']['Row']

interface Props {
  open: boolean
  onClose: () => void
  trip: Trip
}

export function EditTripModal({ open, onClose, trip }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [destination, setDestination] = useState(trip.destination ?? '')
  const [previewUrl, setPreviewUrl] = useState<string | null>(trip.cover_image_url ?? null)
  const [imgLoading, setImgLoading] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(!!trip.cover_image_url)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync with incoming trip when modal reopens for a different trip
  useEffect(() => {
    if (open) {
      setDestination(trip.destination ?? '')
      setPreviewUrl(trip.cover_image_url ?? null)
      setImgLoaded(!!trip.cover_image_url)
      setError(null)
    }
  }, [open, trip])

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await updateTrip(trip.id, new FormData(e.currentTarget))
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="✏️ Edit trip">
      <form key={trip.id} onSubmit={handleSubmit} className="space-y-4">

        {/* Image preview */}
        <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100">
          {imgLoading && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-sky-100 via-blue-200 to-sky-100" />
          )}
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Destination preview"
              onLoad={() => setImgLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
          {!previewUrl && !imgLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sky-400">
              <MapPin className="w-8 h-8 opacity-40" />
              <p className="text-xs font-medium text-sky-500/70">Type a destination to preview a photo</p>
            </div>
          )}
          {previewUrl && imgLoaded && (
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
          )}
          {previewUrl && !imgLoading && (
            <button
              type="button"
              onClick={() => fetchImage(destination)}
              className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-white text-xs font-medium backdrop-blur-sm transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              New photo
            </button>
          )}
        </div>

        <input type="hidden" name="cover_image_url" value={previewUrl ?? ''} />

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <Input label="Trip name" name="title" required defaultValue={trip.title} />

        <Input
          label="Destination"
          name="destination"
          placeholder="e.g. Tokyo, Japan"
          value={destination}
          onChange={handleDestinationChange}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Start date" name="start_date" type="date" defaultValue={trip.start_date ?? ''} />
          <Input label="End date" name="end_date" type="date" defaultValue={trip.end_date ?? ''} />
        </div>

        <Textarea label="Description" name="description" defaultValue={trip.description ?? ''} rows={2} />

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={loading}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}
