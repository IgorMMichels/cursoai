import test from 'node:test'
import assert from 'node:assert/strict'
import { aggregatePaperTrades, mergePaperSeries, paperHistory, paperTokenImage, refreshPaperPortfolio } from './paper-market.ts'
import { demoPaperMarket } from './paper-trading.ts'

test('portfolio refresh batches multiple pools into one request per network', async () => {
  const original = globalThis.fetch, urls: string[] = []
  const prototype = demoPaperMarket().market
  const markets = [
    { ...prototype, demo: false, address: 'mint-a', pair: 'pool-a', id: 'a' },
    { ...prototype, demo: false, address: 'mint-b', pair: 'pool-b', id: 'b' },
    { ...prototype, demo: false, chain: 'base' as const, address: '0xabc', pair: 'pool-c', id: 'c' },
  ]
  globalThis.fetch = async (url) => {
    urls.push(String(url))
    return new Response(JSON.stringify({ pairs: markets.map((market, index) => ({ chainId: market.chain, pairAddress: market.pair, baseToken: { address: market.address, symbol: market.symbol }, quoteToken: { address: 'usd', symbol: 'USD' }, priceUsd: String(index + 1) })) }), { status: 200 })
  }
  try {
    const result = await refreshPaperPortfolio(markets, new AbortController().signal)
    assert.equal(urls.length, 2); assert.ok(urls.some((url) => url.endsWith('/solana/pool-a,pool-b')))
    assert.deepEqual(result.map((item) => item.price), [1, 2, 3])
  } finally { globalThis.fetch = original }
})

test('new swaps update minute candles and extend history without doubling overlapping volume', () => {
  const historical = [{ time: 60_000, open: 5, high: 10, low: 4, price: 8, volume: 100 }]
  const trades = [{ id: 'old', time: 10_000, price: 1, volume: 2 }, { id: 'new', time: 90_000, price: 12, volume: 20 }, { id: 'next', time: 125_000, price: 11, volume: 30 }]
  const bars = mergePaperSeries(historical, trades, 60_000)
  assert.deepEqual(bars, [{ time: 60_000, open: 5, high: 12, low: 4, price: 12, volume: 100 }, { time: 120_000, open: 11, high: 11, low: 11, price: 11, volume: 30 }])
  assert.deepEqual(mergePaperSeries(bars, trades, 60_000), bars)
})

test('second candles aggregate actual trades into OHLCV without filling empty periods', () => {
  const ticks = [{ id: 'c', time: 16000, price: 8, volume: 4 }, { id: 'b', time: 3000, price: 12, volume: 3 }, { id: 'a', time: 1000, price: 10, volume: 2 }]
  assert.deepEqual(aggregatePaperTrades(ticks, 5000), [
    { time: 0, open: 10, high: 12, low: 10, price: 12, volume: 5 },
    { time: 15000, open: 8, high: 8, low: 8, price: 8, volume: 4 },
  ])
  assert.equal(aggregatePaperTrades(ticks, 1000).length, 3)
  assert.equal(aggregatePaperTrades(ticks, 10000).length, 2)
  assert.equal(aggregatePaperTrades(ticks, 15000).length, 2)
  assert.throws(() => aggregatePaperTrades(ticks, 0))
})

test('trade candles use the selected token price for buys and sells, excluding unrelated tokens', async () => {
  const original = globalThis.fetch
  const market = { ...demoPaperMarket().market, id: 'test:trades', address: 'requested', demo: false }
  globalThis.fetch = async () => new Response(JSON.stringify({ data: [
    { id: 'buy', attributes: { block_timestamp: '2026-10-03T12:00:01Z', from_token_address: 'SOL', to_token_address: 'requested', price_from_in_usd: '120', price_to_in_usd: '0.2', volume_in_usd: '4' } },
    { id: 'sell', attributes: { block_timestamp: '2026-10-03T12:00:02Z', from_token_address: 'requested', to_token_address: 'SOL', price_from_in_usd: '0.3', price_to_in_usd: '120', volume_in_usd: '5' } },
    { id: 'other', attributes: { block_timestamp: '2026-10-03T12:00:03Z', from_token_address: 'other', to_token_address: 'SOL', price_from_in_usd: '999', price_to_in_usd: '120' } },
  ] }), { status: 200 })
  try {
    const candles = await paperHistory(market, '5s', new AbortController().signal)
    assert.equal(candles.length, 1)
    assert.deepEqual(candles[0], { time: Date.parse('2026-10-03T12:00:00Z'), open: .2, high: .3, low: .2, price: .3, volume: 9 })
  } finally { globalThis.fetch = original }
})

test('image fallback matches the requested token, not the other asset in the pool', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ data: [
    { attributes: { address: 'other', image_url: 'https://example.com/other.png' } },
    { attributes: { address: 'requested', image_url: 'https://example.com/token.png' } },
  ] }), { status: 200 })
  try { assert.equal(await paperTokenImage({ ...demoPaperMarket().market, address: 'requested' }, new AbortController().signal), 'https://example.com/token.png') }
  finally { globalThis.fetch = original }
})

test('trades in the same second keep source execution order rather than alphabetic IDs', () => {
  const candles = aggregatePaperTrades([
    { id: 'z-first', time: 1000, price: 10, volume: 1 },
    { id: 'a-last', time: 1000, price: 7, volume: 2 },
  ], 1000)
  assert.equal(candles[0].open, 10)
  assert.equal(candles[0].price, 7)
  assert.equal(candles[0].high, 10)
  assert.equal(candles[0].low, 7)
})

test('newest-first provider responses form same-second candles in chronological source order', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ data: [
    { id: 'a-newest', attributes: { block_timestamp: '2026-10-03T12:00:01Z', from_token_address: 'selected', price_from_in_usd: '7', volume_in_usd: '2' } },
    { id: 'z-oldest', attributes: { block_timestamp: '2026-10-03T12:00:01Z', from_token_address: 'selected', price_from_in_usd: '10', volume_in_usd: '1' } },
  ] }), { status: 200 })
  try {
    const candles = await paperHistory({ ...demoPaperMarket().market, id: 'test:source-order', address: 'selected' }, '1s', new AbortController().signal)
    assert.equal(candles[0].open, 10)
    assert.equal(candles[0].price, 7)
    assert.equal(candles[0].volume, 3)
  } finally { globalThis.fetch = original }
})
