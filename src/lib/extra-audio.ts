import catalog from '@/lib/generated/extra-audio-catalog.json'
import type { AudioWord } from '@/lib/narration-script'

export type ExtraAudioBlock = {
  id: string
  number: number
  audioSrc: string
  duration: number
}

export type ExtraAudioLesson = {
  id: string
  number: string
  module: string
  title: string
  expectedBlocks: number
  availableBlocks: number
  captionsSrc: string
  blocks: ExtraAudioBlock[]
}

export type ExtraAudioJourney = {
  id: string
  folder: string
  title: string
  lessons: ExtraAudioLesson[]
}

export type ExtraAudioCaptionBlock = {
  id: string
  transcript: string
  duration: number
  matchRatio: number
  words: AudioWord[]
}

export const extraAudioCatalog = catalog as {
  version: number
  voiceLabel: string
  journeys: ExtraAudioJourney[]
}

export const extraAudioJourneyLabels: Record<string, string> = {
  cripto: 'Cripto',
  futuros: 'Futuros',
  memecoins: 'Memecoins',
  trading: 'Trading',
}

export function audioCoverage(lesson: ExtraAudioLesson) {
  return lesson.availableBlocks === lesson.expectedBlocks ? 'completo' : 'parcial'
}
