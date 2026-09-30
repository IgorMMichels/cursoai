import { supabase } from '@/lib/supabase'

export type StudentReview = {
  id: string
  userId: string
  name: string
  rating: number
  text: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
}

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

function mapReview(row: { id: string; user_id: string; author_name: string; rating: number; body: string; created_at: string; status: StudentReview['status'] }): StudentReview {
  return { id: row.id, userId: row.user_id, name: row.author_name, rating: row.rating, text: row.body, createdAt: row.created_at, status: row.status }
}

export async function loadPublishedReviews() {
  const { data, error } = await client().from('student_reviews').select('id,user_id,author_name,rating,body,created_at,status').eq('status', 'approved').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapReview)
}

export async function loadAdminReviews() {
  const { data, error } = await client().from('student_reviews').select('id,user_id,author_name,rating,body,created_at,status').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapReview)
}

export async function submitReview(rating: number, body: string) {
  const { error } = await client().rpc('submit_student_review', {
    p_rating: rating,
    p_body: body.trim(),
  })
  if (error) throw error
}

export async function moderateReview(id: string, status: 'approved' | 'rejected') {
  const { error } = await client().from('student_reviews').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function deleteReview(id: string) {
  const { error } = await client().from('student_reviews').delete().eq('id', id)
  if (error) throw error
}
