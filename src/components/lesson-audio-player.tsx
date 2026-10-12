import { translateUi, translateTemplate } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AudioLines, Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import type { ExtraAudioBlock, ExtraAudioCaptionBlock, ExtraAudioLesson } from '@/lib/extra-audio'
import { parseCaptions, wordDisplayEnd } from '@/lib/narration-timing'
import { useProtectedMedia } from '@/lib/protected-media'

const rates = [0.8, 1, 1.2, 1.5]
const clock = (value: number) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`

export function LessonAudioPlayer({ lesson, context = 'library' }: { lesson: ExtraAudioLesson; context?: 'library' | 'lesson' }) {
  useUiTranslation();
  const audioRef = useRef<HTMLAudioElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const pendingRef = useRef<{ blockId: string; time: number; play: boolean } | null>(null)
  const [blockIndex, setBlockIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(lesson.blocks[0]?.duration ?? 0)
  const [rate, setRate] = useState(1)
  const [follow, setFollow] = useState(true)
  const [captions, setCaptions] = useState<Map<string, ExtraAudioCaptionBlock>>(new Map())
  const [captionState, setCaptionState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const block = lesson.blocks[blockIndex]
  // Audio and transcripts are private: resolve short-lived signed URLs for this lesson only.
  const media = useProtectedMedia([...lesson.blocks.map((item) => item.audioSrc), lesson.captionsSrc])
  const captionUrl = media.urls[lesson.captionsSrc]
  const activeCaptions = captions.get(block.id)
  const activeWordIndex = useMemo(() => {
    if (!activeCaptions) return -1
    let low = 0
    let high = activeCaptions.words.length - 1
    let candidate = -1
    while (low <= high) {
      const middle = (low + high) >>> 1
      if (activeCaptions.words[middle].start <= time) { candidate = middle; low = middle + 1 }
      else high = middle - 1
    }
    return candidate >= 0 && time < activeCaptions.words[candidate].end ? candidate : -1
  }, [activeCaptions, time])

  useEffect(() => {
    if (media.status === 'error') { setCaptionState('error'); return }
    if (!captionUrl) return
    const controller = new AbortController()
    setCaptionState('loading')
    fetch(captionUrl, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('Transcrição indisponível'); return response.json() })
      .then((data: { blocks?: Array<{ id: string; transcript: string; duration: number; matchRatio: number; words: unknown }> }) => {
        if (!Array.isArray(data.blocks)) throw new Error('Arquivo de transcrição inválido')
        const result = new Map<string, ExtraAudioCaptionBlock>()
        for (const item of data.blocks) {
          const sourceBlock = lesson.blocks.find((candidate) => candidate.id === item.id)
          if (!sourceBlock || typeof item.transcript !== 'string') throw new Error('A transcrição não corresponde ao clipe.')
          result.set(item.id, { id: item.id, transcript: item.transcript, duration: item.duration, matchRatio: item.matchRatio, words: parseCaptions(item, item.transcript, item.duration) })
        }
        if (!controller.signal.aborted) { setCaptions(result); setCaptionState('ready') }
      })
      .catch(() => { if (!controller.signal.aborted) { setCaptions(new Map()); setCaptionState('error') } })
    return () => controller.abort()
  }, [lesson, captionUrl, media.status])

  useEffect(() => {
    if (!playing || !follow || activeWordIndex < 0) return
    const container = transcriptRef.current
    const active = container?.querySelector<HTMLElement>('[data-extra-active="true"]')
    if (!container || !active) return
    const outer = container.getBoundingClientRect()
    const inner = active.getBoundingClientRect()
    if (inner.top < outer.top + 18 || inner.bottom > outer.bottom - 18) {
      container.scrollTo({ top: container.scrollTop + inner.top - outer.top - outer.height / 2, behavior: 'smooth' })
    }
  }, [activeWordIndex, follow, playing, blockIndex])

  const jumpTo = (nextIndex: number, targetTime = 0, shouldPlay = playing) => {
    const target = lesson.blocks[nextIndex]
    if (!target) return
    setError('')
    if (nextIndex === blockIndex) {
      const audio = audioRef.current
      if (audio) { audio.currentTime = targetTime; setTime(targetTime); if (shouldPlay) void audio.play().catch(() => setError('Não foi possível reproduzir este clipe.')) }
      return
    }
    pendingRef.current = { blockId: target.id, time: targetTime, play: shouldPlay }
    setBlockIndex(nextIndex)
    setTime(targetTime)
    setDuration(target.duration)
  }

  const jumpToWord = (targetBlock: ExtraAudioBlock, word: { start: number }) => {
    const nextIndex = lesson.blocks.findIndex((item) => item.id === targetBlock.id)
    if (nextIndex >= 0) jumpTo(nextIndex, word.start, true)
  }

  const cycleRate = () => {
    const next = (rates.indexOf(rate) + 1) % rates.length
    setRate(rates[next])
    if (audioRef.current) audioRef.current.playbackRate = rates[next]
  }

  const renderTranscript = (targetBlock: ExtraAudioBlock, index: number) => {
    const text = captions.get(targetBlock.id)?.transcript ?? ''
    const cues = captions.get(targetBlock.id)?.words
    if (!cues?.length) return text
    return <>{cues.map((word, wordIndex) => <span key={word.charStart}>{translateUi(text.slice(wordIndex ? wordDisplayEnd(text, cues[wordIndex - 1]) : 0, word.charStart))}<button type="button" onClick={() => jumpToWord(targetBlock, word)} aria-label={translateUi(translateTemplate("Ouvir a partir de “{{value0}}”, clipe {{value1}}", [text.slice(word.charStart, word.charEnd), targetBlock.number]))} data-extra-active={index === blockIndex && wordIndex === activeWordIndex ? 'true' : undefined} className={`extra-audio-transcript-word ${index === blockIndex && wordIndex === activeWordIndex ? 'extra-audio-transcript-word-active' : word.end <= time && index === blockIndex ? 'text-[#e2ddec]' : ''}`}>{translateUi(text.slice(word.charStart, wordDisplayEnd(text, word)))}</button></span>)}{translateUi(text.slice(wordDisplayEnd(text, cues[cues.length - 1])))}</>
  }

  return <section className="audio-console min-w-0 overflow-hidden rounded-xl border border-violet-300/20 bg-[#12121a]">
    <audio ref={audioRef} src={media.urls[block.audioSrc]} preload="metadata" onLoadedMetadata={(event) => {
      const audio = event.currentTarget
      if (Number.isFinite(audio.duration)) setDuration(audio.duration)
      const pending = pendingRef.current
      if (pending?.blockId === block.id) {
        audio.currentTime = Math.min(pending.time, Number.isFinite(audio.duration) ? audio.duration : pending.time)
        setTime(audio.currentTime)
        pendingRef.current = null
        if (pending.play) void audio.play().catch(() => setError('Não foi possível reproduzir este clipe.'))
      }
    }} onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)} onSeeking={(event) => setTime(event.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => {
      if (blockIndex < lesson.blocks.length - 1) jumpTo(blockIndex + 1, 0, true)
      else setPlaying(false)
    }} onError={() => { setPlaying(false); setError('Este clipe está indisponível no momento.') }} />
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-violet-200">{translateUi(context === 'lesson' ? 'Áudio atualizado · voz gerada por IA' : 'Áudio extra · voz gerada por IA')}</p>{lesson.availableBlocks < lesson.expectedBlocks && <span className="rounded-full border border-amber-100/15 px-2 py-0.5 text-[9px] text-amber-100/80">{translateUi("versão parcial")}</span>}</div><h2 className="mt-2 font-display text-xl font-medium tracking-[-.035em] text-[#f0edf7] sm:text-2xl">{translateUi(context === 'library' ? translateTemplate("Aula {{value0}}: ", [lesson.number]) : '')}{translateUi(lesson.title)}</h2><p className="mt-1 text-[10px] text-[#918c9d]">{translateUi(lesson.module)} · {translateUi(lesson.availableBlocks)} {translateUi(" de ")}{translateUi(lesson.expectedBlocks)} {translateUi(" clipes disponíveis")}</p>{context === 'lesson' && <p className="mt-2 text-[10px] leading-relaxed text-[#918c9d]">{translateUi("Roteiro atualizado da biblioteca. Algumas narrações reúnem temas de várias aulas da jornada.")}</p>}</div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[.08] bg-black/20 px-2.5 py-1.5 text-[9px] text-[#aaa5b4]"><AudioLines size={12} />{translateUi("Complementar à leitura")}</span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => {
          const audio = audioRef.current
          if (!audio) return
          setError('')
          if (audio.paused) void audio.play().catch(() => setError('Não foi possível reproduzir este clipe.'))
          else audio.pause()
        }} aria-label={translateUi(playing ? 'Pausar áudio complementar' : 'Reproduzir áudio complementar')} className="grid size-12 shrink-0 place-items-center rounded-xl bg-violet-200 text-[#100c19] transition hover:bg-white">{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
        <div className="min-w-[180px] flex-1"><div className="flex items-center justify-between gap-3 text-[10px] text-[#a29daa]"><span>{translateUi("Clipe ")}{translateUi(block.number)} {translateUi(" de ")}{translateUi(lesson.blocks.length)}</span><span className="font-mono tabular-nums">{translateUi(clock(time))} / {translateUi(clock(duration))}</span></div><input aria-label={translateUi("Posição no clipe")} aria-valuetext={`${clock(time)} de ${clock(duration)}`} type="range" min={0} max={duration || 1} step={0.01} value={Math.min(time, duration || 1)} onChange={(event) => { const value = Number(event.currentTarget.value); if (audioRef.current) audioRef.current.currentTime = value; setTime(value) }} className="audio-seek mt-2 w-full" style={{ '--audio-progress': `${duration ? time / duration * 100 : 0}%` } as React.CSSProperties} /></div>
        <div className="flex items-center gap-1.5"><button type="button" onClick={() => jumpTo(Math.max(0, blockIndex - 1), 0)} disabled={blockIndex === 0} aria-label={translateUi("Clipe anterior")} className="extra-audio-control"><SkipBack size={14} /></button><button type="button" onClick={() => jumpTo(Math.min(lesson.blocks.length - 1, blockIndex + 1), 0)} disabled={blockIndex === lesson.blocks.length - 1} aria-label={translateUi("Próximo clipe")} className="extra-audio-control"><SkipForward size={14} /></button><button type="button" onClick={cycleRate} aria-label={translateUi(translateTemplate("Velocidade {{value0}} vezes", [rate]))} className="extra-audio-control">{translateUi(rate)}×</button><button type="button" onClick={() => jumpTo(blockIndex, 0, true)} aria-label={translateUi("Recomeçar clipe")} className="extra-audio-control"><RotateCcw size={13} /></button></div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[.07] pt-3"><p className="text-[10px] text-[#898594]">{translateUi("Clique em qualquer palavra para ouvir a partir daquele trecho.")}</p><button type="button" aria-pressed={follow} onClick={() => setFollow((value) => !value)} className="shrink-0 text-[9px] text-violet-200 hover:text-white">{translateUi(follow ? 'Acompanhar leitura: ligado' : 'Acompanhar leitura: desligado')}</button></div>
      {captionState === 'loading' && <p role="status" className="mt-3 text-[10px] text-[#95909f]">{translateUi("Carregando transcrição e marcações de áudio…")}</p>}
      {captionState === 'error' && <p role="alert" className="mt-3 text-[10px] text-amber-200">{translateUi("Não foi possível carregar a transcrição sincronizada.")}</p>}
      <div ref={transcriptRef} className="audio-transcript mt-3 max-h-[min(55vh,560px)] overflow-y-auto rounded-xl border border-white/[.07] bg-black/20 p-4 sm:p-5" aria-label={translateUi("Transcrição personalizada dos clipes")}>
        {captionState === 'ready' && lesson.blocks.map((item, index) => <section key={item.id} className={index ? 'border-t border-white/[.07] pt-5 mt-5' : ''}>
          <div className="mb-2 flex items-center justify-between gap-3"><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#898594]">{translateUi("Trecho ")}{translateUi(String(item.number).padStart(2, '0'))}</p><button type="button" onClick={() => jumpTo(index, 0, true)} className="text-[9px] text-violet-200 hover:text-white">{translateUi("Ouvir trecho")}</button></div>
          <div className="whitespace-pre-wrap text-[13px] leading-[2] text-[#b9b5c4]">{translateUi(renderTranscript(item, index))}</div>
        </section>)}
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-amber-200">{translateUi(error)}</p>}
      {lesson.availableBlocks < lesson.expectedBlocks && <p className="mt-4 rounded-lg border border-amber-100/10 bg-amber-100/[.035] p-3 text-[10px] leading-relaxed text-[#c8b994]">{translateUi("Esta aula ainda não tem todos os clipes narrados. Os trechos disponíveis são extras; continue usando a aula escrita normalmente.")}</p>}
      {captionState === 'ready' && [...captions.values()].some((item) => item.matchRatio < 0.55) && <p className="mt-3 text-[9px] leading-relaxed text-[#777482]">{translateUi("A sincronização das palavras é estimada pela duração do clipe. O texto exibido preserva o roteiro original; ao clicar, o áudio começa em um ponto aproximado da fala.")}</p>}
    </div>
  </section>
}
