export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!date) return ''
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...opts,
  })
}

export function formatDateShort(date: string | null | undefined) {
  return formatDate(date, { weekday: undefined, month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatTime(time: string | null | undefined) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const CARD_GRADIENTS = [
  'from-violet-500 via-purple-500 to-pink-500',
  'from-orange-400 via-rose-500 to-pink-500',
  'from-cyan-400 via-blue-500 to-indigo-600',
  'from-emerald-400 via-teal-500 to-cyan-500',
  'from-amber-400 via-orange-500 to-rose-500',
  'from-fuchsia-500 via-purple-500 to-violet-600',
  'from-lime-400 via-green-500 to-teal-500',
  'from-sky-400 via-blue-500 to-indigo-500',
]

export function tripGradient(id: string) {
  const hash = Array.from(id).reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return CARD_GRADIENTS[hash % CARD_GRADIENTS.length]
}
