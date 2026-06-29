'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addIdea(
  tripId: string,
  data: { name: string; description?: string; category: string; image_url?: string; attachment_urls?: string[] }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('ideas').insert({
    trip_id: tripId,
    created_by: user.id,
    name: data.name,
    description: data.description || null,
    category: data.category as 'food' | 'music' | 'culture' | 'nature' | 'adventure' | 'shopping' | 'other',
    image_url: data.image_url || null,
    attachment_urls: data.attachment_urls ?? [],
  })

  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/ideas`)
  return { success: true }
}

export async function updateIdea(
  tripId: string,
  ideaId: string,
  data: { name: string; description?: string; category: string; image_url?: string; attachment_urls?: string[] }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('ideas').update({
    name: data.name,
    description: data.description || null,
    category: data.category as 'food' | 'music' | 'culture' | 'nature' | 'adventure' | 'shopping' | 'other',
    image_url: data.image_url || null,
    attachment_urls: data.attachment_urls ?? [],
  }).eq('id', ideaId)

  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/ideas`)
  return { success: true }
}

export async function deleteIdea(tripId: string, ideaId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('ideas').delete().eq('id', ideaId)
  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/ideas`)
  return { success: true }
}
