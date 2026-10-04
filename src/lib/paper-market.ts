import type { PaperChain, PaperMarket, PaperPoint } from './paper-trading'

const network: Record<PaperChain, string> = { solana: 'solana', ethereum: 'eth', base: 'base' }
type Row = Record<string, unknown>
const object = (value: unknown): Row => value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}
const numeric = (value: unknown): number | null => value === null || value === undefined || value === '' ? null : Number.isFinite(Number(value)) ? Number(value) : null
const label = (value: unknown, fallback: string) => typeof value === 'string' ? value.slice(0, 120) : fallback

async function request(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(12_000)]) })
  if (response.status === 429) throw new Error('A fonte de dados atingiu o limite. Aguarde um minuto para tentar novamente.')
  if (!response.ok) throw new Error('A fonte de mercado está indisponível. Tente novamente em instantes.')
  return response.json()
}

function parseMarket(value: unknown, chain: PaperChain, address: string): PaperMarket | null {
  const row = object(value), base = object(row.baseToken), quote = object(row.quoteToken)
  const same = (value: unknown) => typeof value === 'string' && (chain === 'solana' ? value === address : value.toLowerCase() === address.toLowerCase())
  const side = same(base.address) ? 'base' : same(quote.address) ? 'quote' : null
  const usd = numeric(row.priceUsd), native = numeric(row.priceNative)
  if (row.chainId !== chain || !side || typeof row.pairAddress !== 'string' || !usd || usd <= 0) return null
  const price = side === 'base' ? usd : native && native > 0 ? usd / native : null
  if (!price || !Number.isFinite(price) || price <= 0) return null
  const target = side === 'base' ? base : quote
  const nonnegative = (value: unknown) => { const number = numeric(value); return number !== null && number >= 0 ? number : null }
  return {
    id: `${chain}:${address}:${row.pairAddress}`, chain, address, pair: row.pairAddress, name: label(target.name, 'Token'),
    symbol: label(target.symbol, 'TOKEN'), quoteSymbol: label((side === 'base' ? quote : base).symbol, 'USD'),
    dex: label(row.dexId, 'DEX'), price, liquidity: nonnegative(object(row.liquidity).usd), volume: nonnegative(object(row.volume).h24),
    change24h: side === 'base' ? numeric(object(row.priceChange).h24) : null,
    marketCap: side === 'base' ? nonnegative(row.marketCap) : null, fdv: side === 'base' ? nonnegative(row.fdv) : null,
    observedAt: Date.now(), demo: false, side, imageUrl: side === 'base' ? safeImage(object(row.info).imageUrl) : undefined,
  }
}

export async function resolvePaperToken(chain: PaperChain, input: string, signal: AbortSignal): Promise<PaperMarket[]> {
  const address = chain === 'solana' ? input.trim() : input.trim().toLowerCase()
  if (!(chain === 'solana' ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ : /^0x[0-9a-fA-F]{40}$/).test(address)) {
    throw new Error(chain === 'solana' ? 'Cole um endereço mint válido da Solana.' : 'Cole um contrato da rede selecionada: 0x seguido de 40 caracteres hexadecimais.')
  }
  const result = await request(`https://api.dexscreener.com/token-pairs/v1/${chain}/${encodeURIComponent(address)}`, signal)
  if (!Array.isArray(result)) throw new Error('Resposta de mercado inválida.')
  const markets = result.map((row) => parseMarket(row, chain, address)).filter((row): row is PaperMarket => !!row)
    .sort((a, b) => (b.liquidity ?? 0) - (a.liquidity ?? 0))
  if (!markets.length) throw new Error('Nenhuma pool com preço disponível foi encontrada. Confira a rede e o CA; tokens novos podem ainda não estar indexados.')
  return markets
}

export async function refreshPaperMarket(market: PaperMarket, signal: AbortSignal): Promise<PaperMarket> {
  const result = object(await request(`https://api.dexscreener.com/latest/dex/pairs/${market.chain}/${encodeURIComponent(market.pair)}`, signal))
  const rows = Array.isArray(result.pairs) ? result.pairs : []
  const updated = rows.map((row) => parseMarket(row, market.chain, market.address)).find((row) => row?.pair === market.pair)
  if (!updated) throw new Error('A pool não retornou preço válido. Ordens pausadas até a próxima atualização.')
  return updated
}

export type PaperInterval = '1s' | '5s' | '10s' | '15s' | '1m' | '5m' | '15m' | '1h'
export const paperIntervals: PaperInterval[] = ['1s', '5s', '10s', '15s', '1m', '5m', '15m', '1h']
export async function paperHistory(market: PaperMarket, interval: PaperInterval, signal: AbortSignal): Promise<PaperPoint[]> {
  if (interval.endsWith('s')) return aggregatePaperTrades(await recentPaperTrades(market, signal), Number.parseInt(interval) * 1000)
  const frame = interval === '1h' ? 'hour' : 'minute'
  const aggregate = interval === '5m' ? 5 : interval === '15m' ? 15 : 1
  const result = object(await request(`https://api.geckoterminal.com/api/v2/networks/${network[market.chain]}/pools/${encodeURIComponent(market.pair)}/ohlcv/${frame}?aggregate=${aggregate}&limit=120&currency=usd&token=${market.side}`, signal))
  const list = object(object(result.data).attributes).ohlcv_list
  if (!Array.isArray(list)) throw new Error('Histórico não disponível para esta pool.')
  const points: PaperPoint[] = []
  for (const row of list) {
    if (!Array.isArray(row)) continue
    const time = numeric(row[0]), price = numeric(row[4])
    if (time !== null && time > 0 && price !== null && price > 0) points.push({ time: time * 1000, price, open: numeric(row[1]) ?? price, high: numeric(row[2]) ?? price, low: numeric(row[3]) ?? price, volume: numeric(row[5]) ?? 0 })
  }
  if (!points.length) throw new Error('A fonte ainda não tem velas históricas para esta pool.')
  return points.sort((a, b) => a.time - b.time)
}


function safeImage(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : undefined } catch { return undefined }
}

export async function paperTokenImage(market: PaperMarket, signal: AbortSignal): Promise<string | undefined> {
  if (market.imageUrl) return market.imageUrl
  const result = object(await request(`https://api.geckoterminal.com/api/v2/networks/${network[market.chain]}/pools/${encodeURIComponent(market.pair)}/info`, signal))
  if (!Array.isArray(result.data)) return undefined
  const token = result.data.map((item) => object(object(item).attributes)).find((item) => typeof item.address === 'string' && (market.chain === 'solana' ? item.address === market.address : item.address.toLowerCase() === market.address.toLowerCase()))
  return safeImage(token?.image_url)
}

export type PaperTick = { id: string; time: number; price: number; volume: number; order?: number }
const tradeCache = new Map<string, { fetchedAt: number; ticks: PaperTick[] }>()
export async function recentPaperTrades(market: PaperMarket, signal: AbortSignal): Promise<PaperTick[]> {
  const previous = tradeCache.get(market.id)
  if (previous && Date.now() - previous.fetchedAt < 14_000) return previous.ticks
  const result = object(await request(`https://api.geckoterminal.com/api/v2/networks/${network[market.chain]}/pools/${encodeURIComponent(market.pair)}/trades`, signal))
  if (!Array.isArray(result.data)) throw new Error('Negócios recentes indisponíveis para esta pool.')
  const ticks = new Map((previous?.ticks ?? []).map((tick) => [tick.id, tick]))
  const same = (value: unknown) => typeof value === 'string' && (market.chain === 'solana' ? value === market.address : value.toLowerCase() === market.address.toLowerCase())
  let sequence = Math.max(0, ...[...ticks.values()].map((tick) => tick.order ?? 0))
  // API response is newest-first; retain its order for trades sharing a timestamp.
  for (const item of [...result.data].reverse()) {
    const row = object(item), attributes = object(row.attributes)
    const price = same(attributes.from_token_address) ? numeric(attributes.price_from_in_usd) : same(attributes.to_token_address) ? numeric(attributes.price_to_in_usd) : null
    const time = typeof attributes.block_timestamp === 'string' ? Date.parse(attributes.block_timestamp) : NaN
    if (typeof row.id === 'string' && Number.isFinite(time) && price !== null && price > 0) ticks.set(row.id, { id: row.id, time, price, volume: Math.max(0, numeric(attributes.volume_in_usd) ?? 0), order: ticks.get(row.id)?.order ?? ++sequence })
  }
  const data = [...ticks.values()].sort((a, b) => a.time - b.time || (a.order ?? 0) - (b.order ?? 0)).slice(-3000)
  if (tradeCache.size >= 12 && !tradeCache.has(market.id)) tradeCache.delete(tradeCache.keys().next().value!)
  tradeCache.set(market.id, { fetchedAt: Date.now(), ticks: data })
  if (!data.length) throw new Error('Ainda não há negócios para formar velas neste intervalo. Tente 1m ou aguarde novos negócios.')
  return data
}

/** Batch held tokens by network: at most one request per network per portfolio refresh. */
export async function refreshPaperPortfolio(markets: PaperMarket[], signal: AbortSignal): Promise<PaperMarket[]> {
  const groups = new Map<PaperChain, PaperMarket[]>()
  for (const market of markets.filter((item) => !item.demo)) groups.set(market.chain, [...(groups.get(market.chain) ?? []), market])
  const results = await Promise.allSettled([...groups].map(async ([chain, entries]) => {
    const pairs = [...new Set(entries.map((item) => item.pair))].map(encodeURIComponent).join(',')
    const result = object(await request(`https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairs}`, signal))
    const rows = Array.isArray(result.pairs) ? result.pairs : []
    return entries.flatMap((entry) => {
      const updated = rows.map((row) => parseMarket(row, chain, entry.address)).find((row) => row?.pair === entry.pair)
      return updated ? [{ ...updated, imageUrl: updated.imageUrl ?? entry.imageUrl }] : []
    })
  }))
  const updated = results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
  if (markets.length && !updated.length) throw new Error('Não foi possível atualizar as outras posições.')
  return updated
}

/** Historical OHLCV is authoritative. Recent swaps extend only its latest bucket.
 * Volume uses max, never sum: the historical and trade windows overlap. */
export function mergePaperSeries(history: PaperPoint[], ticks: PaperTick[], duration: number): PaperPoint[] {
  const bars = aggregatePaperTrades(ticks, duration)
  const merged = new Map(history.map((bar) => [bar.time, { ...bar }]))
  const last = history.at(-1)?.time ?? -Infinity
  for (const bar of bars) {
    if (bar.time < last) continue
    const old = merged.get(bar.time)
    merged.set(bar.time, old ? { ...bar, open: old.open ?? old.price, high: Math.max(old.high ?? old.price, bar.high!), low: Math.min(old.low ?? old.price, bar.low!), volume: Math.max(old.volume ?? 0, bar.volume ?? 0) } : bar)
  }
  return [...merged.values()].sort((a, b) => a.time - b.time).slice(-180)
}

export function paperIntervalDuration(interval: PaperInterval) {
  return Number.parseInt(interval) * (interval.endsWith('s') ? 1000 : interval.endsWith('h') ? 3_600_000 : 60_000)
}

/** Only actual trade buckets: no interpolation, invented trades or empty-period candles. */
export function aggregatePaperTrades(ticks: PaperTick[], duration: number): PaperPoint[] {
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Intervalo inválido.')
  const buckets = new Map<number, PaperPoint>()
  for (const tick of [...ticks].sort((a, b) => a.time - b.time || (a.order ?? 0) - (b.order ?? 0))) {
    const time = Math.floor(tick.time / duration) * duration
    const candle = buckets.get(time)
    if (candle) { candle.price = tick.price; candle.high = Math.max(candle.high!, tick.price); candle.low = Math.min(candle.low!, tick.price); candle.volume = (candle.volume ?? 0) + tick.volume }
    else buckets.set(time, { time, open: tick.price, high: tick.price, low: tick.price, price: tick.price, volume: tick.volume })
  }
  return [...buckets.values()].slice(-180)
}

