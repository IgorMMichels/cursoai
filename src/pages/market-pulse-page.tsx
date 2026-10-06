import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Activity, ArrowUpRight, Bookmark, Check, Copy, Newspaper, Radio, RefreshCw, Search, Send, Server, ShieldCheck, WifiOff } from 'lucide-react'
import { SiteFooter, SiteHeader } from '@/components/site-header'
import { PageMeta } from '@/components/tools/page-meta'
import { relativeTime, useMarketPulse, type PulseNews } from '@/lib/market-pulse'
import '@/styles/landing.css'
import '@/styles/market-pulse.css'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const categories = ['Todos os temas', 'Mercado', 'Macroeconomia', 'Regulação', 'Segurança', 'Institucional', 'Tecnologia']
function loadSaved(): string[] { try { const value = JSON.parse(localStorage.getItem('omega-pulse-saved') ?? '[]'); return Array.isArray(value) ? value.filter((id) => typeof id === 'string').slice(0, 100) : [] } catch { return [] } }

function NewsAssessment({ item }: { item: PulseNews }) {
  if (!item.importance) return null
  return <div className="pulse-assessment">
    <div className="pulse-assessment-labels">
      <span className={`pulse-importance ${item.importance.score >= 7 ? 'is-high' : ''}`}>Importância <strong>{item.importance.score}<small>/10</small></strong></span>
      <span>{item.importance.method === 'ai' ? 'Estimativa por IA' : 'Triagem por regras'}</span>
      <span>{item.region}{item.category === 'Macroeconomia' ? ' · Macro' : ' · Cripto'}</span>
      <span className="pulse-verification">Apuração pendente</span>
    </div>
    {item.cryptoContext && <p className="pulse-crypto-context">{item.cryptoContext}</p>}
    <details className="pulse-assessment-details">
      <summary>Entender a nota e comparar fontes</summary>
      <div><p><strong>Importância estimada.</strong> {item.importance.reason} A nota indica prioridade de leitura, não previsão de preço.</p>
        <p><strong>{item.verification?.status === 'primary_source' ? 'Origem primária.' : 'Veracidade ainda não checada.'}</strong> {item.verification?.reason ?? 'Leia a matéria completa e confira a origem das informações.'}</p>
        {!!item.verification?.reports.length && <ul>{item.verification.reports.map((report) => <li key={report.url}><a href={report.url} target="_blank" rel="noopener noreferrer"><span>{report.source}</span> {report.title} <ArrowUpRight size={12} /></a></li>)}</ul>}
        <small>Similaridade de manchetes encontra coberturas para comparar. Não detecta contradições nem comprova o fato.</small>
      </div>
    </details>
  </div>
}

export function MarketPulsePage({ insideCourse = false }: { insideCourse?: boolean }) {
  const { snapshot, loading, error, connected, stale, now, refresh } = useMarketPulse()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'funding' ? 'funding' : params.get('tab') === 'resumo' ? 'resumo' : 'news'
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [asset, setAsset] = useState('Todos os ativos')
  const [source, setSource] = useState('Todas as fontes')
  const [region, setRegion] = useState('Brasil e exterior')
  const [minimumImportance, setMinimumImportance] = useState('0')
  const [sort, setSort] = useState('importance')
  const [savedOnly, setSavedOnly] = useState(false)
  const [saved, setSaved] = useState(loadSaved)
  const [notice, setNotice] = useState('')
  const [visibleCount, setVisibleCount] = useState(20)
  const news = useMemo(() => (snapshot?.news ?? []).filter((item) =>
    (category === categories[0] || item.category === category)
    && (asset === 'Todos os ativos' || item.assets.includes(asset))
    && (source === 'Todas as fontes' || item.source === source || item.verification?.reports.some((report) => report.source === source))
    && (region === 'Brasil e exterior' || item.region === region)
    && (item.importance?.score ?? 0) >= Number(minimumImportance)
    && (!savedOnly || saved.includes(item.id))
    && `${item.title} ${item.summary} ${item.source}`.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => (sort === 'importance' ? (b.importance?.score ?? 0) - (a.importance?.score ?? 0) : 0) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt)), [snapshot, category, asset, source, region, minimumImportance, sort, savedOnly, saved, query])
  const liveSources = snapshot?.sources.filter((item) => item.status === 'live').length ?? 0
  const nextSeconds = snapshot?.nextCycleAt ? Math.max(0, Math.ceil((Date.parse(snapshot.nextCycleAt) - now) / 1000)) : null
  const status = snapshot?.mode === 'demo' ? 'Demonstração' : !connected ? 'Desconectado' : snapshot?.sources.length && !liveSources ? 'Fontes indisponíveis' : stale ? 'Coleta atrasada' : snapshot?.sources.some((item) => item.status === 'error') ? 'Coleta parcial' : snapshot?.lastCycleAt ? 'Coleta ativa' : 'Iniciando coleta'
  const bookmark = (id: string) => {
    const next = saved.includes(id) ? saved.filter((value) => value !== id) : [...saved, id].slice(-100)
    setSaved(next)
    try { localStorage.setItem('omega-pulse-saved', JSON.stringify(next)) } catch { setNotice('Salvo apenas nesta sessão.') }
  }
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setNotice('Copiado para a área de transferência.') } catch { setNotice('Não foi possível copiar. Você pode selecionar o texto do resumo.') }
  }
  const copyNews = (item: PulseNews) => copy(`${item.title}\n\n${item.summary}\n\nFonte: ${item.source}\n${item.url}${item.importance ? `\n\nImportância estimada: ${item.importance.score}/10 (${item.importance.method === 'ai' ? 'IA' : 'regras'}). ${item.importance.reason}` : ''}${item.cryptoContext ? `\n${item.cryptoContext}` : ''}\n\nApuração independente pendente. Conteúdo educacional. Não é recomendação de investimento.`)
  const resetFilters = () => { setQuery(''); setCategory(categories[0]); setAsset('Todos os ativos'); setSource('Todas as fontes'); setRegion('Brasil e exterior'); setMinimumImportance('0'); setSavedOnly(false); setVisibleCount(20) }
  const content = <>
    <PageMeta title="Radar cripto: notícias e funding" description="Acompanhe manchetes com fonte, taxas de funding e um resumo para estudar o contexto do mercado." path="/radar" privatePage />
    <header className="pulse-heading">
      <div><Link className="pulse-back" to={insideCourse ? '/curso/ferramentas' : '/ferramentas'}>Ferramentas da Omega <ArrowUpRight size={13} /></Link><p className="pulse-eyebrow"><Radio size={14} /> Radar de mercado · piloto</p><h1>O mercado,<br /><span>com contexto.</span></h1><p className="pulse-intro">Cripto e economia, no Brasil e no exterior. Notícias com prioridade de leitura, fontes para comparar e funding de contratos perpétuos.</p></div>
      <div className="pulse-live"><span className={`pulse-live-dot ${!connected || stale || snapshot?.mode === 'demo' ? 'is-offline' : ''}`} /><span>{status}</span><button type="button" onClick={refresh} aria-label="Atualizar radar" title="Atualizar radar"><RefreshCw size={15} /></button></div>
    </header>
    {error && <div className="pulse-banner" role="status"><WifiOff size={17} /><span>{error}</span><button type="button" onClick={refresh}>Reconectar</button></div>}
    {snapshot?.mode === 'demo' && <div className="pulse-banner" role="status"><ShieldCheck size={17} /><span>Todos os valores desta demonstração são fictícios. Nenhuma mensagem é enviada aos canais.</span></div>}
    {snapshot && !snapshot.persistenceHealthy && <div className="pulse-banner" role="status"><Server size={17} /><span>A coleta está com falha ao salvar dados. Os envios aos canais estão pausados até a recuperação.</span></div>}
    <div className="pulse-metrics">
      <div><span>Último ciclo</span><strong>{relativeTime(snapshot?.lastCycleAt ?? null, now)}</strong><small>{snapshot?.lastCycleAt ? new Date(snapshot.lastCycleAt).toLocaleTimeString('pt-BR') : 'O radar aguarda o serviço'}</small></div>
      <div><span>Fontes de notícias</span><strong>{snapshot?.mode === 'demo' ? 'Amostra' : `${liveSources} conectadas`}</strong><small>{snapshot?.sources.length ? `${snapshot.sources.length} fontes configuradas` : 'CoinDesk · Cointelegraph · Decrypt'}</small></div>
      <div><span>Próxima coleta</span><strong>{connected && nextSeconds !== null ? `${nextSeconds}s` : '—'}</strong><small>{snapshot ? `Intervalo de ${snapshot.intervalSeconds} segundos` : 'Atualizações automáticas'}</small></div>
    </div>
    <div className="pulse-workspace">
      <div className="pulse-main">
        <nav className="pulse-tabs" aria-label="Módulos do radar">{[{ id: 'news', label: 'Notícias', icon: Newspaper }, { id: 'funding', label: 'Funding', icon: Activity }, { id: 'resumo', label: 'Resumo', icon: Copy }].map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => setParams(id === 'news' ? {} : { tab: id })}><Icon size={16} />{label}{id === 'news' && <small>{snapshot?.news.length ?? 0}</small>}</button>)}</nav>
        {tab === 'news' && <>
          <div className="pulse-filters"><label className="pulse-search"><Search size={16} /><input aria-label="Buscar notícias" placeholder="Buscar uma notícia ou ativo" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(20) }} /></label><div className="pulse-filter-row"><select aria-label="Filtrar por tema" value={category} onChange={(event) => { setCategory(event.target.value); setVisibleCount(20) }}>{categories.map((value) => <option key={value}>{value}</option>)}</select><select aria-label="Filtrar por ativo" value={asset} onChange={(event) => { setAsset(event.target.value); setVisibleCount(20) }}>{['Todos os ativos', 'BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'USD', 'BRL'].map((value) => <option key={value}>{value}</option>)}</select><select aria-label="Filtrar por fonte" value={source} onChange={(event) => { setSource(event.target.value); setVisibleCount(20) }}>{['Todas as fontes', ...new Set(snapshot?.sources.map((item) => item.name) ?? [])].map((value) => <option key={value}>{value}</option>)}</select><select aria-label="Filtrar por região" value={region} onChange={(event) => { setRegion(event.target.value); setVisibleCount(20) }}>{['Brasil e exterior', 'Brasil', 'Exterior'].map((value) => <option key={value}>{value}</option>)}</select><select aria-label="Filtrar por importância" value={minimumImportance} onChange={(event) => { setMinimumImportance(event.target.value); setVisibleCount(20) }}><option value="0">Toda importância</option><option value="6">Importância ≥ 6</option><option value="7">Importância ≥ 7</option><option value="8">Importância ≥ 8</option></select><select aria-label="Ordenar notícias" value={sort} onChange={(event) => { setSort(event.target.value); setVisibleCount(20) }}><option value="importance">Mais importantes</option><option value="recent">Mais recentes</option></select><button type="button" className={savedOnly ? 'is-selected' : ''} aria-pressed={savedOnly} onClick={() => setSavedOnly((value) => !value)}><Bookmark size={14} /> Salvas</button></div></div>
          {loading && !snapshot ? <div className="pulse-empty" role="status"><Radio size={28} /><h2>Conectando o radar…</h2><p>Buscando a última coleta.</p></div> : !news.length ? <div className="pulse-empty"><Newspaper size={28} /><h2>{snapshot?.news.length ? 'Nenhuma notícia com esses filtros' : 'Aguardando as primeiras notícias'}</h2><p>{snapshot?.news.length ? 'Experimente outro ativo, tema ou fonte.' : 'As manchetes aparecem aqui assim que o serviço conclui uma coleta.'}</p>{!!snapshot?.news.length && <button type="button" onClick={resetFilters}>Limpar filtros</button>}</div> : <div className="pulse-news-list">{news.slice(0, visibleCount).map((item) => <article className="pulse-news" key={item.id}><div className="pulse-news-meta"><span className={`pulse-category ${item.category === 'Segurança' ? 'is-risk' : ''}`}>{item.category}</span><span>{item.source}</span><time dateTime={item.publishedAt} title={new Date(item.publishedAt).toLocaleString('pt-BR')}>{relativeTime(item.publishedAt, now)}</time></div><h2><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></h2>{item.summary && <p>{item.summary}</p>}<NewsAssessment item={item} /><div className="pulse-news-bottom"><div className="pulse-assets">{item.assets.length ? item.assets.map((value) => <span key={value}>{value}</span>) : <span>Contexto geral</span>}</div><div className="pulse-news-actions"><button type="button" onClick={() => bookmark(item.id)} aria-label={saved.includes(item.id) ? 'Remover notícia das salvas' : 'Salvar notícia'} aria-pressed={saved.includes(item.id)}><Bookmark size={15} fill={saved.includes(item.id) ? 'currentColor' : 'none'} /></button><button type="button" onClick={() => copyNews(item)} aria-label="Copiar notícia"><Copy size={15} /></button><a href={item.url} target="_blank" rel="noopener noreferrer">Ler na fonte <ArrowUpRight size={14} /></a></div></div></article>)}{news.length > visibleCount && <button className="pulse-load-more" type="button" onClick={() => setVisibleCount((value) => value + 20)}>Ver mais notícias ({news.length - visibleCount})</button>}</div>}
          <p className="pulse-footnote">Manchetes e trechos do RSS no idioma original. Importância de 0 a 10 é uma estimativa de prioridade, com método identificado. Cobertura semelhante ajuda a comparar fontes; não é prova de veracidade. A apuração independente segue pendente.</p>
        </>}
        {tab === 'funding' && <section className="pulse-funding"><div className="pulse-section-heading"><p>Contratos perpétuos</p><h2>Quem está pagando o funding?</h2><span>Taxa informada pela exchange. Positivo: longs pagam shorts. Negativo: shorts pagam longs.</span></div>{!snapshot?.funding.length ? <div className="pulse-empty"><Activity size={28} /><h2>Funding ainda indisponível</h2><p>Aguardando dados da API pública da Binance.</p></div> : <div className="pulse-funding-grid">{snapshot.funding.map((item) => {
          const outdated = now - Date.parse(item.observedAt) > snapshot.intervalSeconds * 3000 || snapshot.fundingSources.some((row) => row.asset === item.asset && row.status === 'error')
          const isExtreme = Math.abs(item.rate * 100) >= snapshot.fundingThresholdPercent
          return <article key={item.asset} className="pulse-funding-card"><div className="pulse-funding-top"><strong>{item.asset}<small> / USDT</small></strong><span className={outdated ? 'is-warning' : ''}>{outdated ? 'Dado anterior' : isExtreme ? 'Taxa elevada' : 'Dentro do limite'}</span></div><div className={`pulse-funding-rate ${item.rate < 0 ? 'is-negative' : ''}`}>{item.rate > 0 ? '+' : ''}{(item.rate * 100).toFixed(4)}<small>%</small></div><p>{item.rate === 0 ? 'Taxa neutra' : item.rate > 0 ? 'Longs pagam shorts' : 'Shorts pagam longs'}</p><dl><div><dt>Preço de marcação</dt><dd>{money.format(item.markPrice)}</dd></div><div><dt>Próximo pagamento</dt><dd>{new Date(item.nextFundingAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</dd></div><div><dt>Observado</dt><dd>{relativeTime(item.observedAt, now)}</dd></div></dl><a href={item.url} target="_blank" rel="noopener noreferrer">{item.exchange} <ArrowUpRight size={14} /></a></article>
        })}</div>}<div className="pulse-funding-note"><ShieldCheck size={18} /><p>O radar destaca taxas a partir de ±{snapshot?.fundingThresholdPercent ?? 0.1}%. A taxa pode mudar até o pagamento, e um valor extremo pode persistir. Não indica uma entrada ou previsão de preço.</p></div></section>}
        {tab === 'resumo' && <section className="pulse-brief"><div className="pulse-section-heading"><p>Leitura rápida</p><h2>Seu resumo do radar.</h2><span>Três destaques das últimas 24 horas por importância estimada e o funding disponível.</span></div>{snapshot ? <><button type="button" className="pulse-copy-brief" onClick={() => copy(snapshot.brief)}><Copy size={15} /> Copiar resumo</button><pre>{snapshot.brief}</pre></> : <div className="pulse-empty"><Copy size={28} /><h2>Aguardando o radar</h2><p>O resumo ficará disponível depois da conexão.</p></div>}</section>}
      </div>
      <aside className="pulse-sidebar">
        <section><div className="pulse-aside-heading"><Server size={17} /><h2>Fontes da coleta</h2></div>{snapshot?.sources.length ? snapshot.sources.map((item) => <div className="pulse-source" key={item.id}><div><strong>{item.name}</strong><small>{item.status === 'error' ? item.error || 'Fonte indisponível' : item.itemCount ? `${item.itemCount} notícias nesta fonte` : 'Sem notícias recentes no recorte'}</small></div><span className={`pulse-source-dot ${item.status === 'error' ? 'is-error' : item.status === 'demo' ? 'is-demo' : ''}`} title={item.status === 'error' ? 'Fonte com falha' : 'Feed acessível'} /><p>{item.lastSuccessAt ? `Último sucesso: ${relativeTime(item.lastSuccessAt, now)}` : 'Nenhuma coleta concluída'}</p></div>) : <p className="pulse-aside-copy">As fontes e seu estado aparecem após a conexão com o serviço.</p>}<div className="pulse-source"><div><strong>Binance · funding</strong><small>{snapshot?.fundingSources.length ? `${snapshot.fundingSources.filter((item) => item.status === 'live').length} de 3 contratos disponíveis` : snapshot?.mode === 'demo' ? 'Valores fictícios' : 'BTC · ETH · SOL'}</small></div><Activity size={14} /></div></section>
        <section className="pulse-methodology"><div className="pulse-aside-heading"><ShieldCheck size={17} /><h2>Como o radar avalia</h2></div><p className="pulse-aside-copy"><strong>Importância · 0 a 10</strong><br />0–3: periférica. 4–5: rotina. 6–7: contexto relevante. 8–10: impacto amplo ou excepcional.</p><p className="pulse-aside-copy"><strong>Apuração</strong><br />Mostramos a origem e coberturas semelhantes. Repetição de uma notícia não comprova o fato; por isso, a veracidade fica sem nota até uma checagem independente.</p><div className="pulse-analysis-status"><span>Classificação por IA</span><small>{snapshot?.newsAnalysis?.enabled && snapshot.newsAnalysis.configured ? snapshot.newsAnalysis.status === 'error' ? 'Falha · usando regras' : snapshot.newsAnalysis.status === 'daily_limit' ? 'Limite diário · usando regras' : snapshot.newsAnalysis.status === 'ok' ? 'Ativa' : 'Aguardando análise' : snapshot?.newsAnalysis?.enabled ? 'Chave não configurada' : 'Desativada · usando regras'}</small></div></section>
        <section><div className="pulse-aside-heading"><Send size={17} /><h2>Canais de alertas</h2></div>{(snapshot?.channels ?? [{ platform: 'discord', configured: false, enabled: false, pending: 0 }, { platform: 'telegram', configured: false, enabled: false, pending: 0 }]).map((channel) => <div className="pulse-channel" key={channel.platform}><span>{channel.platform === 'discord' ? 'Discord' : 'Telegram'}</span><small>{channel.enabled ? channel.pending ? `${channel.pending} na fila` : 'Ativo' : channel.configured ? 'Pausado' : 'Não conectado'}</small></div>)}<p className="pulse-aside-copy">Os canais recebem novas notícias dos temas configurados, cruzamentos do limite de funding e o resumo diário quando habilitado.</p></section>
        <section className="pulse-learning"><ShieldCheck size={18} /><h2>Contexto para estudar.</h2><p>Compare fontes, leia a matéria completa e relacione o que aconteceu aos conceitos do curso.</p><Link to={insideCourse ? '/curso/simulador' : '/simulador'}>Explorar o simulador <ArrowUpRight size={14} /></Link><small>Conteúdo educacional. Não é recomendação de investimento.</small></section>
      </aside>
    </div>
    <div className="pulse-notice" role="status" aria-live="polite">{notice && <><Check size={14} />{notice}<button type="button" onClick={() => setNotice('')} aria-label="Fechar aviso">×</button></>}</div>
  </>
  return <div className={`pulse-root ${insideCourse ? 'pulse-inside-course' : ''}`}>{!insideCourse && <SiteHeader />}{insideCourse ? <div className="pulse-content">{content}</div> : <main className="pulse-content pulse-public-content">{content}</main>}{!insideCourse && <SiteFooter />}</div>
}
