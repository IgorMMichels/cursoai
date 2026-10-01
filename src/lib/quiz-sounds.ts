const MUTE_KEY = 'quiz-sounds-muted'

export function isQuizSoundsMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function setQuizSoundsMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    /* armazenamento indisponível */
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function canPlay(): boolean {
  try {
    const stored = window.localStorage.getItem(MUTE_KEY)
    if (stored === '1') return false
    if (prefersReducedMotion() && stored !== '0') return false
    return true
  } catch {
    return !prefersReducedMotion()
  }
}

let sharedContext: AudioContext | null = null

function getContext(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    if (!sharedContext) sharedContext = new Ctor()
    if (sharedContext.state === 'suspended') void sharedContext.resume()
    return sharedContext
  } catch {
    return null
  }
}

function beep(frequency: number, startAt: number, duration: number, type: OscillatorType, gainPeak: number): void {
  const context = getContext()
  if (!context) return
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const now = context.currentTime + startAt
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, now)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(now)
  oscillator.stop(now + duration + 0.05)
}

export function playQuizSuccess(): void {
  if (!canPlay()) return
  try {
    beep(523.25, 0, 0.16, 'sine', 0.12)
    beep(783.99, 0.11, 0.22, 'sine', 0.1)
  } catch {
    /* som opcional */
  }
}

export function playQuizError(): void {
  if (!canPlay()) return
  try {
    beep(196, 0, 0.25, 'triangle', 0.1)
  } catch {
    /* som opcional */
  }
}
