import { useEffect, useRef, useState } from 'react'
import { CandlestickSeries, ColorType, CrosshairMode, HistogramSeries, LineStyle, PriceScaleMode, TickMarkType, createChart, type IChartApi, type IPriceLine, type ISeriesApi, type Time, type UTCTimestamp } from 'lightweight-charts'
import { chartBars, formingQuoteCandle, nextChartRange, sameChartBar, type ChartBar } from '@/lib/paper-chart-data'
import type { PaperPoint } from '@/lib/paper-trading'

const priceLabel = (value: number) => new Intl.NumberFormat('pt-BR', { maximumSignificantDigits: 6 }).format(value)

export function PaperChart({ points, basis, livePrice, quoteObservedAt, lastTradeAt, intervalMs = 60_000, seconds, demo, multiplier = 1, metric = 'price', symbol = 'TOKEN' }: { points: PaperPoint[]; basis?: number; livePrice?: number; quoteObservedAt?: number; lastTradeAt?: number | null; intervalMs?: number; seconds: boolean; demo: boolean; multiplier?: number; metric?: 'price' | 'mcap'; symbol?: string }) {
  const [expanded, setExpanded] = useState(false)
  const host = useRef<HTMLDivElement>(null)
  const legend = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const basisRef = useRef<IPriceLine | null>(null)
  const quoteRef = useRef<IPriceLine | null>(null)
  const dataRef = useRef<ChartBar[]>([])
  const formingRef = useRef<ChartBar | null>(null)
  const hovered = useRef(false)

  useEffect(() => {
    if (!host.current) return
    const formatTime = (time: number) => new Date(time * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', ...(seconds ? { second: '2-digit' } : {}), timeZone: demo ? 'UTC' : undefined })
    const formatPrice = (value: number) => value < 0 ? '' : metric === 'mcap' ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value) : priceLabel(value)
    const chart = createChart(host.current, {
      width: host.current.clientWidth, height: host.current.clientHeight, autoSize: false,
      layout: { background: { type: ColorType.Solid, color: '#101114' }, textColor: '#aaa3b8', fontFamily: 'Outfit Variable, sans-serif', fontSize: 11, attributionLogo: true },
      grid: { vertLines: { color: '#ffffff06' }, horzLines: { color: '#ffffff0b' } },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: '#91879f', labelBackgroundColor: '#292233' }, horzLine: { color: '#91879f', labelBackgroundColor: '#292233' } },
      rightPriceScale: { borderColor: '#ffffff12', scaleMargins: { top: .12, bottom: .08 } },
      timeScale: { borderColor: '#ffffff12', timeVisible: true, secondsVisible: seconds, rightOffset: 6, barSpacing: 8, minBarSpacing: 2, tickMarkFormatter: (time: Time, type: TickMarkType) => {
        if (typeof time !== 'number') return null
        const date = new Date(time * 1000), timeZone = demo ? 'UTC' : undefined
        if (type === TickMarkType.Year) return date.toLocaleDateString('pt-BR', { year: 'numeric', timeZone })
        if (type === TickMarkType.Month) return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone })
        if (type === TickMarkType.DayOfMonth) return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone })
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', ...(type === TickMarkType.TimeWithSeconds ? { second: '2-digit' } : {}), timeZone })
      } },
      localization: { locale: 'pt-BR', timeFormatter: (time: Time) => typeof time === 'number' ? formatTime(time) : '' },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    })
    const candles = chart.addSeries(CandlestickSeries, { upColor: '#69d7a2', downColor: '#ee8294', borderVisible: false, wickUpColor: '#69d7a2', wickDownColor: '#ee8294', priceLineColor: '#91879f' })
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceLineVisible: false, lastValueVisible: false }, 1)
    chart.panes()[1].setHeight(65)
    volume.priceScale().applyOptions({ scaleMargins: { top: .15, bottom: 0 }, borderVisible: false })
    candles.applyOptions({ priceFormat: { type: 'custom', minMove: metric === 'mcap' ? .01 : 1e-12, formatter: formatPrice } })
    const element = host.current
    const resize = new ResizeObserver(() => { const range = chart.timeScale().getVisibleLogicalRange(); chart.resize(element.clientWidth, element.clientHeight); if (range) chart.timeScale().setVisibleLogicalRange(range) })
    resize.observe(element)
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => { if (host.current && range) host.current.dataset.visibleRange = JSON.stringify(range) })
    chartRef.current = chart; candlesRef.current = candles; volumeRef.current = volume
    chart.subscribeCrosshairMove((event) => {
      const candle = event.seriesData.get(candles)
      const last = dataRef.current[dataRef.current.length - 1]
      hovered.current = !!event.time
      const point = candle && 'open' in candle ? { time: Number(candle.time), open: candle.open, high: candle.high, low: candle.low, close: candle.close } : last
      const estimated = point && dataRef.current.find((bar) => bar.time === point.time)?.estimated
      if (legend.current && point) legend.current.textContent = `${symbol}${estimated ? ' · vela estimada por cotação' : ''} · ${formatTime(point.time)}   |   O ${formatPrice(point.open)}   H ${formatPrice(point.high)}   L ${formatPrice(point.low)}   C ${formatPrice(point.close)}`
    })
    return () => { resize.disconnect(); chart.remove(); chartRef.current = null; candlesRef.current = null; volumeRef.current = null; basisRef.current = null; quoteRef.current = null; dataRef.current = []; formingRef.current = null }
  }, [seconds, demo, metric, symbol])

  useEffect(() => {
    const chart = chartRef.current, candles = candlesRef.current, volume = volumeRef.current
    if (!chart || !candles || !volume) return
    const scale = chart.timeScale(), range = scale.getVisibleLogicalRange()
    const rows = chartBars(points, multiplier), previous = dataRef.current
    const forming = !demo && livePrice !== undefined && quoteObservedAt !== undefined ? formingQuoteCandle(rows, formingRef.current, { price: livePrice * multiplier, observedAt: quoteObservedAt, lastTradeAt }, intervalMs) : null
    formingRef.current = forming
    if (forming) {
      if (rows.at(-1)?.time === forming.time) rows[rows.length - 1] = forming
      else rows.push(forming)
    }
    if (!rows.length) return
    if (previous.length === rows.length && rows.every((bar, index) => sameChartBar(bar, previous[index]))) return
    const candle = (bar: ChartBar) => ({ time: bar.time as UTCTimestamp, open: bar.open, high: bar.high, low: bar.low, close: bar.close, ...(bar.estimated ? { color: '#b6a0ff', wickColor: '#b6a0ff' } : {}) })
    const histogram = (bar: ChartBar) => ({ time: bar.time as UTCTimestamp, value: bar.volume, color: bar.close >= bar.open ? '#69d7a26b' : '#ee82946b' })
    const incremental = previous.length > 0 && rows.length >= previous.length && previous.slice(0, -1).every((bar, index) => sameChartBar(bar, rows[index])) && rows[previous.length - 1].time === previous[previous.length - 1].time
    if (incremental) {
      for (const bar of rows.slice(previous.length - 1)) { candles.update(candle(bar)); volume.update(histogram(bar)) }
    } else { candles.setData(rows.map(candle)); volume.setData(rows.map(histogram)) }
    scale.setVisibleLogicalRange(nextChartRange(previous, rows, range))
    dataRef.current = rows
    const last = rows[rows.length - 1]
    const format = metric === 'mcap' ? (value: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value) : priceLabel
    if (!hovered.current && legend.current) legend.current.textContent = `${symbol}${last.estimated ? ' · vela estimada por cotação' : ''}   |   O ${format(last.open)}   H ${format(last.high)}   L ${format(last.low)}   C ${format(last.close)}`
  }, [points, livePrice, quoteObservedAt, lastTradeAt, intervalMs, seconds, demo, multiplier, metric, symbol])

  useEffect(() => {
    const candles = candlesRef.current
    if (!candles) return
    if (basisRef.current) { candles.removePriceLine(basisRef.current); basisRef.current = null }
    if (basis !== undefined && Number.isFinite(basis) && basis > 0) basisRef.current = candles.createPriceLine({ price: basis * multiplier, color: '#e6bb75', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'Custo médio' })
  }, [basis, seconds, demo, multiplier, metric, symbol])

  useEffect(() => {
    const candles = candlesRef.current
    if (!candles || livePrice === undefined || !Number.isFinite(livePrice) || livePrice <= 0) return
    const options = { price: livePrice * multiplier, color: '#b6a0ff', lineWidth: 1 as const, lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: 'Cotação' }
    if (quoteRef.current) quoteRef.current.applyOptions(options)
    else quoteRef.current = candles.createPriceLine(options)
  }, [livePrice, seconds, demo, multiplier, metric, symbol])

  const zoom = (factor: number) => {
    const scale = chartRef.current?.timeScale(), range = scale?.getVisibleLogicalRange()
    if (scale && range) { const center = (range.from + range.to) / 2, half = Math.max(5, Math.min(250, (range.to - range.from) * factor / 2)); scale.setVisibleLogicalRange({ from: center - half, to: center + half }) }
  }
  const resetView = () => {
    const chart = chartRef.current
    if (!chart) return
    chart.priceScale('right').applyOptions({ autoScale: true })
    chart.timeScale().setVisibleLogicalRange(nextChartRange([], dataRef.current, null))
  }
  const toggleFullscreen = () => setExpanded((value) => !value)
  useEffect(() => {
    if (!expanded) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false) }
    document.addEventListener('keydown', escape)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', escape) }
  }, [expanded])
  return <div className={`paper-candle-host ${expanded ? 'is-expanded' : ''}`}>
    <div ref={legend} className="paper-chart-legend" aria-hidden="true"/>
    <div ref={host} className="paper-tradingview-canvas" role="img" aria-label={`Gráfico TradingView de ${symbol}, ${metric === 'mcap' ? 'capitalização estimada' : 'preço'}, com ${points.length} velas em USD, volume e cursor. Use arraste, rolagem ou botões para navegar.`}/>
    <div className="paper-chart-controls"><a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer">TradingView Lightweight Charts™</a><div><button type="button" aria-label="Reduzir zoom do gráfico" onClick={() => zoom(1.25)}>−</button><button type="button" aria-label="Ampliar gráfico" onClick={() => zoom(.8)}>+</button><button type="button" onClick={() => { chartRef.current?.priceScale('right').applyOptions({ autoScale: true }); chartRef.current?.timeScale().fitContent() }}>Tudo</button><button type="button" onClick={resetView}>Auto</button><button type="button" onClick={() => { const scale = chartRef.current?.priceScale('right'); if (scale) scale.applyOptions({ mode: scale.options().mode === PriceScaleMode.Logarithmic ? PriceScaleMode.Normal : PriceScaleMode.Logarithmic, autoScale: true }) }}>Log / linear</button><button type="button" aria-pressed={expanded} onClick={toggleFullscreen}>{expanded ? 'Sair da tela cheia' : 'Tela cheia'}</button></div></div>
    <span className="paper-chart-attribution">Copyright (с) 2025 TradingView, Inc.</span>
  </div>
}
