import test from 'node:test'
import assert from 'node:assert/strict'
import { chartBars, formingQuoteCandle, nextChartRange } from './paper-chart-data.ts'

const bars = (start: number, count: number) => chartBars(Array.from({ length: count }, (_, i) => ({ time: (start + i) * 1000, price: 10, open: 9, high: 11, low: 8 })))

test('scrolling through history remains anchored after a rolling window discards its first candle', () => {
  const range = nextChartRange(bars(0, 100), bars(1, 100), { from: 20, to: 40 })
  assert.deepEqual(range, { from: 19, to: 39 })
})

test('new candles follow the latest trade without resetting the user zoom span', () => {
  const range = nextChartRange(bars(0, 100), bars(0, 101), { from: 86, to: 106 })
  assert.equal(range.to - range.from, 20)
  assert.equal(range.to, 107)
})

test('prepending available older history preserves the exact viewed time window', () => {
  assert.deepEqual(nextChartRange(bars(20, 100), bars(0, 120), { from: 20, to: 40 }), { from: 40, to: 60 })
})

test('invalid candles cannot reach TradingView and estimated market cap scales OHLC, not volume', () => {
  const rows = chartBars([{ time: 1000, price: .2, open: .1, high: .3, low: .05, volume: 50 }, { time: 2000, price: NaN }, { time: 3000, price: 1, low: -1 }], 1000)
  assert.deepEqual(rows, [{ time: 1, open: 100, high: 300, low: 50, close: 200, volume: 50 }])
})

test('forming candle reacts to successive quotes before another trade poll, retaining its open and extremes', () => {
  const historical = chartBars([{ time: 60_000, price: 10, open: 9, high: 11, low: 8, volume: 25 }])
  const first = formingQuoteCandle(historical, null, { price: 12, observedAt: 90_000 }, 60_000)
  const second = formingQuoteCandle(historical, first, { price: 7, observedAt: 95_000 }, 60_000)
  assert.deepEqual(second, { time: 60, open: 9, high: 12, low: 7, close: 7, volume: 25, estimated: true })
  assert.equal(historical[0].close, 10)
  const next = formingQuoteCandle(historical, second, { price: 13, observedAt: 125_000 }, 60_000)
  assert.deepEqual(next, { time: 120, open: 13, high: 13, low: 13, close: 13, volume: 0, estimated: true })
})

test('quote overlays cannot overwrite newer trades or accept invalid prices', () => {
  const history = bars(120, 1)
  assert.equal(formingQuoteCandle(history, null, { price: 12, observedAt: 90_000 }, 60_000), null)
  assert.equal(formingQuoteCandle(history, null, { price: 12, observedAt: 125_000, lastTradeAt: 126_000 }, 60_000), null)
  assert.equal(formingQuoteCandle([], null, { price: NaN, observedAt: 125_000 }, 60_000), null)
  assert.equal(formingQuoteCandle([], null, { price: 0, observedAt: 125_000 }, 60_000), null)
})

test('history arriving after the initial quote restores a useful chart range instead of oversized candles', () => {
  const quote = { ...bars(120, 1)[0], estimated: true }
  assert.deepEqual(nextChartRange([quote], bars(0, 121), { from: -2, to: 7 }), { from: 30, to: 127 })
})
