import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock3 } from 'lucide-react'
import { SiteFooter, SiteHeader } from '@/components/site-header'
import { PageMeta } from '@/components/tools/page-meta'
import { ToolArt } from '@/components/tools/tool-art'
import { toolArticles } from '@/lib/tool-articles'
import { tools } from '@/lib/tools'
import '@/styles/landing.css'
import '@/styles/tools.css'

export function ToolArticlesPage() {
  const {articleSlug} = useParams()
  const article = toolArticles.find((item) => item.slug === articleSlug)
  const tool = tools.find((item) => item.slug === article?.toolSlug)
  useEffect(() => { window.scrollTo(0,0) },[articleSlug])
  return <div className="tools-root"><SiteHeader/><main className="tools-public-content tools-content">
    {articleSlug && !article ? <div className="tool-not-found"><PageMeta title="Artigo não encontrado" description="Veja os artigos educativos da Omega." path="/artigos" privatePage/><h1>Artigo não encontrado</h1><Link className="tool-button" to="/artigos">Ver artigos <ArrowRight size={16}/></Link></div> : article ? <>
      <PageMeta title={article.title} description={article.description} path={`/artigos/${article.slug}`}/>
      <article className="tool-editorial"><Link className="tool-back" to="/artigos"><ArrowLeft size={14}/>Todos os artigos</Link><header><p className="tools-intro">Aprenda e experimente</p><h1>{article.title}</h1><p className="article-deck">{article.description}</p><span className="article-reading-time"><Clock3 size={14}/>{article.readingMinutes} min de leitura · Conteúdo educativo</span></header>
        <nav className="article-toc" aria-label="Neste artigo"><strong>Neste artigo</strong>{article.sections.map((section,index) => <a key={section.heading} href={`#conceito-${index+1}`}>{section.heading}</a>)}</nav>
        <div className="article-body">{article.sections.map((section,index) => <section key={section.heading} id={`conceito-${index+1}`}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.example && <aside className="article-example"><span>Exemplo para acompanhar</span><p>{section.example}</p></aside>}</section>)}</div>
        <aside className="article-experiment"><div><h2>Agora, mude os números.</h2><p>Abra o simulador gratuito e veja o conceito em outro cenário.</p><Link className="tool-button" to={`/ferramentas/${article.toolSlug}`}>Experimentar {tool?.title.toLowerCase()} <ArrowRight size={16}/></Link></div><ToolArt kind={tool?.illustration ?? 'risk'} compact/></aside>
        <section className="article-sources"><h2>Fontes para aprofundar</h2><p>Os exemplos numéricos são didáticos. Consulte as regras do produto e da plataforma para situações reais.</p><ul>{article.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} <ArrowUpRight size={13}/></a></li>)}</ul></section>
      </article><section className="tool-related"><h2>Continue explorando</h2><div className="tool-article-list">{toolArticles.filter((item) => item.slug !== article.slug).slice(0,2).map((item) => <Link key={item.slug} to={`/artigos/${item.slug}`}><span>{item.title}</span><ArrowUpRight size={17}/></Link>)}</div></section>
    </> : <>
      <PageMeta title="Artigos cripto: conceitos com exemplos práticos" description="Entenda stop loss, tamanho da posição, long e short, alavancagem e recuperação de perdas com exemplos e simuladores gratuitos." path="/artigos"/>
      <header className="articles-index-heading"><p className="tools-intro">Do conceito ao experimento</p><h1>Entenda o porquê.<br/><span>Teste o que muda.</span></h1><p>Explicações diretas, exemplos com números e ferramentas para aprender fazendo.</p></header>
      <div className="articles-index-list">{toolArticles.map((item) => <Link to={`/artigos/${item.slug}`} key={item.slug}><div><span>{tools.find((entry) => entry.slug === item.toolSlug)?.category} · {item.readingMinutes} min</span><h2>{item.title}</h2><p>{item.description}</p></div><ArrowUpRight size={25}/></Link>)}</div>
      <section className="tools-final-cta"><h2>Aprenda com os números<br/>na sua frente.</h2><Link className="tool-button" to="/ferramentas">Explorar ferramentas <ArrowRight size={16}/></Link></section>
    </>}
  </main><SiteFooter/></div>
}
