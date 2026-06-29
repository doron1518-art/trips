'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AddDiaryEntryModal } from './AddDiaryEntryModal'
import { AttachmentChips } from '@/components/ui/AttachmentUploader'
import { deleteDiaryEntry } from '@/lib/actions/diary'
import { formatDate } from '@/lib/utils'
import type { Database } from '@/types/database'

type Entry = Database['public']['Tables']['diary_entries']['Row']

interface Props {
  tripId: string
  initialEntries: Entry[]
}

export function DiaryClient({ tripId, initialEntries }: Props) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`diary:${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'diary_entries', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          setEntries((prev) => {
            if (prev.find((e) => e.id === (payload.new as Entry).id)) return prev
            return [...prev, payload.new as Entry].sort((a, b) => a.date.localeCompare(b.date))
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'diary_entries', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          setEntries((prev) =>
            prev.map((e) => (e.id === (payload.new as Entry).id ? (payload.new as Entry) : e))
              .sort((a, b) => a.date.localeCompare(b.date))
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'diary_entries', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          setEntries((prev) => prev.filter((e) => e.id !== (payload.old as { id: string }).id))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tripId])

  async function handleDelete(entryId: string) {
    setDeleting(entryId)
    await deleteDiaryEntry(tripId, entryId)
    setDeleting(null)
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>📖</span>
            <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Trip Diary</span>
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Your memories, day by day</p>
        </div>
        <button
          onClick={() => { setEditingEntry(null); setModalOpen(true) }}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 px-4 py-2 rounded-xl shadow-md hover:shadow-rose-200 hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          New entry
        </button>
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-5">📸</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Diary is empty!</h3>
          <p className="text-sm text-gray-400 max-w-xs mb-8 leading-relaxed">
            Write about your day, upload photos, and capture memories you&apos;ll want to revisit forever.
          </p>
          <button
            onClick={() => { setEditingEntry(null); setModalOpen(true) }}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 px-4 py-2.5 rounded-xl shadow-md hover:shadow-rose-200 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Write first entry
          </button>
        </div>
      )}

      {/* Feed */}
      <div className="relative space-y-10">
        {sorted.map((entry, idx) => (
          <div key={entry.id} className="relative group">
            {/* Timeline connector line */}
            {idx < sorted.length - 1 && (
              <span className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-rose-200 to-transparent" aria-hidden />
            )}

            <div className="flex gap-4">
              {/* Date badge */}
              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shrink-0 mt-1 shadow-lg shadow-rose-200">
                <span className="text-[9px] font-bold leading-none opacity-80 uppercase tracking-widest">
                  {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-lg font-black leading-tight">
                  {new Date(entry.date + 'T00:00:00').getDate()}
                </span>
              </div>

              {/* Card */}
              <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
                  <p className="font-bold text-gray-900 text-sm">{formatDate(entry.date)}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => { setEditingEntry(entry); setModalOpen(true) }}
                    className="p-1.5 text-gray-300 hover:text-sky-500 hover:bg-sky-50 transition-all rounded-lg"
                    aria-label="Edit entry"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deleting === entry.id}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  </div>
                </div>

                {/* Notes */}
                {entry.notes && (
                  <div className="px-5 py-4">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{entry.notes}</p>
                  </div>
                )}

                {/* Photos */}
                {entry.photo_urls && entry.photo_urls.length > 0 && (
                  <div className={`grid gap-1 ${entry.photo_urls.length === 1 ? 'grid-cols-1' : entry.photo_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} ${entry.notes ? 'mt-0' : 'mt-3'} mx-4 mb-4 rounded-2xl overflow-hidden`}>
                    {entry.photo_urls.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setLightbox(url)}
                        className="aspect-square overflow-hidden focus:outline-none"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Attachments */}
                {entry.attachment_urls && entry.attachment_urls.length > 0 && (
                  <div className="px-5 pb-4">
                    <AttachmentChips urls={entry.attachment_urls} />
                  </div>
                )}

                {/* Empty content state */}
                {!entry.notes && (!entry.photo_urls || entry.photo_urls.length === 0) && (
                  <div className="flex items-center gap-2 px-5 py-4 text-sm text-gray-300">
                    <ImageIcon className="w-4 h-4" />
                    Empty entry
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Full size"
            className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>
      )}

      <AddDiaryEntryModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEntry(null) }}
        tripId={tripId}
        editEntry={editingEntry ?? undefined}
      />
    </div>
  )
}
