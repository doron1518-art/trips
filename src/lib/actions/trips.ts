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

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[joinTrip] auth error:', authError)
    return { error: 'Not authenticated' }
  }

  const normalizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  console.log('[joinTrip] attempting code:', normalizedCode, 'user:', user.id)

  if (normalizedCode.length !== 6) {
    return { error: 'Code must be exactly 6 characters.' }
  }

  // Call the SECURITY DEFINER function — bypasses RLS for both the trip lookup
  // and the trip_members insert, so non-members can join via code.
  const { data: result, error: rpcError } = await supabase
    .rpc('join_trip_by_code', { p_code: normalizedCode })

  if (rpcError) {
    console.error('[joinTrip] rpc error:', rpcError)
    return { error: `Server error: ${rpcError.message}` }
  }

  console.log('[joinTrip] rpc result:', result)

  const res = result as { error?: string; already_member?: boolean; success?: boolean; trip_id?: string; trip_title?: string }

  if (res.error) return { error: res.error }

  revalidatePath('/trips')

  if (res.already_member) {
    return { alreadyMember: true as const, tripId: res.trip_id!, tripTitle: res.trip_title! }
  }

  return { success: true as const, tripId: res.trip_id!, tripTitle: res.trip_title! }
}
