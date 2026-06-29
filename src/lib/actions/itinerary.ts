'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addItineraryItem(tripId: string, formData: FormData, attachmentUrls: string[] = []) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const time = formData.get('time') as string
  const { error } = await supabase.from('itinerary_items').insert({
    trip_id: tripId,
    created_by: user.id,
    date: formData.get('date') as string,
    title: formData.get('title') as string,
    type: (formData.get('type') as string) as 'event' | 'hotel' | 'transit' | 'other' | 'concert' | 'tour',
    description: (formData.get('description') as string) || null,
    location: (formData.get('location') as string) || null,
    time: time ? time + ':00' : null,
    sort_order: 0,
    attachment_urls: attachmentUrls,
  })

  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/itinerary`)
  return { success: true }
}

export async function updateItineraryItem(tripId: string, itemId: string, formData: FormData, attachmentUrls: string[] = []) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const time = formData.get('time') as string
  const { error } = await supabase.from('itinerary_items').update({
    date: formData.get('date') as string,
    title: formData.get('title') as string,
    type: (formData.get('type') as string) as 'event' | 'hotel' | 'transit' | 'other' | 'concert' | 'tour',
    description: (formData.get('description') as string) || null,
    location: (formData.get('location') as string) || null,
    time: time ? time + ':00' : null,
    attachment_urls: attachmentUrls,
  }).eq('id', itemId)

  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/itinerary`)
  return { success: true }
}

export async function deleteItineraryItem(tripId: string, itemId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('itinerary_items').delete().eq('id', itemId)
  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/itinerary`)
  return { success: true }
}
