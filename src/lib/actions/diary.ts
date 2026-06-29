'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addDiaryEntry(
  tripId: string,
  data: { date: string; notes?: string; photo_urls?: string[]; attachment_urls?: string[] }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('diary_entries').insert({
    trip_id: tripId,
    created_by: user.id,
    date: data.date,
    notes: data.notes || null,
    photo_urls: data.photo_urls || [],
    attachment_urls: data.attachment_urls ?? [],
  })

  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/diary`)
  return { success: true }
}

export async function updateDiaryEntry(
  tripId: string,
  entryId: string,
  data: { date: string; notes?: string; photo_urls?: string[]; attachment_urls?: string[] }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('diary_entries').update({
    date: data.date,
    notes: data.notes || null,
    photo_urls: data.photo_urls ?? [],
    attachment_urls: data.attachment_urls ?? [],
  }).eq('id', entryId)

  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/diary`)
  return { success: true }
}

export async function deleteDiaryEntry(tripId: string, entryId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('diary_entries').delete().eq('id', entryId)
  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/diary`)
  return { success: true }
}
