import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatClient } from '@/components/chat/ChatClient'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [messagesRes, membersRes] = await Promise.all([
    supabase
      .from('trip_messages')
      .select('*')
      .eq('trip_id', id)
      .order('created_at'),
    supabase
      .from('trip_members')
      .select('profiles(id, full_name, email, avatar_url)')
      .eq('trip_id', id),
  ])

  if (messagesRes.error) notFound()

  type ProfileRow = { id: string; full_name: string | null; avatar_url: string | null; email: string }
  const members = (membersRes.data ?? [])
    .map(m => m.profiles as ProfileRow | null)
    .filter((p): p is ProfileRow => p !== null)

  return (
    <ChatClient
      tripId={id}
      currentUserId={user.id}
      initialMessages={messagesRes.data ?? []}
      members={members}
    />
  )
}
