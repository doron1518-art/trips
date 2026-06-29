import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/layout/AppNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppNav userEmail={profile?.email} userName={profile?.full_name ?? undefined} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
