import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TripsClient } from '@/components/trips/TripsClient'

export default async function TripsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch trips where the user is a member, along with member counts
  const { data: memberships } = await supabase
    .from('trip_members')
    .select('trip_id, trips(*), role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const trips = await Promise.all(
    (memberships ?? []).map(async (m) => {
      const trip = m.trips as Parameters<typeof import('@/components/trips/TripsClient')['TripsClient']>[0]['initialTrips'][number]
      const { count } = await supabase
        .from('trip_members')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', trip.id)
      return { ...trip, member_count: count ?? 1 }
    })
  )

  return <TripsClient initialTrips={trips} userId={user.id} />
}
