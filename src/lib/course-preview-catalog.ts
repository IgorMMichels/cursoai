import { modules } from './course.ts'
import localJourneys from './generated/journeys.json' with { type: 'json' }
import type { Journey } from './journeys'

// Reuse course metadata, without lesson bodies, audio or account data.
export function previewCatalog(journeys: Journey[] = localJourneys.map((journey) => ({ ...journey, catalogOnly: true })) as Journey[]): Journey[] {
  const foundation: Journey = {
    id: 'cripto-do-zero', ordinal: 0, title: 'Cripto do Zero',
    shortDesc: 'Fundamentos, carteiras, segurança e rotina de estudo.',
    longDesc: 'A trilha inicial do curso: entenda o mercado, conheça os ativos e prepare sua rotina antes de avançar para as outras jornadas.',
    icon: 'Bitcoin', color: 'lilac', level: 'iniciante', published: true, modules,
  }
  return [foundation, ...journeys.filter((journey) => journey.id !== foundation.id)]
    .filter((journey) => journey.published)
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((journey) => ({ ...journey,
      modules: journey.modules.filter((module) => module.published !== false).map((module) => {
        const lessons = module.lessons.filter((lesson) => lesson.published !== false)
        return { ...module, lessons, duration: `${lessons.reduce((sum, lesson) => sum + (Number.parseFloat(lesson.duration) || 0), 0)} min` }
      }),
    }))
}

export function previewTotals(catalog: Journey[]) {
  const modules = catalog.flatMap((journey) => journey.modules)
  const lessons = modules.flatMap((module) => module.lessons)
  return { journeys: catalog.length, modules: modules.length, lessons: lessons.length,
    minutes: lessons.reduce((sum, lesson) => sum + (Number.parseFloat(lesson.duration) || 0), 0) }
}
