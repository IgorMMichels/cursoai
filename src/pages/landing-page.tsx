import { lazy, Suspense, useState, type ReactNode } from 'react'
import { ReviewsSection } from '@/components/ui/reviews-section'
import { GlowCard } from '@/components/ui/spotlight-card'
import { Activity, ArrowDown, ArrowRight, ArrowUpRight, AudioLines, BookOpen, Check, LockKeyhole, Plus, Shield, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { SiteFooter, SiteHeader } from '@/components/site-header'
import { plans, type Currency, type PlanId } from '@/lib/offers'
import { setPendingOrder } from '@/lib/storage'

const AsciiModelViewer = lazy(() => import('@/components/ui/3d-ascii-model-viewer'))

const topics = [
  { title: 'Entenda o terreno', text: 'Blockchain, ativos e autocustódia.', number: '01', color: 'mint' },
  { title: 'Faça o básico bem feito', text: 'Exchanges, ordens e transferências.', number: '02', color: 'blue' },
  { title: 'Compre Bitcoin com clareza', text: 'Spot, ETF, P2P, taxas e custódia.', number: '03', color: 'lilac' },
  { title: 'Leia além do ticker', text: 'Teses, oferta, liquidez e evidências.', number: '04', color: 'blue' },
  { title: 'Defina o risco antes da entrada', text: 'Orçamento, cenários e estratégia.', number: '05', color: 'amber' },
  { title: 'Proteja o acesso', text: 'Golpes, permissões e resposta.', number: '06', color: 'mint' },
  { title: 'Explore sem confundir retorno e segurança', text: 'DeFi, staking e registros fiscais.', number: '07', color: 'blue' },
  { title: 'Entenda futuros e alavancagem', text: 'Long, short, margem e leitura de padrões.', number: '08', color: 'amber' },
  { title: 'Transforme estudo em processo', text: 'Rotina, critérios e próximos passos.', number: '09', color: 'lilac' },
]

const topicGlow = { mint: 'green', blue: 'blue', lilac: 'purple', amber: 'orange' } as const
const methodSteps = [
  { number: '01', title: 'Entenda a tese', detail: 'Que problema existe e que evidência sustenta a ideia?' },
  { number: '02', title: 'Meça o risco', detail: 'Quanto pode oscilar, falhar ou ficar sem liquidez?' },
  { number: '03', title: 'Defina seu limite', detail: 'O que faria você entrar, esperar ou mudar de ideia?' },
]

export function LandingPage() {
  const [currency, setCurrency] = useState<Currency>('SOL')
  const navigate = useNavigate()
  const choosePlan = (plan: PlanId) => {
    setPendingOrder({ plan, currency })
    navigate(`/login?plano=${plan}&moeda=${currency}`)
  }

  return <div className="min-h-screen overflow-x-clip bg-[#09090d] text-[#e6eee9]">
    <SiteHeader />
    <main>
      <section className="relative isolate overflow-hidden border-b border-white/[.04]">
        <div className="hero-grid absolute inset-0 -z-10 opacity-75" />
        <div className="absolute -left-40 top-20 -z-10 size-[450px] rounded-full bg-[#a78bfa]/[.055] blur-[120px]" />
        <div className="page-shell grid min-h-[650px] items-center gap-10 pb-16 pt-14 lg:grid-cols-[1.08fr_.92fr] lg:pb-20 lg:pt-20">
          <div className="animate-enter relative z-10">
            <p className="eyebrow mb-6">formação em criptoativos · Cripto do Zero</p>
            <h1 className="display-xl max-w-[740px] text-[#edf4ef]">Cripto do zero. Entenda o mercado. Invista com critério.</h1>
            <p className="body-lg mt-6 max-w-[590px]">De Bitcoin e Ethereum a carteiras, DeFi e futuros: aprenda a comprar, analisar projetos e dimensionar riscos com aulas narradas e exercícios interativos. Sem promessa de lucro.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/login" className="button-motion focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#b49cff] px-6 text-sm font-semibold text-[#100c19] shadow-[0_0_36px_rgba(152,120,255,.2)] transition-all hover:-translate-y-0.5 hover:bg-[#c6b4ff]">Começar minha trilha <ArrowUpRight size={16} /></Link>
              <a href="#jornada" className="button-motion inline-flex h-12 items-center gap-2 rounded-full border border-white/[.1] px-5 text-sm text-[#c1cdc5] transition-colors hover:border-white/20 hover:bg-white/[.03]">Conhecer a trilha <ArrowDown size={15} /></a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-[11px] text-[#8ca096]"><span className="flex items-center gap-2"><AudioLines size={14} className="text-[#a78bfa]" />áudios incluídos</span><span className="flex items-center gap-2"><BookOpen size={14} className="text-[#98abff]" />quizzes explicados</span><span className="flex items-center gap-2"><Shield size={14} className="text-[#e4bc76]" />foco em segurança</span></div>
          </div>
          <HeroVisual />
        </div>
        <div className="page-shell grid grid-cols-3 border-t border-white/[.07] py-5 text-center sm:text-left">
          <div className="border-r border-white/[.07] px-2 sm:px-7"><p className="font-display text-xl font-medium tracking-[-.04em] text-[#e7efe9]">9</p><p className="mt-1 text-[10px] text-[#74877c] sm:text-xs">módulos progressivos</p></div>
          <div className="border-r border-white/[.07] px-2 sm:px-7"><p className="font-display text-xl font-medium tracking-[-.04em] text-[#e7efe9]">27</p><p className="mt-1 text-[10px] text-[#74877c] sm:text-xs">aulas e exercícios</p></div>
          <div className="px-2 sm:px-7"><p className="font-display text-xl font-medium tracking-[-.04em] text-[#e7efe9]">3</p><p className="mt-1 text-[10px] text-[#74877c] sm:text-xs">atividades guiadas</p></div>
        </div>
      </section>

      <section id="metodo" className="learning-method scroll-mt-24 py-20 sm:py-28">
        <div className="page-shell">
          <div className="learning-method-heading">
            <div><p className="eyebrow">uma estrutura para pensar</p><h2 className="display-lg mt-4 max-w-2xl text-[#eaf2ec]">Preço oscila.<br /><span>Processo dá contexto.</span></h2></div>
            <p className="max-w-md text-sm leading-relaxed text-[#9695a0]">Mercado mistura dado, opinião e ruído. A trilha organiza perguntas que você pode levar para qualquer ativo — sem tentar adivinhar o próximo movimento.</p>
          </div>
          <div className="learning-method-body mt-11">
            <div className="learning-method-steps">
              {methodSteps.map((step) => <article key={step.number} className="learning-method-step"><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.detail}</p></div></article>)}
            </div>
            <div className="learning-map">
              <div className="learning-map-head"><div><span>MAPA DE APRENDIZADO</span><h3>Da base à decisão</h3></div><span className="learning-map-status"><i /> 9 módulos</span></div>
              <svg className="learning-map-chart" viewBox="0 0 640 220" role="img" aria-labelledby="learning-map-title learning-map-desc">
                <title id="learning-map-title">Sequência de aprendizado do curso</title><desc id="learning-map-desc">Etapas progressivas: fundamentos, compra, proteção e processo pessoal. Não representa preço nem retorno.</desc>
                <defs><linearGradient id="learning-line" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#67dff3" /><stop offset="1" stopColor="#b49cff" /></linearGradient><linearGradient id="learning-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a78bfa" stopOpacity=".18" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0" /></linearGradient></defs>
                <path className="learning-chart-fill" d="M22 178H110L178 151H275L333 120H420L475 78H560L616 39V205H22Z" />
                <path className="learning-chart-line" d="M22 178H110L178 151H275L333 120H420L475 78H560L616 39" />
                {[{x:22,y:178},{x:178,y:151},{x:333,y:120},{x:475,y:78},{x:616,y:39}].map((point,index) => <circle key={index} className="learning-chart-node" cx={point.x} cy={point.y} r={index === 4 ? 5 : 4} style={{ animationDelay: `${index * .35}s` }} />)}
                <path className="learning-chart-guide" d="M22 205H616M22 152H616M22 99H616M22 46H616" />
              </svg>
              <div className="learning-map-labels"><span>Fundamentos</span><span>Compra</span><span>Proteção</span><span>Processo</span></div>
              <p className="learning-map-note">Visualização da ordem de estudo. Não é gráfico de preço ou projeção de desempenho.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="jornada" className="scroll-mt-24 border-y border-white/[.055] bg-[#0f1017] py-20 sm:py-24">
        <div className="page-shell"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="eyebrow">a jornada</p><h2 className="display-lg mt-4 max-w-2xl text-[#eaf2ec]">Do vocabulário básico a um processo próprio.</h2></div><p className="max-w-sm text-sm leading-relaxed text-[#8da096]">Cada etapa prepara a próxima. Avance em ordem ou volte ao assunto que precisa de mais tempo.</p></div>
          <div className="module-grid relative mt-11 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{topics.map((topic) => <GlowCard key={topic.number} glowColor={topicGlow[topic.color as keyof typeof topicGlow]} customSize className="module-glow-card"><Link to="/login" className={`module-card module-${topic.color} group`}><span className="module-card-index">MÓDULO {topic.number}</span><span className="module-card-rule" /><h3>{topic.title}</h3><p>{topic.text}</p><span className="module-card-link">Explorar conteúdo <ArrowRight size={13} /></span></Link></GlowCard>)}</div>
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-white/[.07] bg-[#12131b] p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-violet-200/[.08] text-violet-200"><LockKeyhole size={16} /></div><p className="text-xs leading-relaxed text-[#aaa6b2]">No fim, você monta seu próprio plano de estudo e segurança. O próximo passo pode ser não investir.</p></div><a href="#planos" className="flex shrink-0 items-center gap-1 text-xs font-medium text-violet-200 hover:text-white">Ver os planos <ArrowRight size={14} /></a></div>
        </div>
      </section>

      <section className="practice-section py-20 sm:py-24">
        <div className="page-shell">
          <div className="practice-section-heading">
            <div><p className="eyebrow">estudo aplicado</p><h2 className="display-lg mt-4 max-w-2xl text-[#eaf2ec]">Aprenda testando, não apostando.</h2></div>
            <p className="max-w-md text-sm leading-relaxed text-[#8da096]">Exercícios com cenários fictícios ajudam a transformar conceitos em decisões mais cuidadosas. Nenhum exige comprar cripto.</p>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            <PracticeCard icon={<BookOpen size={18} />} number="LAB 01" title="Investigue uma tese" copy="Compare um projeto fictício por utilidade, oferta, liquidez e evidências." tone="mint" />
            <PracticeCard icon={<Activity size={18} />} number="LAB 02" title="Simule uma queda" copy="Veja como oscilações hipotéticas alteram um saldo definido por você." tone="blue" />
            <PracticeCard icon={<Shield size={18} />} number="LAB 03" title="Revise sua proteção" copy="Confira acesso, permissões, cópias de segurança e resposta a incidentes." tone="amber" />
          </div>
        </div>
      </section>

      <ReviewsSection />

      <section id="planos" className="scroll-mt-24 border-y border-white/[.06] bg-[#0f1017] py-20 sm:py-24">
        <div className="page-shell"><div className="mx-auto max-w-2xl text-center"><p className="eyebrow">escolha seu tempo de estudo</p><h2 className="display-lg mt-4 text-[#eaf2ec]">Um curso completo. Três formas de acessar.</h2><p className="body-lg mt-4 text-[15px]">Sem cobrança real nesta demonstração. Escolha um plano para conhecer o fluxo.</p></div>
          <div className="mt-8 flex justify-center"><div className="inline-flex rounded-xl border border-white/[.08] bg-[#14151d] p-1" role="group" aria-label="Moeda de pagamento">{(['BRL', 'SOL'] as const).map((item) => <button type="button" key={item} aria-pressed={currency === item} onClick={() => setCurrency(item)} className={`focus-ring rounded-xl px-5 py-2 text-xs font-semibold transition-colors ${currency === item ? 'bg-[#b49cff] text-[#100c19] hover:bg-[#c6b4ff]' : 'text-[#b1abbc] hover:bg-white/[.05] hover:text-white'}`}>{item === 'BRL' ? 'Reais · BRL' : 'Solana · SOL'}</button>)}</div></div>
          <div className="mx-auto mt-8 grid max-w-5xl gap-4 lg:grid-cols-3">
            {(['month', 'quarter', 'lifetime'] as const).map((id) => {
              const plan = plans[id]
              return <div key={id} className={`interactive-card pricing-card relative flex flex-col rounded-xl border p-6 ${plan.featured ? 'border-[#a78bfa]/35 bg-[linear-gradient(155deg,rgba(167,139,250,.105),rgba(17,28,23,.96)_48%)] shadow-[0_22px_70px_rgba(0,0,0,.22)] lg:-mt-2 lg:mb-2' : 'border-white/[.08] bg-[#14151d]'}`}>
                {plan.featured && <span className="mb-3 inline-flex w-fit rounded-xl bg-[#a78bfa] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.12em] text-[#09090d]">melhor valor</span>}
                <div className="flex items-start justify-between gap-2"><div><p className="font-display text-xl font-medium tracking-[-.04em] text-[#e8f0ea]">{plan.name}</p><p className="mt-1 text-xs text-[#82958a]">{plan.term}</p></div>{plan.featured && <Sparkles size={17} className="mt-1 text-[#a78bfa]" />}</div>
                <div className="mt-6"><p className="font-display text-[34px] font-medium tracking-[-.065em] text-[#f0f5f1]">{plan.prices[currency]}<span className="ml-2 font-sans text-xs font-normal tracking-normal text-[#778b80]">{currency === 'BRL' ? 'à vista' : 'pagamento em SOL'}</span></p><p className="mt-1 text-[11px] font-medium text-[#bca9e8]">ou {currency === 'SOL' ? plan.prices.BRL : plan.prices.SOL}</p></div>
                <p className="mt-2 min-h-10 text-xs leading-relaxed text-[#93a69b]">{plan.description}</p>
                <div className="my-5 h-px bg-white/[.08]" />
                <ul className="space-y-3 text-xs text-[#b6c5bc]">{plan.features.map((feature) => <li key={feature} className="flex gap-2.5"><Check size={14} className="mt-0.5 shrink-0 text-[#a78bfa]" />{feature}</li>)}</ul>
                <button type="button" onClick={() => choosePlan(id)} className={`mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors ${plan.featured ? 'bg-[#a78bfa] text-[#09090d] hover:bg-[#c1acff]' : 'border border-white/[.12] text-[#d9e3dc] hover:bg-white/[.04]'}`}>{plan.featured ? 'Escolher acesso vitalício' : `Escolher ${plan.name.toLowerCase()}`}<ArrowUpRight size={14} /></button>
                <p className="mt-3 text-center text-[10px] text-[#73867b]">Simulação de pedido · sem cobrança</p>
              </div>
            })}
          </div>
          <p className="mx-auto mt-6 max-w-3xl text-center text-[11px] leading-relaxed text-[#708279]">Os preços em SOL são os valores de demonstração definidos para esta versão e não representam conversão cambial em tempo real. O plano de acesso vitalício tem o menor custo de entrada por prazo de acesso.</p>
        </div>
      </section>

      <section className="page-shell grid gap-10 py-20 sm:py-24 lg:grid-cols-[.7fr_1.3fr]">
        <div><p className="eyebrow">perguntas comuns</p><h2 className="display-lg mt-4 max-w-sm text-[#eaf2ec]">Sem letra miúda.</h2><p className="mt-4 max-w-sm text-sm leading-relaxed text-[#8fa197]">O acesso é de demonstração nesta versão. Estes botões não cobram e não conectam uma carteira.</p></div>
        <div className="faq-list divide-y divide-white/[.08] border-y border-white/[.08]">{[
          ['Este curso promete que vou ganhar dinheiro?', 'Não. Ele ensina conceitos, pesquisa e organização de risco. O mercado pode gerar perdas, inclusive perda total do capital.'],
          ['Preciso saber programar ou já ter cripto?', 'Não. A trilha começa pelos fundamentos e explica termos antes de avançar. Você pode concluir tudo sem comprar ativos.'],
          ['O que quer dizer acesso vitalício?', 'Nesta proposta, acesso permanente ao material desta trilha. Atualizações futuras ficam indicadas na página do plano; não existe cobrança recorrente neste protótipo.'],
          ['Como funciona o plano de afiliados?', 'A demonstração registra cliques, cadastros e pedidos atribuídos a um código de indicação, com 20% de comissão simulada. Pagamentos reais ainda não estão conectados.'],
        ].map(([q, a], index) => <details key={q} className="group py-4"><summary className="faq-question flex cursor-pointer list-none items-center gap-4 text-sm font-medium text-[#dce6df] marker:hidden"><span className="faq-number">{String(index + 1).padStart(2, '0')}</span><span className="flex-1">{q}</span><Plus size={16} className="shrink-0 text-[#7b8192] transition-all duration-300 group-open:rotate-45 group-open:text-[#b49cff]" /></summary><p className="max-w-2xl pb-1 pl-10 pt-3 text-xs leading-relaxed text-[#8790a2]">{a}</p></details>)}</div>
      </section>
      <div className="border-t border-white/[.06] bg-[#0c0c11] py-5"><div className="page-shell flex items-start gap-3"><span className="mt-0.5 text-[#e4bc76]"><Shield size={15} /></span><p className="max-w-5xl text-[10px] leading-relaxed text-[#74877c]">Conteúdo educativo, não é recomendação individual de investimento. Criptoativos têm alta volatilidade, risco tecnológico, de liquidez e de perda parcial ou total. Pesquise por conta própria e procure orientação profissional para decisões financeiras e tributárias.</p></div></div>
    </main>
    <SiteFooter />
  </div>
}

function HeroVisual() {
  return <div className="animate-enter-delay relative mx-auto w-full max-w-[570px] lg:ml-auto">
    <GlowCard glowColor="purple" customSize className="w-full p-[1px]">
      <div className="hero-ascii-shell aspect-[.92] sm:aspect-[1.08]">
        <Suspense fallback={<AsciiHeroLoading />}><AsciiModelViewer className="absolute inset-0" /></Suspense>
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-[9px] font-semibold uppercase tracking-[.16em] text-white/75 backdrop-blur-md">
          <span className="size-1.5 animate-pulse rounded-full bg-violet-200 shadow-[0_0_14px_#bca8ff]" /> Bitcoin · visualização ASCII
        </div>
        <div className="absolute right-4 top-4 z-10 rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-[9px] tracking-[.1em] text-white/50 backdrop-blur-md">3D · INTERATIVO</div>
        <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between gap-4">
          <div><p className="text-[9px] font-semibold uppercase tracking-[.16em] text-violet-100/80">pergunta antes da entrada</p><p className="mt-2 max-w-[260px] font-display text-xl leading-tight tracking-[-.04em] text-white sm:text-2xl">O que faria você mudar de ideia?</p></div>
          <div className="hidden rounded-lg border border-white/10 bg-black/30 px-3 py-2 backdrop-blur sm:block"><p className="font-mono text-[9px] text-white/50">INTERAÇÃO</p><p className="mt-1 text-xs font-medium text-white">arraste para girar</p></div>
        </div>
        <div className="image-grain pointer-events-none absolute inset-0 z-10" />
      </div>
    </GlowCard>
  </div>
}

function AsciiHeroLoading() {
  return <div className="ascii-loader" role="status" aria-live="polite">
    <div className="ascii-loader-mark"><span>₿</span><i /><i /><i /></div>
    <p>INICIANDO NÚCLEO 3D</p>
    <div className="ascii-loader-track"><span /></div>
  </div>
}

function PracticeCard({ icon, number, title, copy, tone }: { icon: ReactNode; number: string; title: string; copy: string; tone: 'mint' | 'blue' | 'amber' }) {
  const style = { mint: 'border-[#a78bfa]/15 bg-[#a78bfa]/[.08] text-[#a78bfa]', blue: 'border-[#98abff]/15 bg-[#98abff]/[.08] text-[#aab8ff]', amber: 'border-[#e4bc76]/15 bg-[#e4bc76]/[.08] text-[#e4bc76]' }
  return <Link to="/login" className="practice-card interactive-card min-h-[235px] rounded-xl border border-white/[.07] bg-[#12121a] p-6"><div className="flex items-center justify-between"><span className={`practice-card-icon grid size-10 place-items-center rounded-xl border ${style[tone]}`}>{icon}</span><span className="font-display text-[10px] font-semibold tracking-[.14em] text-[#68786f]">{number}</span></div><h3 className="mt-7 font-display text-lg font-medium tracking-[-.035em] text-[#e1eae3]">{title}</h3><p className="mt-2 text-xs leading-relaxed text-[#87998f]">{copy}</p><span className="practice-card-action mt-auto flex items-center gap-2 pt-5 text-[10px] font-semibold text-[#b49cff]">Acessar atividade <ArrowUpRight size={13} /></span></Link>
}


