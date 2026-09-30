import { useState, type ReactNode } from 'react'
import { ArrowRight, AudioLines, BookOpenCheck, Check, ChevronRight, Clock3, Play, Shield, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AudioNarration } from '@/components/audio-narration'
import { welcomeNarration } from '@/lib/audio-tracks'
import { welcomeScript } from '@/lib/narration-script'
import { useSession } from '@/contexts/session-context'
import { allLessons, modules } from '@/lib/course'
import { moduleCovers } from '@/lib/course-media'
import { getStoredValue, setStoredValue } from '@/lib/storage'

const moduleIcons: Record<string, string> = { Blocks: '▦', ArrowLeftRight: '↔', Bitcoin: '₿', ScanSearch: '⌕', Scale: '⚖', ShieldCheck: '⌑', Orbit: '◉', ChartNoAxesCombined: '↗', Compass: '⌖' }
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
  const { user, completedLessons } = useSession()
  const percent = Math.round((completedLessons.length / allLessons.length) * 100)
  const next = allLessons.find((lesson) => !completedLessons.includes(lesson.id)) ?? allLessons[0]
  const completedModules = modules.filter((module) => module.lessons.every((lesson) => completedLessons.includes(lesson.id))).length
  const nextModule = modules.find((module) => module.id === next.moduleId) ?? modules[0]!
  const firstOpenModuleIndex = modules.findIndex((module) => module.lessons.some((lesson) => !completedLessons.includes(lesson.id)))
  const activeModuleIndex = firstOpenModuleIndex < 0 ? modules.length - 1 : firstOpenModuleIndex

  return <div className="space-y-9">
    <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><p className="eyebrow">bom ter você de volta</p><h1 className="mt-3 font-display text-3xl font-medium tracking-[-.05em] text-[#edf4ef] sm:text-4xl">Olá, {user?.name.split(' ')[0]}.</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-[#90a298]">Seu próximo passo está logo aqui. Estude no seu ritmo e volte às decisões com mais contexto.</p></div>
      <div className="flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.025] px-3 py-2 text-xs text-[#98aa9f]"><Sparkles size={14} className="text-[#e4bc76]" />Trilha educativa</div>
    </section>

    <section className="study-bento" aria-label="Seu próximo passo">
      <Card className="bento-panel study-hero">
        <div className="study-hero-art" aria-hidden="true"><img src={moduleCovers[next.moduleId] ?? moduleCovers.m1} alt="" /><span /></div>
        <div className="study-hero-copy">
          <div className="flex flex-wrap items-center gap-2"><span className="bento-kicker">Continuar de onde parou</span><span className="text-[11px] text-[#a29bad]">Módulo {nextModule.number}</span></div>
          <h2>{next.title}</h2>
          <p>Uma ideia por vez. Entenda o conceito e pratique com um cenário ao final da aula.</p>
          <div className="mt-6 flex flex-wrap items-center gap-4"><Link to={`/curso/aula/${next.moduleId}/${next.id}`} className="button-motion inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#b49cff] px-5 text-xs font-semibold text-[#100c19] hover:bg-[#c6b4ff]"><Play size={15} fill="currentColor" />{completedLessons.length ? 'Retomar aula' : 'Começar primeira aula'}</Link><span className="flex items-center gap-1.5 text-xs text-[#b4adbf]"><Clock3 size={14} />{next.duration} de estudo</span></div>
          <div className="study-hero-progress"><div className="mb-2 flex justify-between text-[11px]"><span>Progresso da trilha</span><span className="font-semibold text-[#d3c4ff]">{percent}%</span></div><Progress value={percent} aria-label="Progresso da trilha" className="h-1.5 bg-white/[.09]" /></div>
        </div>
      </Card>
      <Card className="bento-panel study-welcome">
        <div className="flex items-center justify-between"><span className="bento-icon"><AudioLines size={18} /></span><span className="text-[11px] text-[#a59caf]">Antes de começar</span></div>
        <div><h3 className="text-xl font-medium tracking-tight text-[#f0eaf8]">Seu ponto de partida.</h3><p className="mt-2 text-xs leading-relaxed text-[#aaa2b5]">Conheça a trilha e veja como usar aulas, atividades e narrações.</p></div>
        <AudioNarration compact title="Boas-vindas" track={welcomeNarration} transcript={welcomeScript.transcript} summary={welcomeScript.summary} />
      </Card>
      <div className="study-metrics">
        <Metric icon={<BookOpenCheck size={16} />} label="Aulas concluídas" value={`${completedLessons.length} / ${allLessons.length}`} note="Seu avanço na trilha" tone="mint" />
        <Metric icon={<Check size={16} />} label="Módulos completos" value={`${completedModules} / ${modules.length}`} note="Uma etapa de cada vez" tone="blue" />
        <Metric icon={<Shield size={16} />} label="Próxima habilidade" value={nextModule.title} note="Aplique na próxima aula" tone="amber" />
      </div>
      <QuickReview />
    </section>

    <section id="modulos" className="scroll-mt-24">
      <div className="mb-5"><p className="eyebrow">a jornada completa</p><h2 className="mt-2 font-display text-2xl font-medium tracking-[-.04em] text-[#eeeaf4]">Nove módulos. Uma base melhor.</h2></div>
      <div className="course-modules-bento">
        {modules.map((module, index) => {
          const done = module.lessons.filter((lesson) => completedLessons.includes(lesson.id)).length
          const modulePercent = Math.round((done / module.lessons.length) * 100)
          const active = index === activeModuleIndex
          return <Link key={module.id} to={`/curso/aula/${module.id}/${module.lessons.find((lesson) => !completedLessons.includes(lesson.id))?.id ?? module.lessons[0].id}`} className={`course-module-tile group focus-ring ${active ? 'is-current' : ''}`}>
            <Card className="bento-panel bento-module-card">
              <CardContent className="bento-module-content">
                <div className="bento-module-cover"><img src={moduleCovers[module.id] ?? moduleCovers.m1} alt="" loading="lazy" /><span className="bento-module-number">Módulo {module.number}</span><span className="bento-module-symbol">{moduleIcons[module.icon] ?? module.number}</span></div>
                <div className="bento-module-copy">
                  <span className={`text-[10px] font-medium ${active ? 'text-[#c6b4ff]' : 'text-[#9f96ae]'}`}>{done === module.lessons.length ? 'Concluído' : active ? 'Próximo na trilha' : module.lessons.length + ' aulas disponíveis'}</span>
                  <h3>{module.title}</h3><p>{module.subtitle}</p>
                  <div className="bento-module-footer"><div className="mb-2 flex items-center justify-between text-[10px] text-[#afa6bc]"><span>{done}/{module.lessons.length} aulas</span><span>{module.duration}</span></div><Progress value={modulePercent} aria-label={`Progresso: ${module.title}`} className="h-1 bg-white/[.07]" /><div className="mt-4 flex items-center justify-between text-[11px] text-[#cbbbf1]"><span>{done === module.lessons.length ? 'Revisar módulo' : 'Abrir módulo'}</span><ChevronRight size={15} className="transition-transform group-hover:translate-x-1" /></div></div>
                </div>
              </CardContent>
            </Card>
          </Link>
        })}
      </div>
    </section>

    <section className="flex flex-col gap-4 rounded-xl border border-white/[.07] bg-[#12121a] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#e4bc76]/20 bg-[#e4bc76]/[.07] text-[#e4bc76]"><Shield size={17} /></span><div><h3 className="text-sm font-medium text-[#dce8e0]">Aprender também é saber quando não agir.</h3><p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#899b91]">Criptoativos podem oscilar muito e você pode perder todo o valor investido. Use este espaço para estudar, não como recomendação individual.</p></div></div><Link to="/curso/seguranca" className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium text-[#c1acff] hover:text-white">Abrir checklist de segurança <ArrowRight size={14} /></Link></section>
  </div>
}

function Metric({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: string; note: string; tone: 'mint' | 'blue' | 'amber' }) {
  const colors = { mint: 'text-[#a78bfa] bg-[#a78bfa]/[.08]', blue: 'text-[#a6b4ff] bg-[#98abff]/[.08]', amber: 'text-[#e4bc76] bg-[#e4bc76]/[.08]' }
  return <div className="bento-panel bento-metric"><div className="flex items-center gap-2.5"><span className={`grid size-8 place-items-center rounded-lg ${colors[tone]}`}>{icon}</span><span className="text-xs text-[#8fa197]">{label}</span></div><p className="mt-3 font-display text-lg font-medium tracking-[-.04em] text-[#e4ede6]">{value}</p><p className="mt-1 text-[10px] text-[#718479]">{note}</p></div>
}

function getReviewSchedule(): Record<string, number> {
  try { return JSON.parse(getStoredValue('cripto-mentoria:review-schedule') ?? '{}') as Record<string, number> } catch { return {} }
}

function QuickReview() {
  const [schedule, setSchedule] = useState<Record<string, number>>(getReviewSchedule)
  const initialIndex = Math.max(0, reviewCards.findIndex((card) => !schedule[card.id] || schedule[card.id] <= Date.now()))
  const [index, setIndex] = useState(initialIndex)
  const [revealed, setRevealed] = useState(false)
  const current = reviewCards[index]
  const rate = (days: number) => {
    const updated = { ...schedule, [current.id]: Date.now() + days * 24 * 60 * 60 * 1000 }
    setStoredValue('cripto-mentoria:review-schedule', JSON.stringify(updated))
    setSchedule(updated)
    const nextDue = reviewCards.findIndex((card, cardIndex) => cardIndex !== index && (!updated[card.id] || updated[card.id] <= Date.now()))
    setIndex(nextDue >= 0 ? nextDue : (index + 1) % reviewCards.length)
    setRevealed(false)
  }
  return <section className="bento-panel study-review">
    <div className="flex items-center justify-between gap-3"><h3 className="text-xs font-semibold text-[#c6b4ff]">Revisão rápida</h3><span className="text-[10px] text-[#968ca6]">2 minutos</span></div>
    <p className="mt-3 text-sm font-medium leading-relaxed text-[#eee8f6]">{current.prompt}</p>
    {revealed ? <><p className="mt-3 text-xs leading-relaxed text-[#b8afc5]">{current.answer}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => rate(1)} className="rounded-xl border border-white/10 px-3 py-2 text-[10px] text-[#c4bace]">Rever amanhã</button><button type="button" onClick={() => rate(3)} className="rounded-xl bg-[#b49cff] px-3 py-2 text-[10px] font-semibold text-[#100c19]">Lembrei · 3 dias</button></div></> : <button type="button" onClick={() => setRevealed(true)} className="mt-4 inline-flex items-center gap-2 text-xs text-[#c6b4ff]">Revelar resposta <ArrowRight size={13} /></button>}
  </section>
}
