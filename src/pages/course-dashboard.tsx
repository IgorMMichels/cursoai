import { useState, type ReactNode } from 'react'
import { ArrowRight, AudioLines, BookOpenCheck, Check, ChevronRight, Clock3, Play, Shield, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AudioNarration } from '@/components/audio-narration'
import { audioTracks } from '@/lib/audio-tracks'
import { useSession } from '@/contexts/session-context'
import { allLessons, modules } from '@/lib/course'

const moduleIcons: Record<string, string> = { Blocks: '▦', ArrowLeftRight: '↔', Bitcoin: '₿', ScanSearch: '⌕', Scale: '⚖', ShieldCheck: '⌑', Orbit: '◉', ChartNoAxesCombined: '↗', Compass: '⌖' }
const moduleCovers: Record<string, string> = {
  m1: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=900&q=78',
  m2: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=900&q=78',
  m8: 'https://images.unsplash.com/photo-1641266794308-45cef9acb4cb?auto=format&fit=crop&w=900&q=78',
  m3: 'https://images.unsplash.com/photo-1742076553114-cfd4f27de46f?auto=format&fit=crop&w=900&q=78',
  m4: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=900&q=78',
  m5: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=900&q=78',
  m6: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=900&q=78',
  m9: 'https://images.unsplash.com/photo-1742076553114-cfd4f27de46f?auto=format&fit=crop&w=900&q=78',
  m7: 'https://images.unsplash.com/photo-1641266794308-45cef9acb4cb?auto=format&fit=crop&w=900&q=78',
}
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
      <div className="flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.025] px-3 py-2 text-xs text-[#98aa9f]"><Sparkles size={14} className="text-[#e4bc76]" />Trilha educativa · demonstração</div>
    </section>

    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(270px,.72fr)]">
      <div className="relative isolate overflow-hidden rounded-xl border border-[#a78bfa]/15 bg-[linear-gradient(115deg,#191722_0%,#12131b_56%,#101820_100%)] p-6 sm:p-8">
        <div className="dashboard-hero-image pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] overflow-hidden lg:block"><img src={moduleCovers[next.moduleId] ?? moduleCovers.m1} alt="" className="size-full object-cover opacity-60" /><div className="absolute inset-0 bg-[linear-gradient(90deg,#13121a_0%,rgba(19,18,26,.78)_24%,rgba(19,18,26,.08)_100%)]" /><div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(9,9,13,.62),transparent_64%)]" /></div>
        <div className="absolute -right-24 -top-32 -z-10 size-80 rounded-full bg-[#a78bfa]/[.08] blur-[100px]" />
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-[#a78bfa]/15 bg-[#a78bfa]/[.07] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.13em] text-[#b49cff]">continuar de onde parou</span><span className="text-[11px] text-[#7d9085]">{next.moduleTitle}</span></div>
        <h2 className="mt-5 max-w-2xl font-display text-2xl font-medium tracking-[-.04em] text-[#eef5f0] sm:text-3xl">{next.title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#9aaca2]">Uma aula curta, uma ideia por vez. Ao final, você aplica o conceito em um cenário prático.</p>
        <div className="mt-6 flex flex-wrap items-center gap-4"><Link to={`/curso/aula/${next.moduleId}/${next.id}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] transition-colors hover:bg-[#c1acff]"><Play size={15} fill="currentColor" />{completedLessons.length ? 'Retomar aula' : 'Começar primeira aula'}</Link><span className="flex items-center gap-1.5 text-xs text-[#93a69b]"><Clock3 size={14} />{next.duration}</span></div>
        <div className="mt-7 max-w-lg"><div className="mb-2 flex justify-between text-[11px]"><span className="text-[#93a69b]">Progresso da trilha</span><span className="font-semibold text-[#c1acff]">{percent}%</span></div><Progress value={percent} className="h-1.5 bg-white/[.09] [&>div]:bg-[#a78bfa]" /></div>
      </div>

      <Card className="surface flex flex-col justify-between rounded-xl border-white/[.07] p-4 sm:p-5">
        <div><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-lg bg-violet-200/[.09] text-violet-200"><AudioLines size={17} /></span><span className="text-[9px] uppercase tracking-[.13em] text-[#92909d]">boas-vindas</span></div><h3 className="mt-4 font-display text-lg font-medium tracking-[-.035em] text-[#eeeaf4]">Comece pelo contexto</h3><p className="mt-1 text-xs leading-relaxed text-[#aaa6b2]">Como seguir a trilha e usar aulas, atividades e quizzes.</p></div>
        <AudioNarration title="Boas-vindas" transcript={audioTracks['/audio/boas_vindas.mp3']!.transcript} summary={audioTracks['/audio/boas_vindas.mp3']!.summary} />
      </Card>
    </section>

    <section className="grid gap-3 sm:grid-cols-3">
      <Metric icon={<BookOpenCheck size={16} />} label="Aulas concluídas" value={`${completedLessons.length} / ${allLessons.length}`} note="Marque cada aula ao terminar" tone="mint" />
      <Metric icon={<Check size={16} />} label="Módulos completos" value={`${completedModules} / ${modules.length}`} note="Quiz no fim de cada trilha" tone="blue" />
      <Metric icon={<Shield size={16} />} label="Próxima habilidade" value={nextModule.title} note="Seu aprendizado não promete retorno" tone="amber" />
    </section>

    <QuickReview />

    <section id="modulos" className="scroll-mt-24">
      <div className="mb-5 flex items-end justify-between gap-4"><div><p className="eyebrow">a jornada completa</p><h2 className="mt-2 font-display text-2xl font-medium tracking-[-.04em] text-[#eeeaf4]">Nove módulos. Uma base melhor.</h2></div><span className="hidden text-xs text-[#92909d] sm:block">{allLessons.length} aulas · quizzes com explicação</span></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module, index) => {
          const done = module.lessons.filter((lesson) => completedLessons.includes(lesson.id)).length
          const modulePercent = Math.round((done / module.lessons.length) * 100)
          const active = index === activeModuleIndex
          return <Link key={module.id} to={`/curso/aula/${module.id}/${module.lessons.find((lesson) => !completedLessons.includes(lesson.id))?.id ?? module.lessons[0].id}`} className="group focus-ring rounded-xl">
            <Card className={`surface h-full overflow-hidden rounded-xl border-white/[.07] p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-violet-200/25 group-hover:shadow-[0_18px_50px_rgba(111,85,210,.12)] ${active ? 'bg-[#171521]/90' : ''}`}>
              <CardContent className="flex h-full flex-col p-0">
                <div className="module-cover relative -mx-5 -mt-5 mb-4 h-[118px] overflow-hidden"><img src={moduleCovers[module.id] ?? moduleCovers.m1} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" /><div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(17,17,25,.95),rgba(17,17,25,.06)_85%)]" /><span className="absolute left-4 top-3 rounded-md border border-white/15 bg-black/35 px-2 py-1 font-mono text-[9px] text-white/80 backdrop-blur">MÓDULO {module.number}</span><span className="absolute bottom-3 left-4 grid size-8 place-items-center rounded-lg border border-white/15 bg-black/30 text-sm text-violet-100 backdrop-blur">{moduleIcons[module.icon] ?? module.number}</span></div>
                <div className="flex items-start justify-between"><span className={`grid size-11 place-items-center rounded-lg border text-base ${module.color === 'blue' ? 'border-[#98abff]/15 bg-[#98abff]/[.07] text-[#aab8ff]' : module.color === 'amber' ? 'border-[#e4bc76]/15 bg-[#e4bc76]/[.07] text-[#e9c984]' : module.color === 'lilac' ? 'border-[#c0a4ff]/15 bg-[#c0a4ff]/[.07] text-[#c7b3ff]' : 'border-[#a78bfa]/15 bg-[#a78bfa]/[.07] text-[#b49cff]'}`}>{moduleIcons[module.icon] ?? module.number}</span><span className="font-display text-[11px] tracking-[.12em] text-[#60736a]">{module.number}</span></div>
                <h3 className="mt-5 font-display text-[17px] font-medium tracking-[-.03em] text-[#e3ebe5]">{module.title}</h3><p className="mt-2 min-h-10 text-xs leading-relaxed text-[#899b91]">{module.subtitle}</p>
                <div className="mt-auto pt-5"><div className="mb-2 flex items-center justify-between text-[10px]"><span className="text-[#73867b]">{done}/{module.lessons.length} aulas</span><span className="text-[#92a49a]">{module.duration}</span></div><Progress value={modulePercent} className="h-1 bg-white/[.07] [&>div]:bg-[#a78bfa]" /><div className="mt-4 flex items-center justify-between text-[11px]"><span className={done === module.lessons.length ? 'text-[#c1acff]' : 'text-[#82958a]'}>{done === module.lessons.length ? 'Concluído' : active ? 'Próximo na trilha' : 'Disponível'}</span><ChevronRight size={15} className="text-[#71847a] transition-transform group-hover:translate-x-1 group-hover:text-[#a78bfa]" /></div></div>
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
  return <div className="rounded-xl border border-white/[.07] bg-[#12121a] p-4"><div className="flex items-center gap-2.5"><span className={`grid size-8 place-items-center rounded-lg ${colors[tone]}`}>{icon}</span><span className="text-xs text-[#8fa197]">{label}</span></div><p className="mt-3 truncate font-display text-lg font-medium tracking-[-.04em] text-[#e4ede6]">{value}</p><p className="mt-1 text-[10px] text-[#718479]">{note}</p></div>
}

function getReviewSchedule(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem('cripto-mentoria:review-schedule') ?? '{}') as Record<string, number> } catch { return {} }
}

function QuickReview() {
  const [schedule, setSchedule] = useState<Record<string, number>>(getReviewSchedule)
  const initialIndex = Math.max(0, reviewCards.findIndex((card) => !schedule[card.id] || schedule[card.id] <= Date.now()))
  const [index, setIndex] = useState(initialIndex)
  const [revealed, setRevealed] = useState(false)
  const current = reviewCards[index]
  const rate = (days: number) => {
    const updated = { ...schedule, [current.id]: Date.now() + days * 24 * 60 * 60 * 1000 }
    localStorage.setItem('cripto-mentoria:review-schedule', JSON.stringify(updated))
    setSchedule(updated)
    const nextDue = reviewCards.findIndex((card, cardIndex) => cardIndex !== index && (!updated[card.id] || updated[card.id] <= Date.now()))
    setIndex(nextDue >= 0 ? nextDue : (index + 1) % reviewCards.length)
    setRevealed(false)
  }
  return <section className="grid gap-4 rounded-xl border border-white/[.07] bg-[#12121a] p-5 sm:grid-cols-[1fr_.85fr] sm:items-center sm:p-6"><div><p className="eyebrow">revisão rápida · 2 min</p><h2 className="mt-2 font-display text-lg font-medium tracking-[-.035em] text-[#e4ede6]">Puxe uma ideia da memória.</h2><p className="mt-1 max-w-md text-xs leading-relaxed text-[#82958a]">Tente responder antes de revelar. Reveja o cartão amanhã ou em alguns dias.</p></div><div className="rounded-xl border border-[#98abff]/15 bg-[#98abff]/[.035] p-4"><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#9daeff]">pergunta</p><p className="mt-2 text-sm font-medium leading-relaxed text-[#dfe6f1]">{current.prompt}</p>{revealed ? <><p className="mt-3 border-t border-white/[.08] pt-3 text-xs leading-relaxed text-[#aab7c8]">{current.answer}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => rate(1)} className="rounded-full border border-white/[.1] px-3 py-2 text-[10px] text-[#9caeba] hover:bg-white/[.04]">Vou rever amanhã</button><button type="button" onClick={() => rate(3)} className="rounded-full bg-[#a78bfa] px-3 py-2 text-[10px] font-semibold text-[#09090d] hover:bg-[#c1acff]">Lembrei · rever em 3 dias</button></div></> : <button type="button" onClick={() => setRevealed(true)} className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-medium text-[#b2c0fd] hover:text-white">Revelar resposta <ArrowRight size={12} /></button>}</div></section>
}


