import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TripNav } from '@/components/trips/TripNav'
import { TravelDoodleBackground } from '@/components/ui/TravelDoodleBackground'
import type { MemberWithProfile } from '@/components/trips/SharePanel'

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

  const [tripRes, membersRes, membershipRes] = await Promise.all([
    supabase
      .from('trips')
      .select('id, title, destination, owner_id, join_code')
      .eq('id', id)
      .single(),
    supabase
      .from('trip_members')
      .select('role, user_id, profiles(id, full_name, email, avatar_url)')
      .eq('trip_id', id),
    supabase
      .from('trip_members')
      .select('role')
      .eq('trip_id', id)
      .eq('user_id', user.id)
      .single(),
  ])

  if (!tripRes.data) notFound()
  if (!membershipRes.data) notFound()

  const members = (membersRes.data ?? []) as MemberWithProfile[]

  return (
    <div className="relative flex flex-col min-h-[calc(100vh-3.5rem)]">
      <TravelDoodleBackground />
      <TripNav
        tripId={tripRes.data.id}
        tripTitle={tripRes.data.title}
        destination={tripRes.data.destination}
        joinCode={tripRes.data.join_code}
        members={members}
      />
      <div className="relative z-10 flex-1">{children}</div>
    </div>
  )
}
