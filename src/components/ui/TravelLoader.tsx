'use client'

import { useEffect, useState } from 'react'
import { Plane } from 'lucide-react'

const MESSAGES = [
  'Packing bags…',
  'Boarding flight…',
  'Preparing your itinerary…',
  'Fueling up the plane…',
  'Checking passport…',
  'Finding your seat…',
  'Calculating layovers…',
  'Almost wheels-up…',
]

interface Props {
  visible: boolean
}

export function TravelLoader({ visible }: Props) {
  const [msgIdx, setMsgIdx] = useState(0)
  const [textVisible, setTextVisible] = useState(true)

  // Cycle through messages with a fade-out → swap → fade-in
  useEffect(() => {
    if (!visible) {
      setMsgIdx(0)
      setTextVisible(true)
      return
    }
    const interval = setInterval(() => {
      setTextVisible(false)
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % MESSAGES.length)
        setTextVisible(true)
      }, 300)
    }, 2600)
    return () => clearInterval(interval)
  }, [visible])

  if (!visible) return null

  return (
    <>
      {/* ── Keyframes injected once ── */}
      <style>{`
        @keyframes tl-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes tl-bounce {
          0%, 80%, 100% { transform: translateY(0);   opacity: .5; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-6"
        aria-live="polite"
        aria-label="Loading"
      >
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

        {/* ── Card ── */}
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[300px] overflow-hidden">
          {/* Rainbow top accent */}
          <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500" />

          <div className="flex flex-col items-center gap-6 px-8 py-9">

            {/* ── Orbit animation (pure CSS, no SVG motion paths) ── */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Soft outer ring */}
              <div className="absolute inset-0 rounded-full border-[6px] border-sky-50" />
              {/* Dashed track */}
              <div className="absolute inset-2 rounded-full border border-dashed border-sky-200" />

              {/* Rotating wrapper carries the plane around the ring */}
              <div
                className="absolute inset-0"
                style={{ animation: 'tl-orbit 2.4s linear infinite' }}
              >
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                  <Plane
                    className="w-7 h-7 text-sky-500"
                    strokeWidth={2}
                    style={{
                      transform: 'rotate(90deg)',
                      filter: 'drop-shadow(0 2px 4px rgba(14,165,233,0.45))',
                    }}
                  />
                </div>
              </div>

              {/* Center hub */}
              <div className="absolute w-3 h-3 rounded-full bg-sky-100" />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-sky-400" />
            </div>

            {/* ── Message ── */}
            <div className="flex flex-col items-center gap-3 min-h-[52px] justify-center">
              <p
                className="text-sm font-semibold text-gray-700 text-center transition-opacity duration-300 leading-snug"
                style={{ opacity: textVisible ? 1 : 0 }}
              >
                {MESSAGES[msgIdx]}
              </p>

              {/* Bouncing dots */}
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="block w-1.5 h-1.5 rounded-full bg-sky-400"
                    style={{ animation: `tl-bounce 1.1s ease-in-out ${i * 0.18}s infinite` }}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
