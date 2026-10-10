import { translateUi, translateTemplate, getUiLocale } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { RefreshCw, X, Calculator } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { LocalizedLink as Link } from '@/components/localized-router'
import { getQuotes, getSeries, getStablecoinBrlQuote, getStablecoinBrlSeries, previousQuotes, previousStablecoinBrlQuote, type CoinSymbol, type Period, type PricePoint, type Quote, type StablecoinBrlQuote } from '@/lib/market-prices'

const Chart = lazy(() => import('@/components/price-ticker-chart').then((module) => ({ default: module.PriceTickerChart })))
const coins: { symbol: CoinSymbol; name: string; color: string; icon: string }[] = [
  { symbol: 'BTC', name: 'Bitcoin', color: '#f7931a', icon: '/coin-icons/btc.svg' },
  { symbol: 'ETH', name: 'Ethereum', color: '#627eea', icon: '/coin-icons/eth.svg' },
  { symbol: 'SOL', name: 'Solana', color: '#14f195', icon: '/coin-icons/sol.svg' },
]
const periods: { value: Period; label: string }[] = [
  { value: '1H', label: '1h' },
  { value: '24H', label: '24h' },
  { value: '1W', label: '1 sem' },
  { value: '1M', label: '1 mês' },
]
const currency = (price: number) => `US$ ${price.toLocaleString(getUiLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const brlCurrency = { format: (price: number) => new Intl.NumberFormat(getUiLocale(), { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price) }
const percent = (value: number) => `${value >= 0 ? '+' : ''}${value.toLocaleString(getUiLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`

export function PriceTicker() {
  useUiTranslation();
  const location = useLocation()
  const toolsUrl = location.pathname.startsWith('/curso') || location.pathname.startsWith('/jornadas') || location.pathname === '/plataformas' || location.pathname === '/acesso' ? '/curso/ferramentas' : '/ferramentas'
  const [quotes, setQuotes] = useState<Quote[]>(previousQuotes)
  const [stablecoinBrl, setStablecoinBrl] = useState<StablecoinBrlQuote | undefined>(previousStablecoinBrlQuote)
  const [stale, setStale] = useState(false)
  const [stablecoinBrlStale, setStablecoinBrlStale] = useState(false)
  const [loading, setLoading] = useState(!previousQuotes().length)
  const [selected, setSelected] = useState<CoinSymbol | 'USDT' | null>(null)
  const [period, setPeriod] = useState<Period>('1H')
  const [seriesState, setSeriesState] = useState<{ key: string; points: PricePoint[]; error: boolean } | null>(null)
  const [popupLeft, setPopupLeft] = useState(8)
  const [popupBottom, setPopupBottom] = useState(48)
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({})
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pointerDown = useRef(false)
  const latestRequest = useRef(0)

  useEffect(() => {
    let active = true
    const refresh = () => {
      if (document.hidden) return
      void getQuotes().then((items) => { if (active) { setQuotes(items); setStale(false) } }).catch(() => { if (active) setStale(true) }).finally(() => { if (active) setLoading(false) })
      void getStablecoinBrlQuote().then((quote) => { if (active) { setStablecoinBrl(quote); setStablecoinBrlStale(false) } }).catch(() => { if (active) setStablecoinBrlStale(true) })
    }
    refresh()
    const interval = window.setInterval(refresh, 45_000)
    document.addEventListener('visibilitychange', refresh)
    return () => { active = false; window.clearInterval(interval); document.removeEventListener('visibilitychange', refresh) }
  }, [])

  useEffect(() => {
    if (!selected) return
    const request = ++latestRequest.current
    const key = `${selected}:${period}`
    const seriesRequest = selected === 'USDT' ? getStablecoinBrlSeries(period) : getSeries(selected, period)
    void seriesRequest.then((data) => { if (request === latestRequest.current) setSeriesState({ key, points: data, error: false }) }).catch(() => { if (request === latestRequest.current) setSeriesState({ key, points: [], error: true }) })
  }, [selected, period])

  useEffect(() => {
    if (!selected) return
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!document.getElementById('price-ticker-popover')?.contains(target) && !buttons.current[selected]?.contains(target)) setSelected(null)
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setSelected(null); buttons.current[selected]?.focus() } }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => { document.removeEventListener('pointerdown', closeOnOutside); document.removeEventListener('keydown', closeOnEscape) }
  }, [selected])

  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current) }
  const scheduleClose = () => { cancelClose(); closeTimer.current = setTimeout(() => setSelected(null), 170) }
  const open = (symbol: CoinSymbol | 'USDT') => {
    cancelClose()
    const rect = buttons.current[symbol]?.getBoundingClientRect()
    if (rect) {
      const width = Math.min(320, window.innerWidth - 16)
      setPopupLeft(Math.max(8, Math.min(window.innerWidth - width - 8, rect.left + rect.width / 2 - width / 2)))
      setPopupBottom(window.innerHeight - rect.top + 8)
    }
    setSelected(symbol)
  }
  const coin = coins.find((item) => item.symbol === selected)
  const quote = quotes.find((item) => item.symbol === selected)
  const selectedStablecoin = selected === 'USDT'
  const chartKey = selected ? `${selected}:${period}` : ''
  const points = seriesState?.key === chartKey ? seriesState.points : []
  const chartLoading = Boolean(selected) && seriesState?.key !== chartKey
  const chartError = seriesState?.key === chartKey && seriesState.error
  const periodChange = points.length > 1 ? (points.at(-1)!.price / points[0].price - 1) * 100 : period === '24H' ? selectedStablecoin ? stablecoinBrl?.change24h : quote?.change24h : undefined

  return <><div className="fixed inset-x-0 bottom-0 z-40 flex h-10 items-center justify-center gap-0 border-t border-white/[.07] bg-[#0d0e14]/95 px-1 backdrop-blur-xl sm:gap-5" aria-label={translateUi("Cotações e ferramentas")}>
    {coins.map((item) => {
      const current = quotes.find((entry) => entry.symbol === item.symbol)
      return <button key={item.symbol} ref={(node) => { buttons.current[item.symbol] = node }} type="button" aria-haspopup="dialog" aria-expanded={selected === item.symbol} aria-label={translateUi(translateTemplate("{{value0}}, {{value1}}, {{value2}} em 24 horas", [item.name, current ? currency(current.price) : 'preço indisponível', current ? percent(current.change24h) : '']))} onMouseEnter={() => open(item.symbol)} onMouseLeave={scheduleClose} onPointerDown={() => { pointerDown.current = true }} onFocus={() => { if (!pointerDown.current) open(item.symbol) }} onClick={() => { if (selected === item.symbol && !pointerDown.current) setSelected(null); else open(item.symbol); pointerDown.current = false }} className="flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md px-1.5 text-[10px] text-[#cad5cd] transition-colors hover:bg-white/[.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a78bfa] sm:gap-2 sm:text-[11px]">
        <img src={item.icon} alt={translateUi("")} className="size-[17px] shrink-0 object-contain" /><strong className="font-semibold sm:inline">{translateUi(item.symbol)}</strong><span className="hidden tabular-nums min-[480px]:inline">{translateUi(current ? currency(current.price) : loading ? '···' : '—')}</span><span className={`hidden tabular-nums sm:inline ${current?.change24h && current.change24h < 0 ? 'text-[#ed929b]' : 'text-[#92d4ab]'}`}>{translateUi(current ? percent(current.change24h) : '')}</span>{stale && current && <RefreshCw size={11} className="shrink-0 text-[#e4bc76]" aria-label={translateUi("Cotação desatualizada")} />}
      </button>
    })}
    <button ref={(node) => { buttons.current.USDT = node }} type="button" aria-haspopup="dialog" aria-expanded={selected === 'USDT'} aria-label={translateUi(stablecoinBrl ? translateTemplate("USDT/BRL, {{value0}}, {{value1}} em 24 horas", [brlCurrency.format(stablecoinBrl.price), percent(stablecoinBrl.change24h)]) : 'Cotação de USDT em reais')} title={translateUi("Preço de mercado do par USDT/BRL. A cotação pode diferir do dólar comercial.")} onMouseEnter={() => open('USDT')} onMouseLeave={scheduleClose} onPointerDown={() => { pointerDown.current = true }} onFocus={() => { if (!pointerDown.current) open('USDT') }} onClick={() => { if (selected === 'USDT' && !pointerDown.current) setSelected(null); else open('USDT'); pointerDown.current = false }} className="flex min-h-9 min-w-0 items-center justify-center gap-1 rounded-md px-1 text-[10px] text-[#cad5cd] transition-colors hover:bg-white/[.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a78bfa] sm:gap-1.5 sm:text-[11px]">
      <span aria-hidden="true" className="grid size-[14px] shrink-0 place-items-center rounded-full bg-[#26a17b] text-[10px] font-bold leading-none text-white">₮</span>
      <strong className="font-semibold">{translateUi("USDT")}</strong>
      <span className="hidden tabular-nums min-[480px]:inline">{translateUi(stablecoinBrl ? brlCurrency.format(stablecoinBrl.price) : loading ? '···' : '—')}</span>
      <span className={`hidden tabular-nums sm:inline ${stablecoinBrl && stablecoinBrl.change24h < 0 ? 'text-[#ed929b]' : 'text-[#92d4ab]'}`}>{translateUi(stablecoinBrl ? percent(stablecoinBrl.change24h) : '')}</span>
      {stablecoinBrlStale && stablecoinBrl && <RefreshCw size={11} className="shrink-0 text-[#e4bc76]" aria-label={translateUi("Cotação desatualizada")} />}
    </button>
    <Link to={toolsUrl} className="mx-1 flex min-h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[.055] px-2.5 text-[10px] text-[#c6b4ef] transition-colors hover:bg-white/[.1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a78bfa] sm:text-[11px]" aria-label={translateUi("Abrir calculadoras cripto")}><Calculator size={13}/><span className="hidden min-[380px]:inline">{translateUi("Calculadoras")}</span></Link>
  </div>
    {(coin || selectedStablecoin) && createPortal(<div id="price-ticker-popover" role="dialog" aria-modal="false" aria-label={translateUi(translateTemplate("Gráfico de {{value0}}", [selectedStablecoin ? 'USDT / BRL' : coin!.name]))} onMouseEnter={cancelClose} onMouseLeave={scheduleClose} className="fixed z-[100] w-[min(320px,calc(100vw-16px))] rounded-xl border border-white/[.11] bg-[#14151d] p-4 text-[#e6eee9] shadow-[0_20px_60px_rgba(0,0,0,.45)]" style={{ left: popupLeft, bottom: popupBottom }}>
      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2">{selectedStablecoin ? <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-[#26a17b] text-xl font-bold leading-none text-white">₮</span> : <img src={coin!.icon} alt={translateUi("")} className="size-8 object-contain" />}<div><p className="text-xs font-medium">{translateUi(selectedStablecoin ? 'Tether' : coin!.name)}</p><p className="text-[10px] text-[#8da095]">{translateUi(selectedStablecoin ? 'USDT / BRL · pode diferir do dólar comercial' : translateTemplate("{{value0}} / USD", [coin!.symbol]))}</p></div></div><button type="button" onClick={() => setSelected(null)} aria-label={translateUi("Fechar gráfico")} className="grid size-7 place-items-center rounded-md text-[#9eafa3] hover:bg-white/[.06]"><X size={15} /></button></div>
      <div className="mt-4 flex items-end justify-between"><strong className="font-display text-xl font-medium tabular-nums">{translateUi(selectedStablecoin ? stablecoinBrl ? brlCurrency.format(stablecoinBrl.price) : 'Indisponível' : quote ? currency(quote.price) : 'Indisponível')}</strong><span className={`text-xs tabular-nums ${periodChange !== undefined && periodChange < 0 ? 'text-[#ed929b]' : 'text-[#92d4ab]'}`}>{translateUi(periodChange === undefined ? '—' : percent(periodChange))}</span></div>
      <div className="mt-4 flex gap-1" role="tablist" aria-label={translateUi("Período do gráfico")}>{periods.map(({ value, label }) => <button key={value} type="button" role="tab" aria-selected={period === value} onClick={() => setPeriod(value)} className={`min-h-8 flex-1 rounded-md text-[10px] ${period === value ? 'bg-white/[.1] text-white' : 'text-[#87998e] hover:bg-white/[.05]'}`}>{translateUi(label)}</button>)}</div>
      <div className="mt-2 grid h-[118px] place-items-center">{chartLoading ? <span className="text-xs text-[#8ca096]">{translateUi("Carregando gráfico…")}</span> : chartError ? <span className="text-xs text-[#8ca096]">{translateUi("Gráfico indisponível.")}</span> : points.length ? <Suspense fallback={<span className="text-xs text-[#8ca096]">{translateUi("Carregando gráfico…")}</span>}><Chart points={points} color={selectedStablecoin ? '#26a17b' : coin!.color} period={period} currency={selectedStablecoin ? 'BRL' : 'USD'} /></Suspense> : null}</div>
      {(selectedStablecoin ? stablecoinBrlStale : stale) ? <p className="mt-2 text-[9px] leading-relaxed text-[#788a80]">{translateUi("Cotação pode estar desatualizada.")}</p> : null}
    </div>, document.body)}
  </>
}
