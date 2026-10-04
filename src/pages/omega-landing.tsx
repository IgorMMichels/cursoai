import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUpRight, AudioLines, BookOpen, Check, Pause, Play, Plus, Shield, Activity } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { SiteFooter, SiteHeader } from '@/components/site-header'
import { OmegaSymbol } from '@/components/brand'
import { CourseOutline } from '@/components/course-outline'
import { WalletGuideSection } from '@/components/wallet-guides'
import { ReviewsSection } from '@/components/ui/reviews-section'
import { PageMeta } from '@/components/tools/page-meta'
import { OmegaPlans } from '@/components/omega-plans'
import { allLessons, modules } from '@/lib/course'
import journeys from '@/lib/generated/journeys.json'
import '@/styles/landing.css'

const AsciiModelViewer = lazy(() => import('@/components/ui/3d-ascii-model-viewer'))
const lessonCount = allLessons.length + journeys.reduce((sum, journey) => sum + journey.modules.reduce((n, m) => n + m.lessons.length, 0), 0)
const moduleCount = modules.length + journeys.reduce((sum, journey) => sum + journey.modules.length, 0)
const method = [
  { icon: BookOpen, title: 'Entenda a tese', copy: 'Que problema existe e que evidência sustenta a ideia?' },
  { icon: Shield, title: 'Meça o risco', copy: 'Quanto pode oscilar, falhar ou ficar sem liquidez?' },
  { icon: Activity, title: 'Defina seu limite', copy: 'O que faria você entrar, esperar ou mudar de ideia?' },
]
const faq = [
  ['Este curso promete que vou ganhar dinheiro?', 'Não. Ele ensina conceitos, pesquisa e organização de risco. O mercado pode gerar perdas, inclusive perda total do capital.'],
  ['Preciso saber programar ou já ter cripto?', 'Não. A trilha começa pelos fundamentos e explica termos antes de avançar. Você pode concluir tudo sem comprar ativos.'],
  ['O que quer dizer acesso vitalício?', 'Acesso sem prazo de expiração ao material desta trilha.'],
  ['Como funciona o plano de afiliados?', 'Cliques e cadastros ficam ligados ao seu código. Comissão só após confirmação do pagamento.'],
]

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .08 }} transition={{ duration: .45, ease: [.16, 1, .3, 1] }}>{children}</motion.div>
}

function HeroVisual() {
  const reduce = useReducedMotion()
  const [animated, setAnimated] = useState(false)
  const [paused, setPaused] = useState(false)
  return <div className="omega-hero-art">
    <div className="omega-art-frame" aria-hidden="true">
      {animated && !reduce ? <Suspense fallback={<OmegaSymbol className="omega-hero-symbol" />}><AsciiModelViewer className="omega-hero-ascii" paused={paused} /></Suspense> : <OmegaSymbol className="omega-hero-symbol" />}
    </div>
    <div className="omega-art-caption"><span>Conhecimento em movimento.</span>{!reduce && <button type="button" onClick={() => { if (!animated) setAnimated(true); else setPaused(!paused) }} aria-pressed={animated && !paused} aria-label={!animated ? 'Explorar símbolo em ASCII 3D' : paused ? 'Retomar animação ASCII' : 'Pausar animação ASCII'}>{animated && !paused ? <Pause size={14} /> : <Play size={14} />}{!animated ? 'Explorar em ASCII' : paused ? 'Retomar' : 'Pausar'}</button>}</div>
  </div>
}

export function LandingPage() {
  const location = useLocation()
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!location.hash) return
    const frame = requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth' }))
    return () => cancelAnimationFrame(frame)
  }, [location.hash, reduce])
  return <div className="omega-public omega-landing" id="top">
    <PageMeta title="Aprenda cripto com critério" description="Aulas narradas, exercícios e segurança em cada etapa. Conheça as jornadas de cripto, futuros, memecoins e trading da Ômega." path="/landing" />
    <SiteHeader />
    <main id="conteudo">
      <section className="omega-hero" aria-labelledby="omega-hero-title">
        <div className="page-shell omega-hero-layout">
          <Reveal className="omega-hero-copy">
            <p className="omega-kicker">Aprender é construir critério.</p>
            <h1 id="omega-hero-title">Entenda cripto.<br /><span>Decida com critério.</span></h1>
            <p className="omega-hero-description">Aulas narradas, exercícios e segurança em cada etapa. Dos fundamentos ao seu próprio processo.</p>
            <div className="omega-actions"><Link className="omega-button" to="/login?mode=signup">Criar minha conta <ArrowUpRight size={17} /></Link><a href="#jornada" className="omega-text-link">Conhecer as jornadas <ArrowDown size={16} /></a></div>
          </Reveal>
          <HeroVisual />
        </div>
        <dl className="page-shell omega-course-facts">
          <div><dt>jornadas de aprendizado</dt><dd>{journeys.length + 1}</dd></div>
          <div><dt>aulas narradas</dt><dd>{lessonCount}</dd></div>
          <div><dt>módulos com quiz</dt><dd>{moduleCount}</dd></div>
          <div className="omega-fact-note"><dt className="sr-only">Estudo e segurança</dt><dd><Shield size={18} /><span>Estude sem comprar cripto.<br />Nenhuma promessa de lucro.</span></dd></div>
        </dl>
      </section>

      <section id="metodo" className="omega-section omega-method" aria-labelledby="method-title">
        <div className="page-shell omega-method-layout">
          <Reveal><h2 id="method-title">Fundamentos antes<br />de decisões.</h2><p className="omega-section-intro">Mercado mistura dado, opinião e ruído. Organize as perguntas antes de escolher o próximo passo.</p><div className="omega-method-list">{method.map(({ icon: Icon, title, copy }) => <article key={title}><Icon size={21} strokeWidth={1.5} /><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></Reveal>
          <Reveal className="omega-method-note"><BookOpen size={28} strokeWidth={1.3} /><p className="omega-note-title">Da base à decisão.</p><ol><li><strong>Fundamentos</strong><span>Redes, ativos e o que existe por trás do ticker.</span></li><li><strong>Segurança</strong><span>Custódia, permissões e limites de exposição.</span></li><li><strong>Processo</strong><span>Pesquisa, prática e um plano que você pode revisar.</span></li></ol><Link to="/explorar" className="omega-text-link">Veja como é estudar aqui <ArrowRight size={16} /></Link></Reveal>
        </div>
      </section>

      <section id="jornada" className="omega-section omega-catalog" aria-labelledby="catalog-title">
        <div className="page-shell">
          <Reveal className="omega-section-heading"><p className="omega-kicker">Sua próxima jornada</p><h2 id="catalog-title">Uma base. Vários caminhos.</h2><p className="omega-section-intro">Bitcoin é o ponto de partida. Avance para redes, custódia, DeFi, futuros e análise de mercado.</p></Reveal>
          <div className="omega-journey-grid">
            <Link to="/explorar" className="omega-journey-card omega-journey-foundations"><div className="omega-journey-image omega-foundation-image"><img src="/coin-icons/btc.svg" alt="" width="80" height="80" loading="lazy" /></div><div className="omega-journey-copy"><h3>Cripto do Zero</h3><p>Fundamentos, carteiras e pesquisa de projetos.</p><span>{allLessons.length} aulas <ArrowUpRight size={17} /></span></div></Link>
            {journeys.map((journey) => <Link key={journey.id} to="/explorar" className="omega-journey-card"><div className="omega-journey-image"><img src={journey.coverUrl} alt="" width="600" height="360" loading="lazy" /></div><div className="omega-journey-copy"><h3>{journey.title.replace('Jornada de ', '').replace('Jornada ', '')}</h3><p>{journey.shortDesc}</p><span>{journey.modules.reduce((sum, m) => sum + m.lessons.length, 0)} aulas <ArrowUpRight size={17} /></span></div></Link>)}
          </div>
          <div className="omega-outline-layout"><div><h3>Comece pelos fundamentos.</h3><p>Explore o conteúdo da trilha Cripto do Zero, módulo por módulo.</p><div className="omega-study-details"><span><AudioLines size={16} />Áudio e transcrição</span><span><Check size={16} />Exercícios e quizzes</span></div></div><CourseOutline /></div>
        </div>
      </section>

      <section className="omega-section omega-practice" aria-labelledby="practice-title"><div className="page-shell">
        <Reveal className="omega-section-heading"><h2 id="practice-title">Aprenda testando,<br /><span>não apostando.</span></h2><p className="omega-section-intro">Atividades com cenários fictícios ajudam a transformar conceitos em decisões mais cuidadosas.</p></Reveal>
        <div className="omega-practice-layout"><Link to="/curso/aula/m3/m3l1" className="omega-practice-feature"><BookOpen size={25} /><h3>Investigue uma tese.</h3><p>Compare um projeto fictício por utilidade, oferta, liquidez e evidências.</p><span className="omega-text-link">Acessar atividade <ArrowUpRight size={17} /></span><div className="omega-practice-watermark" aria-hidden="true"><OmegaSymbol /></div></Link><div className="omega-practice-side"><Link to="/curso/aula/m4/m4l1"><Activity size={23} /><h3>Simule uma queda.</h3><p>Veja como oscilações hipotéticas alteram um saldo definido por você.</p><span>Acessar atividade <ArrowUpRight size={16} /></span></Link><Link to="/curso/seguranca"><Shield size={23} /><h3>Revise sua proteção.</h3><p>Confira acesso, permissões, cópias de segurança e resposta a incidentes.</p><span>Acessar checklist <ArrowUpRight size={16} /></span></Link></div></div>
      </div></section>

      <WalletGuideSection />
      <ReviewsSection />

      <OmegaPlans />

      <section className="omega-section omega-faq" aria-labelledby="faq-title"><div className="page-shell omega-faq-layout"><div><h2 id="faq-title">Antes de começar.</h2><p className="omega-section-intro">Conteúdo, acesso e próximos passos. Respostas diretas para você decidir.</p><Link to="/afiliar" className="omega-text-link">Conhecer o programa de afiliados <ArrowRight size={16} /></Link></div><div>{faq.map(([q, a]) => <details key={q}><summary>{q}<Plus size={18} /></summary><p>{a}</p></details>)}</div></div></section>
    </main>
    <SiteFooter />
  </div>
}
