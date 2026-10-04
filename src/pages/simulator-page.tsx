import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PaperChart } from '@/components/tools/paper-chart'
import { ArrowDownLeft, ArrowUpRight, ChevronRight, FlaskConical, RefreshCw, Search, ShieldCheck, SkipForward, Wallet, X } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { PageMeta } from '@/components/tools/page-meta'
import { demoPaperMarket, markPaperWallet, newPaperWallet, paperFill, paperPositionFor, restorePaperWallet, PAPER_INITIAL_CASH, type PaperChain, type PaperMarket, type PaperPoint, type PaperCosts } from '@/lib/paper-trading'
import { aggregatePaperTrades, defaultPaperInterval, mergePaperSeries, paperIntervalDuration, recentPaperTrades, paperHistory, paperTokenImage, paperIntervals, refreshPaperMarket, refreshPaperPortfolio, resolvePaperToken, type PaperInterval } from '@/lib/paper-market'
import { browserPaperRuntime, startPaperPolling } from '@/lib/paper-feed'
import { preparePaperOrder } from '@/lib/paper-order'
import '@/styles/landing.css'
import '@/styles/simulator.css'

const STORAGE_KEY = 'cripto-paper-wallet-v1'
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)
const priceText = (value: number) => new Intl.NumberFormat('pt-BR', { maximumSignificantDigits: 7 }).format(value)
const priceUSD = (value: number) => `$${priceText(value)}`
const compactUSD = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value)
const shortAddress = (value: string) => `${value.slice(0, 6)}…${value.slice(-5)}`
const timeText = (value: number) => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const ageText = (now: number, time: number) => { const seconds = Math.max(0, Math.floor((now - time) / 1000)); return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}min ${seconds % 60}s` }
const numberInput = (value: string) => value.trim() === '' ? NaN : Number(value.replace(',', '.'))
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.'
const chainName: Record<PaperChain, string> = { solana: 'Solana', ethereum: 'Ethereum', base: 'Base' }
function loadWallet() { try { return restorePaperWallet(localStorage.getItem(STORAGE_KEY)) } catch { return newPaperWallet() } }

export function SimulatorPage({ insideCourse = false }: { insideCourse?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [wallet, setWallet] = useState(loadWallet)
  const [market, setMarket] = useState<PaperMarket>(() => demoPaperMarket().market)
  const [points, setPoints] = useState<PaperPoint[]>(() => demoPaperMarket().points)
  const [failedImage, setFailedImage] = useState('')
  const [pools, setPools] = useState<PaperMarket[]>([])
  const [chain, setChain] = useState<PaperChain>('solana')
  const [address, setAddress] = useState('')
  const [selectionVersion, setSelectionVersion] = useState(0)
  const [chartMetric, setChartMetric] = useState<'price' | 'mcap'>('price')
  const [chartSupply, setChartSupply] = useState<number | null>(null)
  const [interval, setIntervalValue] = useState<PaperInterval>('1m')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('100')
  const [sellPercent, setSellPercent] = useState(100)
  const [fee, setFee] = useState('0,3')
  const [slippage, setSlippage] = useState('1')
  const [fixed, setFixed] = useState('0')
  const [reason, setReason] = useState('')
  const [tab, setTab] = useState<'positions' | 'history'>('positions')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [marketError, setMarketError] = useState('')
  const [searchError, setSearchError] = useState('')
  const [executing, setExecuting] = useState(false)
  const [lastTradeAt, setLastTradeAt] = useState<number | null>(null)
  const [lastChartQuery, setLastChartQuery] = useState<number | null>(null)
  const [chartError, setChartError] = useState('')
  const [orderError, setOrderError] = useState('')
  const [notice, setNotice] = useState('')
  const [storageError, setStorageError] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [clock, setClock] = useState(Date.now())
  const [demoPlaying, setDemoPlaying] = useState(false)
  const requestRef = useRef<AbortController | null>(null)
  const orderRequestRef = useRef<AbortController | null>(null)
  const walletRef = useRef(wallet)
  walletRef.current = wallet
  const selectedRef = useRef(market)
  const selectionEpoch = useRef(0)
  const demoStep = useRef(0)
  selectedRef.current = market
  const portfolioKey = wallet.positions.filter((item) => !item.market.demo && item.market.id !== market.id).map((item) => item.market.id).sort().join('|')

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet)); setStorageError(false) }
    catch { setStorageError(true) }
  }, [wallet])
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  useEffect(() => {
    if (!market.demo || !demoPlaying) return
    const timer = window.setInterval(() => {
      if (document.hidden) return
      if (demoStep.current >= 500) { setDemoPlaying(false); return }
      advanceDemo()
    }, 2000)
    return () => window.clearInterval(timer)
  }, [market.demo, demoPlaying])
  useEffect(() => () => { requestRef.current?.abort(); orderRequestRef.current?.abort() }, [])
  useEffect(() => {
    const ca = searchParams.get('ca'), requestedChain = searchParams.get('rede')
    if (ca && requestedChain && ['solana', 'ethereum', 'base'].includes(requestedChain)) void loadToken(requestedChain as PaperChain, ca, searchParams.get('pool'))
    // URL restoration runs on mount; choosing a pool updates the URL separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (market.demo) return
    const epoch = selectionEpoch.current
    return startPaperPolling(async (signal) => {
      try {
        const next = await refreshPaperMarket(selectedRef.current, signal)
        if (!signal.aborted && epoch === selectionEpoch.current) {
          setMarket({ ...next, imageUrl: next.imageUrl ?? selectedRef.current.imageUrl }); setMarketError(''); setWallet((previous) => markPaperWallet(previous, next))
        }
      } catch (error) { if (!signal.aborted && epoch === selectionEpoch.current) setMarketError(errorText(error)); throw error }
    }, 5_000, browserPaperRuntime())
  }, [market.id, market.demo, selectionVersion])

  useEffect(() => {
    if (market.demo) return
    const epoch = selectionEpoch.current
    let historical: PaperPoint[] = [], historyAt = 0, historyWarning = ''
    return startPaperPolling(async (signal) => {
      setHistoryLoading(true)
      try {
        const target = selectedRef.current
        const needHistory = !interval.endsWith('s') && Date.now() - historyAt >= 60_000
        if (needHistory) historyAt = Date.now()
        const [historyResult, tradesResult] = await Promise.allSettled([
          needHistory ? paperHistory(target, interval, signal) : Promise.resolve(historical),
          recentPaperTrades(target, signal),
        ])
        if (signal.aborted || epoch !== selectionEpoch.current) return
        if (historyResult.status === 'fulfilled') historical = historyResult.value
        if (needHistory) historyWarning = historyResult.status === 'rejected' ? 'Sem histórico atualizado; exibindo os negócios disponíveis.' : ''
        const ticks = tradesResult.status === 'fulfilled' ? tradesResult.value : []
        const data = interval.endsWith('s') ? aggregatePaperTrades(ticks, paperIntervalDuration(interval)) : mergePaperSeries(historical, ticks, paperIntervalDuration(interval))
        if (!data.length) throw tradesResult.status === 'rejected' ? tradesResult.reason : historyResult.status === 'rejected' ? historyResult.reason : new Error('Aguardando negócios desta pool.')
        setPoints(data); setLastChartQuery(Date.now()); setLastTradeAt(ticks.at(-1)?.time ?? null)
        const warning = tradesResult.status === 'rejected' ? errorText(tradesResult.reason) : historyWarning
        setChartError(warning)
        if (tradesResult.status === 'rejected') throw tradesResult.reason
      } catch (error) { if (!signal.aborted && epoch === selectionEpoch.current) setChartError(errorText(error)); throw error }
      finally { if (!signal.aborted && epoch === selectionEpoch.current) setHistoryLoading(false) }
    }, 15_000, browserPaperRuntime())
  }, [market.id, market.demo, interval, selectionVersion])

  useEffect(() => {
    if (market.demo || market.imageUrl) return
    const controller = new AbortController()
    const target = selectedRef.current
    void paperTokenImage(target, controller.signal).then((imageUrl) => { if (!controller.signal.aborted && imageUrl && selectedRef.current.id === target.id) setMarket((current) => ({ ...current, imageUrl })) }).catch(() => {})
    return () => controller.abort()
  }, [market.id, market.demo, market.imageUrl])

  useEffect(() => {
    if (!portfolioKey) return
    return startPaperPolling(async (signal) => {
      const held = walletRef.current.positions.map((item) => item.market).filter((item) => !item.demo && item.id !== selectedRef.current.id)
      const updates = await refreshPaperPortfolio(held, signal)
      if (!signal.aborted) setWallet((current) => updates.reduce(markPaperWallet, current))
    }, 30_000, browserPaperRuntime())
  }, [portfolioKey])

  async function search(event: FormEvent) {
    event.preventDefault()
    await loadToken(chain, address)
  }
  async function loadToken(requestedChain: PaperChain, ca: string, pair?: string | null) {
    requestRef.current?.abort()
    const controller = new AbortController(); requestRef.current = controller
    setLoading(true); setSearchError(''); setOrderError(''); setNotice('')
    try {
      const result = await resolvePaperToken(requestedChain, ca, controller.signal)
      if (controller.signal.aborted) return
      const selected = result.find((item) => item.pair === pair) ?? result[0]
      setPools(result); chooseMarket(selected); setAddress(selected.address); setChain(requestedChain)
    } catch (error) { if (!controller.signal.aborted) setSearchError(errorText(error)) }
    finally { if (!controller.signal.aborted) setLoading(false) }
  }
  function chooseMarket(next: PaperMarket) {
    setDemoPlaying(false)
    const previous = selectedRef.current
    if (previous.chain !== next.chain || previous.address !== next.address || previous.demo !== next.demo) setIntervalValue(defaultPaperInterval(next.marketCap))
    selectionEpoch.current++
    orderRequestRef.current?.abort(); orderRequestRef.current = null; setExecuting(false)
    selectedRef.current = next
    setSearchParams(next.demo ? {} : { rede: next.chain, ca: next.address, pool: next.pair }, { replace: true })
    setSelectionVersion((version) => version + 1)
    const supply = next.marketCap && next.marketCap > 0 ? next.marketCap / next.price : null
    setChartSupply(supply); if (!supply) setChartMetric('price')
    setMarket(next); setMarketError(''); setChartError(''); setOrderError(''); setNotice('')
    setSearchError(''); setSide('buy'); setSellPercent(100); setLastTradeAt(null); setLastChartQuery(null)
    setPoints([]); setWallet((previous) => markPaperWallet(previous, next))
  }
  function demo() {
    requestRef.current?.abort(); setLoading(false); demoStep.current = 0
    const data = demoPaperMarket(); chooseMarket(data.market); setPoints(data.points); setPools([]); setAddress('')
  }
  function advanceDemo() {
    const data = demoPaperMarket(++demoStep.current)
    setMarket(data.market); setPoints(data.points); setWallet((previous) => markPaperWallet(previous, data.market))
  }
  const position = paperPositionFor(wallet, market)
  const costs: PaperCosts = { feePercent: numberInput(fee), slippagePercent: numberInput(slippage), fixedFee: numberInput(fixed) }
  const tradeAmount = side === 'buy' ? numberInput(amount) : (position?.quantity ?? 0) * sellPercent / 100
  let preview: ReturnType<typeof paperFill> | null = null
  let previewError = ''
  try { preview = paperFill(side, market.price, tradeAmount, costs) } catch (error) { previewError = errorText(error) }
  const stale = !market.demo && clock - market.observedAt > 90_000
  const quietPool = !market.demo && lastTradeAt !== null && clock - lastTradeAt > 120_000
  const positionsValue = wallet.positions.reduce((total, item) => total + item.quantity * item.market.price, 0)
  const total = wallet.cash + positionsValue
  const pnl = total - PAPER_INITIAL_CASH
  const visiblePoints = market.demo ? points : points.slice(-180)

  async function trade(event: FormEvent) {
    event.preventDefault(); setOrderError(''); setNotice('')
    if (loading || orderRequestRef.current) return
    const controller = new AbortController(); orderRequestRef.current = controller
    const target = selectedRef.current
    const submittedSide = side, submittedAmount = tradeAmount, submittedCosts = { ...costs }, submittedReason = reason
    setExecuting(true)
    try {
      const result = await preparePaperOrder(() => walletRef.current, target, submittedSide, submittedAmount, submittedCosts, submittedReason, controller.signal)
      if (controller.signal.aborted || selectedRef.current.id !== target.id) return
      const next = result.wallet
      walletRef.current = next
      selectedRef.current = result.market
      setMarket(selectedRef.current); setMarketError('')
      setWallet(next); setReason(''); setNotice(`${submittedSide === 'buy' ? 'Compra' : 'Venda'} simulada registrada.`)
      setTab(submittedSide === 'buy' ? 'positions' : 'history')
    } catch (error) { if (!controller.signal.aborted) setOrderError(errorText(error)) }
    finally { if (orderRequestRef.current === controller) { orderRequestRef.current = null; setExecuting(false) } }
  }
  return <div className={`paper-root ${insideCourse ? 'paper-inside' : ''}`}>
    <PageMeta title="Simulador de trade: carteira fictícia e memecoins" description="Cole o contrato de um token, explore seu preço e treine compras e vendas com saldo fictício, taxas e histórico local." path="/simulador" privatePage={insideCourse}/>
    {!insideCourse && <SiteHeader/>}
    <main className="paper-container">
      <div className="paper-heading"><div><Link className="paper-breadcrumb" to={insideCourse ? '/curso/ferramentas' : '/ferramentas'}>Ferramentas <ChevronRight size={13}/> Simulador</Link><h1>Modo treino<span>Paper trade.</span></h1><p>Explore o mercado. Teste suas decisões com dinheiro fictício.</p></div><div className="paper-mode"><FlaskConical size={18}/><span>Ambiente de simulação<small>Nenhuma ordem real é enviada</small></span></div></div>

      <section className="paper-summary" aria-label="Carteira fictícia"><div><span><Wallet size={14}/> Saldo disponível</span><strong>{money(wallet.cash)}</strong></div><div><span>Em posições</span><strong>{money(positionsValue)}</strong></div><div><span>Patrimônio estimado</span><strong>{money(total)}</strong></div><div><span>Resultado total</span><strong className={pnl >= 0 ? 'paper-positive' : 'paper-negative'}>{pnl >= 0 ? '+' : ''}{money(pnl)} <small>{(pnl / PAPER_INITIAL_CASH * 100).toFixed(2)}%</small></strong></div><button className="paper-icon-button" aria-label="Reiniciar carteira fictícia" title="Reiniciar carteira" onClick={() => setResetOpen(true)}><RefreshCw size={17}/></button></section>
      <p className="paper-valuation-note">Saldo inicial: {money(PAPER_INITIAL_CASH)} fictícios · patrimônio estimado antes dos custos de saída · outras posições consultadas a cada 30s.</p>
      {storageError && <p className="paper-alert" role="status">O navegador não permitiu salvar. Sua carteira funciona nesta sessão, mas pode não ser recuperada ao fechar.</p>}
      {resetOpen && <div className="paper-reset" role="region" aria-label="Confirmar reinício"><p>Reiniciar apaga as posições e o histórico deste navegador.</p><button className="paper-button" onClick={() => { setWallet(newPaperWallet()); setResetOpen(false); setNotice('Carteira reiniciada.'); setOrderError('') }}>Confirmar reinício</button><button className="paper-ghost" onClick={() => setResetOpen(false)}>Cancelar</button></div>}

      <form className="paper-search" onSubmit={search}>
        <label>Rede<select value={chain} onChange={(event) => setChain(event.target.value as PaperChain)}><option value="solana">Solana</option><option value="ethereum">Ethereum</option><option value="base">Base</option></select></label>
        <label className="paper-address">Contrato do token (CA)<div><Search size={16}/><input aria-label="Contrato do token (CA)" value={address} onChange={(event) => setAddress(event.target.value)} placeholder={chain === 'solana' ? 'Cole o mint address da Solana' : '0x… contrato da rede selecionada'} autoComplete="off" spellCheck={false}/></div></label>
        <button className="paper-button" disabled={loading || !address.trim()}>{loading ? 'Buscando…' : 'Carregar token'}<ArrowUpRight size={16}/></button>
        <button className="paper-ghost" type="button" onClick={demo}>Usar exemplo</button>
      </form>
      {searchError && <div className="paper-alert" role="alert">{searchError}</div>}

      <div className={`paper-workspace ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
        <section className="paper-chart-panel" aria-label="Preço e gráfico do token">
          <div className="paper-market-top"><div className="paper-token-heading"><div className="paper-token-name"><span className="paper-token-avatar">{market.imageUrl && failedImage !== market.imageUrl ? <img src={market.imageUrl} alt={`Logo de ${market.name}`} referrerPolicy="no-referrer" onError={() => setFailedImage(market.imageUrl ?? '')}/> : market.symbol.slice(0, 1)}</span><div><h2>{market.name}<span>{market.symbol}</span></h2><p>{market.demo ? 'Token fictício · exemplo didático' : `${chainName[market.chain]} · ${shortAddress(market.address)}`}</p></div></div><span className={`paper-source ${market.demo ? 'is-demo' : ''}`}>{market.demo ? 'DEMONSTRAÇÃO' : 'DADOS DE MERCADO'}</span></div>
          <div className="paper-quote"><div className="paper-main-cap"><span>Market cap</span><strong title={market.marketCap === null ? 'Market cap não informado pela fonte' : money(market.marketCap)}>{market.marketCap === null ? '—' : compactUSD(market.marketCap)}</strong></div><div className="paper-secondary-price"><span>Preço</span><strong>{priceUSD(market.price)}</strong>{market.change24h !== null && <small className={market.change24h >= 0 ? 'paper-positive' : 'paper-negative'}>{market.change24h > 0 ? '+' : ''}{market.change24h.toFixed(2)}% · 24h</small>}</div></div></div>
          <div className="paper-chart-toolbar"><div className="paper-chart-view"><button aria-pressed={chartMetric === 'price'} onClick={() => setChartMetric('price')}>Preço</button><button aria-pressed={chartMetric === 'mcap'} disabled={!chartSupply} title="Capitalização estimada usando a oferta implícita na consulta inicial" onClick={() => setChartMetric('mcap')}>MCap</button></div><span>USD · {market.demo ? 'cenário sintético' : interval.endsWith('s') ? 'velas de negócios recentes' : 'velas históricas'}</span>{market.demo ? <div className="paper-timeframes"><button aria-pressed={demoPlaying} onClick={() => setDemoPlaying((playing) => !playing)} disabled={demoStep.current >= 500}>{demoPlaying ? 'Pausar exemplo' : 'Reproduzir exemplo'}</button><button className="paper-ghost" onClick={advanceDemo} disabled={demoStep.current >= 500}>Avançar <SkipForward size={14}/></button></div> : <div className="paper-timeframes">{paperIntervals.map((frame) => <button key={frame} aria-pressed={interval === frame} onClick={() => { if (frame !== interval) { setPoints([]); setChartError(''); setIntervalValue(frame) } }}>{frame}</button>)}</div>}</div>
          <div className="paper-chart" role="group" aria-label={`Gráfico de ${market.symbol}, preço atual ${priceUSD(market.price)}. ${market.demo ? 'Dados fictícios.' : 'Atualizações periódicas.'}`}>
            {visiblePoints.length > 0 ? <PaperChart key={`${market.id}:${interval}`} points={visiblePoints} livePrice={market.demo ? undefined : market.price} basis={position ? position.cost / position.quantity : undefined} seconds={interval.endsWith('s')} demo={market.demo} symbol={market.symbol} metric={chartMetric} multiplier={chartMetric === 'mcap' ? chartSupply ?? 1 : 1}/> : <div className="paper-chart-empty"><Search size={24}/><h3>{historyLoading ? 'Carregando velas…' : 'Sem negócios disponíveis neste intervalo'}</h3><p>A cotação e as ordens continuam disponíveis. O gráfico aguarda negócios reais desta pool.</p></div>}
            {historyLoading && <span className="paper-chart-loading" role="status">Consultando negócios…</span>}
          </div>
          {chartMetric === 'mcap' && <p className="paper-chart-note">MCap estimado: preço de cada vela × oferta implícita na consulta inicial. Não é histórico verificado da oferta.</p>}
          {!market.demo && <div className={`paper-feed-bar ${marketError || chartError || quietPool || stale ? 'is-delayed' : ''}`} aria-label="Estado da atualização"><span><i/>{marketError || stale ? 'Reconectando cotação' : chartError ? 'Gráfico com atualização limitada' : quietPool ? 'Fonte sem negócios recentes' : 'Consultas automáticas ativas'}</span><span>Preço consultado há {market.observedAt > 0 ? ageText(clock, market.observedAt) : '—'} · gráfico consultado há {lastChartQuery ? ageText(clock, lastChartQuery) : '—'} · último negócio há {lastTradeAt ? ageText(clock, lastTradeAt) : '—'}</span></div>}
          {quietPool && <p className="paper-chart-note">O último negócio recebido da fonte foi às {lastTradeAt ? timeText(lastTradeAt) : '—'}. As consultas continuam; sem novos negócios retornados, os candles permanecem iguais. Isso pode indicar pouca atividade ou atraso da fonte.</p>}
          {marketError && <p className="paper-chart-note">{marketError} A próxima ordem tentará consultar a cotação novamente.</p>}
          {chartError && <p className="paper-chart-note">{chartError}</p>}
          <div className="paper-market-stats"><div><span>Liquidez</span><strong>{market.liquidity === null ? 'Não disponível' : money(market.liquidity)}</strong></div><div><span>Volume 24h</span><strong>{market.volume === null ? 'Não disponível' : money(market.volume)}</strong></div><div><span>Valor de mercado</span><strong>{market.marketCap === null ? 'Não informado' : money(market.marketCap)}</strong></div><div><span>FDV</span><strong>{market.fdv === null ? 'Não informado' : money(market.fdv)}</strong></div></div>
          <div className="paper-pool"><span>{market.dex} · {market.symbol}/{market.quoteSymbol}</span>{pools.length > 1 && <select aria-label="Pool de liquidez" value={market.pair} onChange={(event) => { const next = pools.find((item) => item.pair === event.target.value); if (next) chooseMarket({ ...next, observedAt: 0 }) }}>{pools.map((pool) => <option key={pool.pair} value={pool.pair}>{pool.dex} · {pool.quoteSymbol} · {pool.liquidity === null ? 'sem liquidez informada' : money(pool.liquidity)}</option>)}</select>}{!market.demo && <a href={`https://dexscreener.com/${market.chain}/${encodeURIComponent(market.pair)}`} target="_blank" rel="noopener noreferrer">Ver pool <ArrowUpRight size={13}/></a>}</div>
          <p className="paper-chart-note">{market.demo ? 'Preços e métricas fictícios. Avance o cenário para observar sua posição.' : 'Cotação DEX Screener a cada 5s · negócios GeckoTerminal a cada 15s · histórico a cada 60s. A linha pontilhada indica a cotação consultada; as velas mostram negócios. As fontes gratuitas têm cache e não oferecem streaming por segundo.'}</p>
        </section>

        <form id="paper-order-focus" tabIndex={-1} className="paper-order-panel" onSubmit={trade}>
          <fieldset disabled={executing} aria-busy={executing}>
          <div className="paper-panel-heading"><h2>Sua ordem</h2><span>Spot · mercado</span></div>
          <div className="paper-order-balance"><span>Saldo fictício</span><strong>{money(wallet.cash)}</strong></div>
          {position && <div className="paper-position-preview"><span>Sua posição · {priceText(position.quantity)} {market.symbol}</span><strong className={position.quantity * market.price >= position.cost ? 'paper-positive' : 'paper-negative'}>{money(position.quantity * market.price - position.cost)} <small>aberto</small></strong></div>}
          <div className="paper-side-tabs"><button type="button" aria-pressed={side === 'buy'} onClick={() => { setSide('buy'); setOrderError(''); setNotice('') }}><ArrowDownLeft size={15}/> Comprar</button><button type="button" aria-pressed={side === 'sell'} onClick={() => { setSide('sell'); setOrderError(''); setNotice('') }}><ArrowUpRight size={15}/> Vender</button></div>
          {side === 'buy' ? <><label className="paper-field">Valor total da compra<div><input aria-label="Valor total da compra" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)}/><span>USD</span></div></label><div className="paper-presets">{[100, 250, 500].map((value) => <button type="button" key={value} onClick={() => setAmount(String(value))}>${value}</button>)}<button type="button" onClick={() => setAmount(String(Math.floor(wallet.cash * 100) / 100))}>Saldo</button></div></> : <><label className="paper-field">Parte da posição<select value={sellPercent} onChange={(event) => setSellPercent(Number(event.target.value))}><option value={25}>25% da posição</option><option value={50}>50% da posição</option><option value={75}>75% da posição</option><option value={100}>100% · fechar posição</option></select></label><p className="paper-field-help">Disponível: {priceText(position?.quantity ?? 0)} {market.symbol}</p></>}
          <div className="paper-costs"><label className="paper-field">Taxa simulada<div><input aria-label="Taxa simulada" inputMode="decimal" value={fee} onChange={(event) => setFee(event.target.value)}/><span>%</span></div></label><label className="paper-field">Slippage estimado<div><input aria-label="Slippage estimado" inputMode="decimal" value={slippage} onChange={(event) => setSlippage(event.target.value)}/><span>%</span></div></label></div>
          <details className="paper-extra"><summary>Custo fixo e diário</summary><label className="paper-field">Custo fixo por ordem<div><input aria-label="Custo fixo por ordem" inputMode="decimal" value={fixed} onChange={(event) => setFixed(event.target.value)}/><span>USD</span></div></label><label className="paper-field">{side === 'buy' ? 'Qual é sua hipótese?' : 'O que aprendeu com a saída?'}<textarea aria-label="Nota da operação" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Registre o raciocínio por trás da decisão."/></label></details>
          <div className="paper-order-preview"><div><span>Preço simulado de execução</span><strong>{preview ? priceUSD(preview.price) : '—'}</strong></div><div><span>Quantidade</span><strong>{preview ? priceText(preview.quantity) : '—'} {market.symbol}</strong></div><div><span>Taxas incluídas</span><strong>{preview ? money(preview.fee) : '—'}</strong></div><div className="paper-order-total"><span>{side === 'buy' ? 'Débito total' : 'Recebimento líquido'}</span><strong>{preview ? money(preview.net) : '—'}</strong></div></div>
          {orderError && <p className="paper-alert" role="alert">{orderError}</p>}
          {notice && <p className="paper-success" role="status">{notice}</p>}
          {stale && <p className="paper-alert">A prévia está antiga. Ao confirmar, consultaremos o preço novamente.</p>}
          {side === 'buy' && preview && preview.net > wallet.cash + 1e-8 && <p className="paper-alert">Saldo fictício insuficiente para este valor.</p>}
          <button className={`paper-submit ${side === 'sell' ? 'paper-submit-sell' : ''}`} disabled={executing || loading || !!previewError || side === 'buy' && !!preview && preview.net > wallet.cash + 1e-8 || side === 'sell' && !position}>{executing ? 'Confirmando cotação…' : side === 'buy' ? `Comprar ${market.symbol}` : `Vender ${market.symbol}`}<ArrowUpRight size={17}/></button>
          {!market.demo && <p className="paper-field-help">Prévia estimada. A execução simulada usa uma nova consulta de preço, com os custos acima.</p>}
          {previewError && <p className="paper-field-help">{side === 'sell' && !position ? 'Compre este token para abrir uma posição.' : previewError}</p>}
          <p className="paper-order-disclaimer"><ShieldCheck size={15}/> Custos hipotéticos. O preço exibido não garante execução ou possibilidade de venda real.</p>
          </fieldset>
        </form>
      </div>

      <section className="paper-ledger"><div className="paper-ledger-heading"><div className="paper-ledger-tabs"><button aria-pressed={tab === 'positions'} onClick={() => setTab('positions')}>Posições <span>{wallet.positions.length}</span></button><button aria-pressed={tab === 'history'} onClick={() => setTab('history')}>Histórico <span>{wallet.trades.length}</span></button></div><span>Salvo neste navegador · até 200 operações</span></div>
        {tab === 'positions' ? wallet.positions.length ? <div className="paper-table-wrap"><table><thead><tr><th>Token / rede</th><th>Quantidade</th><th>Custo médio</th><th>Último preço</th><th>Valor estimado</th><th>Resultado aberto</th><th></th></tr></thead><tbody>{wallet.positions.map((item) => { const value = item.quantity * item.market.price; const result = value - item.cost; return <tr key={item.market.id}><td><strong>{item.market.symbol}</strong><small>{item.market.demo ? 'Fictício' : `${chainName[item.market.chain]} · ${shortAddress(item.market.address)}`} · {item.market.dex}</small></td><td>{priceText(item.quantity)}</td><td>{priceUSD(item.cost / item.quantity)}</td><td>{priceUSD(item.market.price)}<small>{item.market.demo ? 'Cenário' : timeText(item.market.observedAt)}</small></td><td>{money(value)}</td><td className={result >= 0 ? 'paper-positive' : 'paper-negative'}>{money(result)}<small>{(result / item.cost * 100).toFixed(2)}% · antes da saída</small></td><td><button className="paper-ghost" onClick={() => { setChain(item.market.chain); setAddress(item.market.demo ? '' : item.market.address); if (item.market.demo) { const data = demoPaperMarket(demoStep.current); chooseMarket(data.market); setPoints(data.points) } else { setPools([]); chooseMarket(item.market) } setSide('sell'); setSellPercent(100); const panel = document.getElementById('paper-order-focus'); panel?.focus({ preventScroll: true }); panel?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }) }}>Gerenciar <ArrowUpRight size={13}/></button></td></tr> })}</tbody></table></div> : <div className="paper-ledger-empty"><Wallet size={23}/><div><h3>Sua primeira posição começa aqui.</h3><p>Faça uma compra simulada. Depois, acompanhe o efeito do preço e dos custos.</p></div></div> : wallet.trades.length ? <div className="paper-table-wrap"><table><thead><tr><th>Operação</th><th>Token</th><th>Preço de execução</th><th>Quantidade</th><th>Taxa</th><th>Fluxo de caixa</th><th>Resultado realizado</th><th>Diário</th></tr></thead><tbody>{wallet.trades.map((item) => <tr key={item.id}><td><strong className={item.side === 'buy' ? 'paper-positive' : 'paper-negative'}>{item.side === 'buy' ? 'Compra' : 'Venda'}</strong><small>{new Date(item.time).toLocaleString('pt-BR')}</small></td><td>{item.symbol}<small>{item.demo ? 'Fictício' : chainName[item.chain]}</small></td><td>{priceUSD(item.price)}<small>Slippage: {item.slippagePercent}%</small></td><td>{priceText(item.quantity)}</td><td>{money(item.fee)}</td><td>{item.side === 'buy' ? '−' : '+'}{money(item.net)}</td><td className={item.pnl !== null && item.pnl < 0 ? 'paper-negative' : 'paper-positive'}>{item.pnl === null ? '—' : money(item.pnl)}</td><td className="paper-journal">{item.reason || 'Sem anotação'}</td></tr>)}</tbody></table></div> : <div className="paper-ledger-empty"><FlaskConical size={23}/><div><h3>Um espaço para observar suas decisões.</h3><p>Compras e vendas aparecerão aqui com os custos e as notas da operação.</p></div></div>}
      </section>
      <div className="paper-bottom"><p><ShieldCheck size={15}/> Carteira local e fictícia. Sem login, depósito ou conexão de carteira.</p><Link to={insideCourse ? '/curso/ferramentas/risco-stop' : '/ferramentas/risco-stop'}>Planejar risco e stop <ArrowUpRight size={14}/></Link></div>
      <details className="paper-method"><summary>Como esta simulação funciona</summary><p>Cada ordem consulta o preço antes de executar, com taxa, custo fixo e slippage hipotéticos. Uma falha ou troca de token cancela a confirmação sem alterar o saldo. O orçamento de compra inclui os custos. Vendas realizam o resultado proporcional ao custo médio. A cotação não é uma proposta executável: baixa liquidez, taxas do token e restrições de venda podem alterar uma operação real.</p><p>No exemplo, preço e métricas são fictícios e o tempo é mostrado em UTC. Em tokens reais, o gráfico mostra as velas históricas fornecidas pelo GeckoTerminal; nos intervalos em segundos, as velas são agregadas dos negócios recentes retornados pelo GeckoTerminal. Intervalo de vela e frequência de atualização são coisas diferentes: não há transmissão ao vivo a cada segundo. Períodos sem negócios não geram velas artificiais. O horário de consulta não comprova a idade do último negócio. A pool selecionada é consultada a cada 5 segundos e outras posições são consultadas em lote a cada 30 segundos; falhas preservam o último preço identificado na tabela. Trocar de pool do mesmo token preserva a posição e o custo médio.</p><p>A primeira versão oferece ordens a mercado. Não há ordens automáticas com a página fechada. O histórico pertence a este navegador e pode desaparecer ao limpar os dados.</p></details>
    </main>
    {notice && <button className="paper-notice-dismiss" aria-label="Dispensar confirmação" onClick={() => setNotice('')}><X size={12}/> {notice}</button>}
  </div>
}
