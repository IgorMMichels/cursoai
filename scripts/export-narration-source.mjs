import { allLessons } from '../src/lib/course.ts'
import { lessonTranscript, welcomeScript } from '../src/lib/narration-script.ts'

process.stdout.write(JSON.stringify([
  welcomeScript,
  ...allLessons.map(lesson => ({
    id: lesson.id,
    title: lesson.title,
    summary: lesson.takeaway,
    transcript: lessonTranscript(lesson),
  })),
]))
