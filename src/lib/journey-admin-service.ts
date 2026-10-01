import { supabase } from '@/lib/supabase'
import { loadJourneys, type Journey } from '@/lib/journeys'
import type { ProtectedLessonContent } from '@/lib/learning-service'

function db() {
  if (!supabase) throw new Error('Serviço indisponível no momento.')
  return supabase
}

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export const loadAdminJourneys = () => loadJourneys(true)

export async function saveJourney(input: Omit<Journey, 'modules'>, originalId?: string) {
  if (originalId === 'cripto-do-zero' && input.id !== originalId) throw new Error('Slug da trilha original não pode ser alterado.')
  const row = { id: input.id, ordinal: input.ordinal, title: input.title, short_desc: input.shortDesc, long_desc: input.longDesc, icon: input.icon, color: input.color, level: input.level, cover_url: input.coverUrl ?? null, published: input.published }
  if (originalId) check((await db().from('journeys').update(row).eq('id', originalId)).error)
  else check((await db().from('journeys').insert(row)).error)
}

export async function saveModule(input: { id: string; journeyId: string; ordinal: number; title: string; subtitle: string; published: boolean }, originalId?: string) {
  const row = { id: input.id, journey_id: input.journeyId, ordinal: input.ordinal, title: input.title, subtitle: input.subtitle, published: input.published }
  if (originalId) check((await db().from('course_modules').update(row).eq('id', originalId)).error)
  else check((await db().from('course_modules').insert(row)).error)
}

export async function saveLesson(input: { id: string; moduleId: string; ordinal: number; title: string; durationMinutes: number; published: boolean }, originalId?: string) {
  if (input.published) {
    const [content, key] = await Promise.all([
      db().from('lesson_content').select('lesson_id').eq('lesson_id', input.id).maybeSingle(),
      db().from('lesson_exercise_keys').select('lesson_id').eq('lesson_id', input.id).maybeSingle(),
    ])
    check(content.error); check(key.error)
    if (!content.data || !key.data) throw new Error('Cadastre conteúdo e answerIndex antes de publicar aula.')
  }
  const row = { id: input.id, module_id: input.moduleId, ordinal: input.ordinal, title: input.title, duration_minutes: input.durationMinutes, published: input.published }
  if (originalId) check((await db().from('lessons').update(row).eq('id', originalId)).error)
  else check((await db().from('lessons').insert(row)).error)
  await refreshModuleQuiz(input.moduleId)
}

export async function saveLessonContent(lessonId: string, content: ProtectedLessonContent, answerIndex: number) {
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= content.exercise.options.length) throw new Error('Defina answerIndex válido para o exercício.')
  check((await db().from('lesson_content').upsert({ lesson_id: lessonId, content, updated_at: new Date().toISOString() }, { onConflict: 'lesson_id' })).error)
  check((await db().from('lesson_exercise_keys').upsert({ lesson_id: lessonId, answer_index: answerIndex }, { onConflict: 'lesson_id' })).error)
  const lesson = await db().from('lessons').select('module_id').eq('id', lessonId).single()
  check(lesson.error)
  await refreshModuleQuiz(lesson.data!.module_id)
}

async function refreshModuleQuiz(moduleId: string) {
  const siblings = await db().from('lessons').select('id,ordinal').eq('module_id', moduleId).eq('published', true).order('ordinal')
  check(siblings.error)
  if (!siblings.data?.length) {
    check((await db().from('module_quiz_questions').delete().eq('module_id', moduleId)).error)
    return
  }
  const ids = siblings.data.map((item) => item.id)
  const [contents, keys] = await Promise.all([
    db().from('lesson_content').select('lesson_id,content').in('lesson_id', ids),
    db().from('lesson_exercise_keys').select('lesson_id,answer_index').in('lesson_id', ids),
  ])
  check(contents.error); check(keys.error)
  if (contents.data?.length !== ids.length || keys.data?.length !== ids.length) {
    check((await db().from('module_quiz_questions').delete().eq('module_id', moduleId)).error)
    return
  }
  const questions = ids.map((id) => {
    const exercise = (contents.data!.find((item) => item.lesson_id === id)!.content as ProtectedLessonContent).exercise
    return { question: exercise.prompt, options: exercise.options, answer: keys.data!.find((item) => item.lesson_id === id)!.answer_index, explanation: exercise.note }
  })
  check((await db().from('module_quiz_questions').upsert({ module_id: moduleId, questions, updated_at: new Date().toISOString() }, { onConflict: 'module_id' })).error)
}

export async function loadAdminLessonContent(lessonId: string) {
  const [content, key] = await Promise.all([
    db().from('lesson_content').select('content').eq('lesson_id', lessonId).maybeSingle(),
    db().from('lesson_exercise_keys').select('answer_index').eq('lesson_id', lessonId).maybeSingle(),
  ])
  check(content.error); check(key.error)
  if (!content.data) return undefined
  return { ...(content.data.content as ProtectedLessonContent), answerIndex: key.data?.answer_index ?? 0 }
}

async function ensureNoActivity(moduleIds: string[], lessonIds: string[]) {
  if (lessonIds.length) {
    const progress = await db().from('lesson_progress').select('lesson_id').in('lesson_id', lessonIds).limit(1)
    check(progress.error)
    if (progress.data?.length) throw new Error('Exclusão bloqueada: há progresso de alunos nessas aulas.')
  }
  if (moduleIds.length) {
    const attempts = await db().from('quiz_attempts').select('module_id').in('module_id', moduleIds).limit(1)
    check(attempts.error)
    if (attempts.data?.length) throw new Error('Exclusão bloqueada: há revisões de alunos nesses módulos.')
  }
}

export async function deleteJourney(journey: Journey) {
  if (journey.id === 'cripto-do-zero') throw new Error('Trilha original não pode ser excluída.')
  const moduleIds = journey.modules.map((module) => module.id)
  await ensureNoActivity(moduleIds, journey.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)))
  check((await db().from('journeys').delete().eq('id', journey.id)).error)
}

export async function deleteModule(module: Journey['modules'][number]) {
  await ensureNoActivity([module.id], module.lessons.map((lesson) => lesson.id))
  check((await db().from('course_modules').delete().eq('id', module.id)).error)
}

export async function deleteLesson(lessonId: string) {
  await ensureNoActivity([], [lessonId])
  const lesson = await db().from('lessons').select('module_id').eq('id', lessonId).single()
  check(lesson.error)
  check((await db().from('lessons').delete().eq('id', lessonId)).error)
  await refreshModuleQuiz(lesson.data!.module_id)
}

export async function reorder(table: 'journeys' | 'course_modules' | 'lessons', first: { id: string; ordinal: number }, second: { id: string; ordinal: number }) {
  // Existing unique ordinal constraints on modules and lessons need a temporary free slot.
  const temporary = 32767
  check((await db().from(table).update({ ordinal: temporary }).eq('id', first.id)).error)
  try {
    check((await db().from(table).update({ ordinal: first.ordinal }).eq('id', second.id)).error)
    check((await db().from(table).update({ ordinal: second.ordinal }).eq('id', first.id)).error)
  } catch (error) {
    await db().from(table).update({ ordinal: first.ordinal }).eq('id', first.id)
    throw error
  }
}
