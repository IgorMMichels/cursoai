import { useEffect, useState } from 'react'

export type PulseReport = { source: string; sourceId: string; title: string; url: string; publishedAt: string }
export type PulseNews = {
  id: string; title: string; summary: string; url: string; source: string; sourceId: string; publishedAt: string; assets: string[]; category: string;
  region?: string; language?: string; primary?: boolean; cryptoContext?: string;
  importance?: { score: number; reason: string; method: 'rules' | 'ai'; assessedAt: string; model?: string };
  verification?: { status: 'primary_source' | 'similar_coverage' | 'single_source'; verdict: 'not_checked'; score: null; reason: string; outlets: number; reports: PulseReport[] };
}
export type PulseFunding = { asset: string; rate: number; markPrice: number; nextFundingAt: string; observedAt: string; exchange: string; url: string }
export type PulseSource = { id: string; name: string; region?: string; primary?: boolean; status: 'live' | 'error' | 'demo'; lastSuccessAt: string | null; lastAttemptAt: string; error: string | null; itemCount: number }
export type PulseSnapshot = {
  version: 1; mode: 'live' | 'demo'; lastCycleAt: string | null; nextCycleAt: string | null; intervalSeconds: number; stale: boolean; persistenceHealthy: boolean;
  news: PulseNews[]; funding: PulseFunding[]; sources: PulseSource[];
  newsAnalysis?: { enabled: boolean; configured: boolean; model: string; status: string; lastSuccessAt: string | null; error: string | null };
  fundingSources: { asset: string; status: 'live' | 'error'; lastSuccessAt: string | null; error: string | null }[];
  fundingThresholdPercent: number; brief: string;
  channels: { platform: 'discord' | 'telegram'; configured: boolean; enabled: boolean; pending: number; lastStatus: string | null; lastAttemptAt: string | null }[];
}

const configuredBase = import.meta.env.VITE_BOTS_API_URL?.trim().replace(/\/+$/, '')
const apiBase = configuredBase || (import.meta.env.DEV ? '/bots-api' : null)
const httpsLink = (value: unknown) => typeof value === 'string' && /^https:\/\//.test(value)
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object'
const dateString = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value))
const reportRecord = (value: unknown) => record(value) && typeof value.source === 'string' && typeof value.sourceId === 'string' && typeof value.title === 'string' && httpsLink(value.url) && dateString(value.publishedAt)

function parseSnapshot(value: unknown): PulseSnapshot {
  if (!record(value) || value.version !== 1 || !['live', 'demo'].includes(String(value.mode)) || !Array.isArray(value.news) || !Array.isArray(value.funding) || !Array.isArray(value.sources) || !Array.isArray(value.fundingSources) || !Array.isArray(value.channels) || typeof value.brief !== 'string' || typeof value.intervalSeconds !== 'number' || !Number.isFinite(value.intervalSeconds) || typeof value.fundingThresholdPercent !== 'number' || !Number.isFinite(value.fundingThresholdPercent) || typeof value.stale !== 'boolean' || typeof value.persistenceHealthy !== 'boolean' || (value.lastCycleAt !== null && !dateString(value.lastCycleAt)) || (value.nextCycleAt !== null && !dateString(value.nextCycleAt))) throw new Error('O serviço retornou um feed inválido.')
  if (!value.news.every((item) => record(item) && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.summary === 'string' && typeof item.source === 'string' && typeof item.sourceId === 'string' && httpsLink(item.url) && dateString(item.publishedAt) && Array.isArray(item.assets) && item.assets.every((asset) => typeof asset === 'string') && typeof item.category === 'string')) throw new Error('Não foi possível interpretar as notícias.')
  if (!value.news.every((item) => (item.cryptoContext === undefined || typeof item.cryptoContext === 'string') && (item.region === undefined || typeof item.region === 'string') && (item.importance === undefined || record(item.importance) && Number.isInteger(item.importance.score) && Number(item.importance.score) >= 0 && Number(item.importance.score) <= 10 && ['rules', 'ai'].includes(String(item.importance.method)) && typeof item.importance.reason === 'string' && dateString(item.importance.assessedAt)) && (item.verification === undefined || record(item.verification) && ['primary_source', 'similar_coverage', 'single_source'].includes(String(item.verification.status)) && item.verification.verdict === 'not_checked' && item.verification.score === null && typeof item.verification.reason === 'string' && Number.isInteger(item.verification.outlets) && Array.isArray(item.verification.reports) && item.verification.reports.every(reportRecord)))) throw new Error('Não foi possível interpretar a avaliação das notícias.')
  if (value.newsAnalysis !== undefined && (!record(value.newsAnalysis) || typeof value.newsAnalysis.enabled !== 'boolean' || typeof value.newsAnalysis.configured !== 'boolean' || typeof value.newsAnalysis.model !== 'string' || typeof value.newsAnalysis.status !== 'string' || value.newsAnalysis.error !== null && typeof value.newsAnalysis.error !== 'string' || value.newsAnalysis.lastSuccessAt !== null && !dateString(value.newsAnalysis.lastSuccessAt))) throw new Error('Estado da análise inválido.')
  if (!value.funding.every((item) => record(item) && typeof item.asset === 'string' && typeof item.rate === 'number' && Number.isFinite(item.rate) && typeof item.markPrice === 'number' && Number.isFinite(item.markPrice) && item.markPrice > 0 && dateString(item.nextFundingAt) && dateString(item.observedAt) && typeof item.exchange === 'string' && httpsLink(item.url))) throw new Error('Não foi possível interpretar o funding.')
  if (!value.sources.every((item) => record(item) && typeof item.id === 'string' && typeof item.name === 'string' && ['live', 'error', 'demo'].includes(String(item.status)) && (item.lastSuccessAt === null || dateString(item.lastSuccessAt)) && dateString(item.lastAttemptAt) && typeof item.itemCount === 'number')) throw new Error('Não foi possível interpretar as fontes.')
  if (!value.fundingSources.every((item) => record(item) && typeof item.asset === 'string' && ['live', 'error'].includes(String(item.status)))) throw new Error('Não foi possível interpretar a fonte do funding.')
  if (!value.channels.every((item) => record(item) && ['discord', 'telegram'].includes(String(item.platform)) && typeof item.configured === 'boolean' && typeof item.enabled === 'boolean' && typeof item.pending === 'number')) throw new Error('Não foi possível interpretar os canais.')
  return value as unknown as PulseSnapshot
}

export function useMarketPulse() {
  const [snapshot, setSnapshot] = useState<PulseSnapshot | null>(null)
  const [error, setError] = useState<string | null>(apiBase ? null : 'O SISMO ainda não foi conectado neste ambiente.')
  const [loading, setLoading] = useState(Boolean(apiBase))
  const [revision, setRevision] = useState(0)
  const [connected, setConnected] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!apiBase) return
    let disposed = false
    let inFlight = false
    let stream: EventSource | undefined
    const controllers = new Set<AbortController>()
    const accept = (value: unknown) => {
      const next = parseSnapshot(value)
      if (disposed) return
      setSnapshot((previous) => previous?.lastCycleAt && next.lastCycleAt && Date.parse(previous.lastCycleAt) > Date.parse(next.lastCycleAt) ? previous : next)
      setError(null)
      setLoading(false)
      setConnected(true)
    }
    const refresh = async () => {
      if (inFlight || disposed || document.hidden) return
      inFlight = true
      const controller = new AbortController()
      controllers.add(controller)
      const timeout = window.setTimeout(() => controller.abort(), 10000)
      try {
        const response = await fetch(`${apiBase}/api/pulse`, { cache: 'no-store', signal: controller.signal })
        if (!response.ok) throw new Error('O serviço de coleta está indisponível.')
        accept(await response.json())
      } catch {
        if (!disposed) { setError('Sem conexão com o serviço de coleta. Os dados já recebidos continuam visíveis.'); setConnected(false); setLoading(false) }
      } finally { clearTimeout(timeout); controllers.delete(controller); inFlight = false }
    }
    void refresh()
    stream = new EventSource(`${apiBase}/api/stream`)
    stream.addEventListener('pulse', (event) => {
      try { accept(JSON.parse((event as MessageEvent).data)) } catch { void refresh() }
    })
    stream.onerror = () => { if (!disposed) void refresh() }
    // Polling mantém a tela atualizada também atrás de proxies sem SSE.
    const poll = window.setInterval(refresh, 15000)
    const tick = window.setInterval(() => setNow(Date.now()), 1000)
    const onVisible = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { disposed = true; stream?.close(); controllers.forEach((controller) => controller.abort()); clearInterval(poll); clearInterval(tick); document.removeEventListener('visibilitychange', onVisible) }
  }, [revision])

  const stale = snapshot ? snapshot.stale || !snapshot.lastCycleAt || now - Date.parse(snapshot.lastCycleAt) > snapshot.intervalSeconds * 3000 : false
  return { snapshot, error, loading, connected, stale, now, refresh: () => setRevision((value) => value + 1) }
}

export function relativeTime(value: string | null, now = Date.now()) {
  if (!value) return 'Aguardando coleta'
  const seconds = Math.max(0, Math.floor((now - Date.parse(value)) / 1000))
  if (seconds < 60) return 'Agora há pouco'
  if (seconds < 3600) return `Há ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `Há ${Math.floor(seconds / 3600)} h`
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
