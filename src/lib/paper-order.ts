import { refreshPaperMarket } from './paper-market.ts'
import { executePaperTrade, type PaperCosts, type PaperMarket, type PaperWallet } from './paper-trading.ts'

/** Fetch first, then read the current wallet. A failed/cancelled request never debits it. */
export async function preparePaperOrder(getWallet: () => PaperWallet, market: PaperMarket, side: 'buy' | 'sell', amount: number, costs: PaperCosts, reason: string, signal: AbortSignal, quoteProvider = refreshPaperMarket) {
  const quote = market.demo ? market : await quoteProvider(market, signal)
  signal.throwIfAborted()
  if (quote.id !== market.id || quote.chain !== market.chain || quote.address !== market.address || quote.pair !== market.pair) throw new Error('A cotação não corresponde ao token selecionado.')
  return { market: { ...quote, imageUrl: quote.imageUrl ?? market.imageUrl }, wallet: executePaperTrade(getWallet(), quote, side, amount, costs, reason) }
}
