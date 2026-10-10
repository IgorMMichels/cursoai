import { translateUi, translateTemplate, getUiLocale } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LocalizedLink as Link } from '@/components/localized-router'
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
  useUiTranslation();
  if (!item.importance) return null
  return <div className="pulse-assessment">
    <div className="pulse-assessment-labels">
      <span className={`pulse-importance ${item.importance.score >= 7 ? 'is-high' : ''}`}>{translateUi("Importância ")}<strong>{translateUi(item.importance.score)}<small>/10</small></strong></span>
      <span>{translateUi(item.importance.method === 'ai' ? 'Estimativa por IA' : 'Triagem por regras')}</span>
      <span>{translateUi(item.region)}{translateUi(item.category === 'Macroeconomia' ? ' · Macro' : ' · Cripto')}</span>
      <span className="pulse-verification">{translateUi("Apuração pendente")}</span>
    </div>
    {item.cryptoContext && <p className="pulse-crypto-context">{translateUi(item.cryptoContext)}</p>}
    <details className="pulse-assessment-details">
      <summary>{translateUi("Entender a nota e comparar fontes")}</summary>
      <div><p><strong>{translateUi("Importância estimada.")}</strong> {translateUi(item.importance.reason)} {translateUi(" A nota indica prioridade de leitura, não previsão de preço.")}</p>
        <p><strong>{translateUi(item.verification?.status === 'primary_source' ? 'Origem primária.' : 'Veracidade ainda não checada.')}</strong> {translateUi(item.verification?.reason ?? 'Leia a matéria completa e confira a origem das informações.')}</p>
        {!!item.verification?.reports.length && <ul>{item.verification.reports.map((report) => <li key={report.url}><a href={report.url} target="_blank" rel="noopener noreferrer"><span>{translateUi(report.source)}</span> {translateUi(report.title)} <ArrowUpRight size={12} /></a></li>)}</ul>}
        <small>{translateUi("Similaridade de manchetes encontra coberturas para comparar. Não detecta contradições nem comprova o fato.")}</small>
      </div>
    </details>
  </div>
}

export function MarketPulsePage({ insideCourse = false }: { insideCourse?: boolean }) {
  useUiTranslation();
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
    <PageMeta title={translateUi("Radar cripto: notícias e funding")} description={translateUi("Acompanhe manchetes com fonte, taxas de funding e um resumo para estudar o contexto do mercado.")} path="/radar" privatePage />
    <header className="pulse-heading">
      <div><Link className="pulse-back" to={insideCourse ? '/curso/ferramentas' : '/ferramentas'}>{translateUi("Ferramentas da Omega ")}<ArrowUpRight size={13} /></Link><p className="pulse-eyebrow"><Radio size={14} /> {translateUi(" Radar de mercado · piloto")}</p><h1>{translateUi("O mercado,")}<br /><span>{translateUi("com contexto.")}</span></h1><p className="pulse-intro">{translateUi("Cripto e economia, no Brasil e no exterior. Notícias com prioridade de leitura, fontes para comparar e funding de contratos perpétuos.")}</p></div>
      <div className="pulse-live"><span className={`pulse-live-dot ${!connected || stale || snapshot?.mode === 'demo' ? 'is-offline' : ''}`} /><span>{translateUi(status)}</span><button type="button" onClick={refresh} aria-label={translateUi("Atualizar radar")} title={translateUi("Atualizar radar")}><RefreshCw size={15} /></button></div>
    </header>
    {error && <div className="pulse-banner" role="status"><WifiOff size={17} /><span>{translateUi(error)}</span><button type="button" onClick={refresh}>{translateUi("Reconectar")}</button></div>}
    {snapshot?.mode === 'demo' && <div className="pulse-banner" role="status"><ShieldCheck size={17} /><span>{translateUi("Todos os valores desta demonstração são fictícios. Nenhuma mensagem é enviada aos canais.")}</span></div>}
    {snapshot && !snapshot.persistenceHealthy && <div className="pulse-banner" role="status"><Server size={17} /><span>{translateUi("A coleta está com falha ao salvar dados. Os envios aos canais estão pausados até a recuperação.")}</span></div>}
    <div className="pulse-metrics">
      <div><span>{translateUi("Último ciclo")}</span><strong>{translateUi(relativeTime(snapshot?.lastCycleAt ?? null, now))}</strong><small>{translateUi(snapshot?.lastCycleAt ? new Date(snapshot.lastCycleAt).toLocaleTimeString(getUiLocale()) : 'O radar aguarda o serviço')}</small></div>
      <div><span>{translateUi("Fontes de notícias")}</span><strong>{translateUi(snapshot?.mode === 'demo' ? 'Amostra' : translateTemplate("{{value0}} conectadas", [liveSources]))}</strong><small>{translateUi(snapshot?.sources.length ? translateTemplate("{{value0}} fontes configuradas", [snapshot.sources.length]) : 'CoinDesk · Cointelegraph · Decrypt')}</small></div>
      <div><span>{translateUi("Próxima coleta")}</span><strong>{translateUi(connected && nextSeconds !== null ? translateTemplate("{{value0}}s", [nextSeconds]) : '—')}</strong><small>{translateUi(snapshot ? translateTemplate("Intervalo de {{value0}} segundos", [snapshot.intervalSeconds]) : 'Atualizações automáticas')}</small></div>
    </div>
    <div className="pulse-workspace">
      <div className="pulse-main">
        <nav className="pulse-tabs" aria-label={translateUi("Módulos do radar")}>{[{ id: 'news', label: 'Notícias', icon: Newspaper }, { id: 'funding', label: 'Funding', icon: Activity }, { id: 'resumo', label: 'Resumo', icon: Copy }].map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => setParams(id === 'news' ? {} : { tab: id })}><Icon size={16} />{translateUi(label)}{id === 'news' && <small>{translateUi(snapshot?.news.length ?? 0)}</small>}</button>)}</nav>
        {tab === 'news' && <>
          <div className="pulse-filters"><label className="pulse-search"><Search size={16} /><input aria-label={translateUi("Buscar notícias")} placeholder={translateUi("Buscar uma notícia ou ativo")} value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(20) }} /></label><div className="pulse-filter-row"><select aria-label={translateUi("Filtrar por tema")} value={category} onChange={(event) => { setCategory(event.target.value); setVisibleCount(20) }}>{categories.map((value) => <option key={value} value={value}>{translateUi(value)}</option>)}</select><select aria-label={translateUi("Filtrar por ativo")} value={asset} onChange={(event) => { setAsset(event.target.value); setVisibleCount(20) }}>{['Todos os ativos', 'BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'USD', 'BRL'].map((value) => <option key={value} value={value}>{translateUi(value)}</option>)}</select><select aria-label={translateUi("Filtrar por fonte")} value={source} onChange={(event) => { setSource(event.target.value); setVisibleCount(20) }}>{['Todas as fontes', ...new Set(snapshot?.sources.map((item) => item.name) ?? [])].map((value) => <option key={value} value={value}>{translateUi(value)}</option>)}</select><select aria-label={translateUi("Filtrar por região")} value={region} onChange={(event) => { setRegion(event.target.value); setVisibleCount(20) }}>{['Brasil e exterior', 'Brasil', 'Exterior'].map((value) => <option key={value} value={value}>{translateUi(value)}</option>)}</select><select aria-label={translateUi("Filtrar por importância")} value={minimumImportance} onChange={(event) => { setMinimumImportance(event.target.value); setVisibleCount(20) }}><option value="0">{translateUi("Toda importância")}</option><option value="6">{translateUi("Importância ≥ 6")}</option><option value="7">{translateUi("Importância ≥ 7")}</option><option value="8">{translateUi("Importância ≥ 8")}</option></select><select aria-label={translateUi("Ordenar notícias")} value={sort} onChange={(event) => { setSort(event.target.value); setVisibleCount(20) }}><option value="importance">{translateUi("Mais importantes")}</option><option value="recent">{translateUi("Mais recentes")}</option></select><button type="button" className={savedOnly ? 'is-selected' : ''} aria-pressed={savedOnly} onClick={() => setSavedOnly((value) => !value)}><Bookmark size={14} /> {translateUi(" Salvas")}</button></div></div>
          {loading && !snapshot ? <div className="pulse-empty" role="status"><Radio size={28} /><h2>{translateUi("Conectando o radar…")}</h2><p>{translateUi("Buscando a última coleta.")}</p></div> : !news.length ? <div className="pulse-empty"><Newspaper size={28} /><h2>{translateUi(snapshot?.news.length ? 'Nenhuma notícia com esses filtros' : 'Aguardando as primeiras notícias')}</h2><p>{translateUi(snapshot?.news.length ? 'Experimente outro ativo, tema ou fonte.' : 'As manchetes aparecem aqui assim que o serviço conclui uma coleta.')}</p>{!!snapshot?.news.length && <button type="button" onClick={resetFilters}>{translateUi("Limpar filtros")}</button>}</div> : <div className="pulse-news-list">{news.slice(0, visibleCount).map((item) => <article className="pulse-news" key={item.id}><div className="pulse-news-meta"><span className={`pulse-category ${item.category === 'Segurança' ? 'is-risk' : ''}`}>{translateUi(item.category)}</span><span>{translateUi(item.source)}</span><time dateTime={item.publishedAt} title={translateUi(new Date(item.publishedAt).toLocaleString(getUiLocale()))}>{translateUi(relativeTime(item.publishedAt, now))}</time></div><h2><a href={item.url} target="_blank" rel="noopener noreferrer">{translateUi(item.title)}</a></h2>{item.summary && <p>{translateUi(item.summary)}</p>}<NewsAssessment item={item} /><div className="pulse-news-bottom"><div className="pulse-assets">{item.assets.length ? item.assets.map((value) => <span key={value}>{translateUi(value)}</span>) : <span>{translateUi("Contexto geral")}</span>}</div><div className="pulse-news-actions"><button type="button" onClick={() => bookmark(item.id)} aria-label={translateUi(saved.includes(item.id) ? 'Remover notícia das salvas' : 'Salvar notícia')} aria-pressed={saved.includes(item.id)}><Bookmark size={15} fill={saved.includes(item.id) ? 'currentColor' : 'none'} /></button><button type="button" onClick={() => copyNews(item)} aria-label={translateUi("Copiar notícia")}><Copy size={15} /></button><a href={item.url} target="_blank" rel="noopener noreferrer">{translateUi("Ler na fonte ")}<ArrowUpRight size={14} /></a></div></div></article>)}{news.length > visibleCount && <button className="pulse-load-more" type="button" onClick={() => setVisibleCount((value) => value + 20)}>{translateUi("Ver mais notícias (")}{translateUi(news.length - visibleCount)})</button>}</div>}
          <p className="pulse-footnote">{translateUi("Manchetes e trechos do RSS no idioma original. Importância de 0 a 10 é uma estimativa de prioridade, com método identificado. Cobertura semelhante ajuda a comparar fontes; não é prova de veracidade. A apuração independente segue pendente.")}</p>
        </>}
        {tab === 'funding' && <section className="pulse-funding"><div className="pulse-section-heading"><p>{translateUi("Contratos perpétuos")}</p><h2>{translateUi("Quem está pagando o funding?")}</h2><span>{translateUi("Taxa informada pela exchange. Positivo: longs pagam shorts. Negativo: shorts pagam longs.")}</span></div>{!snapshot?.funding.length ? <div className="pulse-empty"><Activity size={28} /><h2>{translateUi("Funding ainda indisponível")}</h2><p>{translateUi("Aguardando dados da API pública da Binance.")}</p></div> : <div className="pulse-funding-grid">{snapshot.funding.map((item) => {
          const outdated = now - Date.parse(item.observedAt) > snapshot.intervalSeconds * 3000 || snapshot.fundingSources.some((row) => row.asset === item.asset && row.status === 'error')
          const isExtreme = Math.abs(item.rate * 100) >= snapshot.fundingThresholdPercent
          return <article key={item.asset} className="pulse-funding-card"><div className="pulse-funding-top"><strong>{translateUi(item.asset)}<small> {translateUi(" / USDT")}</small></strong><span className={outdated ? 'is-warning' : ''}>{translateUi(outdated ? 'Dado anterior' : isExtreme ? 'Taxa elevada' : 'Dentro do limite')}</span></div><div className={`pulse-funding-rate ${item.rate < 0 ? 'is-negative' : ''}`}>{translateUi(item.rate > 0 ? '+' : '')}{translateUi((item.rate * 100).toFixed(4))}<small>%</small></div><p>{translateUi(item.rate === 0 ? 'Taxa neutra' : item.rate > 0 ? 'Longs pagam shorts' : 'Shorts pagam longs')}</p><dl><div><dt>{translateUi("Preço de marcação")}</dt><dd>{translateUi(money.format(item.markPrice))}</dd></div><div><dt>{translateUi("Próximo pagamento")}</dt><dd>{translateUi(new Date(item.nextFundingAt).toLocaleString(getUiLocale(), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }))}</dd></div><div><dt>{translateUi("Observado")}</dt><dd>{translateUi(relativeTime(item.observedAt, now))}</dd></div></dl><a href={item.url} target="_blank" rel="noopener noreferrer">{translateUi(item.exchange)} <ArrowUpRight size={14} /></a></article>
        })}</div>}<div className="pulse-funding-note"><ShieldCheck size={18} /><p>{translateUi("O radar destaca taxas a partir de ±")}{translateUi(snapshot?.fundingThresholdPercent ?? 0.1)}{translateUi("%. A taxa pode mudar até o pagamento, e um valor extremo pode persistir. Não indica uma entrada ou previsão de preço.")}</p></div></section>}
        {tab === 'resumo' && <section className="pulse-brief"><div className="pulse-section-heading"><p>{translateUi("Leitura rápida")}</p><h2>{translateUi("Seu resumo do radar.")}</h2><span>{translateUi("Três destaques das últimas 24 horas por importância estimada e o funding disponível.")}</span></div>{snapshot ? <><button type="button" className="pulse-copy-brief" onClick={() => copy(snapshot.brief)}><Copy size={15} /> {translateUi(" Copiar resumo")}</button><pre>{translateUi(snapshot.brief)}</pre></> : <div className="pulse-empty"><Copy size={28} /><h2>{translateUi("Aguardando o radar")}</h2><p>{translateUi("O resumo ficará disponível depois da conexão.")}</p></div>}</section>}
      </div>
      <aside className="pulse-sidebar">
        <section><div className="pulse-aside-heading"><Server size={17} /><h2>{translateUi("Fontes da coleta")}</h2></div>{snapshot?.sources.length ? snapshot.sources.map((item) => <div className="pulse-source" key={item.id}><div><strong>{translateUi(item.name)}</strong><small>{translateUi(item.status === 'error' ? item.error || 'Fonte indisponível' : item.itemCount ? translateTemplate("{{value0}} notícias nesta fonte", [item.itemCount]) : 'Sem notícias recentes no recorte')}</small></div><span className={`pulse-source-dot ${item.status === 'error' ? 'is-error' : item.status === 'demo' ? 'is-demo' : ''}`} title={translateUi(item.status === 'error' ? 'Fonte com falha' : 'Feed acessível')} /><p>{translateUi(item.lastSuccessAt ? translateTemplate("Último sucesso: {{value0}}", [relativeTime(item.lastSuccessAt, now)]) : 'Nenhuma coleta concluída')}</p></div>) : <p className="pulse-aside-copy">{translateUi("As fontes e seu estado aparecem após a conexão com o serviço.")}</p>}<div className="pulse-source"><div><strong>{translateUi("Binance · funding")}</strong><small>{translateUi(snapshot?.fundingSources.length ? translateTemplate("{{value0}} de 3 contratos disponíveis", [snapshot.fundingSources.filter((item) => item.status === 'live').length]) : snapshot?.mode === 'demo' ? 'Valores fictícios' : 'BTC · ETH · SOL')}</small></div><Activity size={14} /></div></section>
        <section className="pulse-methodology"><div className="pulse-aside-heading"><ShieldCheck size={17} /><h2>{translateUi("Como o radar avalia")}</h2></div><p className="pulse-aside-copy"><strong>{translateUi("Importância · 0 a 10")}</strong><br />{translateUi("0–3: periférica. 4–5: rotina. 6–7: contexto relevante. 8–10: impacto amplo ou excepcional.")}</p><p className="pulse-aside-copy"><strong>{translateUi("Apuração")}</strong><br />{translateUi("Mostramos a origem e coberturas semelhantes. Repetição de uma notícia não comprova o fato; por isso, a veracidade fica sem nota até uma checagem independente.")}</p><div className="pulse-analysis-status"><span>{translateUi("Classificação por IA")}</span><small>{translateUi(snapshot?.newsAnalysis?.enabled && snapshot.newsAnalysis.configured ? snapshot.newsAnalysis.status === 'error' ? 'Falha · usando regras' : snapshot.newsAnalysis.status === 'daily_limit' ? 'Limite diário · usando regras' : snapshot.newsAnalysis.status === 'ok' ? 'Ativa' : 'Aguardando análise' : snapshot?.newsAnalysis?.enabled ? 'Chave não configurada' : 'Desativada · usando regras')}</small></div></section>
        <section><div className="pulse-aside-heading"><Send size={17} /><h2>{translateUi("Canais de alertas")}</h2></div>{(snapshot?.channels ?? [{ platform: 'discord', configured: false, enabled: false, pending: 0 }, { platform: 'telegram', configured: false, enabled: false, pending: 0 }]).map((channel) => <div className="pulse-channel" key={channel.platform}><span>{translateUi(channel.platform === 'discord' ? 'Discord' : 'Telegram')}</span><small>{translateUi(channel.enabled ? channel.pending ? translateTemplate("{{value0}} na fila", [channel.pending]) : 'Ativo' : channel.configured ? 'Pausado' : 'Não conectado')}</small></div>)}<p className="pulse-aside-copy">{translateUi("Os canais recebem novas notícias dos temas configurados, cruzamentos do limite de funding e o resumo diário quando habilitado.")}</p></section>
        <section className="pulse-learning"><ShieldCheck size={18} /><h2>{translateUi("Contexto para estudar.")}</h2><p>{translateUi("Compare fontes, leia a matéria completa e relacione o que aconteceu aos conceitos do curso.")}</p><Link to={insideCourse ? '/curso/simulador' : '/simulador'}>{translateUi("Explorar o simulador ")}<ArrowUpRight size={14} /></Link><small>{translateUi("Conteúdo educacional. Não é recomendação de investimento.")}</small></section>
      </aside>
    </div>
    <div className="pulse-notice" role="status" aria-live="polite">{notice && <><Check size={14} />{translateUi(notice)}<button type="button" onClick={() => setNotice('')} aria-label={translateUi("Fechar aviso")}>×</button></>}</div>
  </>
  return <div className={`pulse-root ${insideCourse ? 'pulse-inside-course' : ''}`}>{!insideCourse && <SiteHeader />}{insideCourse ? <div className="pulse-content">{translateUi(content)}</div> : <main className="pulse-content pulse-public-content">{translateUi(content)}</main>}{!insideCourse && <SiteFooter />}</div>
}
