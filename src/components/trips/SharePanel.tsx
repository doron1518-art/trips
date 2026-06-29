'use client'

import { useEffect, useRef, useState } from 'react'
import { Users, Copy, Check, Crown, Link } from 'lucide-react'

export type MemberWithProfile = {
  role: 'owner' | 'editor'
  user_id: string
  profiles: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null
}

interface Props {
  joinCode: string
  members: MemberWithProfile[]
}

function avatarGradient(userId: string) {
  const g = ['from-sky-400 to-blue-500','from-violet-400 to-purple-500','from-rose-400 to-pink-500','from-emerald-400 to-teal-500','from-amber-400 to-orange-500']
  return g[userId.charCodeAt(0) % g.length]
}

function initials(m: MemberWithProfile) {
  const p = m.profiles
  if (!p) return '?'
  if (p.full_name) return p.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return p.email[0].toUpperCase()
}

function displayName(m: MemberWithProfile) {
  return m.profiles?.full_name ?? m.profiles?.email ?? 'Unknown'
}

export function SharePanel({ joinCode, members }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  async function copyCode() {
    await navigator.clipboard.writeText(joinCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format as "ABC DEF" for readability
  const display = joinCode.slice(0, 3) + ' ' + joinCode.slice(3)
  const sorted = [...members].sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : 0))

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all shadow-sm ${
          open
            ? 'bg-sky-50 border-sky-300 text-sky-700'
            : 'bg-white border-gray-200 text-gray-600 hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50'
        }`}
      >
        <Link className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Share</span>
        {/* Member avatars — show up to 3 */}
        <div className="flex -space-x-1.5">
          {sorted.slice(0, 3).map((m) => (
            <div
              key={m.user_id}
              className={`w-5 h-5 rounded-full bg-gradient-to-br ${avatarGradient(m.user_id)} flex items-center justify-center text-white text-[8px] font-bold ring-1 ring-white shrink-0`}
            >
              {initials(m)}
            </div>
          ))}
          {members.length > 3 && (
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[8px] font-bold ring-1 ring-white">
              +{members.length - 3}
            </div>
          )}
        </div>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {/* Join code section */}
          <div className="p-4 bg-gradient-to-br from-sky-50 to-indigo-50 border-b border-sky-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Invite Code
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white rounded-xl px-4 py-2.5 text-center font-mono text-xl font-black text-gray-900 tracking-[0.25em] border border-sky-100 shadow-inner select-all">
                {display}
              </div>
              <button
                onClick={copyCode}
                title={copied ? 'Copied!' : 'Copy code'}
                className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-all shadow-sm ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-emerald-200'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-sky-400 hover:text-sky-600'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Share this code so friends can join the trip instantly.
            </p>
          </div>

          {/* Members list */}
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Members · {members.length}
              </p>
            </div>
            <div className="space-y-2.5">
              {sorted.map((m) => (
                <div key={m.user_id} className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient(m.user_id)} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}
                  >
                    {m.profiles?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      initials(m)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
                      {displayName(m)}
                    </p>
                    {m.profiles?.full_name && (
                      <p className="text-xs text-gray-400 truncate">{m.profiles.email}</p>
                    )}
                  </div>
                  {m.role === 'owner' && (
                    <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-label="Owner" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
