import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'food' | 'music' | 'culture' | 'nature' | 'adventure' | 'shopping' | 'other'
  | 'owner' | 'editor'
  | 'event' | 'hotel' | 'transit' | 'concert' | 'tour' | 'restaurant'
  | 'default'

const VARIANTS: Record<BadgeVariant, string> = {
  food:      'bg-gradient-to-r from-orange-400 to-red-400 text-white',
  music:     'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  culture:   'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
  nature:    'bg-gradient-to-r from-green-400 to-emerald-500 text-white',
  adventure: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
  shopping:  'bg-gradient-to-r from-pink-400 to-rose-500 text-white',
  other:     'bg-gradient-to-r from-gray-400 to-slate-500 text-white',
  owner:     'bg-gradient-to-r from-amber-400 to-orange-400 text-white',
  editor:    'bg-gradient-to-r from-sky-400 to-blue-500 text-white',
  event:     'bg-gradient-to-r from-blue-400 to-cyan-500 text-white',
  hotel:     'bg-gradient-to-r from-violet-400 to-purple-600 text-white',
  transit:   'bg-gradient-to-r from-teal-400 to-cyan-500 text-white',
  concert:   'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white',
  tour:       'bg-gradient-to-r from-lime-500 to-green-500 text-white',
  restaurant: 'bg-gradient-to-r from-orange-400 to-red-500 text-white',
  default:    'bg-gradient-to-r from-gray-400 to-slate-400 text-white',
}

const EMOJIS: Record<BadgeVariant, string> = {
  food:      '🍜',
  music:     '🎵',
  culture:   '🏛️',
  nature:    '🌿',
  adventure: '🧗',
  shopping:  '🛍️',
  other:     '✨',
  owner:     '👑',
  editor:    '✏️',
  event:     '🎯',
  hotel:     '🏨',
  transit:   '✈️',
  concert:   '🎤',
  tour:       '🚶‍♂️',
  restaurant: '🍽️',
  default:    '•',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const v = variant ?? 'default'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize shadow-sm',
        VARIANTS[v] ?? VARIANTS.default,
        className
      )}
    >
      <span className="text-[11px] leading-none">{EMOJIS[v]}</span>
      {children}
    </span>
  )
}
