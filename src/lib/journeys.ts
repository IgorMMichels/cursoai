import { modules as legacyModules, type CourseModule } from '@/lib/course'
import localJourneys from '@/lib/generated/journeys.json'
import { supabase } from '@/lib/supabase'

export type JourneyLevel = 'iniciante' | 'intermediario' | 'avancado'
export type JourneyStatus = 'not-started' | 'in-progress' | 'completed'
export type Journey = {
  id: string
  ordinal: number
  title: string
  shortDesc: string
  longDesc: string
  icon: string
  color: string
  level: JourneyLevel
  coverUrl?: string
  published: boolean
  modules: CourseModule[]
  catalogOnly?: boolean
}

function missingJourneySchema(error: { code?: string; message?: string } | null) {
  return Boolean(error && (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    (error.code === '42703' && /journey_id/.test(error.message ?? ''))
  ))
}

function localCatalog(legacyAvailable = true): Journey[] {
  const upcoming = localJourneys.map((journey) => ({
    ...journey,
    level: journey.level as JourneyLevel,
    coverUrl: journey.coverUrl ?? undefined,
    catalogOnly: true,
  }))
  return [...upcoming, {
    id: 'cripto-do-zero', ordinal: 4, title: 'Cripto do Zero',
    shortDesc: 'Aprenda fundamentos, segurança e decisões conscientes em cripto.',
    longDesc: 'Sua trilha original de fundamentos de criptoativos, carteiras, segurança, análise e gestão de risco.',
    icon: 'BookOpen', color: 'lilac', level: 'iniciante', published: true,
    modules: legacyModules, catalogOnly: !legacyAvailable,
  }]
}

export function journeyLessons(journey: Journey) {
  return journey.modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id })))
}

export function journeyProgress(journey: Journey, completedLessons: string[]) {
  const lessons = journeyLessons(journey)
  if (!lessons.length) return 0
  const completed = new Set(completedLessons)
  return Math.round(lessons.filter((lesson) => completed.has(lesson.id)).length / lessons.length * 100)
}

export function journeyStatus(journey: Journey, completedLessons: string[]): JourneyStatus {
  const progress = journeyProgress(journey, completedLessons)
  return progress === 0 ? 'not-started' : progress === 100 ? 'completed' : 'in-progress'
}

export function nextLesson(journey: Journey, completedLessons: string[]) {
  const completed = new Set(completedLessons)
  return journeyLessons(journey).find((lesson) => !completed.has(lesson.id)) ?? null
}

export async function loadJourneys(includeUnpublished = false): Promise<Journey[]> {
  if (!supabase) {
    if (!includeUnpublished) return localCatalog(false)
    throw new Error('Serviço indisponível no momento.')
  }
  const journeyQuery = supabase.from('journeys').select('id,ordinal,title,short_desc,long_desc,icon,color,level,cover_url,published').order('ordinal')
  const moduleQuery = supabase.from('course_modules').select('id,journey_id,ordinal,title,subtitle,published').order('ordinal')
  const lessonQuery = supabase.from('lessons').select('id,module_id,ordinal,title,duration_minutes,published').order('ordinal')
  const [journeyResult, moduleResult, lessonResult] = await Promise.all([journeyQuery, moduleQuery, lessonQuery])
  if (missingJourneySchema(journeyResult.error) || missingJourneySchema(moduleResult.error)) {
    if (!includeUnpublished) return localCatalog()
  }
  if (journeyResult.error) throw journeyResult.error
  if (moduleResult.error) throw moduleResult.error
  if (lessonResult.error) throw lessonResult.error
  const rows = (journeyResult.data ?? []).filter((row) => includeUnpublished || row.published)
  if (!includeUnpublished && rows.length === 0) return localCatalog()
  return rows.map((row) => ({
    id: row.id,
    ordinal: row.ordinal,
    title: row.title,
    shortDesc: row.short_desc,
    longDesc: row.long_desc,
    icon: row.icon,
    color: row.color,
    level: row.level as JourneyLevel,
    coverUrl: row.cover_url ?? undefined,
    published: row.published,
    modules: (moduleResult.data ?? []).filter((module) => module.journey_id === row.id && (includeUnpublished || module.published)).map((module) => {
      const lessons = (lessonResult.data ?? []).filter((lesson) => lesson.module_id === module.id && (includeUnpublished || lesson.published))
      const legacy = row.id === 'cripto-do-zero' ? legacyModules.find((item) => item.id === module.id) : undefined
      return {
        id: module.id,
        number: String(module.ordinal).padStart(2, '0'),
        ordinal: module.ordinal,
        title: module.title,
        subtitle: module.subtitle,
        icon: legacy?.icon ?? row.icon,
        color: legacy?.color ?? row.color,
        duration: `${lessons.reduce((total, lesson) => total + lesson.duration_minutes, 0)} min`,
        published: module.published,
        lessons: lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, duration: `${lesson.duration_minutes} min`, published: lesson.published, ordinal: lesson.ordinal })),
      }
    }),
  }))
}
