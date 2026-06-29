'use client'

import { useEffect, useState } from 'react'
import { Plus, MapPin, Clock, Trash2, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AddAnchorModal } from './AddAnchorModal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AttachmentChips } from '@/components/ui/AttachmentUploader'
import { deleteItineraryItem } from '@/lib/actions/itinerary'
import { formatDate, formatTime } from '@/lib/utils'
import type { Database } from '@/types/database'

type Item = Database['public']['Tables']['itinerary_items']['Row']
type ItemType = Item['type']

const TYPE_ICONS: Record<ItemType, string> = {
  event:   '🎯',
  hotel:   '🏨',
  transit: '✈️',
  other:   '📌',
  concert: '🎤',
  tour:    '🚶‍♂️',
}

const TYPE_COLORS: Record<ItemType, string> = {
  event:   'from-blue-400 to-cyan-500',
  hotel:   'from-violet-400 to-purple-600',
  transit: 'from-teal-400 to-cyan-500',
  other:   'from-gray-400 to-slate-500',
  concert: 'from-fuchsia-500 to-pink-500',
  tour:    'from-lime-500 to-green-500',
}

function groupByDate(items: Item[]): Map<string, Item[]> {
  const map = new Map<string, Item[]>()
  const sorted = [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return (a.time ?? '').localeCompare(b.time ?? '')
  })
  for (const item of sorted) {
    const list = map.get(item.date) ?? []
    list.push(item)
    map.set(item.date, list)
  }
  return map
}

interface Props {
  tripId: string
  initialItems: Item[]
}

export function ItineraryClient({ tripId, initialItems }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultDate, setDefaultDate] = useState('')
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`itinerary:${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'itinerary_items', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          setItems((prev) => {
            if (prev.find((i) => i.id === (payload.new as Item).id)) return prev
            return [...prev, payload.new as Item]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'itinerary_items', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          setItems((prev) => prev.map((i) => (i.id === (payload.new as Item).id ? (payload.new as Item) : i)))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'itinerary_items', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          setItems((prev) => prev.filter((i) => i.id !== (payload.old as { id: string }).id))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tripId])

  async function handleDelete(itemId: string) {
    setDeleting(itemId)
    await deleteItineraryItem(tripId, itemId)
    setDeleting(null)
  }

  function openForDate(date: string) {
    setEditingItem(null)
    setDefaultDate(date)
    setModalOpen(true)
  }

  const grouped = groupByDate(items)

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>🗺️</span>
            <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">Itinerary</span>
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Your day-by-day adventure plan</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setDefaultDate(''); setModalOpen(true) }}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 px-4 py-2 rounded-xl shadow-md hover:shadow-sky-200 hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Add anchor
        </button>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-5">🗓️</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Nothing planned yet!</h3>
          <p className="text-sm text-gray-400 max-w-xs mb-8 leading-relaxed">
            Add flights, hotels, and events to build your timeline.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 px-4 py-2.5 rounded-xl shadow-md hover:shadow-sky-200 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add first anchor
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([date, dayItems]) => (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 text-white shrink-0 shadow-lg shadow-sky-200">
                <span className="text-[10px] font-bold leading-none opacity-80 uppercase tracking-wider">
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-2xl font-black leading-tight">
                  {new Date(date + 'T00:00:00').getDate()}
                </span>
              </div>
              <div>
                <p className="font-bold text-gray-900">{formatDate(date)}</p>
                <button
                  onClick={() => openForDate(date)}
                  className="text-xs text-sky-500 hover:text-blue-600 font-semibold transition-colors"
                >
                  + Add to this day
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="ml-7 pl-6 border-l-2 border-dashed border-sky-100 space-y-3">
              {dayItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Left color strip based on type */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b ${TYPE_COLORS[item.type]}`} />

                  <div className="flex items-start gap-3 pl-2">
                    <span className="text-xl mt-0.5 shrink-0">{TYPE_ICONS[item.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-gray-900">{item.title}</h4>
                        <Badge variant={item.type}>{item.type}</Badge>
                      </div>

                      <div className="mt-1.5 space-y-1">
                        {item.time && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Clock className="w-3.5 h-3.5 text-violet-400" />
                            {formatTime(item.time)}
                          </div>
                        )}
                        {item.location && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <MapPin className="w-3.5 h-3.5 text-pink-400" />
                            {item.location}
                          </div>
                        )}
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{item.description}</p>
                        )}
                        <AttachmentChips urls={item.attachment_urls ?? []} />
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0">
                      <button
                        onClick={() => { setEditingItem(item); setModalOpen(true) }}
                        className="p-2.5 sm:p-1.5 text-gray-300 hover:text-sky-500 hover:bg-sky-50 transition-all rounded-lg"
                        aria-label="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleting === item.id}
                        className="p-2.5 sm:p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AddAnchorModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null) }}
        tripId={tripId}
        defaultDate={defaultDate}
        editItem={editingItem ?? undefined}
      />
    </div>
  )
}
