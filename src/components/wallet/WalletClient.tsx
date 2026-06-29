'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, FileText, Image as ImageIcon, ExternalLink, Paperclip } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AddWalletItemModal } from './AddWalletItemModal'
import { deleteWalletItem } from '@/lib/actions/wallet'
import type { Database } from '@/types/database'

type WalletItem = Database['public']['Tables']['wallet_items']['Row']

const CATEGORIES: Record<string, { emoji: string; label: string; color: string }> = {
  passport:  { emoji: '🛂', label: 'Passport',             color: 'from-blue-400 to-indigo-500' },
  flight:    { emoji: '✈️', label: 'Flight',               color: 'from-sky-400 to-cyan-500' },
  hotel:     { emoji: '🏨', label: 'Hotel',                color: 'from-violet-400 to-purple-500' },
  transport: { emoji: '🚌', label: 'Transport',            color: 'from-teal-400 to-emerald-500' },
  receipt:   { emoji: '🧾', label: 'Receipt',              color: 'from-amber-400 to-orange-500' },
  insurance: { emoji: '🛡️', label: 'Insurance',           color: 'from-rose-400 to-pink-500' },
  visa:      { emoji: '🪪', label: 'Visa',                 color: 'from-lime-500 to-green-500' },
  other:     { emoji: '📄', label: 'Other',                color: 'from-gray-400 to-slate-500' },
}

const ANCHOR_TYPE_EMOJI: Record<string, string> = {
  event: '🎯', hotel: '🏨', transit: '✈️', other: '📌', concert: '🎤', tour: '🚶‍♂️',
}

function displayName(url: string) {
  const raw = url.split('/').pop()?.split('?')[0] ?? 'file'
  return raw.replace(/^\d{10,}-/, '').replace(/^wallet-\d{10,}-/, '')
}

function isPdf(url: string) { return url.toLowerCase().includes('.pdf') }

interface AnchorAttachment {
  id: string
  title: string
  type: string
  attachment_urls: string[]
}

interface Props {
  tripId: string
  initialItems: WalletItem[]
  anchorAttachments: AnchorAttachment[]
}

export function WalletClient({ tripId, initialItems, anchorAttachments }: Props) {
  const [items, setItems] = useState<WalletItem[]>(initialItems)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`wallet:${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_items', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          setItems((prev) => {
            if (prev.find((i) => i.id === (payload.new as WalletItem).id)) return prev
            return [payload.new as WalletItem, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'wallet_items', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          setItems((prev) => prev.filter((i) => i.id !== (payload.old as { id: string }).id))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tripId])

  async function handleDelete(itemId: string) {
    setDeleting(itemId)
    await deleteWalletItem(tripId, itemId)
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    setDeleting(null)
  }

  const usedCategories = Array.from(new Set(items.map((i) => i.category)))
  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter)
  const hasAnchors = anchorAttachments.length > 0

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>💼</span>
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Travel Wallet
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">All your trip documents in one place</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-4 py-2 rounded-xl shadow-md hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Add Document
        </button>
      </div>

      {/* My Documents section */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-bold text-gray-800 text-lg">My Documents</h3>
          {items.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {items.length}
            </span>
          )}
        </div>

        {/* Category filter */}
        {items.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-5">
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600'
              }`}
            >
              ✨ All
            </button>
            {usedCategories.map((cat) => {
              const meta = CATEGORIES[cat] ?? CATEGORIES.other
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filter === cat
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600'
                  }`}
                >
                  <span>{meta.emoji}</span>
                  {meta.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Items grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((item) => {
              const meta = CATEGORIES[item.category] ?? CATEGORIES.other
              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Top color strip */}
                  <div className={`h-1 bg-gradient-to-r ${meta.color}`} />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Category emoji */}
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-xl shrink-0 shadow-sm`}>
                        <span className="leading-none">{meta.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-gray-900 text-sm leading-snug">{item.title}</p>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                            className="p-2 sm:p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="inline-block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">
                          {meta.label}
                        </span>
                        {item.notes && (
                          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{item.notes}</p>
                        )}
                        {item.file_url && (
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition-colors max-w-full"
                          >
                            {isPdf(item.file_url)
                              ? <FileText className="w-3 h-3 shrink-0" />
                              : <ImageIcon className="w-3 h-3 shrink-0" />}
                            <span className="truncate">{displayName(item.file_url)}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 ml-auto" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="text-5xl mb-4">💼</div>
            <h3 className="text-base font-bold text-gray-800 mb-1">Wallet is empty</h3>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-6">
              Add passports, tickets, visas, receipts — anything you&apos;ll need on the trip.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 rounded-xl shadow-md hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add first document
            </button>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">
            No documents in this category.
          </div>
        )}
      </section>

      {/* From Itinerary section */}
      {hasAnchors && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-gray-800 text-lg">From Itinerary</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
              {anchorAttachments.reduce((sum, a) => sum + a.attachment_urls.length, 0)}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4">Files attached to your itinerary anchors.</p>
          <div className="space-y-3">
            {anchorAttachments.map((anchor) => (
              <div key={anchor.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Anchor header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="text-base">{ANCHOR_TYPE_EMOJI[anchor.type] ?? '📌'}</span>
                  <p className="font-semibold text-gray-800 text-sm truncate">{anchor.title}</p>
                  <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {anchor.attachment_urls.length} {anchor.attachment_urls.length === 1 ? 'file' : 'files'}
                  </span>
                </div>
                {/* Files */}
                <div className="p-4 flex flex-wrap gap-2">
                  {anchor.attachment_urls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-medium transition-colors border border-sky-100"
                    >
                      {isPdf(url)
                        ? <FileText className="w-3.5 h-3.5 shrink-0" />
                        : <ImageIcon className="w-3.5 h-3.5 shrink-0" />}
                      <span className="max-w-[140px] truncate">{displayName(url)}</span>
                      <Paperclip className="w-3 h-3 shrink-0 opacity-50" />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <AddWalletItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tripId={tripId}
      />
    </div>
  )
}
