'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { AttachmentUploader } from '@/components/ui/AttachmentUploader'
import { addIdea, updateIdea } from '@/lib/actions/ideas'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Idea = Database['public']['Tables']['ideas']['Row']

const CATEGORY_OPTIONS = [
  { value: 'food',      label: '🍜  Food & Drink' },
  { value: 'music',     label: '🎵  Music & Nightlife' },
  { value: 'culture',   label: '🏛️  Culture & Arts' },
  { value: 'nature',    label: '🌿  Nature & Outdoors' },
  { value: 'adventure', label: '🧗  Adventure & Sports' },
  { value: 'shopping',  label: '🛍️  Shopping' },
  { value: 'other',     label: '✨  Other' },
]

interface Props {
  open: boolean
  onClose: () => void
  tripId: string
  editIdea?: Idea
}

export function AddIdeaModal({ open, onClose, tripId, editIdea }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([])
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const isEditing = !!editIdea

  useEffect(() => {
    if (open) {
      setPreview(editIdea?.image_url ?? null)
      setAttachmentUrls(editIdea?.attachment_urls ?? [])
      setAttachmentFiles([])
      setError(null)
    }
  }, [open, editIdea?.id])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const name = fd.get('name') as string
    const description = fd.get('description') as string
    const category = fd.get('category') as string
    const file = fileRef.current?.files?.[0]

    const supabase = createClient()

    // Upload cover image if new file selected
    let image_url = isEditing ? (editIdea.image_url ?? undefined) : undefined
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${tripId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('idea-images').upload(path, file, {
        contentType: file.type,
        upsert: false,
      })
      if (uploadError) { setError(uploadError.message); setLoading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('idea-images').getPublicUrl(path)
      image_url = publicUrl
    } else if (!preview) {
      image_url = undefined
    }

    // Upload new attachments
    const uploadedAttachmentUrls: string[] = []
    for (const attFile of attachmentFiles) {
      const safeName = attFile.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60)
      const path = `${tripId}/${Date.now()}-${safeName}`
      const { error: uploadErr } = await supabase.storage.from('attachments').upload(path, attFile, {
        contentType: attFile.type,
        upsert: false,
      })
      if (uploadErr) { setError(uploadErr.message); setLoading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(path)
      uploadedAttachmentUrls.push(publicUrl)
    }
    const finalAttachmentUrls = [...attachmentUrls, ...uploadedAttachmentUrls]

    const result = isEditing
      ? await updateIdea(tripId, editIdea.id, { name, description, category, image_url, attachment_urls: finalAttachmentUrls })
      : await addIdea(tripId, { name, description, category, image_url, attachment_urls: finalAttachmentUrls })

    setLoading(false)
    if (result?.error) { setError(result.error); return }

    if (!isEditing) {
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      ;(e.target as HTMLFormElement).reset()
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? '✏️ Edit idea' : '💡 Add idea'}>
      <form key={editIdea?.id ?? 'new'} onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Cover image */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-1.5">Image</p>
          <div className="relative">
            <label
              htmlFor="idea-image"
              className="flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-colors overflow-hidden"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <ImagePlus className="w-7 h-7" />
                  <span className="text-xs">Click to upload an image</span>
                </div>
              )}
            </label>
            {preview && (
              <button
                type="button"
                onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <input id="idea-image" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
        </div>

        <Input label="Name" name="name" required placeholder="e.g. Ramen at Ichiran" defaultValue={editIdea?.name ?? ''} />
        <Select label="Category" name="category" required options={CATEGORY_OPTIONS} defaultValue={editIdea?.category ?? 'other'} />
        <Textarea label="Description" name="description" placeholder="What makes this special?" rows={2} defaultValue={editIdea?.description ?? ''} />

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
            {isEditing ? 'Save changes' : 'Add idea'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
