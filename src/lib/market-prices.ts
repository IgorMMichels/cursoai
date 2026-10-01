export type CoinSymbol = 'BTC' | 'ETH' | 'SOL'
export type Period = '1H' | '24H' | '1W' | '1M'
export type Quote = { symbol: CoinSymbol; price: number; change24h: number; updatedAt: number }
export type PricePoint = { time: number; price: number }

const symbols: CoinSymbol[] = ['BTC', 'ETH', 'SOL']
const ids: Record<CoinSymbol, string> = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana' }
const hosts = ['https://data-api.binance.vision', 'https://api.binance.com']
const periods: Record<Period, { interval: string; limit: number; duration: number }> = {
  '1H': { interval: '1m', limit: 60, duration: 60 * 60_000 },
  '24H': { interval: '15m', limit: 96, duration: 24 * 60 * 60_000 },
  '1W': { interval: '1h', limit: 168, duration: 7 * 24 * 60 * 60_000 },
  '1M': { interval: '4h', limit: 180, duration: 30 * 24 * 60 * 60_000 },
}
const seriesCache = new Map<string, { at: number; points: PricePoint[] }>()
const pendingSeries = new Map<string, Promise<PricePoint[]>>()
const fallbackSeriesCache = new Map<string, { at: number; points: PricePoint[] }>()
const pendingFallbackSeries = new Map<string, Promise<PricePoint[]>>()
let quoteCache: { at: number; quotes: Quote[] } | undefined
let pendingQuotes: Promise<Quote[]> | undefined

async function json(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new Error(`API de mercado: ${response.status}`)
  return response.json() as Promise<unknown>
}

async function binance(path: string) {
  let failure: unknown
  for (const host of hosts) {
    try { return await json(`${host}${path}`) } catch (error) { failure = error }
  }
  throw failure
}

function valid(value: unknown) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) throw new Error('Preço inválido recebido da API.')
  return number
}

export async function getQuotes(): Promise<Quote[]> {
  if (quoteCache && Date.now() - quoteCache.at < 30_000) return quoteCache.quotes
  if (pendingQuotes) return pendingQuotes
  pendingQuotes = (async () => {
    const now = Date.now()
    try {
      const list = await binance(`/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols.map((symbol) => `${symbol}USDT`)))}`) as { symbol: string; lastPrice: string; priceChangePercent: string }[]
      const quotes = symbols.map((symbol) => {
        const row = list.find((item) => item.symbol === `${symbol}USDT`)
        if (!row) throw new Error(`Cotação ${symbol} ausente.`)
        return { symbol, price: valid(row.lastPrice), change24h: Number(row.priceChangePercent), updatedAt: now }
      })
      quoteCache = { at: now, quotes }
      return quotes
    } catch {
      const fallback = await json('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true') as Record<string, { usd: number; usd_24h_change: number }>
      const quotes = symbols.map((symbol) => ({ symbol, price: valid(fallback[ids[symbol]]?.usd), change24h: Number(fallback[ids[symbol]]?.usd_24h_change ?? 0), updatedAt: now }))
      quoteCache = { at: now, quotes }
      return quotes
    }
  })().finally(() => { pendingQuotes = undefined })
  return pendingQuotes
}

export function previousQuotes() { return quoteCache?.quotes ?? [] }

async function fallbackSeries(symbol: CoinSymbol, period: Period): Promise<PricePoint[]> {
  const days = period === '1H' || period === '24H' ? 1 : 30
  const key = `${symbol}:${days}`
  const cached = fallbackSeriesCache.get(key)
  if (cached && Date.now() - cached.at < 60_000) return cached.points
  const pending = pendingFallbackSeries.get(key)
  if (pending) return pending
  const request = (async () => {
    const data = await json(`https://api.coingecko.com/api/v3/coins/${ids[symbol]}/market_chart?vs_currency=usd&days=${days}`) as { prices: [number, number][] }
    const points = data.prices.map(([time, price]) => ({ time, price: valid(price) }))
    fallbackSeriesCache.set(key, { at: Date.now(), points })
    return points
  })().finally(() => { pendingFallbackSeries.delete(key) })
  pendingFallbackSeries.set(key, request)
  return request
}

export async function getSeries(symbol: CoinSymbol, period: Period): Promise<PricePoint[]> {
  const key = `${symbol}:${period}`
  const cached = seriesCache.get(key)
  if (cached && Date.now() - cached.at < 60_000) return cached.points
  const pending = pendingSeries.get(key)
  if (pending) return pending
  const request = (async () => {
    const config = periods[period]
    let points: PricePoint[]
    try {
      const rows = await binance(`/api/v3/klines?symbol=${symbol}USDT&interval=${config.interval}&limit=${config.limit}`) as [number, string, string, string, string][]
      points = rows.map((row) => ({ time: Number(row[0]), price: valid(row[4]) }))
    } catch {
      points = (await fallbackSeries(symbol, period)).filter(({ time }) => time >= Date.now() - config.duration)
    }
    if (points.length < 2) throw new Error('Gráfico indisponível.')
    seriesCache.set(key, { at: Date.now(), points })
    return points
  })().finally(() => { pendingSeries.delete(key) })
  pendingSeries.set(key, request)
  return request
}
