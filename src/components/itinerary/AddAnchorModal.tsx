'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { AttachmentUploader } from '@/components/ui/AttachmentUploader'
import { addItineraryItem, updateItineraryItem } from '@/lib/actions/itinerary'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Item = Database['public']['Tables']['itinerary_items']['Row']

const TYPE_OPTIONS = [
  { value: 'event',      label: '🎯  Event' },
  { value: 'hotel',      label: '🏨  Hotel / Accommodation' },
  { value: 'transit',    label: '✈️  Transit / Transport' },
  { value: 'restaurant', label: '🍽️  Restaurant / Bar' },
  { value: 'concert',    label: '🎤  Concert & Party 🥳' },
  { value: 'tour',       label: '🚶‍♂️  Tour' },
  { value: 'other',      label: '📌  Other' },
]

interface Props {
  open: boolean
  onClose: () => void
  tripId: string
  defaultDate?: string
  editItem?: Item
}

export function AddAnchorModal({ open, onClose, tripId, defaultDate = '', editItem }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([])
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const isEditing = !!editItem

  useEffect(() => {
    if (open) {
      setAttachmentUrls(editItem?.attachment_urls ?? [])
      setAttachmentFiles([])
      setError(null)
    }
  }, [open, editItem?.id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Capture before any awaits — e.currentTarget becomes null after the first await
    const form = e.currentTarget
    const fd = new FormData(form)
    setLoading(true)
    setError(null)

    // Upload new attachment files
    const supabase = createClient()
    const uploadedUrls: string[] = []
    for (const file of attachmentFiles) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60)
      const path = `${tripId}/${Date.now()}-${safeName}`
      const { error: uploadErr } = await supabase.storage.from('attachments').upload(path, file, {
        contentType: file.type,
        upsert: false,
      })
      if (uploadErr) { setError(uploadErr.message); setLoading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(path)
      uploadedUrls.push(publicUrl)
    }
    const finalAttachmentUrls = [...attachmentUrls, ...uploadedUrls]

    const result = isEditing
      ? await updateItineraryItem(tripId, editItem.id, fd, finalAttachmentUrls)
      : await addItineraryItem(tripId, fd, finalAttachmentUrls)

    setLoading(false)
    if (result?.error) { setError(result.error); return }
    if (!isEditing) form.reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? '✏️ Edit anchor' : '➕ Add anchor'}>
      <form key={editItem?.id ?? 'new'} onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" name="date" type="date" required defaultValue={editItem?.date ?? defaultDate} />
          <Input label="Time" name="time" type="time" defaultValue={editItem?.time?.slice(0, 5) ?? ''} />
        </div>

        <Input label="Title" name="title" required placeholder="e.g. Check-in at hotel" defaultValue={editItem?.title ?? ''} />

        <Select label="Type" name="type" required options={TYPE_OPTIONS} defaultValue={editItem?.type ?? 'event'} />

        <Input label="Location" name="location" placeholder="e.g. Shinjuku, Tokyo" defaultValue={editItem?.location ?? ''} />

        <Textarea label="Notes" name="description" placeholder="Any details, confirmation numbers, links…" rows={3} defaultValue={editItem?.description ?? ''} />

        <AttachmentUploader
          existingUrls={attachmentUrls}
          onRemoveExisting={(idx) => setAttachmentUrls((p) => p.filter((_, i) => i !== idx))}
          pendingFiles={attachmentFiles}
          onAddFiles={(files) => setAttachmentFiles((p) => [...p, ...files])}
          onRemovePending={(idx) => setAttachmentFiles((p) => p.filter((_, i) => i !== idx))}
          disabled={loading}
        />

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={loading}>
            {isEditing ? 'Save changes' : 'Add anchor'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
