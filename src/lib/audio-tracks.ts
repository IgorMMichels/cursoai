import type { Lesson } from './course'
import { narrations } from './generated/narrations'
import { lessonTranscript, welcomeScript } from './narration-script'

// An edited lesson cannot silently play an outdated recording.
export function getLessonNarration(lesson: Lesson) {
  const track = narrations[lesson.id]
  return track?.transcript === lessonTranscript(lesson) ? track : undefined
}

export const welcomeNarration = narrations.welcome?.transcript === welcomeScript.transcript
  ? narrations.welcome : undefined
