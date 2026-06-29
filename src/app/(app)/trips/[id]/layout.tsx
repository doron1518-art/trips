import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TripNav } from '@/components/trips/TripNav'
import { TravelDoodleBackground } from '@/components/ui/TravelDoodleBackground'

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trip } = await supabase
    .from('trips')
    .select('id, title, destination, owner_id')
    .eq('id', id)
    .single()

  if (!trip) notFound()

  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) notFound()

  return (
    <div className="relative flex flex-col min-h-[calc(100vh-3.5rem)]">
      <TravelDoodleBackground />
      <TripNav
        tripId={trip.id}
        tripTitle={trip.title}
        destination={trip.destination}
        isOwner={membership.role === 'owner'}
      />
      <div className="relative z-10 flex-1">{children}</div>
    </div>
  )
}
