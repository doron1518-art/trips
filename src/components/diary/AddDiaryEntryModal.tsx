'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { AttachmentUploader } from '@/components/ui/AttachmentUploader'
import { addDiaryEntry, updateDiaryEntry } from '@/lib/actions/diary'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Entry = Database['public']['Tables']['diary_entries']['Row']

interface Props {
  open: boolean
  onClose: () => void
  tripId: string
  editEntry?: Entry
}

export function AddDiaryEntryModal({ open, onClose, tripId, editEntry }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([])
  const [newPreviews, setNewPreviews] = useState<{ url: string; file: File }[]>([])
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([])
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const isEditing = !!editEntry
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (open) {
      setExistingPhotoUrls(editEntry?.photo_urls ?? [])
      setNewPreviews([])
      setAttachmentUrls(editEntry?.attachment_urls ?? [])
      setAttachmentFiles([])
      setError(null)
    }
  }, [open, editEntry?.id])

  function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const added = files.map((file) => ({ url: URL.createObjectURL(file), file }))
    setNewPreviews((prev) => [...prev, ...added])
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const date = fd.get('date') as string
    const notes = fd.get('notes') as string

    const supabase = createClient()

    // Upload new photos
    const uploadedPhotoUrls: string[] = []
    for (const { file } of newPreviews) {
      const ext = file.name.split('.').pop()
      const path = `${tripId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('diary-photos').upload(path, file, {
        contentType: file.type,
        upsert: false,
      })
      if (uploadError) { setError(uploadError.message); setLoading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('diary-photos').getPublicUrl(path)
      uploadedPhotoUrls.push(publicUrl)
    }
    const photo_urls = [...existingPhotoUrls, ...uploadedPhotoUrls]

    // Upload new attachments
    const uploadedAttachmentUrls: string[] = []
    for (const file of attachmentFiles) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60)
      const path = `${tripId}/${Date.now()}-${safeName}`
      const { error: uploadErr } = await supabase.storage.from('attachments').upload(path, file, {
        contentType: file.type,
        upsert: false,
      })
      if (uploadErr) { setError(uploadErr.message); setLoading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(path)
      uploadedAttachmentUrls.push(publicUrl)
    }
    const attachment_urls = [...attachmentUrls, ...uploadedAttachmentUrls]

    const result = isEditing
      ? await updateDiaryEntry(tripId, editEntry.id, { date, notes, photo_urls, attachment_urls })
      : await addDiaryEntry(tripId, { date, notes, photo_urls, attachment_urls })

    setLoading(false)
    if (result?.error) { setError(result.error); return }

    if (!isEditing) {
      setNewPreviews([])
      ;(e.target as HTMLFormElement).reset()
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? '✏️ Edit diary entry' : '📖 New diary entry'} maxWidth="lg">
      <form key={editEntry?.id ?? 'new'} onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <Input label="Date" name="date" type="date" required defaultValue={editEntry?.date ?? today} />

        <Textarea label="Notes" name="notes" placeholder="What happened today? How did it feel?" rows={5} defaultValue={editEntry?.notes ?? ''} />

        {/* Photos */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">Photos</p>

          {existingPhotoUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {existingPhotoUrls.map((url, idx) => (
                <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setExistingPhotoUrls((p) => p.filter((_, i) => i !== idx))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {newPreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {newPreviews.map(({ url }, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setNewPreviews((p) => p.filter((_, i) => i !== idx))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label
            htmlFor="diary-photos"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-500 cursor-pointer hover:border-sky-400 hover:text-sky-600 transition-colors w-fit"
          >
            <ImagePlus className="w-4 h-4" />
            Add photos
          </label>
          <input id="diary-photos" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple className="hidden" onChange={handlePhotoFiles} />
        </div>

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
            {isEditing ? 'Save changes' : 'Save entry'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
