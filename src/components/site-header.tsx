import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, ChevronUp, Menu, X } from 'lucide-react'
import { Brand } from '@/components/brand'

export function SiteHeader() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const landing = location.pathname === '/landing'
  const links = landing ? [{ label: 'A jornada', href: '#jornada' }, { label: 'Avaliações', href: '#avaliacoes' }, { label: 'Planos', href: '#planos' }] : [{ label: 'O método', href: '/landing#jornada' }, { label: 'Avaliações', href: '/landing#avaliacoes' }, { label: 'Planos', href: '/landing#planos' }]
  return (
    <header className="site-header sticky top-0 z-40 px-3 pt-3">
      <div className="page-shell header-dock flex h-16 items-center justify-between gap-3 px-3 sm:gap-5 sm:px-5">
        <Brand />
        <nav className="dock-navigation hidden items-center gap-1 md:flex" aria-label="Navegação principal">
          {links.map((item) => <a key={item.label} href={item.href} className="dock-link rounded-full px-3.5 py-2 text-[11px] text-[#a7a2b1] transition-all hover:text-white">{item.label}</a>)}
        </nav>
        <div className="hidden items-center gap-3 sm:flex">
          <Link to="/login" className="dock-login inline-flex px-2 py-2 text-xs text-[#b1abbc] hover:text-white">Entrar</Link>
          <Link to={landing ? '/login' : '/landing#planos'} className="button-motion dock-cta inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#a78bfa] px-4 text-xs font-semibold text-[#09090d] shadow-[0_0_25px_rgba(167,139,250,.18)] transition-all hover:-translate-y-0.5 hover:bg-[#c1acff]">{landing ? 'Começar agora' : 'Ver os planos'}<ArrowUpRight size={15} /></Link>
        </div>
        <button type="button" className="dock-menu grid size-10 place-items-center rounded-full border border-white/10 text-white sm:hidden" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen((value) => !value)}>{open ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
      {open && <nav className="site-mobile-nav absolute inset-x-3 top-[calc(100%+8px)] rounded-2xl p-2 shadow-2xl sm:hidden" aria-label="Navegação móvel">
        <div className="mx-auto flex max-w-xl flex-col gap-1">{links.map((item) => <a key={item.label} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm text-[#b1beb7] transition-colors hover:bg-white/[.06] hover:text-white">{item.label}</a>)}<Link to="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm text-[#b1beb7] transition-colors hover:bg-white/[.06] hover:text-white">Entrar na plataforma</Link></div>
      </nav>}
    </header>
  )
}

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-footer-frame page-shell">
      <section className="footer-invite" aria-labelledby="footer-invite-title">
        <div className="footer-invite-content">
          <p className="eyebrow">criptoativos, com método e contexto</p>
          <h2 id="footer-invite-title">Aprenda a decidir com mais critério.</h2>
          <p className="footer-invite-copy">Fundamentos, segurança, DeFi e futuros para entender o mercado cripto e seus riscos.</p>
          <div className="footer-actions">
            <a href="#jornada" className="button-motion footer-action-primary">Conhecer a trilha <ArrowUpRight size={15} /></a>
            <Link to="/login" className="button-motion footer-action-secondary">Acessar plataforma</Link>
          </div>
        </div>
      </section>

      <div className="footer-details">
        <div className="footer-brand-lockup"><Brand compact /><span>Cripto do Zero</span></div>
        <p className="footer-disclaimer">Educação para entender o mercado e proteger suas decisões.<br />Criptoativos envolvem risco de perda.</p>
        <nav className="footer-links" aria-label="Links do rodapé">
          <a href="#jornada">A trilha</a>
          <a href="#avaliacoes">Avaliações</a>
          <a href="#planos">Planos</a>
          <Link to="/afiliado">Afiliados</Link>
        </nav>
      </div>

      <div className="footer-bottomline">
        <span>© {new Date().getFullYear()} Cripto do Zero</span>
        <span>Conteúdo educacional. Não é recomendação de investimento.</span>
        <a href="#top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Voltar ao topo <ChevronUp size={14} /></a>
      </div>
    </div>
  </footer>
}


