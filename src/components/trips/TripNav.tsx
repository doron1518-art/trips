'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { InviteMemberModal } from './InviteMemberModal'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Itinerary', emoji: '🗺️', href: 'itinerary' },
  { label: 'Ideas',     emoji: '💡', href: 'ideas' },
  { label: 'Diary',     emoji: '📖', href: 'diary' },
  { label: 'Wallet',    emoji: '💼', href: 'wallet' },
]

interface Props {
  tripId: string
  tripTitle: string
  destination: string | null
  isOwner: boolean
}

export function TripNav({ tripId, tripTitle, destination, isOwner }: Props) {
  const pathname = usePathname()
  const [inviteOpen, setInviteOpen] = useState(false)

  return (
    <>
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Trip header row */}
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/trips"
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-violet-600 transition-colors shrink-0 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">Trips</span>
              </Link>
              <span className="text-gray-200 hidden sm:inline">/</span>
              <div className="min-w-0">
                <h1 className="font-bold text-gray-900 truncate">{tripTitle}</h1>
                {destination && (
                  <p className="text-xs text-gray-400 truncate">📍 {destination}</p>
                )}
              </div>
            </div>

            {isOwner && (
              <button
                onClick={() => setInviteOpen(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 px-3.5 py-1.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-sky-200 hover:-translate-y-0.5 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Invite</span>
              </button>
            )}
          </div>

          {/* Tab row */}
          <nav className="flex gap-1 -mb-px">
            {TABS.map(({ label, emoji, href }) => {
              const fullHref = `/trips/${tripId}/${href}`
              const active = pathname.startsWith(fullHref)
              return (
                <Link
                  key={href}
                  href={fullHref}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 rounded-t-lg',
                    active
                      ? 'border-sky-500 text-sky-600 bg-sky-50/60'
                      : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <span className="text-base leading-none">{emoji}</span>
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} tripId={tripId} />
    </>
  )
}
