import { translateUi, translateTemplate } from '@/lib/ui-translation'
import { HeaderLanguageSelect } from '@/components/header-language-select'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LocalizedLink as Link, useLocalizedNavigate as useNavigate } from '@/components/localized-router'
import { ArrowUpRight, ChevronDown, ChevronUp, Eye, LogIn, LogOut, Menu, Pencil, Play, Sparkles, X } from 'lucide-react'
import { Brand } from '@/components/brand'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession } from '@/contexts/session-context'
import { hasActivePlan } from '@/components/guards'
import { ProfileSettings } from '@/components/profile-settings'
import { FounderBadge } from '@/components/founder-badge'

function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return false
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return true
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const studentAreaLinks = [
  { label: 'Ver preview', description: 'Conheça a trilha por dentro', href: '/explorar', icon: Eye },
  { label: 'Entrar', description: 'Acesse com seu e-mail e senha', href: '/login', icon: LogIn },
  { label: 'Começar agora', description: 'Escolha seu tempo de acesso', href: '/planos', icon: Sparkles },
]

function StudentAreaDropdown() {
  useUiTranslation();
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open ])

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="dock-link inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-3.5 text-[11px] text-[#a7a2b1] transition-all hover:text-white"
      >
        {translateUi("Área do aluno")}<ChevronDown size={13} className={`transition-transform duration-300 ${open ? 'rotate-180 text-[#a78bfa]' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full -translate-x-1/2 pt-2.5">
          <div
            role="menu"
            aria-label={translateUi("Área do aluno")}
            className="w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#121219]/95 p-1.5 shadow-[0_24px_60px_rgba(0,0,0,.5)] backdrop-blur-xl"
            style={{ animation: 'dock-open .25s cubic-bezier(.16,1,.3,1) both' }}
          >
          {studentAreaLinks.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#a78bfa]/[.09]"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[.04] text-[#a78bfa] transition-colors group-hover:border-[#a78bfa]/30 group-hover:bg-[#a78bfa]/[.12]">
                <item.icon size={15} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-[#e8e4ee] group-hover:text-white">{translateUi(item.label)}</span>
                <span className="block truncate text-[10px] text-[#8b8793]">{translateUi(item.description)}</span>
              </span>
            </Link>
          ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileDropdown({ layout = 'desktop', onNavigate }: { layout?: 'desktop' | 'mobile'; onNavigate?: () => void }) {
  useUiTranslation();
  const { user, signOut } = useSession()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open ])

  const displayName = user?.name?.trim() || 'Aluno'
  const initial = displayName.slice(0, 1).toUpperCase() || 'A'
  const activePlan = hasActivePlan(user)
  const planStatus = activePlan ? 'Plano ativo' : 'Sem plano ativo'

  const handleNavigate = () => {
    setOpen(false)
    onNavigate?.()
  }

  const handleSignOut = () => {
    setOpen(false)
    onNavigate?.()
    signOut()
    navigate('/landing')
  }

  return (
    <div
      ref={rootRef}
      className={`relative ${layout === 'mobile' ? 'w-full' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {layout === 'desktop' ? (
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={translateUi(translateTemplate("Perfil de {{value0}}", [displayName]))}
          title={translateUi(displayName)}
          onClick={() => setOpen((value) => !value)}
          className="dock-login grid size-10 shrink-0 place-items-center rounded-full transition-all hover:-translate-y-0.5"
        >
          <Avatar className="size-10 border border-white/15 bg-[#211f2b] shadow-[0_0_18px_rgba(167,139,250,.25)] transition-shadow hover:shadow-[0_0_24px_rgba(167,139,250,.35)]">
            <AvatarImage src={user?.avatarUrl} alt={translateUi("")} className="object-cover" />
            <AvatarFallback className="bg-[#211f2b] font-display text-xs font-semibold text-[#cbbaff]">{translateUi(initial)}</AvatarFallback>
          </Avatar>
        </button>
      ) : (
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={translateUi(translateTemplate("Perfil de {{value0}}", [displayName]))}
          title={translateUi(displayName)}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#a78bfa]/[.09] hover:text-white"
        >
          <Avatar className="size-10 shrink-0 border border-white/15 bg-[#211f2b] shadow-[0_0_12px_rgba(167,139,250,.2)]">
            <AvatarImage src={user?.avatarUrl} alt={translateUi("")} className="object-cover" />
            <AvatarFallback className="bg-[#211f2b] font-display text-xs font-semibold text-[#cbbaff]">{translateUi(initial)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm text-[#e8e4ee]">{translateUi(displayName)}</span><span className="flex items-center gap-2"><span className="block text-[11px] text-[#8b8793]">{translateUi(planStatus)}</span>{user?.isFounder && <FounderBadge isFounder={user.isFounder} />}</span></span>
          <ChevronDown size={14} className={`shrink-0 text-[#8b8793] transition-transform duration-300 ${open ? 'rotate-180 text-[#a78bfa]' : ''}`} />
        </button>
      )}
      {open && (
        <div className={`absolute top-full z-50 pt-2.5 ${layout === 'desktop' ? 'left-1/2 -translate-x-1/2' : 'left-1/2 -translate-x-1/2'}`}>
          <div
            role="menu"
            aria-label={translateUi(translateTemplate("Perfil de {{value0}}", [displayName]))}
            className="w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#121219]/95 p-1.5 shadow-[0_24px_60px_rgba(0,0,0,.5)] backdrop-blur-xl"
            style={{ animation: 'dock-open .25s cubic-bezier(.16,1,.3,1) both' }}
          >
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <Avatar className="size-9 shrink-0 border border-white/15 bg-[#211f2b] shadow-[0_0_12px_rgba(167,139,250,.2)]">
                <AvatarImage src={user?.avatarUrl} alt={translateUi("")} className="object-cover" />
                <AvatarFallback className="bg-[#211f2b] font-display text-xs font-semibold text-[#cbbaff]">{translateUi(initial)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-[#e8e4ee]">{translateUi(displayName)}</span>
                <span className={`flex items-center gap-2 truncate text-[10px] ${activePlan ? 'text-[#8bd8b1]' : 'text-[#8b8793]'}`}><span>{translateUi(planStatus)}</span>{user?.isFounder && <FounderBadge isFounder={user.isFounder} />}</span>
              </span>
            </div>
            <div className="mx-2 my-1 border-t border-white/[.07]" />
            <Link
              to="/curso"
              role="menuitem"
              onClick={handleNavigate}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#a78bfa]/[.09]"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[.04] text-[#a78bfa] transition-colors group-hover:border-[#a78bfa]/30 group-hover:bg-[#a78bfa]/[.12]">
                <Pencil size={15} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-[#e8e4ee] group-hover:text-white">{translateUi("Editar informações de perfil")}</span>
                <span className="block truncate text-[10px] text-[#8b8793]">{translateUi("Nome, foto e dados")}</span>
              </span>
            </Link>
            {activePlan ? (
              <Link
                to="/curso"
                role="menuitem"
                onClick={handleNavigate}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#a78bfa]/[.09]"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[.04] text-[#a78bfa] transition-colors group-hover:border-[#a78bfa]/30 group-hover:bg-[#a78bfa]/[.12]">
                  <Play size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-[#e8e4ee] group-hover:text-white">{translateUi("Acessar o curso")}</span>
                  <span className="block truncate text-[10px] text-[#8b8793]">{translateUi("Continuar de onde parou")}</span>
                </span>
              </Link>
            ) : (
              <Link
                to="/curso"
                role="menuitem"
                onClick={handleNavigate}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#a78bfa]/[.09]"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[.04] text-[#a78bfa] transition-colors group-hover:border-[#a78bfa]/30 group-hover:bg-[#a78bfa]/[.12]">
                  <Eye size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-[#e8e4ee] group-hover:text-white">{translateUi("Ver meu preview")}</span>
                  <span className="block truncate text-[10px] text-[#8b8793]">{translateUi("Sua prévia da trilha")}</span>
                </span>
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#a78bfa]/[.09]"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[.04] text-[#a78bfa] transition-colors group-hover:border-[#a78bfa]/30 group-hover:bg-[#a78bfa]/[.12]">
                <LogOut size={15} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-[#e8e4ee] group-hover:text-white">{translateUi("Sair")}</span>
                <span className="block truncate text-[10px] text-[#8b8793]">{translateUi("Encerrar sessão")}</span>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function SiteHeader({ mode = 'site' }: { mode?: 'site' | 'affiliate' }) {
  useUiTranslation();
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { user, loading, signOut } = useSession()
  const isLogged = !loading && !!user
  const activePlan = isLogged && hasActivePlan(user)
  const affiliateMode = mode === 'affiliate'
  const landing = location.pathname === '/landing'
  const links = landing ? [{ label: 'O método', href: '#metodo' }, { label: 'A jornada', href: '#jornada' }, { label: 'Avaliações', href: '#avaliacoes' }, { label: 'Planos', href: '/planos' }, { label: 'Afiliados', href: '/afiliar' }] : [{ label: 'O método', href: '/landing#metodo' }, { label: 'A jornada', href: '/landing#jornada' }, { label: 'Avaliações', href: '/landing#avaliacoes' }, { label: 'Planos', href: '/planos' }, { label: 'Afiliados', href: '/afiliar' }]
  const handleAnchorClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      const id = href.slice(1)
      if (!id) return
      if (document.getElementById(id)) {
        event.preventDefault()
        setOpen(false)
        scrollToSection(id)
        window.history.pushState(null, '', href)
      }
      return
    }
    if (href === '/planos') {
      event.preventDefault()
      setOpen(false)
      navigate('/planos')
      return
    }
    if (href.startsWith('/landing#')) {
      const id = href.split('#')[1] ?? ''
      if (!id) return
      event.preventDefault()
      setOpen(false)
      if (location.pathname === '/landing') {
        if (scrollToSection(id)) window.history.pushState(null, '', `#${id}`)
        return
      }
      navigate({ pathname: '/landing', hash: `#${id}` })
    }
  }
  const affiliateLinks = [
    { label: 'Desempenho', href: '#desempenho' },
    { label: 'Recebimentos', href: '#recebimentos' },
    { label: 'Atividade', href: '#atividade' },
  ]
  return (
    <header className="site-header sticky top-0 z-40 px-3 pt-3">
      <div className={`page-shell header-dock flex h-16 items-center justify-between gap-3 px-3 sm:gap-5 sm:px-5 2xl:grid 2xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]`}>
        <div className="flex min-w-0 items-center gap-3 justify-self-start"><Brand className="min-w-0 whitespace-nowrap" />{affiliateMode && <span className="hidden border-l border-white/10 pl-3 text-[11px] text-[#898395] sm:block">{translateUi("Central de parcerias")}</span>}</div>
        <nav className="dock-navigation hidden items-center gap-1 2xl:flex" aria-label={translateUi(affiliateMode ? 'Navegação de afiliado' : 'Navegação principal')}>
          {affiliateMode ? <>
            {affiliateLinks.map((item) => <a key={item.href} href={item.href} onClick={(event) => handleAnchorClick(event, item.href)} aria-current={location.hash === item.href ? 'location' : undefined} className="dock-link inline-flex h-8 items-center justify-center rounded-full px-3 text-[11px] text-[#a7a2b1] transition-all hover:text-white">{translateUi(item.label)}</a>)}
            <Link to="/landing" className="dock-link inline-flex h-8 items-center justify-center rounded-full px-3 text-[11px] text-[#a7a2b1] transition-all hover:text-white">{translateUi("Voltar ao site")}</Link>
          </> : <>
            <Link to="/simulador" aria-current={location.pathname === '/simulador' ? 'page' : undefined} className="dock-link inline-flex h-8 items-center justify-center rounded-full px-3 text-[11px] text-[#c6b4ef] hover:text-white">{translateUi("Simulador")}</Link>
            <Link to="/ferramentas" aria-current={location.pathname.startsWith('/ferramentas') ? 'page' : undefined} className="dock-link inline-flex h-8 items-center justify-center rounded-full px-3 text-[11px] text-[#c6b4ef] transition-colors hover:text-white">{translateUi("Ferramentas")}</Link>
            <Link to="/radar" aria-current={location.pathname === '/radar' ? 'page' : undefined} className="dock-link inline-flex h-8 items-center justify-center rounded-full px-3 text-[11px] text-[#c6b4ef] transition-colors hover:text-white">{translateUi("SISMO")}</Link>
            {links.map((item) => <a key={item.label} href={item.href} onClick={(event) => handleAnchorClick(event, item.href)} className="dock-link inline-flex h-8 items-center justify-center rounded-full px-3 text-[11px] text-[#a7a2b1] transition-all hover:text-white">{translateUi(item.label)}</a>)}
            {!landing && <StudentAreaDropdown />}
          </>}
        </nav>
        <nav className="dock-navigation hidden min-w-0 items-center gap-1 xl:flex 2xl:hidden" aria-label={translateUi(affiliateMode ? 'Navegação de afiliado' : 'Navegação resumida')}>
          {affiliateMode ? <>
            {affiliateLinks.map((item) => <a key={item.href} href={item.href} onClick={(event) => handleAnchorClick(event, item.href)} className="dock-link inline-flex h-8 items-center justify-center rounded-full px-3 text-[11px] text-[#a7a2b1] transition-colors hover:text-white">{translateUi(item.label)}</a>)}
          </> : <>
            <Link to="/simulador" className="dock-link inline-flex h-8 items-center justify-center rounded-full px-3 text-[11px] text-[#c6b4ef] hover:text-white">{translateUi("Simulador")}</Link>
            <Link to="/ferramentas" className="dock-link inline-flex h-8 items-center justify-center rounded-full px-3 text-[11px] text-[#c6b4ef] hover:text-white">{translateUi("Ferramentas")}</Link>
            <Link to={landing ? '#jornada' : '/landing#jornada'} onClick={(event) => handleAnchorClick(event, landing ? '#jornada' : '/landing#jornada')} className="dock-link inline-flex h-8 items-center justify-center rounded-full px-3 text-[11px] text-[#a7a2b1] hover:text-white">{translateUi("A jornada")}</Link>
            <Link to="/planos" className="dock-link inline-flex h-8 items-center justify-center rounded-full px-3 text-[11px] text-[#a7a2b1] hover:text-white">{translateUi("Planos")}</Link>
          </>}
        </nav>
        <div className="hidden items-center justify-self-end gap-3 2xl:flex">
          <HeaderLanguageSelect />
          {affiliateMode ? <><ProfileSettings compact /><button type="button" onClick={() => { signOut(); navigate('/landing') }} className="grid size-10 place-items-center rounded-xl border border-white/[.08] text-[#9b96a5] transition hover:border-[#f28c9a]/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b49cff]" aria-label={translateUi("Sair da conta")} title={translateUi("Sair")}><LogOut size={15} /></button></> : landing ? (
            <><Link to="/login" className="dock-login inline-flex h-10 items-center justify-center px-3 text-xs text-[#b1abbc] hover:text-white">{translateUi("Entrar")}</Link><Link to="/explorar" className="button-motion dock-cta inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#a78bfa] px-4 text-xs font-semibold text-[#09090d] shadow-[0_0_25px_rgba(167,139,250,.18)] transition-all hover:-translate-y-0.5 hover:bg-[#c1acff]">{translateUi("Conhecer o curso")}<ArrowUpRight size={15} /></Link></>
          ) : isLogged ? (
            <>
              {activePlan ? (
                <Link to="/curso" className="button-motion dock-cta inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#a78bfa] px-4 text-xs font-semibold text-[#09090d] shadow-[0_0_25px_rgba(167,139,250,.18)] transition-all hover:-translate-y-0.5 hover:bg-[#c1acff]">{translateUi("Continuar")}<ArrowUpRight size={15} /></Link>
              ) : (
                <Link to="/planos" className="button-motion dock-cta inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#a78bfa] px-4 text-xs font-semibold text-[#09090d] shadow-[0_0_25px_rgba(167,139,250,.18)] transition-all hover:-translate-y-0.5 hover:bg-[#c1acff]">{translateUi("Ver planos")}<ArrowUpRight size={15} /></Link>
              )}
              <ProfileDropdown layout="desktop" />
            </>
          ) : (
            <>
              <Link to="/login" className="dock-login inline-flex h-10 items-center justify-center px-3 text-xs text-[#b1abbc] hover:text-white">{translateUi("Entrar")}</Link>
              <Link to="/planos" className="button-motion dock-cta inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#a78bfa] px-4 text-xs font-semibold text-[#09090d] shadow-[0_0_25px_rgba(167,139,250,.18)] transition-all hover:-translate-y-0.5 hover:bg-[#c1acff]">{translateUi(landing ? 'Começar agora' : 'Ver os planos')}<ArrowUpRight size={15} /></Link>
            </>
          )}
        </div>
        <button type="button" className="dock-menu grid size-10 place-items-center rounded-full border border-white/10 text-white 2xl:hidden" aria-label={translateUi(open ? 'Fechar menu' : 'Abrir menu')} aria-expanded={open} aria-controls="site-mobile-navigation" onClick={() => setOpen((value) => !value)}>{open ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
      {open && <nav id="site-mobile-navigation" className="site-mobile-nav absolute inset-x-3 top-[calc(100%+8px)] max-h-[calc(100dvh-130px)] overflow-y-auto rounded-2xl p-2 shadow-2xl 2xl:hidden" aria-label={translateUi(affiliateMode ? 'Navegação de afiliado' : 'Navegação móvel')}>
        {affiliateMode ? <>
          {affiliateLinks.map((item) => <a key={item.href} href={item.href} onClick={(event) => handleAnchorClick(event, item.href)} className="block rounded-xl px-3 py-3 text-sm text-[#c6b4ef] hover:bg-white/[.06]">{translateUi(item.label)}</a>)}
          <Link to="/landing" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-sm text-[#b1abbc] hover:bg-white/[.06]">{translateUi("Voltar ao site")}</Link>
          <div className="mt-2 border-t border-white/[.07] pt-2"><ProfileSettings compact /><button type="button" onClick={() => { setOpen(false); signOut(); navigate('/landing') }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#b1abbc] hover:bg-white/[.06] hover:text-white"><LogOut size={15} />{translateUi("Sair da conta")}</button></div>
        </> : <>
        <Link to="/simulador" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-sm text-[#c6b4ef] hover:bg-white/[.06]">{translateUi("Simulador de trade")}</Link>
        <Link to="/ferramentas" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-sm text-[#c6b4ef] hover:bg-white/[.06]">{translateUi("Ferramentas gratuitas")}</Link>
        <Link to="/radar" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-sm text-[#c6b4ef] hover:bg-white/[.06]">{translateUi("SISMO")}</Link>
        <Link to="/artigos" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-sm text-[#c6b4ef] hover:bg-white/[.06]">{translateUi("Artigos e conceitos")}</Link>
        <div className="mx-auto flex max-w-xl flex-col gap-1">{links.map((item) => <a key={item.label} href={item.href} onClick={(event) => handleAnchorClick(event, item.href)} className="rounded-xl px-3 py-3 text-sm text-[#b1beb7] transition-colors hover:bg-white/[.06] hover:text-white">{translateUi(item.label)}</a>)}
          {!landing && <><p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#8d839f]">{translateUi("Área do aluno")}</p>
          {studentAreaLinks.map((item) => <Link key={item.label} to={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#a78bfa]/[.09] hover:text-white"><span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[.04] text-[#a78bfa]"><item.icon size={15} /></span><span><span className="block text-sm text-[#e8e4ee]">{translateUi(item.label)}</span><span className="block text-[11px] text-[#8b8793]">{translateUi(item.description)}</span></span></Link>)}
          {isLogged ? (
            <>
              <Link
                to={activePlan ? '/curso' : '/planos'}
                onClick={() => setOpen(false)}
                className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#a78bfa] px-4 text-sm font-semibold text-[#09090d] transition-all hover:bg-[#c1acff]"
              >
                {translateUi(activePlan ? 'Continuar' : 'Ver planos')}<ArrowUpRight size={15} />
              </Link>
              <ProfileDropdown layout="mobile" onNavigate={() => setOpen(false)} />
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm text-[#b1beb7] transition-colors hover:bg-white/[.06] hover:text-white">{translateUi("Entrar na plataforma")}</Link>
          )}</>}{landing && <div className="mt-2 flex gap-2 border-t border-white/[.07] pt-3"><Link to="/login" onClick={() => setOpen(false)} className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/[.1] text-sm text-[#c8c2d2]">{translateUi("Entrar")}</Link><Link to="/explorar" onClick={() => setOpen(false)} className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#a78bfa] text-sm font-semibold text-[#09090d]">{translateUi("Conhecer o curso")}</Link></div>}</div>
        </>}
      </nav>}
    </header>
  )
}

export function SiteFooter() {
  useUiTranslation();
  const location = useLocation()
  const navigate = useNavigate()
  const handleFooterAnchor = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const id = href.slice(1)
    if (!id) return
    if (location.pathname === '/landing') {
      if (document.getElementById(id)) {
        event.preventDefault()
        scrollToSection(id)
        window.history.pushState(null, '', href)
      }
      return
    }
    event.preventDefault()
    navigate({ pathname: '/landing', hash: href })
  }
  return <footer className="site-footer">
    <div className="page-shell">
      <div className="footer-main">
        <div className="footer-identity">
          <div className="footer-brand-lockup"><Brand compact /><span>{translateUi("Omega")}</span></div>
          <p className="footer-tagline">{translateUi("Aprenda cripto com método e critério.")}</p>
        </div>
        <nav className="footer-links" aria-label={translateUi("Links do rodapé")}>
          <Link to="/ferramentas">{translateUi("Ferramentas")}</Link>
          <Link to="/artigos">{translateUi("Artigos")}</Link>
          <a href="#jornada" onClick={(event) => handleFooterAnchor(event, '#jornada')}>{translateUi("A trilha")}</a>
          <a href="#avaliacoes" onClick={(event) => handleFooterAnchor(event, '#avaliacoes')}>{translateUi("Avaliações")}</a>
          <Link to="/planos">{translateUi("Planos")}</Link>
          <Link to="/afiliar">{translateUi("Afiliados")}</Link>
        </nav>
        <Link to="/login" className="footer-cta">{translateUi("Acessar plataforma ")}<ArrowUpRight size={14} /></Link>
      </div>

      <div className="footer-bottomline">
        <span>© {translateUi(new Date().getFullYear())} {translateUi(" Omega")}</span>
        <span>{translateUi("Criptoativos envolvem risco de perda.")}</span>
        <a href="#top" onClick={(event) => { event.preventDefault(); scrollToTop() }}>{translateUi("Voltar ao topo ")}<ChevronUp size={14} /></a>
      </div>
    </div>
  </footer>
}

