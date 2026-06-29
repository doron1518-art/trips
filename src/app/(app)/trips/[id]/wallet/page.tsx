import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WalletClient } from '@/components/wallet/WalletClient'

export default async function WalletPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [walletRes, itineraryRes] = await Promise.all([
    supabase
      .from('wallet_items')
      .select('*')
      .eq('trip_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('itinerary_items')
      .select('id, title, type, attachment_urls')
      .eq('trip_id', id)
      .order('date'),
  ])

  if (walletRes.error) notFound()

  const anchorsWithFiles = (itineraryRes.data ?? []).filter(
    (item) => item.attachment_urls && item.attachment_urls.length > 0
  )

  return (
    <WalletClient
      tripId={id}
      initialItems={walletRes.data ?? []}
      anchorAttachments={anchorsWithFiles}
    />
  )
}
