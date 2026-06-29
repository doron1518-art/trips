'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, MapPin, Plane } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'

interface AppNavProps {
  userEmail: string | undefined
  userName: string | undefined
}

export function AppNav({ userEmail, userName }: AppNavProps) {
  const pathname = usePathname()
  const onTripsHome = pathname === '/trips'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sky-100 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/trips" className="flex items-center gap-2 shrink-0 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-b from-sky-200 via-sky-400 to-blue-600 shadow-md group-hover:shadow-sky-300 transition-shadow duration-300 overflow-hidden relative">
            {/* cloud hint at top */}
            <span className="absolute top-0.5 left-0.5 w-4 h-2 bg-white/30 rounded-full blur-[2px]" />
            <Plane className="w-4 h-4 text-white drop-shadow relative z-10" />
          </div>
          <span className="font-bold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent text-sm hidden sm:block">
            Trips
          </span>
        </Link>

        {/* Center: breadcrumb hint when inside a trip */}
        {!onTripsHome && (
          <Link
            href="/trips"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-sky-500 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Trips</span>
          </Link>
        )}

        {/* User + sign out */}
        <div className="flex items-center gap-3 ml-auto">
          {(userName ?? userEmail) && (
            <span className="text-sm text-gray-400 hidden md:block truncate max-w-[160px]">
              👋 {userName ?? userEmail}
            </span>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-red-50"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
