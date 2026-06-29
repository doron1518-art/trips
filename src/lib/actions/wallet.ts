'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addWalletItem(
  tripId: string,
  data: { title: string; category: string; file_url?: string | null; notes?: string | null }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('wallet_items').insert({
    trip_id: tripId,
    created_by: user.id,
    title: data.title,
    category: data.category,
    file_url: data.file_url || null,
    notes: data.notes || null,
  })

  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/wallet`)
  return { success: true }
}

export async function deleteWalletItem(tripId: string, itemId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('wallet_items').delete().eq('id', itemId)
  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/wallet`)
  return { success: true }
}
