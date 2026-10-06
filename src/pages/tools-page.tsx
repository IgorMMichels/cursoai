import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Bot, ChevronRight, LockKeyhole, Sparkles } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { SiteFooter, SiteHeader } from '@/components/site-header'
import { useSession } from '@/contexts/session-context'
import { hasActivePlan } from '@/components/guards'
import { tools, toolBase } from '@/lib/tools'
import { toolArticles } from '@/lib/tool-articles'
import { PageMeta } from '@/components/tools/page-meta'
import { PositionCalculator, RecoveryCalculator, RiskCalculator } from '@/components/tools/calculators'
import '@/styles/landing.css'
import '@/styles/tools.css'

gsap.registerPlugin(useGSAP)

export function ToolsPage({ insideCourse = false }: { insideCourse?: boolean }) {
  const { slug } = useParams()
  const container = useRef<HTMLDivElement>(null)
  const base = toolBase(insideCourse)
  const tool = tools.find((item) => item.slug === slug)
  const [activeBot,setActiveBot] = useState(0)
  const {user,loading} = useSession()
  const activePlan = !loading && hasActivePlan(user)
  const selectedTool = tool ?? tools[0]
  useEffect(() => {
    if (insideCourse) document.querySelector('[data-course-scroll]')?.scrollTo(0,0)
    else window.scrollTo(0,0)
  },[slug,insideCourse])

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.tool-reveal', { opacity:0,y:20,duration:.75,stagger:.09,ease:'power2.out' })
    })
    return () => media.revert()
  },{scope:container,dependencies:[slug,insideCourse],revertOnUpdate:true})

  const calculator = (item: typeof tools[number]) => item.slug === 'risco-stop' ? <RiskCalculator/> : item.slug === 'long-short' ? <PositionCalculator/> : <RecoveryCalculator/>
  const workbench = <>
    <section id="simuladores" className="tool-workbench tool-reveal" aria-label="Calculadoras cripto">
      <div className="tool-workbench-heading"><div><p>Calculadoras gratuitas</p><h2>{selectedTool.title}</h2><span>{selectedTool.description}</span></div><span className="workbench-hint">Exemplos didáticos · sem login</span></div>
      <nav className="tool-switcher" aria-label="Escolha uma calculadora">{tools.map((item) => <Link aria-current={selectedTool.slug === item.slug ? 'page' : undefined} key={item.slug} to={`${base}/${item.slug}`}><span>{item.title}</span><small>{item.category}</small></Link>)}</nav>
      {calculator(selectedTool)}
    </section>
    <section className="tool-related"><div><h2>Entenda o que está por trás.</h2><p>Uma simulação fica mais útil quando você entende suas hipóteses.</p></div><div className="tool-article-list">{toolArticles.filter((article) => article.toolSlug === selectedTool.slug).map((article) => <Link key={article.slug} to={`/artigos/${article.slug}`}><span>{article.title}</span><ArrowUpRight size={18}/></Link>)}</div><Link className="tool-text-button" to={selectedTool.lesson}>Ver aula relacionada <ArrowUpRight size={14}/></Link><small className="tool-lesson-note">As aulas completas seguem o acesso do curso.</small></section>
  </>
  const content = slug && !tool ? <div className="tool-not-found"><h1>Ferramenta não encontrada</h1><p>Esse endereço não faz parte do catálogo.</p><Link className="tool-button" to={base}>Ver ferramentas <ArrowRight size={16}/></Link></div> : tool ? <>
    <PageMeta title={`${tool.title}: simulador gratuito`} description={tool.description} path={`/ferramentas/${tool.slug}`} privatePage={insideCourse}/>
    <div className="tool-detail-heading tool-reveal"><Link className="tool-back" to={base}><ChevronRight size={13}/> Todas as calculadoras</Link><h1>Calculadoras cripto</h1><p>Altere os valores e veja como mudam o risco, a exposição e o resultado estimado.</p></div>
    {workbench}
  </> : <>
    <PageMeta title="Ferramentas cripto gratuitas: simule e aprenda" description="Explore risco e stop, long e short e recuperação de perdas com simuladores educativos gratuitos, sem login." path="/ferramentas" privatePage={insideCourse}/>
    <section className="tools-hero tools-hero-simple tool-reveal"><div><p className="tools-intro">O seu laboratório cripto</p><h1>Calculadoras para testar cenários.</h1><p className="tools-hero-copy">Ajuste os valores. Entenda o resultado. Ferramentas gratuitas para estudar risco e posições antes de operar.</p><div className="tools-hero-actions"><Link className="tool-button" to={insideCourse ? '/curso/simulador' : '/simulador'}>Abrir simulador de trade <ArrowUpRight size={15}/></Link><Link className="tool-text-button" to="/artigos">Ler os conceitos <ArrowUpRight size={15}/></Link></div></div></section>
    {workbench}
    <section className="tools-bots-section"><div className="tools-section-heading"><div><h2>Acompanhe.<br/><span>Compare. Estude.</span></h2><p>Os primeiros bots estão em piloto: notícias com fonte e funding de contratos perpétuos, em um radar com atualização automática.</p></div><span className="tool-member-label"><Bot size={14}/>Piloto aberto</span></div><div className="tools-bots" onMouseLeave={() => setActiveBot(0)}>{[{ title: 'Market Pulse', description: 'Notícias de três fontes, filtros por tema e ativo e um resumo para estudar.', tab: '' }, { title: 'Funding Monitor', description: 'Funding de BTC, ETH e SOL, com destaque para taxas elevadas.', tab: '?tab=funding' }, { title: 'War Room', description: 'Uma futura visão integrada dos módulos e cenários de estudo.', tab: null }].map((item,index) => <article className={`tool-bot ${activeBot === index ? 'is-expanded' : ''}`} key={item.title} id={`bot-${String(index+1).padStart(2,'0')}`} onMouseEnter={() => setActiveBot(index)}><div className="tool-bot-top"><Bot size={28}/><span>{item.tab !== null ? 'Piloto disponível' : 'Em planejamento'}</span></div>{item.tab !== null ? <Link className="tool-bot-title" to={`${insideCourse ? '/curso/radar' : '/radar'}${item.tab}`}>{item.title}<ArrowUpRight size={18}/></Link> : <button className="tool-bot-title" type="button" onClick={() => setActiveBot(index)} aria-pressed={activeBot === index}>{item.title}<ArrowUpRight size={18}/></button>}<p>{item.description}</p><div className="tool-bot-status">{item.tab !== null ? <><Bot size={13}/>Abrir radar educacional</> : <><LockKeyhole size={13}/>{loading ? 'Verificando seu acesso…' : activePlan ? 'Em planejamento para o curso' : 'Em planejamento para assinantes'}</>}</div></article>)}</div>{!loading && !activePlan && <div className="tool-bots-cta"><Link to="/planos">Conhecer os planos <ArrowRight size={14}/></Link>{!user && <Link to="/login">Já sou aluno</Link>}</div>}</section>
    <section className="tools-reading-section"><div className="tools-section-heading"><div><h2>Os números têm contexto.</h2><p>Leituras práticas para continuar o que você começou a explorar.</p></div><Link className="tool-text-button" to="/artigos">Todos os artigos <ArrowUpRight size={15}/></Link></div><div className="tools-reading-grid">{toolArticles.slice(0,3).map((article,index) => <Link key={article.slug} to={`/artigos/${article.slug}`} className="tool-reading-card"><div className="tool-reading-icon"><img src={`/coin-icons/${index === 1 ? 'eth' : index === 2 ? 'sol' : 'btc'}.svg`} alt=""/></div><h3>{article.title}</h3><p>{article.description}</p><span>{article.readingMinutes} min de leitura <ArrowUpRight size={17}/></span></Link>)}</div></section>
    <section className="tools-final-cta"><Sparkles size={26}/><h2>Uma boa pergunta<br/>abre uma nova trilha.</h2><p>Das simulações aos fundamentos, conheça o método da Omega.</p><Link className="tool-button" to="/explorar">Conhecer o curso <ArrowRight size={16}/></Link></section>
  </>

  return <div ref={container} className={`tools-root ${insideCourse ? 'tools-inside-course' : ''}`}>
    {!insideCourse && <SiteHeader/>}
    <div className={insideCourse ? 'tools-content' : 'tools-content tools-public-content'}>{slug && !tool && <PageMeta title="Ferramenta não encontrada" description="Explore o catálogo de ferramentas da Omega." path="/ferramentas" privatePage/>}{content}</div>
    {!insideCourse && <SiteFooter/>}
  </div>
}
