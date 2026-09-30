import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleHelp, Clock3, Lightbulb, RotateCcw, ShieldAlert } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { AudioNarration } from '@/components/audio-narration'
import { LessonVisual } from '@/components/lesson-visual'
import { useSession } from '@/contexts/session-context'
import { allLessons, findLesson, modules } from '@/lib/course'
import { loadLessonContent, verifyLessonExercise, type ProtectedLessonContent } from '@/lib/learning-service'

export function LessonPage() {
  const { moduleId = '', lessonId = '' } = useParams()
  return <LessonPageContent key={`${moduleId}:${lessonId}`} moduleId={moduleId} lessonId={lessonId} />
}

function LessonPageContent({ moduleId, lessonId }: { moduleId: string; lessonId: string }) {
  const module = modules.find((item) => item.id === moduleId)
  const lesson = findLesson(moduleId, lessonId)
  const { completedLessons, completeLesson } = useSession()
  const lessonIndex = useMemo(() => allLessons.findIndex((item) => item.id === lessonId), [lessonId])
  const nextLesson = allLessons[lessonIndex + 1]
  const alreadyComplete = completedLessons.includes(lessonId)
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

  if (!module || !lesson) return <Navigate to="/curso" replace />

  const moduleLesson = module.lessons.findIndex((item) => item.id === lessonId)
  const checkExercise = async () => {
    if (selected === null) return
    setChecking(true)
    setExerciseError('')
    try {
      setExerciseCorrect(await verifyLessonExercise(lessonId, selected))
      setChecked(true)
    } catch {
      setExerciseError('Não foi possível conferir a resposta. Tente novamente.')
    } finally {
      setChecking(false)
    }
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
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link to="/curso#modulos" className="inline-flex items-center gap-2 text-xs text-[#8ca096] transition-colors hover:text-white"><ArrowLeft size={14} />Trilha completa</Link><div className="flex items-center gap-3 text-[10px] text-[#7e9287]"><span>Módulo {module.number}</span><span className="size-1 rounded-full bg-[#52665b]" /><span>Aula {moduleLesson + 1} de {module.lessons.length}</span></div></div>
    <div className="mb-8 flex items-center gap-3"><Progress value={((moduleLesson + 1) / module.lessons.length) * 100} className="h-1 flex-1 bg-white/[.08] [&_[data-slot=progress-indicator]]:bg-[#a78bfa]" /><span className="text-[10px] text-[#7f9287]">{module.duration}</span></div>

    <article className="rounded-xl border border-white/[.07] bg-[#12121a] p-5 sm:p-9">
      <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-[#a78bfa]/15 bg-[#a78bfa]/[.055] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.14em] text-[#b49cff]">{module.title}</span><span className="flex items-center gap-1 text-[10px] text-[#71857a]"><Clock3 size={12} />{lesson.duration}</span></div>
      <h1 className="mt-5 max-w-3xl font-display text-3xl font-medium leading-[1.12] tracking-[-.055em] text-[#eaf2ec] sm:text-[42px]">{lesson.title}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#93a69b]">Tempo de estudo estimado: {lesson.duration.replace(' min', ' minutos')}, incluindo leitura e atividade. A duração da narração aparece no player.</p>

      {contentLoading && <p className="mt-7 rounded-xl border border-white/[.07] bg-black/15 p-4 text-xs text-[#aab7ae]" role="status">Carregando conteúdo seguro da aula…</p>}
      {contentError && <div className="mt-7 rounded-xl border border-amber-200/15 bg-amber-100/[.04] p-4"><p className="text-xs text-amber-100">{contentError}</p><button type="button" onClick={() => { setContent(null); setContentError(''); setContentLoading(true); setRetryContent((value) => value + 1) }} className="mt-3 text-xs text-[#c1acff] underline underline-offset-4">Tentar novamente</button></div>}
      {content && <AudioNarration title={lesson.title} track={content.narration} transcript={content.narration.transcript} summary={content.takeaway} />}

      {content && <div className="mt-8 space-y-5">{content.paragraphs.map((paragraph, index) => <p key={index} className="max-w-[760px] text-[14px] leading-[1.9] text-[#c0ccc4]">{paragraph}</p>)}</div>}
      <LessonVisual moduleId={module.id} />
      {content?.sources.length ? <aside className="mt-6 rounded-xl border border-white/[.07] bg-white/[.025] p-4"><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#aaa1ca]">Fontes para continuar</p><ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">{content.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" className="text-[11px] text-[#c2b5fa] underline decoration-violet-300/25 underline-offset-4 transition-colors hover:text-white">{source.label}</a></li>)}</ul></aside> : null}
      {lesson.id === 'm4l2' && <div className="mt-8 rounded-xl border border-[#98abff]/15 bg-[#98abff]/[.035] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#9eafff]">laboratório de cenários</p><h2 className="mt-2 font-display text-lg font-medium text-[#e1e8f2]">Veja o impacto em reais.</h2><p className="mt-1 max-w-md text-[11px] leading-relaxed text-[#8c9ab0]">Mude os valores e observe o que uma oscilação hipotética significa no seu saldo.</p></div><span className="rounded-full border border-[#98abff]/15 px-2.5 py-1 text-[9px] text-[#9eafff]">sem previsão</span></div><div className="mt-6 grid gap-6 sm:grid-cols-[1fr_180px] sm:items-end"><div className="space-y-5"><div><div className="mb-2 flex items-center justify-between text-[10px]"><label htmlFor="amount-slider" className="text-[#a4b2c4]">Valor inicial</label><span className="font-medium text-[#d9e1f2]">R$ {scenarioAmount.toLocaleString('pt-BR')}</span></div><Slider id="amount-slider" min={500} max={10000} step={500} value={[scenarioAmount]} onValueChange={(value) => setScenarioAmount(typeof value === 'number' ? value : value[0] ?? 2000)} aria-label="Valor hipotético em reais" /></div><div><div className="mb-2 flex items-center justify-between text-[10px]"><label htmlFor="drawdown-slider" className="text-[#a4b2c4]">Queda hipotética</label><span className="font-medium text-[#d9e1f2]">−{scenarioDrop}%</span></div><Slider id="drawdown-slider" min={0} max={90} step={5} value={[scenarioDrop]} onValueChange={(value) => setScenarioDrop(typeof value === 'number' ? value : value[0] ?? 35)} aria-label="Queda hipotética percentual" /></div></div><div className="rounded-lg border border-white/[.07] bg-[#0d0e14] p-4"><p className="text-[9px] uppercase tracking-[.13em] text-[#72849a]">saldo depois do cenário</p><p className="mt-2 font-display text-2xl font-medium tracking-[-.04em] text-[#e2eaf2]">R$ {(scenarioAmount * (1 - scenarioDrop / 100)).toLocaleString('pt-BR')}</p><p className="mt-1 text-[10px] text-[#8d9aab]">diferença de R$ {(scenarioAmount * scenarioDrop / 100).toLocaleString('pt-BR')}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.08]"><div className="h-full rounded-full bg-[#98abff] transition-[width]" style={{ width: `${100 - scenarioDrop}%` }} /></div></div></div><p className="mt-4 text-[9px] leading-relaxed text-[#728198]">Exemplo aritmético com valores fictícios. Não estima chance de queda, não considera custos ou impostos e não recomenda um valor para investir.</p></div>}
      {lesson.id === 'm9l3' && <FuturesSimulator leverage={futuresLeverage} setLeverage={setFuturesLeverage} move={futuresMove} setMove={setFuturesMove} side={futuresSide} setSide={setFuturesSide} />}
      {content && <div className="mt-8 flex gap-3 rounded-xl border border-[#a78bfa]/15 bg-[#a78bfa]/[.045] p-4 sm:p-5"><Lightbulb size={17} className="mt-0.5 shrink-0 text-[#a78bfa]" /><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#b49cff]">guarde esta ideia</p><p className="mt-2 text-sm leading-relaxed text-[#c8d9ce]">{content.takeaway}</p></div></div>}
      <div className="mt-9 border-t border-white/[.07] pt-7">
        {content && <>
        <div className="mb-4 flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e4bc76]/[.08] text-[#e4bc76]"><CircleHelp size={16} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#b99c69]">aplique o conceito</p><h2 className="mt-1 font-display text-lg font-medium tracking-[-.03em] text-[#e6eee8]">{content.exercise.title}</h2></div></div>
        <p className="mb-4 text-sm leading-relaxed text-[#adbbb2]">{content.exercise.prompt}</p>
        <div className="space-y-2">{content.exercise.options.map((option, index) => <button type="button" key={option} disabled={checked || checking} onClick={() => setSelected(index)} aria-pressed={selected === index} className={`focus-ring flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-xs leading-relaxed transition-colors disabled:cursor-default ${checked && index === selected && exerciseCorrect ? 'border-[#a78bfa]/35 bg-[#a78bfa]/[.07] text-[#e8e1f7]' : checked && index === selected ? 'border-[#f28c8c]/30 bg-[#f28c8c]/[.05] text-[#e8c3c3]' : selected === index ? 'border-[#a78bfa]/30 bg-[#a78bfa]/[.04] text-[#dce8df]' : 'border-white/[.07] bg-[#171820] text-[#a9b8af] hover:border-white/[.13]'}`}><span className={`grid size-6 shrink-0 place-items-center rounded-full border text-[9px] ${selected === index ? 'border-[#a78bfa]/60 text-[#c1acff]' : 'border-white/[.15] text-[#71847a]'}`}>{checked && index === selected && exerciseCorrect ? <Check size={12} /> : String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
        {exerciseError && <p className="mt-3 text-xs text-rose-300" role="alert">{exerciseError}</p>}
        {!checked ? <Button onClick={checkExercise} disabled={selected === null || checking} className="mt-4 h-10 rounded-full bg-[#dcebe1] px-5 text-xs font-semibold text-[#09090d] hover:bg-white disabled:opacity-40">{checking ? 'Conferindo…' : 'Conferir resposta'} <ArrowRight size={14} /></Button> : <div className={`mt-4 flex gap-3 rounded-xl border p-4 ${exerciseCorrect ? 'border-[#a78bfa]/15 bg-[#a78bfa]/[.045]' : 'border-[#e4bc76]/15 bg-[#e4bc76]/[.045]'}`}><span className="mt-0.5">{exerciseCorrect ? <Check size={15} className="text-[#a78bfa]" /> : <ShieldAlert size={15} className="text-[#e4bc76]" />}</span><div><p className="text-xs font-medium text-[#dce7df]">{exerciseCorrect ? 'Boa leitura.' : 'Veja o ponto principal.'}</p><p className="mt-1 text-xs leading-relaxed text-[#94a69c]">{content.exercise.note}</p></div></div>}
        </>}
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-white/[.07] pt-6 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => { setSelected(null); setChecked(false); setExerciseCorrect(null); setExerciseError('') }} className="inline-flex h-10 items-center gap-2 self-start rounded-full px-3 text-xs text-[#809389] hover:text-white"><RotateCcw size={13} />Refazer atividade</button><div className="flex flex-wrap items-center gap-3">{alreadyComplete ? <span className="inline-flex h-11 items-center gap-1.5 text-[10px] text-[#b49cff]"><Check size={13} />Aula concluída</span> : <Button onClick={markDone} disabled={!checked || saving} className="h-11 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] hover:bg-[#c1acff] disabled:opacity-40">{saving ? 'Salvando…' : 'Marcar aula concluída'} <Check size={14} /></Button>}<Link to={nextLesson ? `/curso/aula/${nextLesson.moduleId}/${nextLesson.id}` : `/curso/modulo/${module.id}`} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[.1] px-4 text-xs text-[#d6d0df] transition-all hover:-translate-y-0.5 hover:border-[#b49cff]/35 hover:bg-[#b49cff]/[.06]">{nextLesson ? 'Próxima aula' : 'Revisar módulo'} <ArrowRight size={14} /></Link></div></div>
      {saveError && <p className="mt-3 text-xs text-rose-300" role="alert">{saveError}</p>}
    </article>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#768a7e]"><span>{module.number} / {module.title}</span>{nextLesson && <Link to={`/curso/aula/${nextLesson.moduleId}/${nextLesson.id}`} className="inline-flex items-center gap-1.5 hover:text-[#c1acff]">Prévia da próxima aula: {nextLesson.title} <ArrowRight size={13} /></Link>}</div>
  </div>
}

function FuturesSimulator({ leverage, setLeverage, move, setMove, side, setSide }: { leverage: number; setLeverage: (value: number) => void; move: number; setMove: (value: number) => void; side: 'long' | 'short'; setSide: (value: 'long' | 'short') => void }) {
  const notional = 1000
  const margin = notional / leverage
  const pnl = notional * (move / 100) * (side === 'long' ? 1 : -1)
  const resultColor = pnl > 0 ? 'text-[#b8a2ff]' : pnl < 0 ? 'text-[#f3a2a2]' : 'text-[#ddd8e8]'
  return <section className="futures-lab mt-8 rounded-xl border border-amber-200/15 bg-[#17151c] p-5 sm:p-6" aria-label="Simulador educacional de futuros">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-[.15em] text-amber-200/80">laboratório · exposição fictícia</p><h2 className="mt-2 font-display text-lg font-medium tracking-[-.03em] text-[#f0edf5]">Mude a direção e veja a escala.</h2><p className="mt-1 max-w-lg text-[11px] leading-relaxed text-[#a29eaa]">Exemplo matemático com nocional de R$ 1.000. Sem preço de mercado e sem previsão.</p></div><span className="rounded-md border border-amber-100/15 bg-amber-100/[.04] px-2.5 py-1 text-[9px] text-amber-100/80">não executa operações</span></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.8fr]">
      <div className="space-y-5">
        <div><p className="mb-2 text-[10px] text-[#aaa6b2]">Direção da posição</p><div className="grid grid-cols-2 gap-2"><button type="button" aria-pressed={side === 'long'} onClick={() => setSide('long')} className={`rounded-lg border px-3 py-2.5 text-left text-xs transition-all ${side === 'long' ? 'border-violet-300/35 bg-violet-300/[.09] text-violet-100 shadow-[0_0_20px_rgba(152,120,255,.08)]' : 'border-white/[.08] text-[#9c98a4] hover:bg-white/[.03]'}`}><span className="block font-semibold">Long · comprada</span><span className="mt-1 block text-[9px] opacity-70">tende a ganhar com alta</span></button><button type="button" aria-pressed={side === 'short'} onClick={() => setSide('short')} className={`rounded-lg border px-3 py-2.5 text-left text-xs transition-all ${side === 'short' ? 'border-amber-200/30 bg-amber-100/[.07] text-amber-100 shadow-[0_0_20px_rgba(245,194,107,.06)]' : 'border-white/[.08] text-[#9c98a4] hover:bg-white/[.03]'}`}><span className="block font-semibold">Short · vendida</span><span className="mt-1 block text-[9px] opacity-70">tende a ganhar com queda</span></button></div></div>
        <div><div className="mb-2 flex items-center justify-between text-[10px]"><label htmlFor="leverage-slider" className="text-[#aaa6b2]">Alavancagem hipotética</label><span className="font-mono font-semibold text-[#e2d8ff]">{leverage}×</span></div><Slider id="leverage-slider" min={1} max={10} step={1} value={[leverage]} onValueChange={(value) => setLeverage(typeof value === 'number' ? value : value[0] ?? 5)} aria-label="Alavancagem hipotética" /></div>
        <div><div className="mb-2 flex items-center justify-between text-[10px]"><label htmlFor="move-slider" className="text-[#aaa6b2]">Variação hipotética do preço</label><span className="font-mono font-semibold text-[#e2d8ff]">{move > 0 ? '+' : ''}{move}%</span></div><Slider id="move-slider" min={-20} max={20} step={1} value={[move]} onValueChange={(value) => setMove(typeof value === 'number' ? value : value[0] ?? 0)} aria-label="Variação hipotética percentual do preço" /></div>
      </div>
      <div className="rounded-lg border border-white/[.07] bg-black/20 p-4 sm:p-5"><div className="grid grid-cols-2 gap-4"><div><p className="text-[9px] uppercase tracking-[.12em] text-[#85818f]">margem inicial*</p><p className="mt-2 font-display text-xl text-[#e8e3f0]">R$ {margin.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</p></div><div><p className="text-[9px] uppercase tracking-[.12em] text-[#85818f]">resultado aritmético</p><p className={`mt-2 font-display text-xl ${resultColor}`}>{pnl > 0 ? '+' : ''}R$ {pnl.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</p></div></div><div className="mt-4 h-px bg-white/[.07]" /><p className="mt-4 text-[10px] leading-relaxed text-[#aaa6b2]">Variação sobre a margem: <strong className={resultColor}>{pnl > 0 ? '+' : ''}{((pnl / margin) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong></p><p className="mt-1 text-[9px] leading-relaxed text-[#817d89]">*Aproximação didática: margem = nocional ÷ alavancagem.</p></div>
    </div>
    <p className="mt-5 rounded-lg border border-rose-300/10 bg-rose-300/[.035] p-3 text-[9px] leading-relaxed text-[#c3adb2]">Cálculo simplificado antes de taxas, funding, ajustes, slippage e margem de manutenção. Em produtos reais, regras variam e a liquidação pode ocorrer antes. Perdas podem superar a margem depositada. Este material não indica operação.</p>
  </section>
}



