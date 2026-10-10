import { SourceLanguageNotice } from '@/components/source-language-notice'
import { translateUi } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useMemo, useState } from 'react'
import { AudioLines, ChevronDown, Headphones, Search, Sparkles } from 'lucide-react'
import { extraAudioCatalog, extraAudioJourneyLabels } from '@/lib/extra-audio'
import { LessonAudioPlayer } from '@/components/lesson-audio-player'

export function ExtraAudioPage() {
  useUiTranslation();
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

  return <main className="mx-auto w-full max-w-[1320px] space-y-7"><SourceLanguageNotice />
    <header className="relative overflow-hidden rounded-2xl border border-violet-200/15 bg-[linear-gradient(120deg,rgba(29,24,43,.96),rgba(15,17,25,.98)_68%)] p-6 sm:p-9">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 size-72 rounded-full bg-violet-400/10 blur-3xl" />
      <div className="relative max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/20 bg-violet-200/[.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-violet-100"><Headphones size={13} />{translateUi("Biblioteca opcional")}</span>
        <h1 className="mt-4 font-display text-3xl font-medium tracking-[-.045em] text-[#f0edf7] sm:text-[42px]">{translateUi("Ouça no seu ritmo.")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#bbb6c8]">{translateUi("Narrações extras para acompanhar as aulas sem precisar ler cada trecho. O conteúdo escrito continua completo; ouvir é opcional.")}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] text-[#c9c1d8]"><span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5"><Sparkles size={12} className="text-violet-200" />{translateUi("Voz gerada por IA")}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5"><AudioLines size={12} />{translateUi("Transcrição de fala real do curso")}</span></div>
      </div>
    </header>

    {!availableJourneys.length ? <div role="status" className="rounded-xl border border-white/10 p-6 text-sm text-[#aaa6b7]">{translateUi("Os áudios complementares ainda não foram adicionados.")}</div> : <>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={translateUi("Jornada dos áudios")}>
        {availableJourneys.map((item) => <button key={item.id} type="button" role="tab" aria-selected={journey?.id === item.id} onClick={() => changeJourney(item.id)} className={`rounded-full border px-4 py-2 text-xs transition-colors ${journey?.id === item.id ? 'border-violet-200/40 bg-violet-200/[.1] text-violet-100' : 'border-white/[.08] text-[#9d99a8] hover:border-white/20 hover:text-white'}`}>{translateUi(extraAudioJourneyLabels[item.id] ?? item.title)}</button>)}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-xl border border-white/[.08] bg-[#101117]">
          <div className="border-b border-white/[.07] p-4">
            <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[#e8e4ef]">{translateUi(journey?.title)}</p><p className="mt-1 text-[10px] text-[#85818f]">{translateUi(lessons.length)} {translateUi(" aulas · ")}{translateUi(clips)} {translateUi(" clipes")}</p></div><Headphones size={17} className="text-violet-200" /></div>
            <label className="mt-4 flex h-9 items-center gap-2 rounded-lg border border-white/[.08] bg-black/20 px-3 text-[#8e8998]"><Search size={14} /><span className="sr-only">{translateUi("Buscar aula")}</span><input value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder={translateUi("Buscar aula")} className="min-w-0 flex-1 bg-transparent text-xs text-[#e9e5ef] outline-none placeholder:text-[#777381]" /></label>
          </div>
          <div className="max-h-[min(60vh,680px)] space-y-1 overflow-y-auto p-2">
            {filtered.map((lesson) => <button key={lesson.id} type="button" aria-current={selectedLesson?.id === lesson.id ? 'true' : undefined} onClick={() => setLessonId(lesson.id)} className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedLesson?.id === lesson.id ? 'border-violet-200/20 bg-violet-200/[.07]' : 'border-transparent hover:bg-white/[.035]'}`}>
              <span className="flex items-start justify-between gap-2"><span><span className="block text-[9px] uppercase tracking-[.12em] text-[#8b8793]">{translateUi("Aula ")}{translateUi(lesson.number)} · {translateUi(lesson.module)}</span><span className="mt-1 block text-xs font-medium leading-relaxed text-[#ddd9e5]">{translateUi(lesson.title)}</span></span><ChevronDown size={13} className={`mt-1 shrink-0 -rotate-90 ${selectedLesson?.id === lesson.id ? 'text-violet-200' : 'text-[#686574]'}`} /></span>
              <span className="mt-2 flex items-center gap-1.5 text-[9px] text-[#86828f]"><span>{translateUi(lesson.availableBlocks)} {translateUi(" de ")}{translateUi(lesson.expectedBlocks)} {translateUi(" clipes")}</span>{lesson.availableBlocks < lesson.expectedBlocks && <span className="rounded-full border border-amber-100/15 px-1.5 py-0.5 text-amber-100/80">{translateUi("parcial")}</span>}</span>
            </button>)}
            {!filtered.length && <p className="p-4 text-xs text-[#85818f]">{translateUi("Nenhuma aula encontrada.")}</p>}
          </div>
        </aside>

        {selectedLesson ? <LessonAudioPlayer key={selectedLesson.id} lesson={selectedLesson} /> : <div className="rounded-xl border border-white/[.08] p-6 text-sm text-[#9c98a5]">{translateUi("Escolha uma aula que tenha áudio disponível.")}</div>}
      </div>
      {journey?.id === 'cripto' && <p className="text-[10px] leading-relaxed text-[#777482]">{translateUi("Algumas narrações de Cripto ainda não estão disponíveis ou estão incompletas. As aulas escritas e atividades da plataforma não dependem desses áudios extras.")}</p>}
    </>}
  </main>
}
