'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AddIdeaModal } from './AddIdeaModal'
import { Badge } from '@/components/ui/Badge'
import { AttachmentChips } from '@/components/ui/AttachmentUploader'
import { deleteIdea } from '@/lib/actions/ideas'
import type { Database } from '@/types/database'

type Idea = Database['public']['Tables']['ideas']['Row']
type Category = Idea['category']

const ALL_CATEGORIES: { value: Category | 'all'; label: string; emoji: string }[] = [
  { value: 'all',       label: 'All',       emoji: '✨' },
  { value: 'food',      label: 'Food',      emoji: '🍜' },
  { value: 'music',     label: 'Music',     emoji: '🎵' },
  { value: 'culture',   label: 'Culture',   emoji: '🏛️' },
  { value: 'nature',    label: 'Nature',    emoji: '🌿' },
  { value: 'adventure', label: 'Adventure', emoji: '🧗' },
  { value: 'shopping',  label: 'Shopping',  emoji: '🛍️' },
  { value: 'other',     label: 'Other',     emoji: '🔮' },
]

const CATEGORY_PLACEHOLDER_COLORS: Record<Category, string> = {
  food:      'from-orange-100 to-red-100',
  music:     'from-purple-100 to-pink-100',
  culture:   'from-blue-100 to-indigo-100',
  nature:    'from-green-100 to-emerald-100',
  adventure: 'from-amber-100 to-orange-100',
  shopping:  'from-pink-100 to-rose-100',
  other:     'from-gray-100 to-slate-100',
}

const CATEGORY_PLACEHOLDER_EMOJI: Record<Category, string> = {
  food:      '🍜',
  music:     '🎵',
  culture:   '🏛️',
  nature:    '🌿',
  adventure: '🧗',
  shopping:  '🛍️',
  other:     '✨',
}

interface Props {
  tripId: string
  initialIdeas: Idea[]
}

export function IdeasClient({ tripId, initialIdeas }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas)
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`ideas:${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ideas', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          setIdeas((prev) => {
            if (prev.find((i) => i.id === (payload.new as Idea).id)) return prev
            return [payload.new as Idea, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ideas', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          setIdeas((prev) => prev.map((i) => (i.id === (payload.new as Idea).id ? (payload.new as Idea) : i)))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'ideas', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          setIdeas((prev) => prev.filter((i) => i.id !== (payload.old as { id: string }).id))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tripId])

  async function handleDelete(ideaId: string) {
    setDeleting(ideaId)
    await deleteIdea(tripId, ideaId)
    setDeleting(null)
  }

  const filtered = filter === 'all' ? ideas : ideas.filter((i) => i.category === filter)

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>💡</span>
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Idea Box</span>
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Things you want to do or try</p>
        </div>
        <button
          onClick={() => { setEditingIdea(null); setModalOpen(true) }}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 px-4 py-2 rounded-xl shadow-md hover:shadow-orange-200 hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Add idea
        </button>
      </div>

      {/* Category filter */}
      {ideas.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {ALL_CATEGORIES.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                filter === value
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-orange-100 scale-105'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-300 hover:text-orange-500 hover:scale-105'
              }`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {ideas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-5">💡</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No ideas yet!</h3>
          <p className="text-sm text-gray-400 max-w-xs mb-8 leading-relaxed">
            Capture restaurants, activities, and hidden gems you don&apos;t want to miss.
          </p>
          <button
            onClick={() => { setEditingIdea(null); setModalOpen(true) }}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 px-4 py-2.5 rounded-xl shadow-md hover:shadow-orange-200 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add first idea
          </button>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((idea) => (
            <div
              key={idea.id}
              className="group relative bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300"
            >
              {/* Image or placeholder */}
              {idea.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={idea.image_url}
                  alt={idea.name}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className={`w-full h-44 bg-gradient-to-br ${CATEGORY_PLACEHOLDER_COLORS[idea.category]} flex items-center justify-center`}>
                  <span className="text-5xl opacity-50">{CATEGORY_PLACEHOLDER_EMOJI[idea.category]}</span>
                </div>
              )}

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-900 text-sm leading-snug">{idea.name}</h3>
                  <Badge variant={idea.category}>{idea.category}</Badge>
                </div>
                {idea.description && (
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{idea.description}</p>
                )}
                <AttachmentChips urls={idea.attachment_urls ?? []} />
              </div>

              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 z-10">
                <button
                  onClick={() => { setEditingIdea(idea); setModalOpen(true) }}
                  className="p-2.5 sm:p-1.5 rounded-xl bg-white/90 backdrop-blur-sm text-gray-400 hover:text-sky-500 hover:bg-white shadow-sm transition-colors"
                  aria-label="Edit idea"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(idea.id)}
                  disabled={deleting === idea.id}
                  className="p-2.5 sm:p-1.5 rounded-xl bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm transition-colors"
                  aria-label="Delete idea"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && ideas.length > 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-sm text-gray-400">No ideas in this category yet.</p>
        </div>
      )}

      <AddIdeaModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingIdea(null) }}
        tripId={tripId}
        editIdea={editingIdea ?? undefined}
      />
    </div>
  )
}
