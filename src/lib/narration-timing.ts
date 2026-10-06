import type { AudioWord } from './narration-script'

// Keep closing punctuation with its word when a transcript wraps onto a new line.
export function wordDisplayEnd(transcript: string, word: AudioWord): number {
  return word.charEnd + (transcript.slice(word.charEnd).match(/^[.,!?;:…)\]}»”’]+/u)?.[0].length ?? 0)
}

export function activeWordAt(words: AudioWord[], time: number): number {
  let low = 0
  let high = words.length - 1
  let candidate = -1
  while (low <= high) {
    const middle = (low + high) >>> 1
    if (words[middle].start <= time) { candidate = middle; low = middle + 1 }
    else high = middle - 1
  }
  return candidate >= 0 && time < words[candidate].end ? candidate : -1
}

export function parseCaptions(value: unknown, transcript: string, duration: number): AudioWord[] {
  const data = value as { transcript?: unknown; words?: unknown }
  if (!data || data.transcript !== transcript || !Array.isArray(data.words) || !data.words.length) throw new Error('A transcrição não corresponde ao áudio.')
  let previousEnd = 0
  let previousCharEnd = 0
  for (const word of data.words as AudioWord[]) {
    if (!word || ![word.start, word.end, word.charStart, word.charEnd].every(Number.isFinite)
      || word.start < previousEnd - .001 || word.end <= word.start || word.end > duration + .15
      || !Number.isInteger(word.charStart) || !Number.isInteger(word.charEnd)
      || word.charStart < previousCharEnd || word.charEnd <= word.charStart || word.charEnd > transcript.length) {
      throw new Error('Marcações de tempo inválidas.')
    }
    if (/[\p{L}\p{N}]/u.test(transcript.slice(previousCharEnd, word.charStart))) throw new Error('Há palavras sem marcação.')
    previousEnd = word.end
    previousCharEnd = word.charEnd
  }
  if (/[\p{L}\p{N}]/u.test(transcript.slice(previousCharEnd))) throw new Error('A transcrição está incompleta.')
  return data.words as AudioWord[]
}
