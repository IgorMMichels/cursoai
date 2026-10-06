import mapping from '@/lib/generated/lesson-audio-map.json'
import { extraAudioCatalog } from '@/lib/extra-audio'

// Editorial association by topic: the new scripts group several journey lessons.
// Resolve the source from the library itself so both areas always share audio,
// transcripts, durations and captions. Never fall back to the legacy narration.
export function findLessonAudio(lessonId: string) {
  const sourceId = (mapping as Record<string, string>)[lessonId]
  if (!sourceId) return undefined
  return extraAudioCatalog.journeys.flatMap((journey) => journey.lessons).find((lesson) => lesson.id === sourceId)
}
