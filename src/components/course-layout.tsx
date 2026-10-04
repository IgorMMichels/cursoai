import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, ChevronRight, LayoutDashboard, LayoutGrid, LogOut, Map, PanelLeftClose, PanelLeftOpen, ShieldCheck, WalletCards, SlidersHorizontal } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Brand } from '@/components/brand'
import { ProfileSettings } from '@/components/profile-settings'
import { useSession } from '@/contexts/session-context'
import { hasActivePlan } from '@/components/guards'
import { allLessons, modules } from '@/lib/course'

export function CourseLayout() {
  const { user, completedLessons, signOut } = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const [pinned, setPinned] = useState(true)
  const [hovered, setHovered] = useState(false)
  const expanded = pinned || hovered
  // Modo preview: logado sem plano ativo. Só usa user/plan check;
  // nenhum dado de progresso é lido e nenhum fetch é disparado aqui.
  const isPreview = !hasActivePlan(user)
  const inJourneys = location.pathname.startsWith('/jornadas')
  const inPlatforms = location.pathname.startsWith('/plataformas')
  const inTools = location.pathname.startsWith('/curso/ferramentas') || location.pathname.startsWith('/curso/simulador')
  const legacyCompleted = allLessons.filter((lesson) => completedLessons.includes(lesson.id)).length
  const progress = Math.round((legacyCompleted / allLessons.length) * 100)
  const links = [
    { to: '/curso', label: 'Visão geral', icon: LayoutDashboard, end: true },
    { to: '/jornadas', label: 'Jornadas', icon: Map },
    { to: '/curso#modulos', label: 'Minha trilha', icon: BookOpen },
    { to: '/plataformas', label: 'Plataformas', icon: LayoutGrid },
    { to: '/curso/ferramentas', label: 'Ferramentas', icon: SlidersHorizontal },
    { to: '/curso/simulador', label: 'Simulador de trade', icon: SlidersHorizontal },
    { to: '/acesso', label: 'Como pagar', icon: WalletCards },
    { to: '/curso/seguranca', label: 'Central de segurança', icon: ShieldCheck },
  ]

  return <div className={`min-h-screen bg-[#09090d] lg:grid lg:h-[calc(100dvh-40px)] lg:min-h-0 lg:overflow-hidden ${pinned ? 'lg:grid-cols-[252px_minmax(0,1fr)]' : 'lg:grid-cols-[76px_minmax(0,1fr)]'}`}>
    <aside
      onMouseEnter={() => { if (!pinned) setHovered(true) }}
      onMouseLeave={() => setHovered(false)}
      className={`hidden border-r border-white/[.07] bg-[#0d0e14] lg:fixed lg:top-0 lg:bottom-10 lg:flex lg:h-[calc(100dvh-40px)] lg:flex-col lg:overflow-y-auto lg:overscroll-y-contain lg:z-30 transition-[width] duration-300 ${expanded ? 'lg:w-[252px]' : 'lg:w-[76px]'} ${hovered && !pinned ? 'shadow-[0_0_50px_rgba(0,0,0,.55)]' : ''}`}
    >
      <div className={`flex pt-6 pb-7 ${expanded ? 'items-center justify-between px-4' : 'flex-col items-center gap-3 px-0'}`}>
        <Brand compact={!expanded} />
        <button
          type="button"
          onClick={() => setPinned((value) => !value)}
          aria-expanded={expanded}
          aria-label={pinned ? 'Recolher barra lateral' : 'Fixar barra lateral'}
          title={pinned ? 'Recolher barra lateral' : 'Fixar barra lateral'}
          className="grid size-7 shrink-0 place-items-center rounded-lg border border-white/[.08] bg-white/[.02] text-[#8ea197] transition hover:bg-white/[.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a78bfa]"
        >
          {expanded ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
        </button>
      </div>
      <div className={expanded ? 'px-4' : 'px-2'}>
        {expanded
          ? <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[#687b70]">Aprender</p>
          : <div aria-hidden="true" className="mx-auto mb-3 h-px w-8 bg-white/10" />}
        <nav className="space-y-1" aria-label="Área do aluno">
          {links.map(({ to, label, icon: Icon, end }) => <NavLink key={label} to={to} end={end} title={!expanded ? label : undefined} aria-label={label} className={({ isActive }) => `group flex items-center gap-3 rounded-xl py-3 text-[13px] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a78bfa] ${expanded ? 'px-3' : 'justify-center px-0'} ${isActive ? 'bg-[#a78bfa]/[.12] text-white ring-1 ring-[#a78bfa]/25' : 'text-[#8ea197] hover:bg-white/[.05] hover:text-white'}`}><Icon size={17} strokeWidth={1.7} />{expanded && <span className="truncate">{label}</span>}</NavLink>)}
        </nav>
      </div>
      <div className={`mt-auto ${expanded ? 'p-4' : 'p-2'}`}>
        {!isPreview && expanded && <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex items-center justify-between text-xs"><span className="text-[#a4b5ab]">Cripto do Zero</span><span className="font-semibold text-[#a78bfa]">{progress}%</span></div><Progress value={progress} className="mt-3 h-1.5 bg-white/[.08] [&_[data-slot=progress-indicator]]:bg-[#a78bfa]" /><p className="mt-3 text-[11px] leading-relaxed text-[#788b80]">{legacyCompleted} de {allLessons.length} aulas marcadas como concluídas</p><NavLink to="/curso#modulos" className="mt-4 inline-flex items-center gap-1 text-xs text-[#b6a5f0] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a78bfa]">Continuar <ChevronRight size={14} /></NavLink></div>}
        <div className={`flex items-center gap-1 rounded-xl border border-white/[.045] bg-white/[.015] p-1 ${expanded ? 'mt-4' : 'mt-4 flex-col justify-center'}`}><ProfileSettings compact={!expanded} /><button type="button" onClick={() => { signOut(); navigate('/login') }} aria-label="Sair" title="Sair" className="grid size-9 shrink-0 place-items-center rounded-lg text-[#81948a] transition hover:bg-white/[.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a78bfa]"><LogOut size={15} /></button></div>
      </div>
    </aside>

    <div data-course-scroll className="min-w-0 lg:col-start-2 lg:h-[calc(100dvh-40px)] lg:overflow-y-auto lg:overscroll-y-contain">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-white/[.07] bg-[#09090d]/85 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
        <div className="lg:hidden"><Brand compact /></div>
        <div className="hidden items-center gap-2 text-xs text-[#7f9287] lg:flex"><span>Seu espaço de estudo</span><ChevronRight size={13} /><span className="text-[#c6d4cb]">{inTools ? 'Ferramentas' : inJourneys ? 'Jornadas' : inPlatforms ? 'Plataformas' : `${modules.length} módulos`}</span></div>
        <Link to="/curso/ferramentas" className="ml-3 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/[.08] px-2.5 text-[10px] text-[#c1acff] lg:hidden" aria-label="Ferramentas do curso"><SlidersHorizontal size={14} /><span className="hidden sm:inline">Ferramentas</span></Link>
        <div className="ml-auto flex items-center gap-3">{isPreview && <Link to="/planos" className="button-motion inline-flex min-h-9 items-center justify-center rounded-xl bg-[#b49cff] px-4 text-xs font-semibold text-[#100c19] hover:bg-[#c6b4ff]">Começar agora</Link>}<Link to="/jornadas" className="inline-flex min-h-9 items-center gap-1 rounded-full border border-white/[.08] px-3 text-[10px] text-[#c1acff] hover:bg-white/[.04] lg:hidden"><Map size={14} />Jornadas</Link><Link to="/plataformas" className="grid size-9 place-items-center rounded-full border border-white/[.08] text-[#c1acff] hover:bg-white/[.04] lg:hidden" aria-label="Plataformas"><LayoutGrid size={16} /></Link><Link to="/acesso" className="grid size-9 place-items-center rounded-full border border-white/[.08] text-[#c1acff] hover:bg-white/[.04]" aria-label="Como pagar"><WalletCards size={16} /></Link><ProfileSettings compact /></div>
      </header>
      <main className="mx-auto w-full max-w-[1450px] px-4 pb-20 pt-7 sm:px-7 sm:pt-9 lg:px-10"><Outlet /></main>
    </div>
  </div>
}
