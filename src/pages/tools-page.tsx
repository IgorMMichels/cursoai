import { translateUi, translateTemplate } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { LocalizedLink as Link } from '@/components/localized-router'
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
  useUiTranslation();
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
    <section id="simuladores" className="tool-workbench tool-reveal" aria-label={translateUi("Calculadoras cripto")}>
      <div className="tool-workbench-heading"><div><p>{translateUi("Calculadoras gratuitas")}</p><h2>{translateUi(selectedTool.title)}</h2><span>{translateUi(selectedTool.description)}</span></div><span className="workbench-hint">{translateUi("Exemplos didáticos · sem login")}</span></div>
      <nav className="tool-switcher" aria-label={translateUi("Escolha uma calculadora")}>{tools.map((item) => <Link aria-current={selectedTool.slug === item.slug ? 'page' : undefined} key={item.slug} to={`${base}/${item.slug}`}><span>{translateUi(item.title)}</span><small>{translateUi(item.category)}</small></Link>)}</nav>
      {translateUi(calculator(selectedTool))}
    </section>
    <section className="tool-related"><div><h2>{translateUi("Entenda o que está por trás.")}</h2><p>{translateUi("Uma simulação fica mais útil quando você entende suas hipóteses.")}</p></div><div className="tool-article-list">{toolArticles.filter((article) => article.toolSlug === selectedTool.slug).map((article) => <Link key={article.slug} to={`/artigos/${article.slug}`}><span>{translateUi(article.title)}</span><ArrowUpRight size={18}/></Link>)}</div><Link className="tool-text-button" to={selectedTool.lesson}>{translateUi("Ver aula relacionada ")}<ArrowUpRight size={14}/></Link><small className="tool-lesson-note">{translateUi("As aulas completas seguem o acesso do curso.")}</small></section>
  </>
  const content = slug && !tool ? <div className="tool-not-found"><h1>{translateUi("Ferramenta não encontrada")}</h1><p>{translateUi("Esse endereço não faz parte do catálogo.")}</p><Link className="tool-button" to={base}>{translateUi("Ver ferramentas ")}<ArrowRight size={16}/></Link></div> : tool ? <>
    <PageMeta title={translateUi(translateTemplate("{{value0}}: simulador gratuito", [tool.title]))} description={translateUi(tool.description)} path={`/ferramentas/${tool.slug}`} privatePage={insideCourse}/>
    <div className="tool-detail-heading tool-reveal"><Link className="tool-back" to={base}><ChevronRight size={13}/> {translateUi(" Todas as calculadoras")}</Link><h1>{translateUi("Calculadoras cripto")}</h1><p>{translateUi("Altere os valores e veja como mudam o risco, a exposição e o resultado estimado.")}</p></div>
    {translateUi(workbench)}
  </> : <>
    <PageMeta title={translateUi("Ferramentas cripto gratuitas: simule e aprenda")} description={translateUi("Explore risco e stop, long e short e recuperação de perdas com simuladores educativos gratuitos, sem login.")} path="/ferramentas" privatePage={insideCourse}/>
    <section className="tools-hero tools-hero-simple tool-reveal"><div><p className="tools-intro">{translateUi("O seu laboratório cripto")}</p><h1>{translateUi("Calculadoras para testar cenários.")}</h1><p className="tools-hero-copy">{translateUi("Ajuste os valores. Entenda o resultado. Ferramentas gratuitas para estudar risco e posições antes de operar.")}</p><div className="tools-hero-actions"><Link className="tool-button" to={insideCourse ? '/curso/simulador' : '/simulador'}>{translateUi("Abrir simulador de trade ")}<ArrowUpRight size={15}/></Link><Link className="tool-text-button" to="/artigos">{translateUi("Ler os conceitos ")}<ArrowUpRight size={15}/></Link></div></div></section>
    {translateUi(workbench)}
    <section className="tools-bots-section"><div className="tools-section-heading"><div><h2>{translateUi("Acompanhe.")}<br/><span>{translateUi("Compare. Estude.")}</span></h2><p>{translateUi("Os primeiros bots estão em piloto: notícias com fonte e funding de contratos perpétuos, em um radar com atualização automática.")}</p></div><span className="tool-member-label"><Bot size={14}/>{translateUi("Piloto aberto")}</span></div><div className="tools-bots" onMouseLeave={() => setActiveBot(0)}>{[{ title: 'Market Pulse', description: 'Notícias de três fontes, filtros por tema e ativo e um resumo para estudar.', tab: '' }, { title: 'Funding Monitor', description: 'Funding de BTC, ETH e SOL, com destaque para taxas elevadas.', tab: '?tab=funding' }, { title: 'War Room', description: 'Uma futura visão integrada dos módulos e cenários de estudo.', tab: null }].map((item,index) => <article className={`tool-bot ${activeBot === index ? 'is-expanded' : ''}`} key={item.title} id={`bot-${String(index+1).padStart(2,'0')}`} onMouseEnter={() => setActiveBot(index)}><div className="tool-bot-top"><Bot size={28}/><span>{translateUi(item.tab !== null ? 'Piloto disponível' : 'Em planejamento')}</span></div>{item.tab !== null ? <Link className="tool-bot-title" to={`${insideCourse ? '/curso/radar' : '/radar'}${item.tab}`}>{translateUi(item.title)}<ArrowUpRight size={18}/></Link> : <button className="tool-bot-title" type="button" onClick={() => setActiveBot(index)} aria-pressed={activeBot === index}>{translateUi(item.title)}<ArrowUpRight size={18}/></button>}<p>{translateUi(item.description)}</p><div className="tool-bot-status">{item.tab !== null ? <><Bot size={13}/>{translateUi("Abrir radar educacional")}</> : <><LockKeyhole size={13}/>{translateUi(loading ? 'Verificando seu acesso…' : activePlan ? 'Em planejamento para o curso' : 'Em planejamento para assinantes')}</>}</div></article>)}</div>{!loading && !activePlan && <div className="tool-bots-cta"><Link to="/planos">{translateUi("Conhecer os planos ")}<ArrowRight size={14}/></Link>{!user && <Link to="/login">{translateUi("Já sou aluno")}</Link>}</div>}</section>
    <section className="tools-reading-section"><div className="tools-section-heading"><div><h2>{translateUi("Os números têm contexto.")}</h2><p>{translateUi("Leituras práticas para continuar o que você começou a explorar.")}</p></div><Link className="tool-text-button" to="/artigos">{translateUi("Todos os artigos ")}<ArrowUpRight size={15}/></Link></div><div className="tools-reading-grid">{toolArticles.slice(0,3).map((article,index) => <Link key={article.slug} to={`/artigos/${article.slug}`} className="tool-reading-card"><div className="tool-reading-icon"><img src={`/coin-icons/${index === 1 ? 'eth' : index === 2 ? 'sol' : 'btc'}.svg`} alt={translateUi("")}/></div><h3>{translateUi(article.title)}</h3><p>{translateUi(article.description)}</p><span>{translateUi(article.readingMinutes)} {translateUi(" min de leitura ")}<ArrowUpRight size={17}/></span></Link>)}</div></section>
    <section className="tools-final-cta"><Sparkles size={26}/><h2>{translateUi("Uma boa pergunta")}<br/>{translateUi("abre uma nova trilha.")}</h2><p>{translateUi("Das simulações aos fundamentos, conheça o método da Omega.")}</p><Link className="tool-button" to="/explorar">{translateUi("Conhecer o curso ")}<ArrowRight size={16}/></Link></section>
  </>

  return <div ref={container} className={`tools-root ${insideCourse ? 'tools-inside-course' : ''}`}>
    {!insideCourse && <SiteHeader/>}
    <div className={insideCourse ? 'tools-content' : 'tools-content tools-public-content'}>{slug && !tool && <PageMeta title={translateUi("Ferramenta não encontrada")} description={translateUi("Explore o catálogo de ferramentas da Omega.")} path="/ferramentas" privatePage/>}{translateUi(content)}</div>
    {!insideCourse && <SiteFooter/>}
  </div>
}
