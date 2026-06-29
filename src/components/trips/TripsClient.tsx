'use client'

import { useEffect, useState } from 'react'
import { Plus, Hash } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TripCard } from './TripCard'
import { CreateTripModal } from './CreateTripModal'
import { EditTripModal } from './EditTripModal'
import { JoinTripModal } from './JoinTripModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { deleteTrip } from '@/lib/actions/trips'
import type { Database } from '@/types/database'

type Trip = Database['public']['Tables']['trips']['Row'] & { member_count?: number }

interface Props {
  initialTrips: Trip[]
  userId: string
}

export function TripsClient({ initialTrips, userId }: Props) {
  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('trips-list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trips' },
        async (payload) => {
          const { data: membership } = await supabase
            .from('trip_members')
            .select('role')
            .eq('trip_id', (payload.new as Trip).id)
            .eq('user_id', userId)
            .single()
          if (membership) {
            setTrips((prev) => {
              if (prev.find((t) => t.id === (payload.new as Trip).id)) return prev
              return [...prev, payload.new as Trip]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips' },
        (payload) => {
          setTrips((prev) => prev.map((t) => (t.id === (payload.new as Trip).id ? { ...t, ...payload.new } : t)))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'trips' },
        (payload) => {
          setTrips((prev) => prev.filter((t) => t.id !== (payload.old as Trip).id))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function handleDeleteTrip() {
    if (!deletingTrip) return
    await deleteTrip(deletingTrip.id)
    // realtime subscription removes it from state
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-500 via-blue-500 to-blue-600 bg-clip-text text-transparent">
            My Trips 🌍
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {trips.length === 0
              ? 'Adventure awaits — create your first trip!'
              : `${trips.length} trip${trips.length > 1 ? 's' : ''} in the works`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setJoinOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 px-4 py-2 rounded-xl shadow-sm hover:-translate-y-0.5 transition-all duration-200"
          >
            <Hash className="w-4 h-4" />
            <span className="hidden sm:inline">Join trip</span>
            <span className="sm:hidden">Join</span>
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 px-4 py-2 rounded-xl shadow-md hover:shadow-sky-200 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New trip</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-7xl mb-6 animate-bounce">✈️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No trips yet!</h3>
          <p className="text-sm text-gray-400 max-w-xs mb-8 leading-relaxed">
            Start planning your next adventure. Build an itinerary, collect ideas, and capture every memory.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 px-5 py-2.5 rounded-xl shadow-md hover:shadow-sky-200 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Plan your first trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onEdit={() => setEditingTrip(trip)}
              onDelete={() => setDeletingTrip(trip)}
            />
          ))}
        </div>
      )}

      <CreateTripModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinTripModal open={joinOpen} onClose={() => setJoinOpen(false)} />

      {editingTrip && (
        <EditTripModal
          open={!!editingTrip}
          onClose={() => setEditingTrip(null)}
          trip={editingTrip}
        />
      )}

      <ConfirmModal
        open={!!deletingTrip}
        onClose={() => setDeletingTrip(null)}
        title="Delete trip?"
        message={`"${deletingTrip?.title}" and all its itinerary, ideas, and diary entries will be permanently deleted.`}
        confirmLabel="Yes, delete trip"
        onConfirm={handleDeleteTrip}
      />
    </div>
  )
}
