import { translateUi, translateTemplate } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, AudioLines, BookOpenCheck, Check, ChevronRight, Clock3, Play, Shield } from 'lucide-react'
import { LocalizedLink as Link } from '@/components/localized-router'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AudioNarration } from '@/components/audio-narration'
import { welcomeNarration } from '@/lib/audio-tracks'
import { welcomeScript } from '@/lib/narration-script'
import { useSession } from '@/contexts/session-context'
import { allLessons, modules } from '@/lib/course'
import { moduleCovers } from '@/lib/course-media'
import { loadReviewSchedule, saveReviewSchedule, type ReviewSchedule } from '@/lib/learning-service'
import { AmbientShader } from '@/components/ui/ambient-shader'
import { FounderBadge } from '@/components/founder-badge'
const reviewCards = [
  { id: 'blockchain', prompt: 'O que uma blockchain ajuda a fazer?', answer: 'Manter um histórico compartilhado de transações validado pelas regras da rede.' },
  { id: 'custody', prompt: 'O que uma carteira realmente protege?', answer: 'As chaves que autorizam transações; as moedas ficam registradas na rede.' },
  { id: 'limit-order', prompt: 'O que uma ordem limitada controla?', answer: 'O preço máximo de compra ou mínimo de venda que você aceita; ela pode não executar.' },
  { id: 'liquidity', prompt: 'Por que liquidez importa?', answer: 'Ela influencia o custo e a possibilidade de comprar ou sair de uma posição.' },
  { id: 'dca', prompt: 'O que DCA não garante?', answer: 'Lucro, proteção contra perdas ou um preço médio melhor.' },
  { id: 'defi', prompt: 'O que uma auditoria de contrato não garante?', answer: 'Que perdas não ocorrerão; ela tem escopo, data e dependências fora do código.' },
  { id: 'risk', prompt: 'Qual pergunta vem antes do retorno?', answer: 'Que perda em reais você suporta sem comprometer suas necessidades?' },
]

export function CourseDashboard() {
  useUiTranslation();
  const { user, completedLessons } = useSession()
  const legacyCompleted = allLessons.filter((lesson) => completedLessons.includes(lesson.id)).length
  const percent = Math.round((legacyCompleted / allLessons.length) * 100)
  const next = allLessons.find((lesson) => !completedLessons.includes(lesson.id)) ?? allLessons[0]
  const completedModules = modules.filter((module) => module.lessons.every((lesson) => completedLessons.includes(lesson.id))).length
  const nextModule = modules.find((module) => module.id === next.moduleId) ?? modules[0]!
  const firstOpenModuleIndex = modules.findIndex((module) => module.lessons.some((lesson) => !completedLessons.includes(lesson.id)))
  const activeModuleIndex = firstOpenModuleIndex < 0 ? modules.length - 1 : firstOpenModuleIndex

  return <div className="space-y-9">
    <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><p className="eyebrow">{translateUi("bom ter você de volta")}</p><div className="mt-3 flex flex-wrap items-center gap-3"><h1 className="font-display text-3xl font-medium tracking-[-.05em] text-[#edf4ef] sm:text-4xl">{translateUi("Olá, ")}{translateUi(user?.name.split(' ')[0])}.</h1>{user && <FounderBadge isFounder={user.isFounder} />}</div><p className="mt-2 max-w-xl text-sm leading-relaxed text-[#90a298]">{translateUi("Seu próximo passo está logo aqui. Estude no seu ritmo e volte às decisões com mais contexto.")}</p></div>
    </section>

    <section className="study-bento" aria-label={translateUi("Seu próximo passo")}>
      <Card className="bento-panel study-hero">
        <AmbientShader className="study-hero-shader" />
        <div className="study-hero-art" aria-hidden="true"><img loading="lazy" decoding="async" src={moduleCovers[next.moduleId] ?? moduleCovers.m1} alt={translateUi("")} /><span /></div>
        <div className="study-hero-copy">
          <div className="flex flex-wrap items-center gap-2"><span className="bento-kicker">{translateUi("Continuar de onde parou")}</span><span className="text-[11px] text-[#a29bad]">{translateUi("Módulo ")}{translateUi(nextModule.number)}</span></div>
          <h2>{translateUi(next.title)}</h2>
          <p>{translateUi("Uma ideia por vez. Entenda o conceito e pratique com um cenário ao final da aula.")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4"><Link to={`/curso/aula/${next.moduleId}/${next.id}`} className="button-motion inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#b49cff] px-5 text-xs font-semibold text-[#100c19] hover:bg-[#c6b4ff]"><Play size={15} fill="currentColor" />{translateUi(legacyCompleted ? 'Retomar aula' : 'Começar primeira aula')}</Link><span className="flex items-center gap-1.5 text-xs text-[#b4adbf]"><Clock3 size={14} />{translateUi(next.duration)} {translateUi(" de estudo")}</span></div>
          <div className="study-hero-progress"><div className="mb-2 flex justify-between text-[11px]"><span>{translateUi("Progresso da trilha")}</span><span className="font-semibold text-[#d3c4ff]">{translateUi(percent)}%</span></div><Progress value={percent} aria-label={translateUi("Progresso da trilha")} className="h-1.5 bg-white/[.09]" /></div>
        </div>
      </Card>
      <Card className="bento-panel study-welcome">
        <div className="flex items-center justify-between"><span className="bento-icon"><AudioLines size={18} /></span><span className="text-[11px] text-[#a59caf]">{translateUi("Antes de começar")}</span></div>
        <div><h3 className="text-xl font-medium tracking-tight text-[#f0eaf8]">{translateUi("Seu ponto de partida.")}</h3><p className="mt-2 text-xs leading-relaxed text-[#aaa2b5]">{translateUi("Conheça a trilha e veja como usar aulas, atividades e narrações.")}</p></div>
        <AudioNarration compact title={translateUi("Boas-vindas")} track={welcomeNarration} transcript={welcomeScript.transcript} summary={welcomeScript.summary} />
      </Card>
      <div className="study-metrics">
        <Metric icon={<BookOpenCheck size={16} />} label={translateUi("Aulas concluídas")} value={`${legacyCompleted} / ${allLessons.length}`} note="Seu avanço na trilha" tone="mint" />
        <Metric icon={<Check size={16} />} label={translateUi("Módulos completos")} value={`${completedModules} / ${modules.length}`} note="Uma etapa de cada vez" tone="blue" />
        <Metric icon={<Shield size={16} />} label={translateUi("Próxima habilidade")} value={nextModule.title} note="Aplique na próxima aula" tone="amber" />
      </div>
      {user && <QuickReview key={user.id} userId={user.id} />}
    </section>

    <section id="modulos" className="scroll-mt-24">
      <div className="mb-6"><p className="eyebrow">{translateUi("a jornada completa")}</p><h2 className="mt-2 font-display text-2xl font-medium tracking-[-.04em] text-[#eeeaf4]">{translateUi("Nove módulos. Uma base melhor.")}</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#90a298]">{translateUi("Comece pelo Módulo 01 e avance no seu ritmo. Cada card mostra progresso, duração e o próximo passo.")}</p></div>
      {(() => {
        const featured = modules[0]!
        const featuredDone = featured.lessons.filter((lesson) => completedLessons.includes(lesson.id)).length
        const featuredPercent = Math.round((featuredDone / featured.lessons.length) * 100)
        const featuredTargetId = featured.lessons.find((lesson) => !completedLessons.includes(lesson.id))?.id ?? featured.lessons[0]!.id
        return (
          <Link to={`/curso/aula/${featured.id}/${featuredTargetId}`} className="focus-ring group grid overflow-hidden rounded-2xl border border-white/[.07] bg-[#12121a] transition-colors hover:border-[#a78bfa]/30 sm:grid-cols-2">
            <div className="relative min-h-[220px] overflow-hidden bg-[#1c1728] sm:min-h-[300px]">
              <img src={moduleCovers[featured.id] ?? moduleCovers.m1} alt={translateUi("")} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#12121a]/50 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-[#12121a]/10" />
              <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[10px] font-medium text-white backdrop-blur">{translateUi("Módulo ")}{translateUi(featured.number)}</span>
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <span className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#c6b4ff]">{translateUi(featuredDone === featured.lessons.length ? 'Concluído' : 'Próximo na trilha')}</span>
              <h3 className="mt-3 font-display text-2xl font-medium tracking-[-.04em] text-[#f0eaf6] sm:text-[32px] sm:leading-[1.1]">{translateUi(featured.title)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#a89fb7]">{translateUi(featured.subtitle)}</p>
              <div className="mt-6 flex items-center justify-between text-xs text-[#afa6bc]"><span>{translateUi(featuredDone)}/{translateUi(featured.lessons.length)} {translateUi(" aulas")}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={13} />{translateUi(featured.duration)}</span></div>
              <Progress value={featuredPercent} aria-label={translateUi(translateTemplate("Progresso: {{value0}}", [featured.title]))} className="mt-2 h-1.5 bg-white/[.07]" />
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#cbbbf1]">{translateUi("Abrir módulo ")}<ChevronRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
            </div>
          </Link>
        )
      })()}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {modules.slice(1).map((module, restIndex) => {
          const index = restIndex + 1
          const done = module.lessons.filter((lesson) => completedLessons.includes(lesson.id)).length
          const modulePercent = Math.round((done / module.lessons.length) * 100)
          const active = index === activeModuleIndex
          const targetId = module.lessons.find((lesson) => !completedLessons.includes(lesson.id))?.id ?? module.lessons[0]!.id
          const status = done === module.lessons.length ? 'Concluído' : active ? 'Próximo na trilha' : `${module.lessons.length} aulas disponíveis`
          return <Link key={module.id} to={`/curso/aula/${module.id}/${targetId}`} className="focus-ring group flex flex-col overflow-hidden rounded-2xl border border-white/[.07] bg-[#12121a] transition-colors hover:border-[#a78bfa]/30">
            <div className="relative h-44 overflow-hidden bg-[#1c1728]">
              <img src={moduleCovers[module.id] ?? moduleCovers.m1} alt={translateUi("")} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#12121a]/60 to-transparent" />
              <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[10px] font-medium text-white backdrop-blur">{translateUi("Módulo ")}{translateUi(module.number)}</span>
            </div>
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <span className={`text-[11px] font-medium ${active ? 'text-[#c6b4ff]' : 'text-[#9f96ae]'}`}>{translateUi(status)}</span>
              <h3 className="mt-2 font-display text-xl font-medium tracking-[-.03em] text-[#f0eaf6]">{translateUi(module.title)}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#a89fb7]">{translateUi(module.subtitle)}</p>
              <div className="mt-auto pt-5">
                <div className="flex items-center justify-between text-[11px] text-[#afa6bc]"><span>{translateUi(done)}/{translateUi(module.lessons.length)} {translateUi(" aulas")}</span><span className="inline-flex items-center gap-1"><Clock3 size={12} />{translateUi(module.duration)}</span></div>
                <Progress value={modulePercent} aria-label={translateUi(translateTemplate("Progresso: {{value0}}", [module.title]))} className="mt-2 h-1 bg-white/[.07]" />
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#cbbbf1]">{translateUi("Abrir módulo ")}<ChevronRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
              </div>
            </div>
          </Link>
        })}
      </div>
    </section>

    <section className="flex flex-col gap-4 rounded-xl border border-white/[.07] bg-[#12121a] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#e4bc76]/20 bg-[#e4bc76]/[.07] text-[#e4bc76]"><Shield size={17} /></span><div><h3 className="text-sm font-medium text-[#dce8e0]">{translateUi("Aprender também é saber quando não agir.")}</h3><p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#899b91]">{translateUi("Criptoativos podem oscilar muito e você pode perder todo o valor investido. Use este espaço para estudar, não como recomendação individual.")}</p></div></div><Link to="/curso/seguranca" className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium text-[#c1acff] hover:text-white">{translateUi("Abrir checklist de segurança ")}<ArrowRight size={14} /></Link></section>
  </div>
}

function Metric({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: string; note: string; tone: 'mint' | 'blue' | 'amber' }) {
  useUiTranslation();
  const colors = { mint: 'text-[#a78bfa] bg-[#a78bfa]/[.08]', blue: 'text-[#a6b4ff] bg-[#98abff]/[.08]', amber: 'text-[#e4bc76] bg-[#e4bc76]/[.08]' }
  return <div className="bento-panel bento-metric"><div className="flex items-center gap-2.5"><span className={`grid size-8 place-items-center rounded-lg ${colors[tone]}`}>{translateUi(icon)}</span><span className="text-xs text-[#8fa197]">{translateUi(label)}</span></div><p className="mt-3 font-display text-lg font-medium tracking-[-.04em] text-[#e4ede6]">{translateUi(value)}</p><p className="mt-1 text-[10px] text-[#718479]">{translateUi(note)}</p></div>
}

function QuickReview({ userId }: { userId: string }) {
  useUiTranslation();
  const [schedule, setSchedule] = useState<ReviewSchedule>({})
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [retry, setRetry] = useState(0)
  const current = reviewCards[index]

  useEffect(() => {
    let active = true
    loadReviewSchedule(userId)
      .then((items) => {
        if (!active) return
        setSchedule(items)
        const dueIndex = reviewCards.findIndex((card) => !items[card.id] || items[card.id] <= Date.now())
        setIndex(Math.max(0, dueIndex))
      })
      .catch((cause: unknown) => { if (active) setLoadError(cause instanceof Error ? cause.message : 'Não foi possível carregar sua revisão.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry, userId])

  const rate = async (days: 1 | 3) => {
    if (saving) return
    const dueAt = Date.now() + days * 24 * 60 * 60 * 1000
    setSaving(true)
    setActionError('')
    setNotice('')
    try {
      await saveReviewSchedule(userId, current.id, days, dueAt)
      const updated = { ...schedule, [current.id]: dueAt }
      setSchedule(updated)
      const now = Date.now()
      const nextDue = reviewCards.findIndex((card, cardIndex) => cardIndex !== index && (!updated[card.id] || updated[card.id] <= now))
      setIndex(nextDue >= 0 ? nextDue : (index + 1) % reviewCards.length)
      setRevealed(false)
      setNotice('Sua próxima revisão foi salva na conta.')
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível salvar sua revisão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <section className="bento-panel study-review" aria-label={translateUi("Revisão rápida")}><h3 className="text-xs font-semibold text-[#c6b4ff]">{translateUi("Revisão rápida")}</h3><p className="mt-3 text-xs text-[#968ca6]" role="status">{translateUi("Carregando sua agenda de revisão…")}</p></section>
  if (loadError) return <section className="bento-panel study-review" aria-label={translateUi("Revisão rápida")}><h3 className="text-xs font-semibold text-[#c6b4ff]">{translateUi("Revisão rápida")}</h3><p className="mt-3 text-xs text-rose-300" role="alert">{translateUi(loadError)}</p><button type="button" onClick={() => { setLoadError(''); setLoading(true); setRetry((value) => value + 1) }} className="mt-3 text-xs text-[#c6b4ff]">{translateUi("Tentar novamente")}</button></section>

  return <section className="bento-panel study-review">
    <div className="flex items-center justify-between gap-3"><h3 className="text-xs font-semibold text-[#c6b4ff]">{translateUi("Revisão rápida")}</h3><span className="text-[10px] text-[#968ca6]">{translateUi("2 minutos")}</span></div>
    <p className="mt-3 text-sm font-medium leading-relaxed text-[#eee8f6]">{translateUi(current.prompt)}</p>
    {revealed ? <><p className="mt-3 text-xs leading-relaxed text-[#b8afc5]">{translateUi(current.answer)}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => void rate(1)} className="rounded-xl border border-white/10 px-3 py-2 text-[10px] text-[#c4bace] disabled:opacity-50">{translateUi(saving ? 'Salvando…' : 'Rever amanhã')}</button><button type="button" disabled={saving} onClick={() => void rate(3)} className="rounded-xl bg-[#b49cff] px-3 py-2 text-[10px] font-semibold text-[#100c19] disabled:opacity-50">{translateUi(saving ? 'Salvando…' : 'Lembrei · 3 dias')}</button></div></> : <button type="button" onClick={() => setRevealed(true)} className="mt-4 inline-flex items-center gap-2 text-xs text-[#c6b4ff]">{translateUi("Revelar resposta ")}<ArrowRight size={13} /></button>}
    {actionError && <p className="mt-3 text-xs text-rose-300" role="alert">{translateUi(actionError)}</p>}
    {notice && <p className="mt-3 text-[10px] text-[#9bcdb7]" role="status">{translateUi(notice)}</p>}
  </section>
}
