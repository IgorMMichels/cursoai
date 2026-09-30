import { supabase } from '@/lib/supabase'
import type { NarrationTrack } from '@/lib/narration-script'

function client() {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.')
  return supabase
}

export type ProtectedLessonContent = {
  paragraphs: string[]
  takeaway: string
  sources: { label: string; url: string }[]
  exercise: { title: string; prompt: string; options: string[]; note: string }
  narration: NarrationTrack
}

export async function loadLessonContent(lessonId: string): Promise<ProtectedLessonContent> {
  const { data, error } = await client().from('lesson_content').select('content').eq('lesson_id', lessonId).single()
  if (error) throw error
  return data.content as ProtectedLessonContent
}

export async function verifyLessonExercise(lessonId: string, answerIndex: number) {
  const { data, error } = await client().rpc('verify_lesson_exercise', {
    p_lesson_id: lessonId,
    p_answer_index: answerIndex,
  })
  if (error) throw error
  return data as boolean
}

export type QuizAttempt = {
  moduleId: string
  score: number
  total: number
  passed: boolean
  createdAt: string
}
export type QuizQuestion = { question: string; options: string[] }
export type QuizSubmission = { score: number; total: number; passed: boolean; feedback: { selected: number; correct: boolean; correct_option: number; explanation: string }[] }

export async function loadModuleQuiz(moduleId: string): Promise<QuizQuestion[]> {
  const { data, error } = await client().rpc('get_module_quiz', { p_module_id: moduleId })
  if (error) throw error
  return (data ?? []) as QuizQuestion[]
}

export async function submitModuleQuiz(moduleId: string, answers: number[]): Promise<QuizSubmission> {
  const { data, error } = await client().rpc('submit_module_quiz', { p_module_id: moduleId, p_answers: answers })
  if (error) throw error
  return data as QuizSubmission
}

export async function loadLessonProgress(userId: string) {
  const { data, error } = await client().from('lesson_progress').select('lesson_id').eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map((row) => row.lesson_id)
}

export async function saveLessonProgress(userId: string, lessonId: string) {
  const { error } = await client().from('lesson_progress').upsert(
    { user_id: userId, lesson_id: lessonId },
    { onConflict: 'user_id,lesson_id', ignoreDuplicates: true },
  )
  if (error) throw error
}

export async function loadSecurityChecklist() {
  const { data: auth, error: authError } = await client().auth.getUser()
  if (authError) throw authError
  if (!auth.user) return []
  const { data, error } = await client().from('profiles').select('security_checklist').eq('id', auth.user.id).single()
  if (error) throw error
  return data.security_checklist ?? []
}

export async function saveSecurityChecklist(items: string[]) {
  const { data: auth, error: authError } = await client().auth.getUser()
  if (authError) throw authError
  if (!auth.user) throw new Error('Entre na sua conta para salvar o checklist.')
  const { error } = await client().from('profiles').update({ security_checklist: items }).eq('id', auth.user.id)
  if (error) throw error
}

export async function saveLearningProfile(profileKey: string, answers: string[]) {
  const { data: auth, error: authError } = await client().auth.getUser()
  if (authError) throw authError
  if (!auth.user) throw new Error('Entre na sua conta para salvar seu perfil de aprendizagem.')
  const { error } = await client().from('learning_profiles').upsert({
    user_id: auth.user.id,
    profile_key: profileKey,
    answers,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function loadLearningProfile() {
  const { data: auth, error: authError } = await client().auth.getUser()
  if (authError) throw authError
  if (!auth.user) return null
  const { data, error } = await client().from('learning_profiles').select('profile_key, answers').eq('user_id', auth.user.id).maybeSingle()
  if (error) throw error
  return data
}

export async function loadQuizAttempts(userId: string) {
  const { data, error } = await client().from('quiz_attempts').select('module_id, score, total, passed, created_at').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  const latest = new Map<string, QuizAttempt>()
  for (const row of data ?? []) {
    if (!latest.has(row.module_id)) latest.set(row.module_id, { moduleId: row.module_id, score: row.score, total: row.total, passed: row.passed, createdAt: row.created_at })
  }
  return Object.fromEntries(latest)
}

export async function issueCourseCertificate() {
  const { data, error } = await client().rpc('issue_course_certificate')
  if (error) throw error
  const certificate = Array.isArray(data) ? data[0] : data
  if (!certificate) throw new Error('Certificado não foi emitido.')
  const { data: auth, error: authError } = await client().auth.getUser()
  if (authError) throw authError
  if (!auth.user) throw new Error('Entre na sua conta para ver o certificado.')
  const { data: profile, error: profileError } = await client().from('profiles').select('display_name').eq('id', auth.user.id).single()
  if (profileError) throw profileError
  return { code: certificate.certificate_code as string, issuedAt: certificate.issued_at as string, name: profile.display_name }
}

export async function loadCourseCertificate(userId: string) {
  const { data, error } = await client().from('course_certificates').select('certificate_code, issued_at').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!data) return null
  const { data: profile, error: profileError } = await client().from('profiles').select('display_name').eq('id', userId).single()
  if (profileError) throw profileError
  return { code: data.certificate_code, issuedAt: data.issued_at, name: profile.display_name }
}
