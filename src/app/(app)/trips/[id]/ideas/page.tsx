import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IdeasClient } from '@/components/ideas/IdeasClient'

export default async function IdeasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ideas, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('trip_id', id)
    .order('created_at', { ascending: false })

  if (error) notFound()

  return <IdeasClient tripId={id} initialIdeas={ideas ?? []} />
}
