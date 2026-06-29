import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DiaryClient } from '@/components/diary/DiaryClient'

export default async function DiaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: entries, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('trip_id', id)
    .order('date')

  if (error) notFound()

  return <DiaryClient tripId={id} initialEntries={entries ?? []} />
}
