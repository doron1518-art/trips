'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hash, ArrowRight, LogIn } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { joinTrip } from '@/lib/actions/trips'

interface Props {
  open: boolean
  onClose: () => void
}

export function JoinTripModal({ open, onClose }: Props) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const router = useRouter()

  function handleClose() {
    setCode('')
    setError(null)
    setInfo(null)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.length < 6) return
    setLoading(true)
    setError(null)
    setInfo(null)

    const result = await joinTrip(code)

    if ('error' in result && result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if ('alreadyMember' in result && result.alreadyMember) {
      setInfo(`You're already a member of "${result.tripTitle}" — taking you there now.`)
      setTimeout(() => {
        handleClose()
        router.push(`/trips/${result.tripId}/itinerary`)
      }, 1200)
      return
    }

    if ('success' in result && result.success) {
      handleClose()
      router.push(`/trips/${result.tripId}/itinerary`)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Join a Trip" maxWidth="sm">
      <div className="space-y-6">
        {/* Icon + description */}
        <div className="flex flex-col items-center text-center gap-3 pt-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <p className="text-sm text-gray-500 max-w-[240px] leading-relaxed">
            Enter the 6-character code shared by the trip organiser.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code input */}
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
                setCode(val)
                setError(null)
                setInfo(null)
              }}
              placeholder="A3K9BZ"
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              autoFocus
              className="w-full pl-12 pr-4 py-4 text-center font-mono text-2xl font-black tracking-[0.3em] rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-violet-400 bg-gray-50 uppercase placeholder:text-gray-300 placeholder:tracking-[0.2em] placeholder:font-normal transition-colors"
            />
            {/* Character count dots */}
            <div className="flex justify-center gap-1.5 mt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i < code.length ? 'bg-violet-500 scale-125' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl text-center">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-sky-50 border border-sky-200 text-sky-700 text-sm px-4 py-3 rounded-xl text-center">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={code.length < 6 || loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-violet-200 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:translate-y-0 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining…' : (
              <>Join Trip <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>
    </Modal>
  )
}
