import { translateUi, translateTemplate } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AudioLines, LoaderCircle, Pause, Play, RotateCcw } from 'lucide-react'
import type { AudioWord, NarrationTrack } from '@/lib/narration-script'
import { activeWordAt, parseCaptions, wordDisplayEnd } from '@/lib/narration-timing'
import { useProtectedMedia } from '@/lib/protected-media'

type Props = { title: string; track?: NarrationTrack; transcript: string; summary?: string; compact?: boolean }
const rates = [0.8, 1, 1.2, 1.5]
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

export function AudioNarration(props: Props) {
  useUiTranslation();
  return <NarrationPlayer key={`${props.track?.src ?? 'unavailable'}:${props.title}`} {...props} />
}

function NarrationPlayer({ title, track, transcript, summary, compact = false }: Props) {
  useUiTranslation();
  const audioRef = useRef<HTMLAudioElement>(null)
  const transcriptRef = useRef<HTMLParagraphElement>(null)
  const mounted = useRef(true)
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(track?.duration ?? 0)
  const [rateIndex, setRateIndex] = useState(1)
  const [words, setWords] = useState<AudioWord[]>([])
  const [captionStatus, setCaptionStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [captionAttempt, setCaptionAttempt] = useState(0)
  const [error, setError] = useState('')
  const [follow, setFollow] = useState(true)
  const [showTranscript, setShowTranscript] = useState(!compact)
  // Narration audio and captions are private; resolve signed URLs for this track.
  const media = useProtectedMedia(track ? [track.src, track.captionsSrc] : [])
  const activeWord = useMemo(() => activeWordAt(words, time), [words, time])
  const progress = duration > 0 ? Math.min(1, time / duration) : 0
  const buttonStyle = 'rounded-xl border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-[#cac6d4] hover:border-violet-200/30 hover:bg-violet-200/[.06] disabled:opacity-40'

  useEffect(() => {
    mounted.current = true
    const audio = audioRef.current
    return () => { mounted.current = false; audio?.pause() }
  }, [])

  useEffect(() => {
    if (!track) return
    if (media.status === 'error') { setWords([]); setCaptionStatus('error'); return }
    const captionUrl = media.urls[track.captionsSrc]
    if (!captionUrl) return
    const controller = new AbortController()
    fetch(captionUrl, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Legendas indisponíveis'); return response.json() })
      .then(data => {
        const cues = parseCaptions(data, transcript, track.duration)
        if (!controller.signal.aborted) { setWords(cues); setCaptionStatus('ready') }
      })
      .catch(() => { if (!controller.signal.aborted) { setWords([]); setCaptionStatus('error') } })
    return () => controller.abort()
  }, [track, transcript, captionAttempt, media])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let previous = 0
    const update = (now: number) => {
      if (now - previous >= 40) { setTime(audioRef.current?.currentTime ?? 0); previous = now }
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  useEffect(() => {
    if (!playing || !follow || !showTranscript || activeWord < 0) return
    const container = transcriptRef.current
    const word = container?.querySelector<HTMLElement>('[data-active="true"]')
    if (!container || !word) return
    const outer = container.getBoundingClientRect()
    const inner = word.getBoundingClientRect()
    if (inner.top < outer.top + 12 || inner.bottom > outer.bottom - 12) {
      container.scrollTo({ top: container.scrollTop + inner.top - outer.top - outer.height / 2, behavior: 'smooth' })
    }
  }, [activeWord, follow, playing, showTranscript])

  const play = async () => {
    const audio = audioRef.current
    if (!audio) return
    setError('')
    setBuffering(true)
    if (audio.error) audio.load()
    try { await audio.play() }
    catch (cause) {
      if (mounted.current && !(cause instanceof DOMException && cause.name === 'AbortError')) {
        setError('Não foi possível reproduzir o áudio. Confira sua conexão e tente novamente.')
        setPlaying(false)
      }
    } finally { if (mounted.current) setBuffering(false) }
  }
  const toggle = () => {
    if (audioRef.current && !audioRef.current.paused) audioRef.current.pause()
    else void play()
  }
  const cycleRate = () => {
    const next = (rateIndex + 1) % rates.length
    setRateIndex(next)
    if (audioRef.current) audioRef.current.playbackRate = rates[next]
  }
  const seekToWord = (word: AudioWord) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = word.start
    setTime(word.start)
    if (audio.paused) void play()
  }
  const restart = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = 0
    setTime(0)
    void play()
  }

  return <section className={`audio-console ${compact ? 'audio-console-compact' : 'mt-7'} overflow-hidden rounded-xl border border-violet-300/20 bg-[#12121a]`} aria-label={translateUi(translateTemplate("Áudio da aula: {{value0}}", [title]))}>
    {track && <audio ref={audioRef} preload="metadata" src={media.urls[track.src]}
      onLoadedMetadata={event => { if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration) }}
      onTimeUpdate={event => setTime(event.currentTarget.currentTime)}
      onSeeking={event => setTime(event.currentTarget.currentTime)}
      onPlay={() => setPlaying(true)} onPlaying={() => setBuffering(false)}
      onWaiting={() => setBuffering(true)} onCanPlay={() => setBuffering(false)}
      onPause={() => { setPlaying(false); setBuffering(false) }}
      onEnded={event => { setPlaying(false); setBuffering(false); setTime(event.currentTarget.duration) }}
      onError={() => { setError('Áudio indisponível. Confira sua conexão e tente novamente.'); setPlaying(false); setBuffering(false) }}
    />}
    <div className="relative z-10 p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <button type="button" onClick={toggle} disabled={!track} aria-label={translateUi(playing ? 'Pausar narração' : 'Reproduzir narração')} className="audio-play-button grid size-11 shrink-0 place-items-center rounded-xl bg-violet-300 text-[#100c19] disabled:opacity-40">
          {buffering ? <LoaderCircle size={17} className="animate-spin" /> : playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#f0edf9]">{translateUi("Narração da aula")}</p>
          {!compact && <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-[#aaa6b7]">{translateUi(summary ?? track?.summary)}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={cycleRate} disabled={!track} className={buttonStyle} aria-label={translateUi(translateTemplate("Velocidade {{value0}} vezes. Alterar velocidade", [rates[rateIndex]]))}>{translateUi(rates[rateIndex])}×</button>
          <button type="button" onClick={restart} disabled={!track} className={buttonStyle} aria-label={translateUi("Recomeçar narração")}><RotateCcw size={14} /></button>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="w-8 text-right font-mono text-[10px] tabular-nums text-[#aaa6b7]">{translateUi(formatTime(time))}</span>
        <input aria-label={translateUi("Avançar ou voltar no áudio")} aria-valuetext={`${formatTime(time)} de ${formatTime(duration)}`} type="range" min={0} max={duration || 1} step={0.01} disabled={!track} value={Math.min(time, duration || 1)} onChange={event => {
          const target = Number(event.currentTarget.value)
          if (audioRef.current) audioRef.current.currentTime = target
          setTime(target)
        }} className="audio-seek min-w-0 flex-1" style={{ '--audio-progress': `${progress * 100}%` } as CSSProperties} />
        <span className="w-8 font-mono text-[10px] tabular-nums text-[#aaa6b7]">{translateUi(track ? formatTime(duration) : '—')}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {compact ? <button type="button" aria-expanded={showTranscript} onClick={() => setShowTranscript(value => !value)} className="inline-flex items-center gap-2 text-[11px] text-violet-200"><AudioLines size={13} />{translateUi(showTranscript ? 'Fechar transcrição' : 'Ver transcrição')}</button> : <div className="flex items-center gap-2 text-[10px] font-semibold text-violet-200"><AudioLines size={13} />{translateUi("Transcrição da narração")}</div>}
        {showTranscript && track && captionStatus === 'ready' && <button type="button" aria-pressed={follow} onClick={() => setFollow(value => !value)} className={buttonStyle}>{translateUi(follow ? 'Acompanhar leitura: ligado' : 'Acompanhar leitura: desligado')}</button>}
      </div>
      {showTranscript && track && captionStatus === 'loading' && <p className="mt-2 text-[10px] text-[#aaa6b7]">{translateUi("Carregando marcações da narração…")}</p>}
      {showTranscript && track && captionStatus === 'error' && <p className="mt-2 text-[10px] text-amber-200">{translateUi("Sincronização indisponível. Você pode ouvir e ler o texto. ")}<button type="button" className="underline" onClick={() => { setCaptionStatus('loading'); setCaptionAttempt(value => value + 1) }}>{translateUi("Tentar novamente")}</button></p>}
      {showTranscript && <p ref={transcriptRef} className="audio-transcript mt-3 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/[.07] bg-black/20 p-4 text-[13px] leading-[2] text-[#b9b5c4]" aria-label={translateUi("Transcrição da narração")} aria-live="off">
        {words.length ? <>{words.map((word, index) => <Fragment key={index}>{translateUi(transcript.slice(index ? wordDisplayEnd(transcript, words[index - 1]) : 0, word.charStart))}<button type="button" onClick={() => seekToWord(word)} aria-label={translateUi(translateTemplate("Ouvir a partir da palavra {{value0}}", [transcript.slice(word.charStart, word.charEnd)]))} data-active={index === activeWord ? 'true' : undefined} className={`audio-transcript-word ${index === activeWord ? 'audio-word-active' : word.end <= time ? 'text-[#e0dbe9]' : ''}`}>{translateUi(transcript.slice(word.charStart, wordDisplayEnd(transcript, word)))}</button></Fragment>)}{translateUi(transcript.slice(wordDisplayEnd(transcript, words[words.length - 1])))}</> : transcript}
      </p>}
      {error && <p role="alert" className="mt-3 text-xs text-amber-200">{translateUi(error)}</p>}
      {!track && <p className="mt-3 text-xs text-amber-200">{translateUi("A narração desta versão da aula ainda não está disponível. O roteiro completo está acima.")}</p>}
    </div>
  </section>
}
