import Link from 'next/link'
import { Calendar, MapPin, Users, Pencil, Trash2 } from 'lucide-react'
import { tripGradient, formatDateShort } from '@/lib/utils'
import type { Database } from '@/types/database'

type Trip = Database['public']['Tables']['trips']['Row'] & { member_count?: number }

interface Props {
  trip: Trip
  onEdit?: () => void
  onDelete?: () => void
}

export function TripCard({ trip, onEdit, onDelete }: Props) {
  const gradient = tripGradient(trip.id)

  return (
    <div className="group relative rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-md hover:shadow-2xl hover:shadow-sky-100 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
      <Link href={`/trips/${trip.id}/itinerary`} className="block">
        {/* Gradient / photo header */}
        <div className={`h-36 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
          {trip.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={trip.cover_image_url}
              alt={trip.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="absolute bottom-3 right-3 text-2xl opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all duration-300">
            🌍
          </span>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-gray-900 truncate text-base">{trip.title}</h3>
            {trip.description && (
              <p className="text-sm text-gray-400 line-clamp-1 mt-0.5">{trip.description}</p>
            )}
          </div>

          <div className="space-y-1.5">
            {trip.destination && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-pink-400" />
                <span className="truncate font-medium">{trip.destination}</span>
              </div>
            )}
            {(trip.start_date || trip.end_date) && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5 shrink-0 text-violet-400" />
                <span>
                  {formatDateShort(trip.start_date)}
                  {trip.end_date && trip.end_date !== trip.start_date && ` – ${formatDateShort(trip.end_date)}`}
                </span>
              </div>
            )}
            {trip.member_count !== undefined && trip.member_count > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Users className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                <span>{trip.member_count} travellers</span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Action buttons — appear on hover, outside the Link */}
      {(onEdit || onDelete) && (
        <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          {onEdit && (
            <button
              onClick={onEdit}
              title="Edit trip"
              className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-gray-500 hover:text-sky-600 hover:bg-white shadow-sm transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              title="Delete trip"
              className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-gray-500 hover:text-red-500 hover:bg-red-50 shadow-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
