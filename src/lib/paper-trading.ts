export type PaperChain = 'solana' | 'ethereum' | 'base'
export type PaperMarket = {
  id: string; chain: PaperChain; address: string; pair: string; name: string; symbol: string
  quoteSymbol: string; dex: string; price: number; liquidity: number | null; volume: number | null
  change24h: number | null; marketCap: number | null; fdv: number | null
  observedAt: number; demo: boolean; side: 'base' | 'quote'; imageUrl?: string
}
export type PaperPoint = { time: number; price: number; open?: number; high?: number; low?: number; volume?: number }
export type PaperPosition = { market: PaperMarket; quantity: number; cost: number }
export type PaperTrade = {
  id: string; marketId: string; symbol: string; chain: PaperChain; demo: boolean; side: 'buy' | 'sell'
  time: number; quantity: number; price: number; gross: number; fee: number; net: number
  pnl: number | null; reason: string; feePercent: number; slippagePercent: number
}
export type PaperWallet = { version: 1; cash: number; positions: PaperPosition[]; trades: PaperTrade[] }
export type PaperCosts = { feePercent: number; slippagePercent: number; fixedFee: number }
export const PAPER_INITIAL_CASH = 10_000
export const newPaperWallet = (): PaperWallet => ({ version: 1, cash: PAPER_INITIAL_CASH, positions: [], trades: [] })

export function samePaperAsset(a: PaperMarket, b: PaperMarket) {
  if (a.demo || b.demo) return a.demo === b.demo && a.id === b.id
  return a.chain === b.chain && (a.chain === 'solana' ? a.address === b.address : a.address.toLowerCase() === b.address.toLowerCase())
}
export function paperPositionFor(wallet: PaperWallet, market: PaperMarket): PaperPosition | undefined {
  const matches = wallet.positions.filter((item) => samePaperAsset(item.market, market))
  if (!matches.length) return undefined
  return { market, quantity: matches.reduce((sum, item) => sum + item.quantity, 0), cost: matches.reduce((sum, item) => sum + item.cost, 0) }
}

export function paperFill(side: 'buy' | 'sell', price: number, amount: number, costs: PaperCosts) {
  if (![price, amount, costs.feePercent, costs.slippagePercent, costs.fixedFee].every(Number.isFinite)
    || price <= 0 || amount <= 0 || costs.fixedFee < 0 || costs.feePercent < 0 || costs.feePercent > 30
    || costs.slippagePercent < 0 || costs.slippagePercent > 30) throw new Error('Confira valor, preço e custos da operação.')
  const execution = price * (side === 'buy' ? 1 + costs.slippagePercent / 100 : 1 - costs.slippagePercent / 100)
  const quantity = side === 'buy' ? (amount - costs.fixedFee) / (execution * (1 + costs.feePercent / 100)) : amount
  const gross = quantity * execution
  const fee = gross * costs.feePercent / 100 + costs.fixedFee
  const net = side === 'buy' ? gross + fee : gross - fee
  if (![execution, quantity, gross, fee, net].every(Number.isFinite) || quantity <= 0 || net <= 0) {
    throw new Error('O valor precisa cobrir os custos da operação.')
  }
  return { price: execution, quantity, gross, fee, net }
}

export function executePaperTrade(wallet: PaperWallet, market: PaperMarket, side: 'buy' | 'sell', amount: number, costs: PaperCosts, reason = '', now = Date.now()): PaperWallet {
  if (!Number.isFinite(market.observedAt) || market.observedAt > now + 5_000 || (!market.demo && now - market.observedAt > 90_000)) {
    throw new Error('Atualize a cotação antes de simular a ordem.')
  }
  const fill = paperFill(side, market.price, amount, costs)
  const existing = paperPositionFor(wallet, market)
  if (side === 'buy' && fill.net > wallet.cash + 1e-8) throw new Error('Saldo fictício insuficiente.')
  if (side === 'buy' && !existing && wallet.positions.length >= 30) throw new Error('Feche uma posição antes de adicionar outro token.')
  if (side === 'sell' && (!existing || fill.quantity > existing.quantity + existing.quantity * 1e-12)) throw new Error('Quantidade maior que a posição disponível.')
  const allocated = side === 'sell' && existing ? existing.cost * (fill.quantity / existing.quantity) : 0
  const positions = wallet.positions.filter((position) => !samePaperAsset(position.market, market))
  if (side === 'buy') {
    positions.push({ market, quantity: (existing?.quantity ?? 0) + fill.quantity, cost: (existing?.cost ?? 0) + fill.net })
  } else if (existing && existing.quantity - fill.quantity > existing.quantity * 1e-10) {
    positions.push({ market, quantity: existing.quantity - fill.quantity, cost: Math.max(0, existing.cost - allocated) })
  }
  const trade: PaperTrade = {
    id: `${now}-${Math.random().toString(36).slice(2, 9)}`, marketId: market.id, symbol: market.symbol,
    chain: market.chain, demo: market.demo, side, time: now, ...fill,
    pnl: side === 'sell' ? fill.net - allocated : null, reason: reason.trim().slice(0, 500),
    feePercent: costs.feePercent, slippagePercent: costs.slippagePercent,
  }
  return { version: 1, cash: Math.max(0, wallet.cash + (side === 'buy' ? -fill.net : fill.net)), positions, trades: [trade, ...wallet.trades].slice(0, 200) }
}

export function markPaperWallet(wallet: PaperWallet, market: PaperMarket): PaperWallet {
  const position = paperPositionFor(wallet, market)
  if (!position) return wallet
  return { ...wallet, positions: [...wallet.positions.filter((item) => !samePaperAsset(item.market, market)), position] }
}

export function restorePaperWallet(raw: string | null): PaperWallet {
  if (!raw) return newPaperWallet()
  try {
    const value = JSON.parse(raw) as PaperWallet
    const positive = (number: number) => Number.isFinite(number) && number > 0
    const nonnegative = (number: number) => Number.isFinite(number) && number >= 0
    if (value.version !== 1 || !nonnegative(value.cash) || !Array.isArray(value.positions) || !Array.isArray(value.trades)
      || value.positions.length > 30 || value.trades.length > 200) throw new Error('invalid')
    for (const position of value.positions) {
      const market = position.market
      if (!positive(position.quantity) || !positive(position.cost) || !market || !positive(market.price)
        || !nonnegative(market.observedAt) || !['solana', 'ethereum', 'base'].includes(market.chain)
        || typeof market.demo !== 'boolean' || !['base', 'quote'].includes(market.side)
        || ![market.id, market.symbol, market.address, market.name, market.pair, market.dex, market.quoteSymbol].every((item) => typeof item === 'string')
        || ![market.liquidity, market.volume, market.marketCap, market.fdv].every((item) => item === null || nonnegative(item))
        || !(market.change24h === null || Number.isFinite(market.change24h))) throw new Error('invalid')
    }
    if (new Set(value.positions.map((position) => position.market.id)).size !== value.positions.length) throw new Error('invalid')
    for (const trade of value.trades) {
      if (![trade.id, trade.marketId, trade.symbol, trade.reason].every((item) => typeof item === 'string')
        || !['buy', 'sell'].includes(trade.side) || !['solana', 'ethereum', 'base'].includes(trade.chain)
        || typeof trade.demo !== 'boolean' || ![trade.quantity, trade.price, trade.gross, trade.net].every(positive)
        || ![trade.fee, trade.time, trade.feePercent, trade.slippagePercent].every(nonnegative)
        || !(trade.pnl === null || Number.isFinite(trade.pnl))) throw new Error('invalid')
    }
    return value
  } catch { return newPaperWallet() }
}

export function demoPaperMarket(step = 0): { market: PaperMarket; points: PaperPoint[] } {
  const start = Date.UTC(2026, 0, 1, 12)
  const points = Array.from({ length: 65 + step }, (_, index) => ({
    time: start + index * 60_000,
    price: 0.00012 * (1 + index * 0.003 + Math.sin(index * 0.37) * 0.16 + Math.cos(index * 0.13) * 0.08),
  })).map((point, index, series) => { const open = series[Math.max(0, index - 1)].price; return { ...point, open, high: Math.max(open, point.price), low: Math.min(open, point.price), volume: 0 } }).slice(-150)
  const price = points[points.length - 1].price
  return { points, market: {
    id: 'demo:luma', chain: 'solana', address: 'Cenário fictício, sem contrato', pair: 'demo', name: 'Luma', symbol: 'LUMA',
    quoteSymbol: 'USD', dex: 'Cenário didático', price, liquidity: 125_000, volume: 48_500,
    change24h: null, fdv: null, marketCap: null, observedAt: Date.now(), demo: true, side: 'base',
  } }
}
