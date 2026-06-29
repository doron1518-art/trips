'use client'

import { useEffect, useState } from 'react'

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

// Circumference of the orbit circle (r=52): 2π×52 ≈ 327px
const ORBIT_C = 327

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
        @keyframes tl-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes tl-bounce {
          0%, 80%, 100% { transform: translateY(0);   opacity: .5; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes tl-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
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

            {/* ── SVG orbit animation ── */}
            <svg
              width="160"
              height="160"
              viewBox="0 0 160 160"
              aria-hidden="true"
              overflow="visible"
            >
              <defs>
                {/* Soft glow filter on the plane */}
                <filter id="tl-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ── Orbit track: soft outer ring ── */}
              <circle
                cx="80" cy="80" r="52"
                fill="none"
                stroke="#e0f2fe"
                strokeWidth="8"
              />

              {/* ── Orbit track: dashed line ── */}
              <circle
                cx="80" cy="80" r="52"
                fill="none"
                stroke="#bae6fd"
                strokeWidth="1.5"
                strokeDasharray="3 9"
              />

              {/* ── Comet arc: spinning highlight that follows the plane ── */}
              <circle
                cx="80" cy="80" r="52"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${ORBIT_C * 0.22} ${ORBIT_C * 0.78}`}
                style={{
                  animation: 'tl-spin 2.4s linear infinite',
                  transformOrigin: '80px 80px',
                  opacity: 0.7,
                }}
              />

              {/* ── Hidden motion path (full clockwise circle) ── */}
              <path
                id="tl-orbit"
                d="M 132,80 A 52,52 0 1,1 131.999,80"
                fill="none"
                stroke="none"
              />

              {/* ── Airplane traveling the orbit ── */}
              <g filter="url(#tl-glow)">
                <animateMotion dur="2.4s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#tl-orbit" />
                </animateMotion>

                {/*
                  Plane centered at origin, nose pointing right (+x).
                  rotate="auto" on animateMotion aligns the +x axis with the
                  path tangent, so the nose always faces the direction of travel.

                  Body:   a narrow fuselage (right-pointing triangle)
                  Wings:  two swept-back delta shapes
                  Tail:   two small fins at the rear
                */}
                <g>
                  {/* Drop shadow */}
                  <path
                    d="M12,0 L-8,-3.5 L-6,0 L-8,3.5 Z
                       M4,-3.5 L-4,-12 L-7,-9 L2,-3.5 Z
                       M4,3.5 L-4,12 L-7,9 L2,3.5 Z
                       M-6,-3 L-10,-7 L-11.5,-5 L-7.5,-3 Z
                       M-6,3 L-10,7 L-11.5,5 L-7.5,3 Z"
                    fill="#0369a1"
                    opacity="0.25"
                    transform="translate(2,3)"
                  />
                  {/* Wings + tail (slightly lighter fill) */}
                  <path
                    d="M4,-3.5 L-4,-12 L-7,-9 L2,-3.5 Z
                       M4,3.5 L-4,12 L-7,9 L2,3.5 Z
                       M-6,-3 L-10,-7 L-11.5,-5 L-7.5,-3 Z
                       M-6,3 L-10,7 L-11.5,5 L-7.5,3 Z"
                    fill="#0ea5e9"
                  />
                  {/* Fuselage (brighter highlight) */}
                  <path
                    d="M12,0 L-8,-3.5 L-6,0 L-8,3.5 Z"
                    fill="#38bdf8"
                  />
                </g>
              </g>

              {/* ── Center hub ── */}
              <circle cx="80" cy="80" r="5"  fill="#e0f2fe" />
              <circle cx="80" cy="80" r="2.5" fill="#7dd3fc" />
            </svg>

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
