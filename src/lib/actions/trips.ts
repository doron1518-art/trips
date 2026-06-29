'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTrip(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('trips').insert({
    owner_id: user.id,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    destination: (formData.get('destination') as string) || null,
    start_date: (formData.get('start_date') as string) || null,
    end_date: (formData.get('end_date') as string) || null,
    cover_image_url: (formData.get('cover_image_url') as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/trips')
  return { success: true }
}

export async function updateTrip(tripId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('trips').update({
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    destination: (formData.get('destination') as string) || null,
    start_date: (formData.get('start_date') as string) || null,
    end_date: (formData.get('end_date') as string) || null,
    cover_image_url: (formData.get('cover_image_url') as string) || null,
  }).eq('id', tripId).eq('owner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/trips')
  return { success: true }
}

export async function deleteTrip(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('trips').delete().eq('id', tripId).eq('owner_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/trips')
  return { success: true }
}

export async function joinTrip(code: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const normalizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (normalizedCode.length !== 6) return { error: 'Code must be 6 characters.' }

  const { data: trip } = await supabase
    .from('trips')
    .select('id, title')
    .eq('join_code', normalizedCode)
    .maybeSingle()

  if (!trip) return { error: 'Invalid code — double-check and try again.' }

  const { data: existing } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', trip.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { alreadyMember: true as const, tripId: trip.id, tripTitle: trip.title }

  const { error } = await supabase.from('trip_members').insert({
    trip_id: trip.id,
    user_id: user.id,
    role: 'editor' as const,
  })

  if (error) return { error: error.message }

  revalidatePath('/trips')
  return { success: true as const, tripId: trip.id, tripTitle: trip.title }
}
