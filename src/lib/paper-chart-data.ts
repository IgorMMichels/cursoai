import type { PaperPoint } from './paper-trading'

export type ChartBar = { time: number; open: number; high: number; low: number; close: number; volume: number }
export type ChartRange = { from: number; to: number }

export function chartBars(points: PaperPoint[], multiplier = 1): ChartBar[] {
  if (!Number.isFinite(multiplier) || multiplier <= 0) return []
  const rows = new Map<number, ChartBar>()
  for (const p of points) {
    const open = p.open ?? p.price, high = p.high ?? p.price, low = p.low ?? p.price
    if (![p.time, p.price, open, high, low].every(Number.isFinite) || Math.min(p.price, open, high, low) <= 0 || p.time < 0) continue
    const bar = { time: Math.floor(p.time / 1000), open: open * multiplier, high: Math.max(high, open, p.price) * multiplier, low: Math.min(low, open, p.price) * multiplier, close: p.price * multiplier, volume: Math.max(0, Number.isFinite(p.volume) ? p.volume! : 0) }
    if ([bar.open, bar.high, bar.low, bar.close].every(Number.isFinite)) rows.set(bar.time, bar)
  }
  return [...rows.values()].sort((a, b) => a.time - b.time)
}

export function sameChartBar(a: ChartBar, b: ChartBar) {
  return a.time === b.time && a.open === b.open && a.high === b.high && a.low === b.low && a.close === b.close && a.volume === b.volume
}

/** Keep zoom span and anchor through append, prepend and rolling-window removal. */
export function nextChartRange(previous: ChartBar[], next: ChartBar[], range: ChartRange | null): ChartRange {
  const last = next.length - 1
  if (!range || !previous.length) return { from: Math.max(-2, last - 90), to: last + 7 }
  const span = range.to - range.from
  if (range.to >= previous.length - 1) return { from: last + 7 - span, to: last + 7 }
  const anchor = Math.max(0, Math.min(previous.length - 1, Math.floor(range.from)))
  const nextIndex = next.findIndex((bar) => bar.time === previous[anchor].time)
  if (nextIndex >= 0) { const shift = nextIndex - anchor; return { from: range.from + shift, to: range.to + shift } }
  // The viewed history fell outside the provider's available window.
  return { from: -2, to: Math.min(last + 7, span - 2) }
}
