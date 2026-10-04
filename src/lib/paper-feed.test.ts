import test from 'node:test'
import assert from 'node:assert/strict'
import { startPaperPolling, type PollRuntime } from './paper-feed.ts'

function harness() {
  let now = 10_000, visible = true, event = () => {}, id = 0
  const timers = new Map<number, { callback: () => void; at: number }>()
  const runtime: PollRuntime = {
    now: () => now, visible: () => visible,
    schedule: (callback, delay) => { timers.set(++id, { callback, at: now + delay }); return id },
    cancel: (timer) => { timers.delete(timer as number) },
    subscribe: (callback) => { event = callback; return () => { event = () => {} } },
  }
  const flush = async () => { for (let index = 0; index < 8; index++) await Promise.resolve() }
  return { runtime, timers, flush,
    async advance(ms: number) { now += ms; const due = [...timers].filter(([, timer]) => timer.at <= now); for (const [key, timer] of due) { timers.delete(key); timer.callback() } await flush() },
    visible(value: boolean) { visible = value; event() }, event() { event() },
  }
}

test('polls immediately, automatically and resumes immediately when the tab returns', async () => {
  const h = harness(); let count = 0
  const stop = startPaperPolling(async () => { count++ }, 5000, h.runtime)
  await h.flush(); assert.equal(count, 1)
  await h.advance(5000); assert.equal(count, 2)
  h.visible(false); await h.advance(60_000); assert.equal(count, 2)
  h.visible(true); await h.advance(0); assert.equal(count, 3)
  h.event(); h.event(); await h.advance(0); assert.equal(count, 3)
  stop(); await h.advance(60_000); assert.equal(count, 3); assert.equal(h.timers.size, 0)
})

test('does not overlap slow requests, aborts obsolete selection and cannot restart it', async () => {
  const h = harness(); let count = 0, signal: AbortSignal | undefined, finish = () => {}
  const stop = startPaperPolling(async (current) => { count++; signal = current; await new Promise<void>((resolve) => { finish = resolve }) }, 5000, h.runtime)
  h.event(); await h.advance(60_000); assert.equal(count, 1)
  stop(); assert.equal(signal?.aborted, true)
  finish(); await h.flush(); assert.equal(h.timers.size, 0)
})

test('backs off after failures, then restores normal automatic updates', async () => {
  const h = harness(); let count = 0
  const stop = startPaperPolling(async () => { if (++count < 3) throw new Error('429') }, 5000, h.runtime)
  await h.flush(); await h.advance(5000); assert.equal(count, 1)
  await h.advance(5000); assert.equal(count, 2)
  await h.advance(19_000); assert.equal(count, 2)
  await h.advance(1000); assert.equal(count, 3)
  await h.advance(5000); assert.equal(count, 4)
  stop()
})
