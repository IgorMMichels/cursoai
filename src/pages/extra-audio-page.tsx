import { useEffect, useMemo, useRef, useState } from 'react'
import { AudioLines, ChevronDown, Headphones, Pause, Play, RotateCcw, Search, SkipBack, SkipForward, Sparkles } from 'lucide-react'
import { extraAudioCatalog, extraAudioJourneyLabels, type ExtraAudioBlock, type ExtraAudioCaptionBlock, type ExtraAudioLesson } from '@/lib/extra-audio'
import { parseCaptions } from '@/lib/narration-timing'

const rates = [0.8, 1, 1.2, 1.5]
const clock = (value: number) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`

export function ExtraAudioPage() {
  const availableJourneys = extraAudioCatalog.journeys.filter((journey) => journey.lessons.length > 0)
  const [journeyId, setJourneyId] = useState(availableJourneys[0]?.id ?? '')
  const journey = availableJourneys.find((item) => item.id === journeyId) ?? availableJourneys[0]
  const [lessonId, setLessonId] = useState(journey?.lessons[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const lessons = journey?.lessons ?? []
  const selectedLesson = lessons.find((lesson) => lesson.id === lessonId) ?? lessons[0]
  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase('pt-BR')
    if (!value) return lessons
    return lessons.filter((lesson) => `${lesson.number} ${lesson.title} ${lesson.module}`.toLocaleLowerCase('pt-BR').includes(value))
  }, [lessons, query])
  const clips = journey?.lessons.reduce((total, lesson) => total + lesson.availableBlocks, 0) ?? 0

  const changeJourney = (next: string) => {
    const destination = availableJourneys.find((item) => item.id === next)
    setJourneyId(next)
    setLessonId(destination?.lessons[0]?.id ?? '')
    setQuery('')
  }

  return <main className="mx-auto w-full max-w-[1320px] space-y-7">
    <header className="relative overflow-hidden rounded-2xl border border-violet-200/15 bg-[linear-gradient(120deg,rgba(29,24,43,.96),rgba(15,17,25,.98)_68%)] p-6 sm:p-9">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 size-72 rounded-full bg-violet-400/10 blur-3xl" />
      <div className="relative max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/20 bg-violet-200/[.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-violet-100"><Headphones size={13} />Biblioteca opcional</span>
        <h1 className="mt-4 font-display text-3xl font-medium tracking-[-.045em] text-[#f0edf7] sm:text-[42px]">Ouça no seu ritmo.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#bbb6c8]">Narrações extras para acompanhar as aulas sem precisar ler cada trecho. O conteúdo escrito continua completo; ouvir é opcional.</p>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] text-[#c9c1d8]"><span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5"><Sparkles size={12} className="text-violet-200" />Voz gerada por IA</span><span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5"><AudioLines size={12} />Transcrição de fala real do curso</span></div>
      </div>
    </header>

    {!availableJourneys.length ? <div role="status" className="rounded-xl border border-white/10 p-6 text-sm text-[#aaa6b7]">Os áudios complementares ainda não foram adicionados.</div> : <>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Jornada dos áudios">
        {availableJourneys.map((item) => <button key={item.id} type="button" role="tab" aria-selected={journey?.id === item.id} onClick={() => changeJourney(item.id)} className={`rounded-full border px-4 py-2 text-xs transition-colors ${journey?.id === item.id ? 'border-violet-200/40 bg-violet-200/[.1] text-violet-100' : 'border-white/[.08] text-[#9d99a8] hover:border-white/20 hover:text-white'}`}>{extraAudioJourneyLabels[item.id] ?? item.title}</button>)}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-xl border border-white/[.08] bg-[#101117]">
          <div className="border-b border-white/[.07] p-4">
            <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[#e8e4ef]">{journey?.title}</p><p className="mt-1 text-[10px] text-[#85818f]">{lessons.length} aulas · {clips} clipes</p></div><Headphones size={17} className="text-violet-200" /></div>
            <label className="mt-4 flex h-9 items-center gap-2 rounded-lg border border-white/[.08] bg-black/20 px-3 text-[#8e8998]"><Search size={14} /><span className="sr-only">Buscar aula</span><input value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Buscar aula" className="min-w-0 flex-1 bg-transparent text-xs text-[#e9e5ef] outline-none placeholder:text-[#777381]" /></label>
          </div>
          <div className="max-h-[min(60vh,680px)] space-y-1 overflow-y-auto p-2">
            {filtered.map((lesson) => <button key={lesson.id} type="button" aria-current={selectedLesson?.id === lesson.id ? 'true' : undefined} onClick={() => setLessonId(lesson.id)} className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedLesson?.id === lesson.id ? 'border-violet-200/20 bg-violet-200/[.07]' : 'border-transparent hover:bg-white/[.035]'}`}>
              <span className="flex items-start justify-between gap-2"><span><span className="block text-[9px] uppercase tracking-[.12em] text-[#8b8793]">Aula {lesson.number} · {lesson.module}</span><span className="mt-1 block text-xs font-medium leading-relaxed text-[#ddd9e5]">{lesson.title}</span></span><ChevronDown size={13} className={`mt-1 shrink-0 -rotate-90 ${selectedLesson?.id === lesson.id ? 'text-violet-200' : 'text-[#686574]'}`} /></span>
              <span className="mt-2 flex items-center gap-1.5 text-[9px] text-[#86828f]"><span>{lesson.availableBlocks} de {lesson.expectedBlocks} clipes</span>{lesson.availableBlocks < lesson.expectedBlocks && <span className="rounded-full border border-amber-100/15 px-1.5 py-0.5 text-amber-100/80">parcial</span>}</span>
            </button>)}
            {!filtered.length && <p className="p-4 text-xs text-[#85818f]">Nenhuma aula encontrada.</p>}
          </div>
        </aside>

        {selectedLesson ? <ExtraAudioLessonPlayer key={selectedLesson.id} lesson={selectedLesson} /> : <div className="rounded-xl border border-white/[.08] p-6 text-sm text-[#9c98a5]">Escolha uma aula que tenha áudio disponível.</div>}
      </div>
      {journey?.id === 'cripto' && <p className="text-[10px] leading-relaxed text-[#777482]">Algumas narrações de Cripto ainda não estão disponíveis ou estão incompletas. As aulas escritas e atividades da plataforma não dependem desses áudios extras.</p>}
    </>}
  </main>
}

function ExtraAudioLessonPlayer({ lesson }: { lesson: ExtraAudioLesson }) {
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
    const controller = new AbortController()
    setCaptionState('loading')
    fetch(lesson.captionsSrc, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('Transcrição indisponível'); return response.json() })
      .then((data: { blocks?: Array<{ id: string; transcript: string; duration: number; matchRatio: number; words: unknown }> }) => {
        if (!Array.isArray(data.blocks)) throw new Error('Arquivo de transcrição inválido')
        const result = new Map<string, ExtraAudioCaptionBlock>()
        for (const item of data.blocks) {
          const sourceBlock = lesson.blocks.find((candidate) => candidate.id === item.id)
          if (!sourceBlock || item.transcript !== sourceBlock.transcript) throw new Error('A transcrição não corresponde ao clipe.')
          result.set(item.id, { id: item.id, transcript: item.transcript, duration: item.duration, matchRatio: item.matchRatio, words: parseCaptions(item, item.transcript, item.duration) })
        }
        if (!controller.signal.aborted) { setCaptions(result); setCaptionState('ready') }
      })
      .catch(() => { if (!controller.signal.aborted) { setCaptions(new Map()); setCaptionState('error') } })
    return () => controller.abort()
  }, [lesson])

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
    const cues = captions.get(targetBlock.id)?.words
    if (!cues?.length) return targetBlock.transcript
    return <>{cues.map((word, wordIndex) => <span key={word.charStart}>{targetBlock.transcript.slice(wordIndex ? cues[wordIndex - 1].charEnd : 0, word.charStart)}<button type="button" onClick={() => jumpToWord(targetBlock, word)} aria-label={`Ouvir a partir de “${targetBlock.transcript.slice(word.charStart, word.charEnd)}”, clipe ${targetBlock.number}`} data-extra-active={index === blockIndex && wordIndex === activeWordIndex ? 'true' : undefined} className={`extra-audio-transcript-word ${index === blockIndex && wordIndex === activeWordIndex ? 'extra-audio-transcript-word-active' : word.end <= time && index === blockIndex ? 'text-[#e2ddec]' : ''}`}>{targetBlock.transcript.slice(word.charStart, word.charEnd)}</button></span>)}{targetBlock.transcript.slice(cues[cues.length - 1].charEnd)}</>
  }

  return <section className="audio-console min-w-0 overflow-hidden rounded-xl border border-violet-300/20 bg-[#12121a]">
    <audio ref={audioRef} src={block.audioSrc} preload="metadata" onLoadedMetadata={(event) => {
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
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-violet-200">Áudio extra · voz gerada por IA</p>{lesson.availableBlocks < lesson.expectedBlocks && <span className="rounded-full border border-amber-100/15 px-2 py-0.5 text-[9px] text-amber-100/80">versão parcial</span>}</div><h2 className="mt-2 font-display text-xl font-medium tracking-[-.035em] text-[#f0edf7] sm:text-2xl">Aula {lesson.number}: {lesson.title}</h2><p className="mt-1 text-[10px] text-[#918c9d]">{lesson.module} · {lesson.availableBlocks} de {lesson.expectedBlocks} clipes disponíveis</p></div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[.08] bg-black/20 px-2.5 py-1.5 text-[9px] text-[#aaa5b4]"><AudioLines size={12} />Complementar à leitura</span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => {
          const audio = audioRef.current
          if (!audio) return
          setError('')
          if (audio.paused) void audio.play().catch(() => setError('Não foi possível reproduzir este clipe.'))
          else audio.pause()
        }} aria-label={playing ? 'Pausar áudio complementar' : 'Reproduzir áudio complementar'} className="grid size-12 shrink-0 place-items-center rounded-xl bg-violet-200 text-[#100c19] transition hover:bg-white">{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
        <div className="min-w-[180px] flex-1"><div className="flex items-center justify-between gap-3 text-[10px] text-[#a29daa]"><span>Clipe {block.number} de {lesson.blocks.length}</span><span className="font-mono tabular-nums">{clock(time)} / {clock(duration)}</span></div><input aria-label="Posição no clipe" aria-valuetext={`${clock(time)} de ${clock(duration)}`} type="range" min={0} max={duration || 1} step={0.01} value={Math.min(time, duration || 1)} onChange={(event) => { const value = Number(event.currentTarget.value); if (audioRef.current) audioRef.current.currentTime = value; setTime(value) }} className="audio-seek mt-2 w-full" style={{ '--audio-progress': `${duration ? time / duration * 100 : 0}%` } as React.CSSProperties} /></div>
        <div className="flex items-center gap-1.5"><button type="button" onClick={() => jumpTo(Math.max(0, blockIndex - 1), 0)} disabled={blockIndex === 0} aria-label="Clipe anterior" className="extra-audio-control"><SkipBack size={14} /></button><button type="button" onClick={() => jumpTo(Math.min(lesson.blocks.length - 1, blockIndex + 1), 0)} disabled={blockIndex === lesson.blocks.length - 1} aria-label="Próximo clipe" className="extra-audio-control"><SkipForward size={14} /></button><button type="button" onClick={cycleRate} aria-label={`Velocidade ${rate} vezes`} className="extra-audio-control">{rate}×</button><button type="button" onClick={() => jumpTo(blockIndex, 0, true)} aria-label="Recomeçar clipe" className="extra-audio-control"><RotateCcw size={13} /></button></div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[.07] pt-3"><p className="text-[10px] text-[#898594]">Clique em qualquer palavra para ouvir a partir daquele trecho.</p><button type="button" aria-pressed={follow} onClick={() => setFollow((value) => !value)} className="shrink-0 text-[9px] text-violet-200 hover:text-white">{follow ? 'Acompanhar leitura: ligado' : 'Acompanhar leitura: desligado'}</button></div>
      {captionState === 'loading' && <p role="status" className="mt-3 text-[10px] text-[#95909f]">Carregando transcrição e marcações de áudio…</p>}
      {captionState === 'error' && <p role="alert" className="mt-3 text-[10px] text-amber-200">Não foi possível carregar a transcrição sincronizada.</p>}
      <div ref={transcriptRef} className="audio-transcript mt-3 max-h-[min(55vh,560px)] overflow-y-auto rounded-xl border border-white/[.07] bg-black/20 p-4 sm:p-5" aria-label="Transcrição personalizada dos clipes">
        {lesson.blocks.map((item, index) => <section key={item.id} className={index ? 'border-t border-white/[.07] pt-5 mt-5' : ''}>
          <div className="mb-2 flex items-center justify-between gap-3"><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#898594]">Trecho {String(item.number).padStart(2, '0')}</p><button type="button" onClick={() => jumpTo(index, 0, true)} className="text-[9px] text-violet-200 hover:text-white">Ouvir trecho</button></div>
          <div className="whitespace-pre-wrap text-[13px] leading-[2] text-[#b9b5c4]">{renderTranscript(item, index)}</div>
        </section>)}
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-amber-200">{error}</p>}
      {lesson.availableBlocks < lesson.expectedBlocks && <p className="mt-4 rounded-lg border border-amber-100/10 bg-amber-100/[.035] p-3 text-[10px] leading-relaxed text-[#c8b994]">Esta aula ainda não tem todos os clipes narrados. Os trechos disponíveis são extras; continue usando a aula escrita normalmente.</p>}
      {captionState === 'ready' && [...captions.values()].some((item) => item.matchRatio < 0.55) && <p className="mt-3 text-[9px] leading-relaxed text-[#777482]">A sincronização das palavras é estimada pela duração do clipe. O texto exibido preserva o roteiro original; ao clicar, o áudio começa em um ponto aproximado da fala.</p>}
    </div>
  </section>
}
