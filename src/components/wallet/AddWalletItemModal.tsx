'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { addWalletItem } from '@/lib/actions/wallet'

const CATEGORIES = [
  { value: 'passport',  emoji: '🛂', label: 'Passport' },
  { value: 'flight',    emoji: '✈️', label: 'Flight / Boarding Pass' },
  { value: 'hotel',     emoji: '🏨', label: 'Hotel Booking' },
  { value: 'transport', emoji: '🚌', label: 'Transport Ticket' },
  { value: 'receipt',   emoji: '🧾', label: 'Receipt' },
  { value: 'insurance', emoji: '🛡️', label: 'Insurance' },
  { value: 'visa',      emoji: '🪪', label: 'Visa / Entry Doc' },
  { value: 'other',     emoji: '📄', label: 'Other' },
]

interface Props {
  open: boolean
  onClose: () => void
  tripId: string
}

export function AddWalletItemModal({ open, onClose, tripId }: Props) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('other')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setTitle('')
      setCategory('other')
      setNotes('')
      setFile(null)
      setError(null)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)

    try {
      let fileUrl: string | null = null

      if (file) {
        const supabase = createClient()
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `${tripId}/wallet-${Date.now()}-${safeName}`
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(path, file, { contentType: file.type, upsert: false })
        if (uploadError) throw new Error(uploadError.message)
        const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path)
        fileUrl = urlData.publicUrl
      }

      const result = await addWalletItem(tripId, {
        title: title.trim(),
        category,
        file_url: fileUrl,
        notes: notes.trim() || null,
      })
      if (result?.error) throw new Error(result.error)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const isPdf = file?.name.toLowerCase().endsWith('.pdf')

  return (
    <Modal open={open} onClose={onClose} title="Add Document">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. My Passport, Flight TLV→JFK, Hotel Receipt…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  category === cat.value
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/50'
                }`}
              >
                <span className="text-base leading-none">{cat.emoji}</span>
                <span className="truncate text-xs">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* File upload */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            File <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          {file ? (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              {isPdf
                ? <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                : <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />}
              <span className="text-sm text-emerald-700 truncate flex-1">{file.name}</span>
              <button
                type="button"
                onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = '' }}
                className="p-0.5 text-emerald-400 hover:text-red-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 hover:border-emerald-300 rounded-xl text-sm text-gray-400 hover:text-emerald-600 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload PDF, JPG, or PNG
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f) }}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Notes <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Booking reference, policy number, expiry date…"
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold shadow-md hover:shadow-emerald-200 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Add to Wallet'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
