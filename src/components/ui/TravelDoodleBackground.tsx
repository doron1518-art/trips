// Paths sourced directly from lucide-react v1.22.0 source files.
// Each icon is 24×24 units; we display them at 4× scale (96px).
// strokeWidth is 0.62 path-units → 0.62 × 4 = ~2.5px visual.

const S = 4     // scale factor 24 → 96 px
const SW = 0.62 // stroke-width in path-space

// Build the transform string to position an icon at (x,y),
// optionally rotated around its own centre.
function place(x: number, y: number, rot = 0) {
  if (rot === 0) return `translate(${x},${y}) scale(${S})`
  const cx = x + (24 * S) / 2
  const cy = y + (24 * S) / 2
  return `translate(${cx},${cy}) rotate(${rot}) translate(${-(24 * S) / 2},${-(24 * S) / 2}) scale(${S})`
}

const STROKE_PROPS = {
  fill: 'none',
  stroke: '#1e293b',
  strokeWidth: SW,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

// ── Icon components (lucide exact paths) ─────────────────────────

function Plane() {
  return (
    <g {...STROKE_PROPS}>
      {/* lucide `plane` — single closed path */}
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </g>
  )
}

function Luggage() {
  return (
    <g {...STROKE_PROPS}>
      {/* lucide `luggage` */}
      <path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2" />
      <path d="M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14" />
      <path d="M10 20h4" />
      <circle cx="16" cy="20" r="2" />
      <circle cx="8" cy="20" r="2" />
    </g>
  )
}

function Building() {
  return (
    <g {...STROKE_PROPS}>
      {/* lucide `building-2` — hotel/building with wings + windows + door */}
      <path d="M10 12h4" />
      <path d="M10 8h4" />
      <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
      <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
    </g>
  )
}

// ── Main component ────────────────────────────────────────────────

export function TravelDoodleBackground() {
  // 480×480 tile, 3×3 grid of 96px icons
  // Slot width/height = 160px → icon top-left offset = (160-96)/2 = 32px into each slot
  const cols = [32, 192, 352]
  const rows = [28, 192, 356]

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ opacity: 0.11 }}
      aria-hidden="true"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern
            id="travel-doodles"
            x="0" y="0"
            width="480" height="480"
            patternUnits="userSpaceOnUse"
          >
            {/* ── Row 1 ──────────────────────────────────────── */}
            {/* Luggage · upright */}
            <g transform={place(cols[0], rows[0])}>
              <Luggage />
            </g>

            {/* Plane · banked 22° (departing angle) */}
            <g transform={place(cols[1], rows[0], 22)}>
              <Plane />
            </g>

            {/* Building · upright */}
            <g transform={place(cols[2], rows[0])}>
              <Building />
            </g>

            {/* ── Row 2 ──────────────────────────────────────── */}
            {/* Plane · banked -16° (opposite direction) */}
            <g transform={place(cols[0], rows[1], -16)}>
              <Plane />
            </g>

            {/* Building · upright */}
            <g transform={place(cols[1], rows[1])}>
              <Building />
            </g>

            {/* Luggage · slight tilt */}
            <g transform={place(cols[2], rows[1], -7)}>
              <Luggage />
            </g>

            {/* ── Row 3 ──────────────────────────────────────── */}
            {/* Building · upright */}
            <g transform={place(cols[0], rows[2])}>
              <Building />
            </g>

            {/* Luggage · slight opposite tilt */}
            <g transform={place(cols[1], rows[2], 9)}>
              <Luggage />
            </g>

            {/* Plane · banked 14° */}
            <g transform={place(cols[2], rows[2], 14)}>
              <Plane />
            </g>
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#travel-doodles)" />
      </svg>
    </div>
  )
}
