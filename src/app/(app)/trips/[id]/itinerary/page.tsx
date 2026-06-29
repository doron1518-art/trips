import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ItineraryClient } from '@/components/itinerary/ItineraryClient'

export default async function ItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items, error } = await supabase
    .from('itinerary_items')
    .select('*')
    .eq('trip_id', id)
    .order('date')
    .order('time', { nullsFirst: true })
    .order('sort_order')

  if (error) notFound()

  return <ItineraryClient tripId={id} initialItems={items ?? []} />
}
