/** One polling lifecycle for market adapters; no overlapping requests or late commits. */
export type PollRuntime = {
  now: () => number
  visible: () => boolean
  schedule: (callback: () => void, delay: number) => unknown
  cancel: (timer: unknown) => void
  subscribe: (callback: () => void) => () => void
}
export function startPaperPolling(task: (signal: AbortSignal) => Promise<void>, delay: number, runtime: PollRuntime) {
  const controller = new AbortController()
  let timer: unknown, pending = false, failures = 0, attemptedAt = -Infinity
  const run = async () => {
    if (controller.signal.aborted || pending || !runtime.visible()) return
    runtime.cancel(timer)
    pending = true; attemptedAt = runtime.now()
    try { await task(controller.signal); failures = 0 }
    catch { failures++ }
    finally {
      pending = false
      if (!controller.signal.aborted && runtime.visible()) timer = runtime.schedule(() => { void run() }, failures ? Math.min(60_000, delay * 2 ** failures) : delay)
    }
  }
  const unsubscribe = runtime.subscribe(() => {
    runtime.cancel(timer)
    if (runtime.visible()) {
      // Visibility, focus and online often fire together. Coalesce this burst.
      const wait = Math.max(0, 1000 - (runtime.now() - attemptedAt))
      if (!pending) timer = runtime.schedule(() => { void run() }, wait)
    }
  })
  void run()
  return () => { controller.abort(); runtime.cancel(timer); unsubscribe() }
}

export function browserPaperRuntime(): PollRuntime {
  return {
    now: Date.now, visible: () => !document.hidden && navigator.onLine,
    schedule: (callback, delay) => window.setTimeout(callback, delay),
    cancel: (timer) => window.clearTimeout(timer as number | undefined),
    subscribe: (callback) => {
      document.addEventListener('visibilitychange', callback)
      window.addEventListener('focus', callback); window.addEventListener('online', callback); window.addEventListener('offline', callback)
      return () => { document.removeEventListener('visibilitychange', callback); window.removeEventListener('focus', callback); window.removeEventListener('online', callback); window.removeEventListener('offline', callback) }
    },
  }
}
