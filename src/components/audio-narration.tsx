import { useEffect, useMemo, useRef, useState } from 'react'
import { AudioLines, Pause, Play, RotateCcw, Volume2 } from 'lucide-react'
import { audioTracks } from '@/lib/audio-tracks'

type AudioNarrationProps = {
  src?: string
  title: string
  transcript: string
  summary?: string
}

const rates = [0.8, 1, 1.2, 1.5]
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

export function AudioNarration({ src, title, transcript, summary }: AudioNarrationProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const speechTimerRef = useRef<number | undefined>(undefined)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rateIndex, setRateIndex] = useState(1)
  const [activeWord, setActiveWord] = useState(-1)
  const [speechSupported, setSpeechSupported] = useState(true)
  const track = src ? audioTracks[src] : undefined
  const resolvedSummary = summary ?? track?.summary ?? `Narração desta aula: ${title}. Ouça a explicação e acompanhe a transcrição.`
  const words = useMemo(() => Array.from(transcript.matchAll(/\S+/g), (match) => ({ text: match[0], start: match.index ?? 0 })), [transcript])
  const estimatedDuration = Math.max(1, words.length / (2.25 * rates[rateIndex]!))
  const playbackDuration = src ? duration : estimatedDuration
  const progress = src ? (duration ? currentTime / duration : 0) : Math.min(1, (activeWord + 1) / Math.max(1, words.length))

  useEffect(() => {
    setSpeechSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    return () => {
      if (typeof window !== 'undefined' && speechTimerRef.current !== undefined) window.clearInterval(speechTimerRef.current)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  const seekActiveWord = (seconds: number, total: number) => {
    if (!words.length || total <= 0) return
    const target = Math.max(0, Math.min(0.999, seconds / total))
    const targetStart = target * transcript.length
    let index = 0
    while (index < words.length - 1 && words[index + 1]!.start <= targetStart) index += 1
    setActiveWord(index)
  }

  const speak = (fromWord = 0, speedIndex = rateIndex) => {
    if (!speechSupported) return
    if (speechTimerRef.current !== undefined) window.clearInterval(speechTimerRef.current)
    window.speechSynthesis.cancel()
    const startAt = Math.max(0, Math.min(words.length - 1, fromWord))
    const startIndex = words[startAt]?.start ?? 0
    const spokenText = `${transcript.slice(startIndex)}`
    const utterance = new SpeechSynthesisUtterance(spokenText)
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith('pt-br'))
    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang ?? 'pt-BR'
    utterance.rate = rates[speedIndex]!
    utterance.onboundary = (event) => {
      if (event.name !== 'word') return
      const absoluteIndex = startIndex + event.charIndex
      let index = startAt
      while (index < words.length - 1 && words[index + 1]!.start <= absoluteIndex) index += 1
      setActiveWord(index)
    }
    let spokenMs = 0
    let lastTick = performance.now()
    speechTimerRef.current = window.setInterval(() => {
      const now = performance.now()
      if (!window.speechSynthesis.paused && window.speechSynthesis.speaking) spokenMs += now - lastTick
      lastTick = now
      const fallbackIndex = startAt + Math.floor((spokenMs / 1000) * 2.25 * rates[speedIndex]!)
      if (fallbackIndex < words.length) setActiveWord((current) => Math.max(current, fallbackIndex))
    }, 180)
    utterance.onend = () => { if (speechTimerRef.current !== undefined) window.clearInterval(speechTimerRef.current); setPlaying(false); setActiveWord(words.length - 1) }
    utterance.onerror = () => { if (speechTimerRef.current !== undefined) window.clearInterval(speechTimerRef.current); setPlaying(false) }
    utteranceRef.current = utterance
    setCurrentTime(0)
    setPlaying(true)
    window.speechSynthesis.speak(utterance)
  }

  const togglePlayback = () => {
    if (src) {
      const audio = audioRef.current
      if (!audio) return
      if (audio.paused) void audio.play()
      else audio.pause()
      return
    }
    if (!speechSupported) return
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause()
      setPlaying(false)
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setPlaying(true)
    } else {
      speak(activeWord >= 0 ? activeWord : 0)
    }
  }

  const cycleRate = () => {
    const next = (rateIndex + 1) % rates.length
    setRateIndex(next)
    if (src && audioRef.current) audioRef.current.playbackRate = rates[next]!
    else if (window.speechSynthesis?.speaking) speak(Math.max(0, activeWord), next)
  }

  const restart = () => {
    if (src && audioRef.current) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
      setActiveWord(-1)
      void audioRef.current.play()
    } else {
      setActiveWord(-1)
      speak(0)
    }
  }

  return <section className="audio-console mt-7 overflow-hidden rounded-xl border border-violet-300/20 bg-[#12121a]" aria-label={`Áudio da aula: ${title}`}>
    {src && <audio
      ref={audioRef}
      preload="metadata"
      src={src}
      onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onDurationChange={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onTimeUpdate={(event) => { const time = event.currentTarget.currentTime; setCurrentTime(time); seekActiveWord(time, event.currentTarget.duration) }}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => setPlaying(false)}
      className="hidden"
    />}
    <div className="audio-orbit" aria-hidden="true"><span /><span /><span /></div>
    <div className="relative z-10 p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <button type="button" onClick={togglePlayback} disabled={!src && !speechSupported} aria-label={playing ? 'Pausar narração' : 'Reproduzir narração'} className="audio-play-button grid size-11 shrink-0 place-items-center rounded-xl bg-violet-300 text-[#100c19] transition-transform hover:scale-105 disabled:opacity-40">
          {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} className="translate-x-px" fill="currentColor" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold tracking-[-.02em] text-[#f0edf9]">Narração da aula</p><span className="rounded-md border border-violet-300/20 bg-violet-300/[.07] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[.1em] text-violet-200">{src ? 'áudio' : 'voz do navegador'}</span></div>
          <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-[#9a98a8]">{resolvedSummary}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={cycleRate} className="rounded-lg border border-white/[.09] px-2.5 py-1.5 text-[10px] font-semibold text-[#cac6d4] transition-colors hover:border-violet-200/30 hover:bg-violet-200/[.06]" aria-label="Alterar velocidade da narração">{rates[rateIndex]}×</button>
          <button type="button" onClick={restart} className="grid size-8 place-items-center rounded-lg text-[#9a98a8] transition-colors hover:bg-white/[.05] hover:text-white" aria-label="Recomeçar narração"><RotateCcw size={14} /></button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="w-8 text-right font-mono text-[9px] tabular-nums text-[#807e8b]">{src ? formatTime(currentTime) : formatTime(progress * playbackDuration)}</span>
        {src ? <input aria-label="Avançar ou voltar no áudio" type="range" min={0} max={duration || 1} step={0.1} value={Math.min(currentTime, duration || 1)} onChange={(event) => { const time = Number(event.currentTarget.value); if (audioRef.current) audioRef.current.currentTime = time; setCurrentTime(time) }} className="audio-seek min-w-0 flex-1" style={{ '--audio-progress': `${progress * 100}%` } as React.CSSProperties} /> : <div className="audio-progress min-w-0 flex-1" style={{ '--audio-progress': `${progress * 100}%` } as React.CSSProperties}><div /></div>}
        <span className="w-8 font-mono text-[9px] tabular-nums text-[#807e8b]">{src ? formatTime(duration) : `~${formatTime(playbackDuration)}`}</span>
      </div>

      <div className="mt-4 flex items-center justify-between"><div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.12em] text-violet-200/75"><AudioLines size={13} />Transcrição acompanhada</div><span className="flex items-center gap-1 text-[9px] text-[#777582]"><Volume2 size={11} />{src ? 'Destaque acompanha o progresso' : 'Palavra destacada durante a fala'}</span></div>
      <p className="mt-1.5 text-[9px] leading-relaxed text-[#777582]">{src ? 'No áudio gravado, a marcação segue o roteiro e a duração do arquivo.' : 'A voz do navegador destaca palavra a palavra; a voz disponível depende do dispositivo.'}</p>
      <p className="audio-transcript mt-2 max-h-44 overflow-y-auto rounded-lg border border-white/[.055] bg-black/20 p-3 text-[12px] leading-[2] text-[#aaa7b4]" aria-label="Transcrição da narração" aria-live="off">
        {words.map((word, index) => <span key={`${word.start}-${index}`} className={index === activeWord ? 'audio-word-active' : index < activeWord ? 'text-[#c2becb]' : ''}>{word.text}{' '}</span>)}
      </p>
      {!src && !speechSupported && <p className="mt-2 text-[10px] text-amber-200/80">Narração indisponível neste navegador. A transcrição segue disponível acima.</p>}
    </div>
  </section>
}
