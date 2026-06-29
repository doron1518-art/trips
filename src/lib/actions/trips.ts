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

export async function inviteMember(tripId: string, email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'owner') return { error: 'Only the trip owner can invite members' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!profile) return { error: 'No account found with that email address' }
  if (profile.id === user.id) return { error: 'You are already the owner of this trip' }

  const { error } = await supabase.from('trip_members').insert({
    trip_id: tripId,
    user_id: profile.id,
    role: 'editor',
  })

  if (error) {
    if (error.code === '23505') return { error: 'This user is already a member of this trip' }
    return { error: error.message }
  }

  revalidatePath(`/trips/${tripId}`)
  return { success: true }
}
