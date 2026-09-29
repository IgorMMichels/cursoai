import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BookOpen, ChevronRight, CircleHelp, LayoutDashboard, LogOut, ShieldCheck, Sparkles } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Brand } from '@/components/brand'
import { useSession, planTitle } from '@/contexts/session-context'
import { allLessons, modules } from '@/lib/course'

export function CourseLayout() {
  const { user, completedLessons, signOut } = useSession()
  const navigate = useNavigate()
  const progress = Math.round((completedLessons.length / allLessons.length) * 100)
  const links = [
    { to: '/curso', label: 'Visão geral', icon: LayoutDashboard, end: true },
    { to: '/curso#modulos', label: 'Minha trilha', icon: BookOpen },
    { to: '/curso/seguranca', label: 'Central de segurança', icon: ShieldCheck },
  ]

  return <div className="min-h-screen bg-[#09090d] lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
    <aside className="hidden border-r border-white/[.07] bg-[#0d0e14] lg:fixed lg:inset-y-0 lg:flex lg:w-[252px] lg:flex-col">
      <div className="px-6 pb-7 pt-6"><Brand /></div>
      <div className="px-4"><p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[#687b70]">Aprender</p><nav className="space-y-1" aria-label="Área do aluno">
        {links.map(({ to, label, icon: Icon, end }) => <NavLink key={label} to={to} end={end} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] transition-colors ${isActive ? 'bg-[#a78bfa]/[.1] text-[#e6dcff]' : 'text-[#8ea197] hover:bg-white/[.04] hover:text-white'}`}><Icon size={17} strokeWidth={1.7} />{label}</NavLink>)}
      </nav></div>
      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex items-center justify-between text-xs"><span className="text-[#a4b5ab]">Sua trilha</span><span className="font-semibold text-[#a78bfa]">{progress}%</span></div><Progress value={progress} className="mt-3 h-1.5 bg-white/[.08] [&_[data-slot=progress-indicator]]:bg-[#a78bfa]" /><p className="mt-3 text-[11px] leading-relaxed text-[#788b80]">{completedLessons.length} de {allLessons.length} aulas marcadas como concluídas</p><NavLink to="/curso#modulos" className="mt-4 inline-flex items-center gap-1 text-xs text-[#b6a5f0] hover:text-white">Continuar <ChevronRight size={14} /></NavLink></div>
        <div className="mt-4 flex items-center gap-3 rounded-xl p-2"><div className="grid size-9 shrink-0 place-items-center rounded-full border border-[#a78bfa]/20 bg-[#a78bfa]/[.09] font-display text-xs font-semibold text-[#b49cff]">{user?.name.slice(0, 1)}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-[#dae4dd]">{user?.name}</p><p className="mt-1 truncate text-[10px] text-[#7f9287]">{planTitle(user?.plan ?? 'demo')} · demonstração</p></div><button type="button" onClick={() => { signOut(); navigate('/login') }} aria-label="Sair" className="grid size-8 place-items-center rounded-lg text-[#81948a] hover:bg-white/5 hover:text-white"><LogOut size={15} /></button></div>
      </div>
    </aside>

    <div className="min-w-0 lg:col-start-2">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-white/[.07] bg-[#09090d]/85 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
        <div className="lg:hidden"><Brand compact /></div>
        <div className="hidden items-center gap-2 text-xs text-[#7f9287] lg:flex"><span>Seu espaço de estudo</span><ChevronRight size={13} /><span className="text-[#c6d4cb]">{modules.length} módulos</span></div>
        <div className="ml-auto flex items-center gap-3"><span className="hidden rounded-full border border-[#a78bfa]/15 bg-[#a78bfa]/[.05] px-3 py-1.5 text-[10px] font-medium text-[#c1acff] sm:inline-flex"><Sparkles size={12} className="mr-1.5" />MODO DEMONSTRAÇÃO</span><button type="button" className="grid size-9 place-items-center rounded-full border border-white/[.08] text-[#a4b6ab] hover:bg-white/[.04]" aria-label="Ajuda"><CircleHelp size={16} /></button><div className="grid size-8 place-items-center rounded-full bg-[#1c2c25] font-display text-xs font-semibold text-[#d2c4ff]">{user?.name.slice(0, 1)}</div></div>
      </header>
      <main className="mx-auto w-full max-w-[1450px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10"><Outlet /></main>
    </div>
  </div>
}


