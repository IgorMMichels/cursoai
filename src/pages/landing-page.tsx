import { translateUi } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ReviewsSection } from '@/components/ui/reviews-section'
import { AmbientShader } from '@/components/ui/ambient-shader'
import { GlowCard } from '@/components/ui/spotlight-card'
import { usePlatformEntryActive } from '@/contexts/platform-entry-context'
import { Activity, ArrowDown, ArrowRight, ArrowUpRight, AudioLines, BookOpen, Check, FingerprintPattern, KeyRound, Plus, Shield } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { LocalizedLink as Link } from '@/components/localized-router'
import { SiteFooter, SiteHeader } from '@/components/site-header'
import { plans } from '@/lib/offers'
import { WalletGuideSection } from '@/components/wallet-guides'
import { CourseOutline } from '@/components/course-outline'
import { omegaCopy } from '@/lib/omega-copy'
import { useLocalization } from '@/contexts/localization-context'
import { getPlanIdsForMarket } from '@/lib/regional-offers'
import { PlanPaymentOptions } from '@/components/plan-payment-options'
import { PageMeta } from '@/components/tools/page-meta'
import { SourceLanguageNotice } from '@/components/source-language-notice'
import { allLessons, modules } from '@/lib/course'
import localJourneys from '@/lib/generated/journeys.json'
import '@/styles/landing.css'

const HeroWebGLShader = lazy(() => import('@/components/ui/hero-webgl-shader'))
const AsciiModelViewer = lazy(() => import('@/components/ui/3d-ascii-model-viewer'))

const journeyModuleCount = localJourneys.reduce((total, journey) => total + journey.modules.length, 0)
const journeyLessonCount = localJourneys.reduce(
  (total, journey) => total + journey.modules.reduce((moduleTotal, module) => moduleTotal + module.lessons.length, 0),
  0,
)
const TOTAL_JOURNEYS = localJourneys.length + 1
const TOTAL_MODULES = journeyModuleCount + modules.length
const TOTAL_LESSONS = journeyLessonCount + allLessons.length

const heroContentReveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut', delay: 0.08, staggerChildren: 0.08 } },
}
const heroItemReveal: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}
const sectionReveal: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
}
const cardReveal: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}
const methodSteps = [
  { number: '01', title: 'Entenda a tese', detail: 'Que problema existe e que evidência sustenta a ideia?' },
  { number: '02', title: 'Meça o risco', detail: 'Quanto pode oscilar, falhar ou ficar sem liquidez?' },
  { number: '03', title: 'Defina seu limite', detail: 'O que faria você entrar, esperar ou mudar de ideia?' },
]

export function LandingPage() {
  useUiTranslation();
  const entryActive = usePlatformEntryActive()
  const { locale, market, regionalOffers, marketLoading, pricingError } = useLocalization()
  const location = useLocation()
  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.slice(1)
    if (!id) return
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(id)
      if (!target) return
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [location.hash, location.pathname])
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest?.('a[href^="#"]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      const href = anchor.getAttribute('href') ?? ''
      if (!href.startsWith('#') || href.length < 2) return
      const target = document.getElementById(href.slice(1))
      if (!target) return
      event.preventDefault()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.pushState(null, '', href)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
  return <div className="min-h-screen overflow-x-clip bg-[#09090d] pb-10 text-[#e6eee9]">
    <PageMeta title={translateUi("Curso de criptoativos e ferramentas gratuitas")} description={translateUi("Aprenda criptoativos com jornadas práticas, aulas narradas e ferramentas gratuitas para estudar risco, Bitcoin, DeFi e mercado.")} path="/landing" />
    <SiteHeader />
    <main className="w-full max-w-full overflow-x-hidden">
      <section className="relative isolate overflow-hidden border-b border-white/[.04]">
        {!entryActive && <Suspense fallback={null}>
          <HeroWebGLShader />
        </Suspense>}
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,13,.18)_0%,rgba(9,9,13,0)_32%,rgba(9,9,13,0)_62%,rgba(9,9,13,.82)_100%),linear-gradient(90deg,rgba(9,9,13,.62)_0%,rgba(9,9,13,.18)_46%,rgba(9,9,13,0)_72%)]" aria-hidden="true" />
        <div className="page-shell relative z-10 grid min-h-[660px] items-center gap-12 pb-16 pt-14 lg:grid-cols-[1.06fr_.94fr] lg:pb-24 lg:pt-24">
          <motion.div className="relative" variants={heroContentReveal} initial="hidden" animate="visible">
            <motion.div variants={heroItemReveal} className="mb-7 flex items-center gap-4">
              <span className="h-px w-10 shrink-0 bg-[#a78bfa]/70" aria-hidden="true" />
              <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#c6baf0]">{translateUi(TOTAL_JOURNEYS)} {translateUi(" jornadas · do zero ao plano de trade")}</p>
            </motion.div>
            <motion.h1 variants={heroItemReveal} className="landing-hero-title text-[#edf4ef]">{translateUi("Entenda cripto.")}<span>{translateUi("Decida com critério.")}</span></motion.h1>
            <SourceLanguageNotice />
            <motion.p variants={heroItemReveal} className="body-lg mt-6 max-w-[580px] text-[15px] leading-[1.8] text-[#b3b0bd] sm:text-base">{translateUi(TOTAL_LESSONS)} {translateUi(" aulas narradas com transcrição, exercício em toda aula, quiz explicado por módulo e certificado de conclusão. De Bitcoin e carteiras a memecoins, DeFi e futuros — com checklist de segurança em cada passo. Sem promessa de lucro.")}</motion.p>
            <motion.div variants={heroItemReveal} className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <Link to="/login" className="button-motion focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ececf0] px-6 text-sm font-semibold text-[#17171c] transition-colors hover:bg-white sm:w-auto">{translateUi("Criar minha conta ")}<ArrowUpRight size={16} /></Link>
              <a href="#jornada" className="button-motion inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/[.15] bg-white/[.02] px-5 text-sm text-[#c1c2cb] backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-white/[.05] sm:w-auto">{translateUi("Ver conteúdo do curso ")}<ArrowDown size={15} /></a>
            </motion.div>
            <motion.div variants={heroItemReveal} className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/[.07] pt-6 text-[11px] tracking-wide text-[#8ca096]">
              <span className="flex items-center gap-2"><AudioLines size={14} className="text-[#a78bfa]" />{translateUi("áudios incluídos")}</span>
              <span className="hidden h-3 w-px bg-white/10 sm:block" aria-hidden="true" />
              <span className="flex items-center gap-2"><BookOpen size={14} className="text-[#98abff]" />{translateUi("quizzes explicados")}</span>
              <span className="hidden h-3 w-px bg-white/10 sm:block" aria-hidden="true" />
              <span className="flex items-center gap-2"><Shield size={14} className="text-[#e4bc76]" />{translateUi("foco em segurança")}</span>
            </motion.div>
            <motion.p variants={heroItemReveal} className="mt-4 text-[11px] leading-relaxed text-[#6c7a72]">{translateUi("Comece pelos fundamentos. Nenhuma aula exige comprar cripto.")}</motion.p>
          </motion.div>
          <HeroVisual />
        </div>
        <dl className="page-shell relative z-10 grid grid-cols-3 border-t border-white/[.07] bg-[#09090d]/60 py-5 backdrop-blur-sm">
          <div className="border-r border-white/[.07] px-2 sm:px-7"><dt className="sr-only">{translateUi("Jornadas")}</dt><dd className="font-display text-xl font-medium tracking-[-.04em] text-[#e7efe9] sm:text-2xl">{translateUi(TOTAL_JOURNEYS)}</dd><dd className="mt-1 text-[10px] text-[#74877c] sm:text-xs">{translateUi("jornadas · do zero ao avançado")}</dd></div>
          <div className="border-r border-white/[.07] px-2 sm:px-7"><dt className="sr-only">{translateUi("Aulas narradas")}</dt><dd className="font-display text-xl font-medium tracking-[-.04em] text-[#e7efe9] sm:text-2xl">{translateUi(TOTAL_LESSONS)}</dd><dd className="mt-1 text-[10px] text-[#74877c] sm:text-xs">{translateUi("aulas narradas com exercício")}</dd></div>
          <div className="px-2 sm:px-7"><dt className="sr-only">{translateUi("Módulos")}</dt><dd className="font-display text-xl font-medium tracking-[-.04em] text-[#e7efe9] sm:text-2xl">{translateUi(TOTAL_MODULES)}</dd><dd className="mt-1 text-[10px] text-[#74877c] sm:text-xs">{translateUi("módulos com quiz explicado")}</dd></div>
        </dl>
      </section>

      <section id="metodo" className="learning-method scroll-mt-24 py-20 sm:py-28">
        <div className="page-shell">
          <div className="learning-method-heading">
            <div><p className="eyebrow">{translateUi("uma estrutura para pensar")}</p><h2 className="display-lg mt-4 max-w-2xl text-[#eaf2ec]">{translateUi("Um método para pensar cripto.")}<br /><span>{translateUi("Sem prever o próximo movimento.")}</span></h2></div>
            <p className="max-w-md text-sm leading-relaxed text-[#9695a0]">{translateUi("Mercado mistura dado, opinião e ruído. A trilha organiza perguntas que você pode levar para qualquer ativo — sem tentar adivinhar o próximo movimento.")}</p>
          </div>
          <div className="learning-method-body mt-11">
            <div className="learning-method-steps">
              {methodSteps.map((step) => <article key={step.number} className="learning-method-step"><span>{translateUi(step.number)}</span><div><h3>{translateUi(step.title)}</h3><p>{translateUi(step.detail)}</p></div></article>)}
            </div>
            <div className="learning-map">
              <div className="learning-map-head"><div><span>{translateUi("MAPA DE APRENDIZADO")}</span><h3>{translateUi("Da base à decisão")}</h3></div><span className="learning-map-status"><i /> {translateUi(TOTAL_MODULES)} {translateUi(" módulos · ")}{translateUi(TOTAL_JOURNEYS)} {translateUi(" jornadas")}</span></div>
              <svg className="learning-map-chart" viewBox="0 0 640 220" role="img" aria-labelledby="learning-map-title learning-map-desc">
                <title id="learning-map-title">{translateUi("Sequência de aprendizado do curso")}</title><desc id="learning-map-desc">{translateUi("Etapas progressivas: fundamentos, compra, proteção e processo pessoal. Não representa preço nem retorno.")}</desc>
                <defs><linearGradient id="learning-line" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#67dff3" /><stop offset="1" stopColor="#b49cff" /></linearGradient><linearGradient id="learning-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a78bfa" stopOpacity=".18" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0" /></linearGradient></defs>
                <path className="learning-chart-fill" d="M22 178H110L178 151H275L333 120H420L475 78H560L616 39V205H22Z" />
                <path className="learning-chart-line" d="M22 178H110L178 151H275L333 120H420L475 78H560L616 39" />
                {[{x:22,y:178},{x:178,y:151},{x:333,y:120},{x:475,y:78},{x:616,y:39}].map((point,index) => <circle key={index} className="learning-chart-node" cx={point.x} cy={point.y} r={index === 4 ? 5 : 4} style={{ animationDelay: `${index * .35}s` }} />)}
                <path className="learning-chart-guide" d="M22 205H616M22 152H616M22 99H616M22 46H616" />
              </svg>
              <div className="learning-map-labels"><span>{translateUi("Fundamentos")}</span><span>{translateUi("Compra")}</span><span>{translateUi("Proteção")}</span><span>{translateUi("Processo")}</span></div>
              <p className="learning-map-note">{translateUi("Visualização da ordem de estudo. Não é gráfico de preço ou projeção de desempenho.")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="omega-features-section py-20 sm:py-28" aria-labelledby="comparison-title">
        <div className="page-shell">
          <h2 id="comparison-title" className="display-lg max-w-3xl text-[#eaf2ec]">{translateUi(omegaCopy.featuresTitle)}</h2>
          <div className="omega-feature-list mt-10">{omegaCopy.features.map((feature, index) => <article key={feature.title} className="omega-feature">
            <span className="omega-feature-number" aria-hidden="true">0{translateUi(index + 1)}</span>
            <div><h3>{translateUi(feature.title)}</h3><p>{translateUi(feature.text)}</p></div>
            <Link to={feature.href}>{translateUi(feature.action)}<ArrowUpRight size={16} /></Link>
          </article>)}</div>
        </div>
      </section>

      <section className="landing-overview-section border-y border-white/[.055] bg-[#0d0e13] py-20 sm:py-24">
        <div className="page-shell">
          <div className="landing-overview-heading">
            <div><p className="eyebrow">{translateUi("dentro da trilha")}</p><h2 className="display-lg mt-4 max-w-2xl text-[#eaf2ec]">{translateUi("Uma visão ampla do mercado. Critério em cada decisão.")}</h2></div>
            <p className="max-w-md text-sm leading-relaxed text-[#92959e]">{translateUi("Bitcoin é ponto de partida. A trilha também cobre Ethereum, custódia, DeFi e futuros, com atenção ao risco de cada tema.")}</p>
          </div>

          <motion.div className="landing-overview-bento mt-10" variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }}>
            <motion.article variants={cardReveal} whileHover={{ y: -3 }} className="market-bento-card market-bento-assets">
              <div className="market-bento-topline"><span>{translateUi("ESCOPO DO CURSO")}</span><BookOpen size={15} /></div>
              <div className="market-asset-gallery" aria-label={translateUi("Bitcoin, Ethereum e Solana")}>
                <div className="market-asset-item"><span className="market-asset-image"><img src="/coin-icons/btc.svg" alt={translateUi("")} /></span><span>{translateUi("Bitcoin")}</span></div>
                <div className="market-asset-item"><span className="market-asset-image"><img src="/coin-icons/eth.svg" alt={translateUi("")} /></span><span>{translateUi("Ethereum")}</span></div>
                <div className="market-asset-item"><span className="market-asset-image"><img src="/coin-icons/sol.svg" alt={translateUi("")} /></span><span>{translateUi("Solana")}</span></div>
              </div>
              <div className="market-bento-copy"><h3>{translateUi("Cripto além de um ativo.")}</h3><p>{translateUi("Entenda redes, custódia, protocolos e formas diferentes de exposição.")}</p></div>
            </motion.article>

            <motion.article variants={cardReveal} whileHover={{ y: -3 }} className="market-bento-card market-bento-security">
              <div className="market-bento-topline"><span>{translateUi("SEGURANÇA")}</span><KeyRound size={15} /></div>
              <div className="market-security-orbit"><i /><i /><span><FingerprintPattern size={36} strokeWidth={1.35} /></span></div>
              <div className="market-bento-copy"><h3>{translateUi("Proteção começa nas chaves.")}</h3><p>{translateUi("Autocustódia, permissões e golpes explicados com passos práticos.")}</p></div>
            </motion.article>

            <motion.article variants={cardReveal} whileHover={{ y: -3 }} className="market-bento-card market-bento-scenarios">
              <div className="market-bento-topline"><span>{translateUi("CENÁRIO DIDÁTICO")}</span><Activity size={15} /></div>
              <svg className="market-scenario-chart" viewBox="0 0 300 92" role="img" aria-labelledby="landing-scenario-title landing-scenario-desc">
                <title id="landing-scenario-title">{translateUi("Ilustração de oscilações de mercado")}</title><desc id="landing-scenario-desc">{translateUi("Traçado esquemático sem dados de preço ou previsão de desempenho.")}</desc>
                <path className="market-scenario-gridline" d="M0 18H300M0 46H300M0 74H300" />
                <motion.path className="market-scenario-line" d="M5 61C21 57 23 28 42 37S63 70 81 53 104 18 121 31 145 64 162 49 181 39 199 46 218 68 236 51 255 20 270 33 287 45 296 26" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.35, ease: 'easeInOut', delay: 0.22 }} />
                <motion.circle cx="296" cy="26" r="3.5" initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 240, damping: 13, delay: 1.35 }} />
              </svg>
              <div className="market-bento-copy"><h3>{translateUi("Gráfico ilustrativo.")}</h3><p>{translateUi("Compare cenários e exposição. O gráfico é didático, não uma cotação.")}</p></div>
            </motion.article>

            <motion.article variants={cardReveal} whileHover={{ y: -3 }} className="market-bento-card market-bento-markets">
              <div className="market-bento-topline"><span>{translateUi("FORMAS DE EXPOSIÇÃO")}</span><ArrowRight size={15} /></div>
              <div className="market-exposure-compare">
                <div><span>{translateUi("SPOT")}</span><strong>{translateUi("Ativo")}</strong><small>{translateUi("Compra · rede · custódia")}</small></div>
                <div><span>{translateUi("FUTUROS")}</span><strong>{translateUi("Contrato")}</strong><small>{translateUi("Long/short · margem · liquidação")}</small></div>
              </div>
              <p className="market-exposure-note"><Shield size={14} /> {translateUi(" Margem pode ampliar perdas quando o mercado anda contra a posição.")}</p>
            </motion.article>

            <motion.article variants={cardReveal} whileHover={{ y: -3 }} className="market-bento-card market-bento-questions">
              <div className="market-bento-topline"><span>{translateUi("PROCESSO DE ANÁLISE")}</span><FingerprintPattern size={15} /></div>
              <h3>{translateUi("Três perguntas antes de operar.")}</h3>
              <ul className="market-review-list">
                <li><span>01</span>{translateUi("Que evidência sustenta a tese?")}</li>
                <li><span>02</span>{translateUi("O que faria você mudar de ideia?")}</li>
                <li><span>03</span>{translateUi("Qual perda cabe no seu limite?")}</li>
              </ul>
            </motion.article>
          </motion.div>
        </div>
      </section>

      <section id="jornada" className="landing-curriculum scroll-mt-24" aria-labelledby="curriculum-title">
        <div className="page-shell curriculum-layout">
          <div className="curriculum-intro">
            <p className="eyebrow">{translateUi("O que você vai aprender")}</p>
            <h2 id="curriculum-title">{translateUi("Da primeira pergunta ao seu próprio processo.")}</h2>
            <p>{translateUi("Veja as aulas de cada módulo. Comece pelos fundamentos e avance no seu ritmo.")}</p>
            <p className="curriculum-note">{translateUi("Ao final, você organiza um plano de estudo e segurança. Nenhuma atividade exige comprar cripto.")}</p>
            <a href="#planos" className="curriculum-action">{translateUi("Comparar planos ")}<ArrowRight size={16} /></a>
          </div>
          <CourseOutline />
        </div>
      </section>

      <section className="practice-section py-20 sm:py-24">
        <AmbientShader className="practice-shader" />
        <div className="page-shell">
          <div className="practice-section-heading">
            <div><p className="eyebrow">{translateUi("estudo aplicado")}</p><h2 className="display-lg mt-4 max-w-2xl text-[#eaf2ec]">{translateUi("Aprenda testando, não apostando.")}</h2></div>
            <p className="max-w-md text-sm leading-relaxed text-[#8da096]">{translateUi("Exercícios com cenários fictícios ajudam a transformar conceitos em decisões mais cuidadosas. Nenhum exige comprar cripto.")}</p>
          </div>
          <div className="practice-bento mt-10">
            <PracticeCard to="/curso/aula/m3/m3l1" icon={<BookOpen size={18} />} number="ANÁLISE" title={translateUi("Investigue uma tese")} copy="Compare um projeto fictício por utilidade, oferta, liquidez e evidências." tone="mint" />
            <PracticeCard to="/curso/aula/m4/m4l1" icon={<Activity size={18} />} number="RISCO" title={translateUi("Simule uma queda")} copy="Veja como oscilações hipotéticas alteram um saldo definido por você." tone="blue" />
            <PracticeCard to="/curso/seguranca" icon={<Shield size={18} />} number="SEGURANÇA" title={translateUi("Revise sua proteção")} copy="Confira acesso, permissões, cópias de segurança e resposta a incidentes." tone="amber" />
          </div>
        </div>
      </section>

      <WalletGuideSection />

      <ReviewsSection />

      <section id="planos" className="pricing-section scroll-mt-24 border-y border-white/[.06] bg-[#0f1017] py-20 sm:py-24">
        <AmbientShader className="pricing-shader" />
        <div className="page-shell"><div className="mx-auto max-w-2xl text-center"><p className="eyebrow">{translateUi("escolha seu tempo de estudo")}</p><h2 className="display-lg mt-4 text-[#eaf2ec]">{translateUi("Escolha quanto tempo de acesso.")}</h2><p className="body-lg mt-4 text-[15px]">{translateUi("Escolha o período de acesso que combina com seu ritmo de estudo.")}</p></div>
          {marketLoading && <p role="status" className="mx-auto mt-8 max-w-xl text-center text-xs text-[#93a69b]">{locale === 'en' ? 'Loading regional prices…' : locale === 'es' ? 'Cargando precios regionales…' : 'Carregando preços da região…'}</p>}
          {pricingError && <p role="alert" className="mx-auto mt-8 max-w-xl text-center text-xs text-[#e4bc76]">{locale === 'en' ? 'Regional prices could not be loaded. Please try again later.' : locale === 'es' ? 'No se pudieron cargar los precios regionales. Inténtalo más tarde.' : 'Não foi possível carregar os preços regionais. Tente novamente mais tarde.'}</p>}
          <div className="pricing-bento mx-auto mt-8">
            {getPlanIdsForMarket(market).map((id) => {
              const plan = plans[id]
              return <div key={id} className={`interactive-card pricing-card relative flex flex-col rounded-xl border p-6 ${plan.featured ? 'border-[#a78bfa]/35 bg-[linear-gradient(155deg,rgba(167,139,250,.105),rgba(20,17,30,.96)_48%)] shadow-[0_22px_70px_rgba(0,0,0,.22)] ' : 'border-white/[.08] bg-[#14151d]'}`}>
                {plan.featured && <span className="mb-3 inline-flex w-fit rounded-xl bg-[#a78bfa] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.12em] text-[#09090d]">{translateUi("melhor valor")}</span>}
                <div className="flex items-start justify-between gap-2"><div><p className="font-display text-xl font-medium tracking-[-.04em] text-[#e8f0ea]">{translateUi(plan.name)}</p><p className="mt-1 text-xs text-[#82958a]">{translateUi(plan.term)}</p></div></div>
                <div className="mt-6">{(marketLoading || pricingError) && <p className="font-display text-sm text-[#9b96a5]">{pricingError ? (locale === 'en' ? 'Regional price unavailable.' : locale === 'es' ? 'Precio regional no disponible.' : 'Preço regional indisponível.') : (locale === 'en' ? 'Loading…' : locale === 'es' ? 'Cargando…' : 'Carregando…')}</p>}</div>
                <p className="mt-2 min-h-10 text-xs leading-relaxed text-[#93a69b]">{translateUi(plan.description)}</p>
                <div className="my-5 h-px bg-white/[.08]" />
                <ul className="space-y-3 text-xs text-[#b6c5bc]">{plan.features.map((feature) => <li key={feature} className="flex gap-2.5"><Check size={14} className="mt-0.5 shrink-0 text-[#a78bfa]" />{translateUi(feature)}</li>)}</ul>
                {!marketLoading && !pricingError && <PlanPaymentOptions planId={id} offers={regionalOffers} locale={locale} />}
              </div>
            })}
          </div>
          <p className="mx-auto mt-6 max-w-3xl text-center text-[11px] leading-relaxed text-[#708279]">{locale === 'en' ? 'Regional prices are based on your detected country. Choose crypto, Stripe, or Pix at checkout.' : locale === 'es' ? 'Los precios regionales se basan en el país detectado. Elige cripto, Stripe o Pix al pagar.' : 'Os preços regionais são definidos pelo país detectado. Escolha cripto, Stripe ou Pix na etapa de pagamento.'}</p>
        </div>
      </section>

      <section className="page-shell grid gap-10 pb-8 pt-20 sm:pb-10 sm:pt-24 lg:grid-cols-[.7fr_1.3fr]">
        <div><p className="eyebrow">{translateUi("perguntas comuns")}</p><h2 className="display-lg mt-4 max-w-sm text-[#eaf2ec]">{translateUi("Dúvidas frequentes.")}</h2><p className="mt-4 max-w-sm text-sm leading-relaxed text-[#8fa197]">{translateUi("Tire suas dúvidas sobre conteúdo, acesso e programa de afiliados.")}</p><Link to="/afiliar" className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#a78bfa]/20 px-4 py-2.5 text-xs text-[#c1acff] hover:bg-[#a78bfa]/[.06]">{translateUi("Quero participar como afiliado ")}<ArrowRight size={14} /></Link></div>
        <div className="faq-list divide-y divide-white/[.08] border-y border-white/[.08]">{[
          ['Este curso promete que vou ganhar dinheiro?', 'Não. Ele ensina conceitos, pesquisa e organização de risco. O mercado pode gerar perdas, inclusive perda total do capital.'],
          ['Preciso saber programar ou já ter cripto?', 'Não. A trilha começa pelos fundamentos e explica termos antes de avançar. Você pode concluir tudo sem comprar ativos.'],
          ['O que quer dizer acesso vitalício?', 'Acesso sem prazo de expiração ao material desta trilha.'],
          ['Como funciona o plano de afiliados?', 'Cliques e cadastros ficam ligados ao seu código. Comissão só após confirmação do pagamento.'],
        ].map(([q, a], index) => <details key={q} className="group py-4"><summary className="faq-question flex cursor-pointer list-none items-center gap-4 text-sm font-medium text-[#dce6df] marker:hidden"><span className="faq-number">{translateUi(String(index + 1).padStart(2, '0'))}</span><span className="flex-1">{translateUi(q)}</span><Plus size={16} className="shrink-0 text-[#7b8192] transition-all duration-300 group-open:rotate-45 group-open:text-[#b49cff]" /></summary><p className="max-w-2xl pb-1 pl-10 pt-3 text-xs leading-relaxed text-[#8790a2]">{translateUi(a)}</p></details>)}</div>
      </section>
    </main>
    <SiteFooter />
  </div>
}

function HeroVisual() {
  useUiTranslation();
  const entryActive = usePlatformEntryActive()
  return <motion.div className="relative mx-auto w-full max-w-[570px] lg:ml-auto" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}>
    <GlowCard glowColor="purple" customSize className="w-full p-[1px]">
      <div className="hero-ascii-shell aspect-[.92] sm:aspect-[1.08]">
        {!entryActive && <Suspense fallback={null}><AsciiModelViewer className="absolute inset-0" /></Suspense>}
        <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between gap-4">
          <div><p className="text-[9px] font-semibold uppercase tracking-[.16em] text-violet-100/80">{translateUi("trilha omega")}</p><p className="mt-2 max-w-[260px] font-display text-xl leading-tight tracking-[-.04em] text-white sm:text-2xl">{translateUi("Método antes do mercado.")}</p></div>
        </div>
        <div className="image-grain pointer-events-none absolute inset-0 z-10" />
      </div>
    </GlowCard>
  </motion.div>
}



function PracticeCard({ to, icon, number, title, copy, tone }: { to: string; icon: ReactNode; number: string; title: string; copy: string; tone: 'mint' | 'blue' | 'amber' }) {
  useUiTranslation();
  const style = { mint: 'border-[#a78bfa]/15 bg-[#a78bfa]/[.08] text-[#a78bfa]', blue: 'border-[#98abff]/15 bg-[#98abff]/[.08] text-[#aab8ff]', amber: 'border-[#e4bc76]/15 bg-[#e4bc76]/[.08] text-[#e4bc76]' }
  return <Link to={to} className="practice-card interactive-card min-h-[235px] rounded-xl border border-white/[.07] bg-[#12121a] p-6"><div className="flex items-center justify-between"><span className={`practice-card-icon grid size-10 place-items-center rounded-xl border ${style[tone]}`}>{translateUi(icon)}</span><span className="font-display text-[10px] font-semibold tracking-[.14em] text-[#68786f]">{translateUi(number)}</span></div><h3 className="mt-7 font-display text-lg font-medium tracking-[-.035em] text-[#e1eae3]">{translateUi(title)}</h3><p className="mt-2 text-xs leading-relaxed text-[#87998f]">{translateUi(copy)}</p><span className="practice-card-action mt-auto flex items-center gap-2 pt-5 text-[10px] font-semibold text-[#b49cff]">{translateUi("Acessar atividade ")}<ArrowUpRight size={13} /></span></Link>
}
