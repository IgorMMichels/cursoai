import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, CandlestickChart, Check, Clock3, LineChart, Rocket } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Progress } from '@/components/ui/progress'
import { PlatformGuides } from '@/components/platform-guides'
import { useSession } from '@/contexts/session-context'
import { journeyLessons, journeyProgress, journeyStatus, loadJourneys, nextLesson, type Journey } from '@/lib/journeys'

const icons: Record<string, typeof BookOpen> = { BookOpen, Rocket, CandlestickChart, LineChart }
const colors: Record<string, string> = { mint: '#a78bfa', blue: '#98abff', lilac: '#bba3ff' }
const levels: Record<string, string> = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' }

export function JourneysPage() {
  const { journeyId } = useParams()
  const { completedLessons } = useSession()
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    loadJourneys().then((items) => { if (active) setJourneys(items) }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar jornadas.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  if (loading) return <p role="status" className="text-sm text-[#8ea197]">Carregando jornadas…</p>
  if (error) return <p role="alert" className="rounded-xl border border-rose-300/20 p-5 text-sm text-rose-200">{error}</p>

  const catalogOnly = journeys.some((item) => item.catalogOnly)
  const catalogNotice = catalogOnly ? <p role="status" className="mb-6 rounded-xl border border-amber-300/20 bg-amber-300/[.04] p-4 text-xs leading-relaxed text-amber-100">Catálogo disponível. Aulas e progresso destas jornadas serão liberados em breve.</p> : null

  if (journeyId) {
    const journey = journeys.find((item) => item.id === journeyId)
    if (!journey) return <div><Link to="/jornadas" className="text-xs text-[#b49cff]">Voltar às jornadas</Link><p className="mt-6 text-sm text-[#aebbb1]">Jornada indisponível.</p></div>
    const Icon = icons[journey.icon] ?? BookOpen
    const progress = journeyProgress(journey, completedLessons)
    const next = nextLesson(journey, completedLessons)
    const first = journeyLessons(journey)[0]
    const target = next ?? first
    const currentId = next?.id
    return <div className="mx-auto max-w-[1050px]">
      <Link to="/jornadas" className="inline-flex min-h-11 items-center gap-2 text-xs text-[#91a398] hover:text-white"><ArrowLeft size={15} />Todas as jornadas</Link>
      <div className="mt-5">{catalogNotice}</div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-white/[.07] bg-[#0d0e14]">
        <div className="relative isolate flex min-h-[300px] items-end overflow-hidden p-6 sm:min-h-[360px] sm:p-9">
          {journey.coverUrl && <img src={journey.coverUrl} alt={`${journey.title}: estudante analisando gráficos e materiais de estudo`} className="absolute inset-0 -z-20 size-full object-cover object-center" />}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#090a10]/95 via-[#090a10]/75 to-[#090a10]/20" />
          <div className="w-full max-w-3xl">
            <span className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-black/25" style={{ color: colors[journey.color] ?? colors.mint }}><Icon size={25} /></span>
            <span className="mt-5 block text-[10px] font-semibold uppercase tracking-[.15em] text-[#c0c9c2]">{levels[journey.level]}</span>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-[-.05em] text-white sm:text-5xl">{journey.title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#d0d8d2]">{journey.longDesc}</p>
          </div>
        </div>
        {!journey.catalogOnly && <div className="flex flex-wrap items-end justify-between gap-5 border-t border-white/[.07] p-6 sm:p-9"><div className="w-full max-w-sm"><div className="flex justify-between text-xs text-[#aebcb2]"><span>Seu progresso</span><strong>{progress}%</strong></div><Progress value={progress} className="mt-3 h-2 bg-white/[.08]" /></div>{target && <Link to={`/jornadas/${journey.id}/aula/${target.moduleId}/${target.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#a78bfa] px-5 text-xs font-semibold text-[#09090d] hover:bg-[#c1acff]">{progress === 100 ? 'Revisar' : progress === 0 ? 'Começar' : 'Continuar jornada'}<ArrowRight size={15} /></Link>}</div>}
      </div>
      <PlatformGuides journeyId={journey.id} />
      <div className="mt-8 space-y-4">{journey.modules.map((module) => {
        const done = module.lessons.filter((lesson) => completedLessons.includes(lesson.id)).length
        return <section key={module.id} className="rounded-xl border border-white/[.07] bg-[#12121a] p-5 sm:p-6"><div className="flex flex-wrap items-start gap-4"><span className="font-display text-xl text-[#a78bfa]">{module.number}</span><div className="min-w-0 flex-1"><h2 className="font-display text-xl text-[#e7eee8]">{module.title}</h2>{module.subtitle && <p className="mt-1 text-xs text-[#84978b]">{module.subtitle}</p>}</div><span className="text-xs text-[#8fa197]">{journey.catalogOnly ? `${module.lessons.length} aulas` : `${done}/${module.lessons.length} · ${module.duration}`}</span></div><div className="mt-5 space-y-2">{module.lessons.map((lesson, index) => journey.catalogOnly ? <div key={lesson.id} className="flex min-h-12 items-center gap-3 rounded-lg border border-white/[.05] bg-white/[.015] px-3 py-2 text-xs"><span className="grid size-6 shrink-0 place-items-center rounded-full border border-white/[.12] text-[10px] text-[#a8b5ab]">{index + 1}</span><span className="min-w-0 flex-1 text-[#9ead9f]">{lesson.title}</span><span className="text-[#788a7e]">{lesson.duration}</span></div> : <Link key={lesson.id} to={`/jornadas/${journey.id}/aula/${module.id}/${lesson.id}`} className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 text-xs transition-colors hover:border-[#a78bfa]/30 ${currentId === lesson.id ? 'border-[#a78bfa]/25 bg-[#a78bfa]/[.06]' : 'border-white/[.05] bg-white/[.015]'}`}><span className="grid size-6 shrink-0 place-items-center rounded-full border border-white/[.12] text-[10px] text-[#a8b5ab]">{completedLessons.includes(lesson.id) ? <Check size={13} className="text-[#a78bfa]" /> : index + 1}</span><span className="min-w-0 flex-1 text-[#c5d1c8]">{lesson.title}</span><span className="inline-flex items-center gap-1 text-[#788a7e]"><Clock3 size={12} />{lesson.duration}</span><ArrowRight size={13} className="text-[#9b89cb]" /></Link>)}</div>{!journey.catalogOnly && <Link to={`/jornadas/${journey.id}/modulo/${module.id}`} className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs text-[#b49cff]">Revisão do módulo <ArrowRight size={14} /></Link>}</section>
      })}</div>
    </div>
  }
  return <div><div className="mb-8"><p className="eyebrow">Seu espaço de estudo</p><h1 className="mt-2 font-display text-4xl font-medium tracking-[-.05em] text-[#eaf2ec]">Jornadas</h1><p className="mt-3 text-sm text-[#8fa197]">Escolha tema, avance no seu ritmo e acompanhe cada progresso.</p></div>{catalogNotice}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{journeys.map((journey) => {
    const Icon = icons[journey.icon] ?? BookOpen
    const progress = journeyProgress(journey, completedLessons)
    const status = journeyStatus(journey, completedLessons)
    const lessons = journeyLessons(journey)
    return <article key={journey.id} className="flex flex-col overflow-hidden rounded-2xl border border-white/[.07] bg-[#0d0e14]"><div className="relative aspect-[16/9] overflow-hidden bg-[#13141b]">{journey.coverUrl ? <img src={journey.coverUrl} alt={`${journey.title}: estudante estudando análise de mercado`} loading="lazy" className="size-full object-cover object-center transition-transform duration-500 hover:scale-[1.03]" /> : <div className="grid size-full place-items-center" aria-hidden="true"><Icon size={32} className="text-[#a78bfa]" /></div>}<div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0d0e14]/70 to-transparent" /></div><div className="flex flex-1 flex-col p-6"><h2 className="font-display text-xl font-medium text-[#eaf2ec]">{journey.title}</h2><p className="mt-2 min-h-12 text-xs leading-relaxed text-[#8fa197]">{journey.shortDesc}</p><div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-[#a3b1a7]"><span className="rounded-full border border-white/[.09] px-2.5 py-1">{levels[journey.level]}</span><span>{journey.modules.length} módulos · {lessons.length} aulas</span></div><div className="mt-auto pt-7">{!journey.catalogOnly && <div className="flex justify-between text-[10px] text-[#9dac9f]"><span>Progresso</span><span>{progress}%</span></div>}{!journey.catalogOnly && <Progress value={progress} className="mt-2 h-1.5 bg-white/[.08]" />}<Link to={`/jornadas/${journey.id}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#a78bfa]/25 bg-[#a78bfa]/[.08] px-4 text-xs font-semibold text-[#c9b7ff] hover:bg-[#a78bfa]/[.15]">{journey.catalogOnly ? 'Ver jornada' : status === 'completed' ? 'Revisar' : status === 'in-progress' ? 'Continuar jornada' : 'Começar'}<ArrowRight size={15} /></Link></div></div></article>
  })}</div></div>
}
