import { createHash } from 'node:crypto'
import { requestText, publicError } from './network.mjs'

export const disclaimer = 'Conteúdo educacional. Não é recomendação de investimento. Criptoativos e futuros envolvem riscos.'
export const platforms = ['discord', 'telegram']

export function destinationKey(config, platform) {
  const secret = platform === 'discord' ? config.discordWebhook : config.telegramToken && config.telegramChatId ? `${config.telegramToken}:${config.telegramChatId}` : ''
  return secret ? createHash('sha256').update(secret).digest('hex') : null
}
export function newsMessage(item) {
  return { id: `news:${item.id}`, module: 'news', title: item.title, summary: `${item.summary || 'Leia a reportagem completa na fonte.'}\n\nFonte: ${item.source} · Tema: ${item.category}${item.importance ? `\nImportância: ${item.importance.score}/10 · ${item.importance.method === 'ai' ? 'estimativa por IA' : 'regras de triagem'}\n${item.importance.reason}` : ''}${item.cryptoContext ? `\n${item.cryptoContext}` : ''}\nManchete original; conteúdo ainda não verificado independentemente.`, url: item.url, timestamp: item.publishedAt }
}
export function fundingMessage(item) {
  return { id: `funding:${item.asset}:${item.observedAt}`, module: 'funding', title: `Funding elevado: ${item.asset}`, summary: `Taxa informada pela ${item.exchange}: ${(item.rate * 100).toFixed(4)}%.\n${item.rate > 0 ? 'Funding positivo: longs pagam shorts.' : 'Funding negativo: shorts pagam longs.'}\nPróxima liquidação do funding: ${item.nextFundingAt}.\nA taxa pode mudar até o próximo pagamento. Funding extremo pode persistir.`, url: item.url, timestamp: item.observedAt }
}
export function telegramText(message) {
  return `${message.title}\n\n${message.summary.slice(0, 3000)}${message.url ? `\n\n${message.url}` : ''}\n\n${disclaimer}`.slice(0, 4000)
}
export function discordPayload(message) {
  return { allowed_mentions: { parse: [] }, embeds: [{ title: message.title.slice(0, 256), ...(message.url ? { url: message.url } : {}), description: `${message.summary.slice(0, 3000)}\n\n${disclaimer}`, color: 0xa78bfa, timestamp: message.timestamp, footer: { text: 'Omega · SISMO' } }] }
}
export async function sendMessage(config, platform, message, fetchImpl = fetch) {
  if (platform === 'discord') {
    const url = new URL(config.discordWebhook)
    url.searchParams.set('wait', 'true')
    const data = JSON.parse(await requestText(url.href, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(discordPayload(message)) }, fetchImpl, 100_000))
    if (!data.id) throw new Error('Resposta de entrega inválida')
    return String(data.id)
  }
  const data = JSON.parse(await requestText(`https://api.telegram.org/bot${config.telegramToken}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: config.telegramChatId, text: telegramText(message), link_preview_options: { is_disabled: true } }) }, fetchImpl, 100_000))
  if (!data.ok || !data.result?.message_id) throw new Error('Resposta de entrega inválida')
  return String(data.result.message_id)
}
export async function drainQueue(state, config, fetchImpl = fetch, now = Date.now()) {
  if (!config.deliveryEnabled || config.demo) return
  await Promise.allSettled(platforms.map(async (platform) => {
    const key = destinationKey(config, platform)
    if (!key) return
    const pending = state.queue.filter((job) => job.platform === platform && job.destination === key && job.nextAttemptAt <= now && job.expiresAt > now).slice(0, 3)
    for (const job of pending) {
      const record = { id: job.message.id, platform, at: new Date(now).toISOString(), attempt: job.attempts + 1 }
      try {
        const messageId = await sendMessage(config, platform, job.message, fetchImpl)
        state.queue = state.queue.filter((candidate) => candidate !== job)
        state.deliveryLog.push({ ...record, status: 'sent', messageId })
      } catch (error) {
        job.attempts += 1
        job.nextAttemptAt = now + Math.min(3600, Math.max(30 * 2 ** job.attempts, Number(error.retryAfter) || 0)) * 1000
        state.deliveryLog.push({ ...record, status: job.attempts >= 5 ? 'failed' : 'retrying', error: publicError(error) })
        if (job.attempts >= 5) state.queue = state.queue.filter((candidate) => candidate !== job)
      }
    }
  }))
  state.deliveryLog = state.deliveryLog.slice(-200)
}
