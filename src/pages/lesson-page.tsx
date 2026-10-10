import { SourceLanguageNotice } from '@/components/source-language-notice'
import { translateUi, translateTemplate, getUiLocale } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleHelp, Clock3, Headphones, Lightbulb, RotateCcw, ShieldAlert, Volume2, VolumeX } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { LocalizedLink as Link, LocalizedNavigate as Navigate } from '@/components/localized-router'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { LessonAudioPlayer } from '@/components/lesson-audio-player'
import { findLessonAudio } from '@/lib/lesson-audio'
import { LessonVisual } from '@/components/lesson-visual'
import { useSession } from '@/contexts/session-context'
import { allLessons, findLesson, modules } from '@/lib/course'
import { journeyLessons } from '@/lib/journeys'
import { useJourney } from '@/lib/use-journey'
import { loadLessonContent, verifyLessonExercise, type ProtectedLessonContent } from '@/lib/learning-service'
import { isQuizSoundsMuted, playQuizError, playQuizSuccess, setQuizSoundsMuted } from '@/lib/quiz-sounds'

export function LessonPage() {
  useUiTranslation();
  const { journeyId, moduleId = '', lessonId = '' } = useParams()
  const { journey, loading, error } = useJourney(journeyId)
  if (loading) return <p role="status" className="text-xs text-[#8ca096]">{translateUi("Carregando jornada…")}</p>
  if (error) return <p role="alert" className="text-xs text-rose-200">{translateUi(error)}</p>
  if (journeyId && !journey) return <Navigate to="/jornadas" replace />
  return <LessonPageContent key={`${moduleId}:${lessonId}`} moduleId={moduleId} lessonId={lessonId} journeyId={journeyId} journeyModules={journey?.modules} />
}

function LessonPageContent({ moduleId, lessonId, journeyId, journeyModules }: { moduleId: string; lessonId: string; journeyId?: string; journeyModules?: typeof modules }) {
  useUiTranslation();
  const activeModules = journeyModules ?? modules
  const basePath = journeyId ? `/jornadas/${journeyId}` : '/curso'
  const activeLessons = journeyModules ? journeyLessons({ modules: journeyModules } as Parameters<typeof journeyLessons>[0]) : allLessons
  const module = activeModules.find((item) => item.id === moduleId)
  const lesson = journeyModules ? module?.lessons.find((item) => item.id === lessonId) : findLesson(moduleId, lessonId)
  const { completedLessons, completeLesson } = useSession()
  const lessonIndex = useMemo(() => activeLessons.findIndex((item) => item.id === lessonId), [activeLessons, lessonId])
  const nextLesson = activeLessons[lessonIndex + 1]
  const alreadyComplete = completedLessons.includes(lessonId)
  const lessonAudio = findLessonAudio(lessonId)
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [exerciseCorrect, setExerciseCorrect] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const [exerciseError, setExerciseError] = useState('')
  const [content, setContent] = useState<ProtectedLessonContent | null>(null)
  const [contentLoading, setContentLoading] = useState(true)
  const [contentError, setContentError] = useState('')
  const [retryContent, setRetryContent] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [soundsMuted, setSoundsMuted] = useState(() => isQuizSoundsMuted())
  const [scenarioAmount, setScenarioAmount] = useState(2000)
  const [scenarioDrop, setScenarioDrop] = useState(35)
  const [futuresLeverage, setFuturesLeverage] = useState(5)
  const [futuresMove, setFuturesMove] = useState(5)
  const [futuresSide, setFuturesSide] = useState<'long' | 'short'>('long')

  useEffect(() => {
    let current = true
    void loadLessonContent(lessonId)
      .then((result) => { if (current) { setContent(result); setContentLoading(false) } })
      .catch(() => { if (current) setContentError('Não foi possível carregar o conteúdo. Verifique o acesso ao curso e tente novamente.') })
      .finally(() => { if (current) setContentLoading(false) })
    return () => { current = false }
  }, [lessonId, retryContent])

  if (!module || !lesson) return <Navigate to={basePath} replace />

  const moduleLesson = module.lessons.findIndex((item) => item.id === lessonId)
  const checkExercise = async () => {
    if (selected === null) return
    setChecking(true)
    setExerciseError('')
    try {
      const correct = await verifyLessonExercise(lessonId, selected)
      setExerciseCorrect(correct)
      setChecked(true)
      if (correct) playQuizSuccess()
      else playQuizError()
    } catch {
      setExerciseError('Não foi possível conferir a resposta. Tente novamente.')
    } finally {
      setChecking(false)
    }
  }

  const toggleSounds = () => {
    setSoundsMuted((muted) => {
      setQuizSoundsMuted(!muted)
      return !muted
    })
  }

  const markDone = async () => {
    setSaving(true)
    setSaveError('')
    try {
      await completeLesson(lessonId)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar seu progresso. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="mx-auto max-w-[970px]">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link to={journeyId ? basePath : '/curso#modulos'} aria-label={translateUi("Voltar para o módulo")} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/[.1] bg-white/[.02] px-4 text-xs font-medium text-[#c5d1c8] transition-colors hover:border-[#a78bfa]/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a78bfa]"><ArrowLeft size={14} />{translateUi("Voltar")}</Link><div className="flex items-center gap-3 text-[10px] text-[#7e9287]"><span>{translateUi("Módulo ")}{translateUi(module.number)}</span><span className="size-1 rounded-full bg-[#52665b]" /><span>{translateUi("Aula ")}{translateUi(moduleLesson + 1)} {translateUi(" de ")}{translateUi(module.lessons.length)}</span></div></div>
    <div className="mb-8 flex items-center gap-3"><Progress value={((moduleLesson + 1) / module.lessons.length) * 100} className="h-1 flex-1 bg-white/[.08] [&_[data-slot=progress-indicator]]:bg-[#a78bfa]" /><span className="text-[10px] text-[#7f9287]">{translateUi(module.duration)}</span></div>

    <SourceLanguageNotice text /><article className="rounded-xl border border-white/[.07] bg-[#12121a] p-5 sm:p-9">
      <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-[#a78bfa]/15 bg-[#a78bfa]/[.055] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.14em] text-[#b49cff]">{translateUi(module.title)}</span><span className="flex items-center gap-1 text-[10px] text-[#71857a]"><Clock3 size={12} />{translateUi(lesson.duration)}</span></div>
      <h1 className="mt-5 max-w-3xl font-display text-3xl font-medium leading-[1.12] tracking-[-.055em] text-[#eaf2ec] sm:text-[42px]">{translateUi(lesson.title)}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#93a69b]">{translateUi("Tempo de estudo estimado: ")}{translateUi(lesson.duration.replace(' min', ' minutos'))}{translateUi(", incluindo leitura e atividade. A duração da narração aparece no player.")}</p>

      {contentLoading && <p className="mt-7 rounded-xl border border-white/[.07] bg-black/15 p-4 text-xs text-[#aab7ae]" role="status">{translateUi("Carregando conteúdo seguro da aula…")}</p>}
      {contentError && <div className="mt-7 rounded-xl border border-amber-200/15 bg-amber-100/[.04] p-4"><p className="text-xs text-amber-100">{translateUi(contentError)}</p><button type="button" onClick={() => { setContent(null); setContentError(''); setContentLoading(true); setRetryContent((value) => value + 1) }} className="mt-3 text-xs text-[#c1acff] underline underline-offset-4">{translateUi("Tentar novamente")}</button></div>}
      {content && (lessonAudio ? <div className="mt-7"><LessonAudioPlayer key={`${lessonId}:${lessonAudio.id}`} lesson={lessonAudio} context="lesson" /></div> : <p className="mt-7 rounded-xl border border-white/[.07] bg-black/15 p-4 text-xs text-[#aab7ae]">{translateUi("O áudio atualizado desta aula ainda não está disponível. Você pode continuar com a leitura e a atividade abaixo.")}</p>)}
      <Link to="/curso/audios-extras" className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-200/15 bg-violet-200/[.04] px-3 py-2 text-[10px] text-violet-100/80 transition hover:border-violet-200/30 hover:text-white"><Headphones size={13} />{translateUi("Biblioteca de áudios extras com voz de IA")}</Link>

      {content && <div className="mt-8 space-y-5">{content.paragraphs.map((paragraph, index) => <p key={index} className="max-w-[760px] text-[14px] leading-[1.9] text-[#c0ccc4]">{translateUi(paragraph)}</p>)}</div>}
      <LessonVisual moduleId={module.id} lessonId={lesson.id} />
      {content?.sources.length ? <aside className="mt-6 rounded-xl border border-white/[.07] bg-white/[.025] p-4"><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#aaa1ca]">{translateUi("Fontes para continuar")}</p><ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">{content.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" className="text-[11px] text-[#c2b5fa] underline decoration-violet-300/25 underline-offset-4 transition-colors hover:text-white">{translateUi(source.label)}</a></li>)}</ul></aside> : null}
      {lesson.id === 'm4l2' && <div className="mt-8 rounded-xl border border-[#98abff]/15 bg-[#98abff]/[.035] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#9eafff]">{translateUi("laboratório de cenários")}</p><h2 className="mt-2 font-display text-lg font-medium text-[#e1e8f2]">{translateUi("Veja o impacto em reais.")}</h2><p className="mt-1 max-w-md text-[11px] leading-relaxed text-[#8c9ab0]">{translateUi("Mude os valores e observe o que uma oscilação hipotética significa no seu saldo.")}</p></div><span className="rounded-full border border-[#98abff]/15 px-2.5 py-1 text-[9px] text-[#9eafff]">{translateUi("sem previsão")}</span></div><div className="mt-6 grid gap-6 sm:grid-cols-[1fr_180px] sm:items-end"><div className="space-y-5"><div><div className="mb-2 flex items-center justify-between text-[10px]"><label htmlFor="amount-slider" className="text-[#a4b2c4]">{translateUi("Valor inicial")}</label><span className="font-medium text-[#d9e1f2]">{translateUi("R$ ")}{translateUi(scenarioAmount.toLocaleString(getUiLocale()))}</span></div><Slider id="amount-slider" min={500} max={10000} step={500} value={[scenarioAmount]} onValueChange={(value) => setScenarioAmount(typeof value === 'number' ? value : value[0] ?? 2000)} aria-label={translateUi("Valor hipotético em reais")} /></div><div><div className="mb-2 flex items-center justify-between text-[10px]"><label htmlFor="drawdown-slider" className="text-[#a4b2c4]">{translateUi("Queda hipotética")}</label><span className="font-medium text-[#d9e1f2]">−{translateUi(scenarioDrop)}%</span></div><Slider id="drawdown-slider" min={0} max={90} step={5} value={[scenarioDrop]} onValueChange={(value) => setScenarioDrop(typeof value === 'number' ? value : value[0] ?? 35)} aria-label={translateUi("Queda hipotética percentual")} /></div></div><div className="rounded-lg border border-white/[.07] bg-[#0d0e14] p-4"><p className="text-[9px] uppercase tracking-[.13em] text-[#72849a]">{translateUi("saldo depois do cenário")}</p><p className="mt-2 font-display text-2xl font-medium tracking-[-.04em] text-[#e2eaf2]">{translateUi("R$ ")}{translateUi((scenarioAmount * (1 - scenarioDrop / 100)).toLocaleString(getUiLocale()))}</p><p className="mt-1 text-[10px] text-[#8d9aab]">{translateUi("diferença de R$ ")}{translateUi((scenarioAmount * scenarioDrop / 100).toLocaleString(getUiLocale()))}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.08]"><div className="h-full rounded-full bg-[#98abff] transition-[width]" style={{ width: `${100 - scenarioDrop}%` }} /></div></div></div><p className="mt-4 text-[9px] leading-relaxed text-[#728198]">{translateUi("Exemplo aritmético com valores fictícios. Não estima chance de queda, não considera custos ou impostos e não recomenda um valor para investir.")}</p></div>}
      {lesson.id === 'm9l3' && <FuturesSimulator leverage={futuresLeverage} setLeverage={setFuturesLeverage} move={futuresMove} setMove={setFuturesMove} side={futuresSide} setSide={setFuturesSide} />}
      {content && <div className="mt-8 flex gap-3 rounded-xl border border-[#a78bfa]/15 bg-[#a78bfa]/[.045] p-4 sm:p-5"><Lightbulb size={17} className="mt-0.5 shrink-0 text-[#a78bfa]" /><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#b49cff]">{translateUi("guarde esta ideia")}</p><p className="mt-2 text-sm leading-relaxed text-[#c8d9ce]">{translateUi(content.takeaway)}</p></div></div>}
      <div className="mt-9 border-t border-white/[.07] pt-7">
        {content && <>
        <div className="mb-4 flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e4bc76]/[.08] text-[#e4bc76]"><CircleHelp size={16} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#b99c69]">{translateUi("aplique o conceito")}</p><h2 className="mt-1 font-display text-lg font-medium tracking-[-.03em] text-[#e6eee8]">{translateUi(content.exercise.title)}</h2></div></div><button type="button" onClick={toggleSounds} aria-pressed={!soundsMuted} aria-label={translateUi(soundsMuted ? 'Ativar sons do exercício' : 'Silenciar sons do exercício')} title={translateUi(soundsMuted ? 'Ativar sons' : 'Silenciar sons')} className="grid size-9 shrink-0 place-items-center rounded-full border border-white/[.08] text-[#8ea197] transition-colors hover:bg-white/[.05] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a78bfa]">{soundsMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button></div>
        <p className="mb-4 text-sm leading-relaxed text-[#adbbb2]">{translateUi(content.exercise.prompt)}</p>
        <div className="space-y-2">{content.exercise.options.map((option, index) => <button type="button" key={option} disabled={checked || checking} onClick={() => setSelected(index)} aria-pressed={selected === index} className={`focus-ring flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-xs leading-relaxed transition-all disabled:cursor-default ${checked && index === selected && exerciseCorrect ? 'border-[#a78bfa]/50 bg-[#a78bfa]/[.09] text-[#e8e1f7] shadow-[0_0_28px_rgba(167,139,250,.25)]' : checked && index === selected ? 'border-[#f28c8c]/50 bg-[#f28c8c]/[.07] text-[#f3c9c9] shadow-[0_0_28px_rgba(242,140,140,.22)]' : selected === index ? 'border-[#a78bfa]/30 bg-[#a78bfa]/[.04] text-[#dce8df]' : 'border-white/[.07] bg-[#171820] text-[#a9b8af] hover:border-white/[.13]'}`}><span className={`grid size-6 shrink-0 place-items-center rounded-full border text-[9px] ${checked && index === selected && exerciseCorrect ? 'border-[#a78bfa]/60 text-[#c1acff]' : checked && index === selected ? 'border-[#f28c8c]/60 text-[#f3a2a2]' : selected === index ? 'border-[#a78bfa]/60 text-[#c1acff]' : 'border-white/[.15] text-[#71847a]'}`}>{checked && index === selected && exerciseCorrect ? <Check size={12} /> : String.fromCharCode(65 + index)}</span>{translateUi(option)}</button>)}</div>
        {exerciseError && <p className="mt-3 text-xs text-rose-300" role="alert">{translateUi(exerciseError)}</p>}
        {!checked ? <Button onClick={checkExercise} disabled={selected === null || checking} className="mt-4 h-11 rounded-full bg-[#dcebe1] px-5 text-xs font-semibold text-[#09090d] shadow-[0_0_24px_rgba(220,235,225,.18)] transition-all hover:bg-white hover:shadow-[0_0_32px_rgba(220,235,225,.28)] active:translate-y-px disabled:shadow-none disabled:opacity-40">{translateUi(checking ? 'Conferindo…' : 'Conferir resposta')} <ArrowRight size={14} /></Button> : <div role="status" className={`mt-4 flex gap-3 rounded-xl border p-4 ${exerciseCorrect ? 'border-[#a78bfa]/30 bg-[#a78bfa]/[.06] shadow-[0_0_28px_rgba(167,139,250,.22)]' : 'border-[#f28c8c]/30 bg-[#f28c8c]/[.05] shadow-[0_0_28px_rgba(242,140,140,.18)]'}`}><span className="mt-0.5">{exerciseCorrect ? <Check size={15} className="text-[#a78bfa]" /> : <ShieldAlert size={15} className="text-[#f28c8c]" />}</span><div><p className="text-xs font-medium text-[#dce7df]">{translateUi(exerciseCorrect ? 'Resposta certa. Bom trabalho.' : translateTemplate("Não foi dessa vez. Você marcou {{value0}} — reveja o ponto abaixo e tente de novo.", [selected !== null ? `${String.fromCharCode(65 + selected)}: ${content.exercise.options[selected]}` : 'uma alternativa']))}</p><p className="mt-2 text-xs leading-relaxed text-[#94a69c]">{translateUi(content.exercise.note)}</p></div></div>}
        </>}
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-white/[.07] pt-6 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => { setSelected(null); setChecked(false); setExerciseCorrect(null); setExerciseError('') }} className="inline-flex h-10 items-center gap-2 self-start rounded-full px-3 text-xs text-[#809389] hover:text-white"><RotateCcw size={13} />{translateUi("Refazer atividade")}</button><div className="flex flex-wrap items-center gap-3">{alreadyComplete ? <span className="inline-flex h-11 items-center gap-1.5 text-[10px] text-[#b49cff]"><Check size={13} />{translateUi("Aula concluída")}</span> : <Button onClick={markDone} disabled={!checked || saving} className="h-11 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] shadow-[0_0_28px_rgba(167,139,250,.35)] transition-all hover:bg-[#c1acff] hover:shadow-[0_0_36px_rgba(167,139,250,.45)] active:translate-y-px disabled:shadow-none disabled:opacity-40">{translateUi(saving ? 'Salvando…' : 'Marcar aula concluída')} <Check size={14} /></Button>}<Link to={nextLesson ? `${basePath}/aula/${nextLesson.moduleId}/${nextLesson.id}` : `${basePath}/modulo/${module.id}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-[#b49cff]/30 bg-[#b49cff]/[.05] px-5 text-xs font-semibold text-[#d6d0df] shadow-[0_0_20px_rgba(167,139,250,.15)] transition-all hover:-translate-y-0.5 hover:border-[#b49cff]/50 hover:bg-[#b49cff]/[.1] active:translate-y-0">{translateUi(nextLesson ? 'Próxima aula' : 'Revisar módulo')} <ArrowRight size={14} /></Link></div></div>
      {saveError && <p className="mt-3 text-xs text-rose-300" role="alert">{translateUi(saveError)}</p>}
    </article>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#768a7e]"><span>{translateUi(module.number)} / {translateUi(module.title)}</span>{nextLesson && <Link to={`${basePath}/aula/${nextLesson.moduleId}/${nextLesson.id}`} className="inline-flex items-center gap-1.5 hover:text-[#c1acff]">{translateUi("Prévia da próxima aula: ")}{translateUi(nextLesson.title)} <ArrowRight size={13} /></Link>}</div>
  </div>
}

function FuturesSimulator({ leverage, setLeverage, move, setMove, side, setSide }: { leverage: number; setLeverage: (value: number) => void; move: number; setMove: (value: number) => void; side: 'long' | 'short'; setSide: (value: 'long' | 'short') => void }) {
  useUiTranslation();
  const notional = 1000
  const margin = notional / leverage
  const pnl = notional * (move / 100) * (side === 'long' ? 1 : -1)
  const resultColor = pnl > 0 ? 'text-[#b8a2ff]' : pnl < 0 ? 'text-[#f3a2a2]' : 'text-[#ddd8e8]'
  return <section className="futures-lab mt-8 rounded-xl border border-amber-200/15 bg-[#17151c] p-5 sm:p-6" aria-label={translateUi("Simulador educacional de futuros")}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-[.15em] text-amber-200/80">{translateUi("laboratório · exposição fictícia")}</p><h2 className="mt-2 font-display text-lg font-medium tracking-[-.03em] text-[#f0edf5]">{translateUi("Mude a direção e veja a escala.")}</h2><p className="mt-1 max-w-lg text-[11px] leading-relaxed text-[#a29eaa]">{translateUi("Exemplo matemático com nocional de R$ 1.000. Sem preço de mercado e sem previsão.")}</p></div><span className="rounded-md border border-amber-100/15 bg-amber-100/[.04] px-2.5 py-1 text-[9px] text-amber-100/80">{translateUi("não executa operações")}</span></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.8fr]">
      <div className="space-y-5">
        <div><p className="mb-2 text-[10px] text-[#aaa6b2]">{translateUi("Direção da posição")}</p><div className="grid grid-cols-2 gap-2"><button type="button" aria-pressed={side === 'long'} onClick={() => setSide('long')} className={`rounded-lg border px-3 py-2.5 text-left text-xs transition-all ${side === 'long' ? 'border-violet-300/35 bg-violet-300/[.09] text-violet-100 shadow-[0_0_20px_rgba(152,120,255,.08)]' : 'border-white/[.08] text-[#9c98a4] hover:bg-white/[.03]'}`}><span className="block font-semibold">{translateUi("Long · comprada")}</span><span className="mt-1 block text-[9px] opacity-70">{translateUi("tende a ganhar com alta")}</span></button><button type="button" aria-pressed={side === 'short'} onClick={() => setSide('short')} className={`rounded-lg border px-3 py-2.5 text-left text-xs transition-all ${side === 'short' ? 'border-amber-200/30 bg-amber-100/[.07] text-amber-100 shadow-[0_0_20px_rgba(245,194,107,.06)]' : 'border-white/[.08] text-[#9c98a4] hover:bg-white/[.03]'}`}><span className="block font-semibold">{translateUi("Short · vendida")}</span><span className="mt-1 block text-[9px] opacity-70">{translateUi("tende a ganhar com queda")}</span></button></div></div>
        <div><div className="mb-2 flex items-center justify-between text-[10px]"><label htmlFor="leverage-slider" className="text-[#aaa6b2]">{translateUi("Alavancagem hipotética")}</label><span className="font-mono font-semibold text-[#e2d8ff]">{translateUi(leverage)}×</span></div><Slider id="leverage-slider" min={1} max={10} step={1} value={[leverage]} onValueChange={(value) => setLeverage(typeof value === 'number' ? value : value[0] ?? 5)} aria-label={translateUi("Alavancagem hipotética")} /></div>
        <div><div className="mb-2 flex items-center justify-between text-[10px]"><label htmlFor="move-slider" className="text-[#aaa6b2]">{translateUi("Variação hipotética do preço")}</label><span className="font-mono font-semibold text-[#e2d8ff]">{translateUi(move > 0 ? '+' : '')}{translateUi(move)}%</span></div><Slider id="move-slider" min={-20} max={20} step={1} value={[move]} onValueChange={(value) => setMove(typeof value === 'number' ? value : value[0] ?? 0)} aria-label={translateUi("Variação hipotética percentual do preço")} /></div>
      </div>
      <div className="rounded-lg border border-white/[.07] bg-black/20 p-4 sm:p-5"><div className="grid grid-cols-2 gap-4"><div><p className="text-[9px] uppercase tracking-[.12em] text-[#85818f]">{translateUi("margem inicial*")}</p><p className="mt-2 font-display text-xl text-[#e8e3f0]">{translateUi("R$ ")}{translateUi(margin.toLocaleString(getUiLocale(), { maximumFractionDigits: 2 }))}</p></div><div><p className="text-[9px] uppercase tracking-[.12em] text-[#85818f]">{translateUi("resultado aritmético")}</p><p className={`mt-2 font-display text-xl ${resultColor}`}>{translateUi(pnl > 0 ? '+' : '')}{translateUi("R$ ")}{translateUi(pnl.toLocaleString(getUiLocale(), { maximumFractionDigits: 2 }))}</p></div></div><div className="mt-4 h-px bg-white/[.07]" /><p className="mt-4 text-[10px] leading-relaxed text-[#aaa6b2]">{translateUi("Variação sobre a margem: ")}<strong className={resultColor}>{translateUi(pnl > 0 ? '+' : '')}{translateUi(((pnl / margin) * 100).toLocaleString(getUiLocale(), { maximumFractionDigits: 1 }))}%</strong></p><p className="mt-1 text-[9px] leading-relaxed text-[#817d89]">{translateUi("*Aproximação didática: margem = nocional ÷ alavancagem.")}</p></div>
    </div>
    <p className="mt-5 rounded-lg border border-rose-300/10 bg-rose-300/[.035] p-3 text-[9px] leading-relaxed text-[#c3adb2]">{translateUi("Cálculo simplificado antes de taxas, funding, ajustes, slippage e margem de manutenção. Em produtos reais, regras variam e a liquidação pode ocorrer antes. Perdas podem superar a margem depositada. Este material não indica operação.")}</p>
  </section>
}



