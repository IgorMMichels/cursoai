import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'node:crypto'

export type EmailKind = 'welcome' | 'first_lesson' | 'reengagement'
export type EmailSegment = 'active' | 'inactive'
export type EmailLocale = 'pt-BR' | 'en' | 'es'

export type MarketingEmail = {
  subject: string
  html: string
  text: string
  headers: Record<string, string>
}

export type QueueItem = {
  id: string
  user_id: string
  email: string
  kind: EmailKind
  campaign_key: string
  idempotency_key: string
  status?: 'pending' | 'processing' | 'sent' | 'failed' | 'suppressed'
  attempts: number
  claimed_at: string | null
  created_at: string
  email_segment: 'active' | 'inactive'
  email_locale: EmailLocale
  payload?: { from: string; to: string[]; subject: string; html: string; text: string; headers: Record<string, string> } | null
}

export function isEnabled(environment: Record<string, string | undefined>) {
  return environment.MARKETING_EMAILS_ENABLED === 'true'
}

export function createAdminClient(environment: Record<string, string | undefined>): SupabaseClient {
  const url = environment.SUPABASE_URL?.trim()
  const key = environment.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) throw new Error('Supabase server credentials are not configured')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export function makeUnsubscribeToken(userId: string, secret: string, expiresAt: number) {
  const payload = `${userId}.${expiresAt}`
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`
}

export function verifyUnsubscribeToken(token: string, secret: string, now = Date.now()): string | null {
  const [userId, expiresRaw, signature, ...extra] = token.split('.')
  const expiresAt = Number(expiresRaw)
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId) || !signature || extra.length || !Number.isSafeInteger(expiresAt) || expiresAt * 1000 <= now) return null
  const payload = `${userId}.${expiresAt}`
  const expected = createHmac('sha256', secret).update(payload).digest('base64url')
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null
  return userId
}

export function renderMarketingEmail(input: {
  kind: EmailKind
  segment: EmailSegment
  locale?: EmailLocale
  name: string
  siteUrl: string
  unsubscribeUrl: string
  companyName: string
  postalAddress: string
}): MarketingEmail {
  const locale = input.locale ?? 'pt-BR'
  const coursePath = input.segment === 'active' ? '/curso' : '/planos'
  const localizedPaths: Record<EmailLocale, Record<string, string>> = {
    'pt-BR': { '/curso': '/curso', '/planos': '/planos' },
    en: { '/curso': '/en/curso', '/planos': '/en/planos' },
    es: { '/curso': '/es/curso', '/planos': '/es/planos' },
  }
  const courseUrl = new URL(localizedPaths[locale][coursePath], input.siteUrl)
  courseUrl.searchParams.set('utm_source', 'email')
  courseUrl.searchParams.set('utm_medium', 'lifecycle')
  courseUrl.searchParams.set('utm_campaign', input.kind)
  courseUrl.searchParams.set('utm_content', input.segment)

  const messages: Record<EmailLocale, Record<EmailKind, { subject: string; title: string; body: string; cta: string }>> = {
    'pt-BR': {
    welcome: {
      subject: 'Seu próximo passo começa com clareza',
      title: 'Boas-vindas à Omega',
      body: input.segment === 'active'
        ? 'Sua conta está pronta. Comece pelo essencial e avance no seu ritmo, com foco em decisões mais conscientes sobre criptoativos.'
        : 'Conheça as opções para começar seus estudos sobre criptoativos com clareza e no seu ritmo.',
      cta: input.segment === 'active' ? 'Acessar o curso' : 'Conhecer os planos',
    },
    first_lesson: {
      subject: 'Uma primeira aula, sem pressa',
      title: 'Vamos começar pelo básico?',
      body: input.segment === 'active'
        ? 'As aulas foram feitas para caber na rotina. Escolha a primeira e construa sua base passo a passo.'
        : 'Conheça as opções para começar a construir sua base sobre criptoativos passo a passo.',
      cta: input.segment === 'active' ? 'Começar a primeira aula' : 'Conhecer os planos',
    },
    reengagement: {
      subject: 'Retome seus estudos quando fizer sentido',
      title: 'Seu aprendizado continua no seu ritmo',
      body: input.segment === 'active'
        ? 'Sua assinatura está ativa e suas aulas concluídas continuam salvas. Quando quiser, retome de onde parou.'
        : 'Você já deu alguns passos nos estudos. Conheça as opções para retomar sua jornada quando fizer sentido.',
      cta: input.segment === 'active' ? 'Retomar meus estudos' : 'Ver opções de acesso',
    },
    },
    en: {
      welcome: { subject: 'Your next step starts with clarity', title: 'Welcome to Omega', body: input.segment === 'active' ? 'Your account is ready. Start with the essentials and learn at your own pace, with a focus on more thoughtful crypto decisions.' : 'Explore the options for starting your crypto studies with clarity and at your own pace.', cta: input.segment === 'active' ? 'Access the course' : 'Explore plans' },
      first_lesson: { subject: 'Your first lesson, at your own pace', title: 'Shall we start with the basics?', body: 'The lessons are designed to fit your routine. Choose the first one and build your foundation step by step.', cta: 'Start the first lesson' },
      reengagement: { subject: 'Pick up your studies when it feels right', title: 'Keep learning at your own pace', body: input.segment === 'active' ? 'Your subscription is active and your completed lessons are saved. Whenever you are ready, pick up where you left off.' : 'You have already taken a few steps in your studies. Explore the options to continue when the time is right.', cta: input.segment === 'active' ? 'Resume my studies' : 'View access options' },
    },
    es: {
      welcome: { subject: 'Tu próximo paso empieza con claridad', title: 'Bienvenido a Omega', body: input.segment === 'active' ? 'Tu cuenta está lista. Empieza por lo esencial y avanza a tu ritmo para tomar decisiones más conscientes sobre criptoactivos.' : 'Conoce las opciones para empezar a estudiar criptoactivos con claridad y a tu ritmo.', cta: input.segment === 'active' ? 'Acceder al curso' : 'Ver los planes' },
      first_lesson: { subject: 'Una primera clase, sin prisa', title: '¿Empezamos por lo básico?', body: 'Las clases están pensadas para adaptarse a tu rutina. Elige la primera y construye tus bases paso a paso.', cta: 'Empezar la primera clase' },
      reengagement: { subject: 'Retoma tus estudios cuando quieras', title: 'Sigue aprendiendo a tu ritmo', body: input.segment === 'active' ? 'Tu suscripción está activa y tus clases completadas siguen guardadas. Cuando quieras, retoma donde lo dejaste.' : 'Ya diste algunos pasos en tus estudios. Conoce las opciones para continuar cuando te venga bien.', cta: input.segment === 'active' ? 'Retomar mis estudios' : 'Ver opciones de acceso' },
    },
  }
  const message = messages[locale][input.kind]
  const footer = {
    'pt-BR': { consent: 'Você recebe esta mensagem porque autorizou e-mails de marketing da Omega.', unsubscribe: 'Cancelar inscrição' },
    en: { consent: 'You are receiving this message because you opted in to Omega marketing emails.', unsubscribe: 'Unsubscribe' },
    es: { consent: 'Recibes este mensaje porque aceptaste los correos de marketing de Omega.', unsubscribe: 'Cancelar suscripción' },
  }[locale]
  const greetings: Record<EmailLocale, string> = { 'pt-BR': 'Olá', en: 'Hello', es: 'Hola' }
  const greeting = input.name ? escapeHtml(input.name) : greetings[locale]
  const safeUrl = escapeHtml(courseUrl.toString())
  const safeUnsubscribe = escapeHtml(input.unsubscribeUrl)
  const safeCompany = escapeHtml(input.companyName)
  const safeAddress = escapeHtml(input.postalAddress)
  const copyright = '© Omega Courses'
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(message.subject)}</title></head><body style="margin:0;background:#0b1110;color:#e8eee9;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1110;padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#111b18;border:1px solid #26342e;border-radius:18px"><tr><td style="padding:36px 32px"><p style="margin:0 0 28px;color:#a7f3d0;font-weight:bold;letter-spacing:3px"><span aria-hidden="true">Ω</span> OMEGA</p><h1 style="margin:0 0 18px;font-size:28px;line-height:1.2;color:#f4faf6">${escapeHtml(message.title)}</h1><p style="margin:0 0 12px;color:#d4e0d7">${greeting},</p><p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#c1cec5">${escapeHtml(message.body)}</p><a href="${safeUrl}" style="display:inline-block;padding:14px 20px;border-radius:10px;background:#a7f3d0;color:#092019;text-decoration:none;font-weight:bold">${escapeHtml(message.cta)}</a><p style="margin:36px 0 0;font-size:12px;line-height:1.6;color:#829188">${escapeHtml(footer.consent)} <a href="${safeUnsubscribe}" style="color:#a7f3d0">${escapeHtml(footer.unsubscribe)}</a>.</p><p style="margin:12px 0 0;font-size:11px;line-height:1.5;color:#829188">${escapeHtml(copyright)} · ${safeCompany} · ${safeAddress}</p></td></tr></table></td></tr></table></body></html>`
  const text = `${message.title}\n\n${input.name || greetings[locale]},\n\n${message.body}\n\n${message.cta}: ${courseUrl.toString()}\n\n${footer.unsubscribe}: ${input.unsubscribeUrl}\n\n${copyright} · ${input.companyName} · ${input.postalAddress}`
  return {
    subject: message.subject,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<${input.unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  }
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

export async function verifyResendWebhook(input: {
  body: string
  id: string | undefined
  timestamp: string | undefined
  signature: string | undefined
  secret: string
  now?: number
}) {
  if (!input.id || !input.timestamp || !input.signature) return false
  const timestamp = Number(input.timestamp)
  const now = input.now ?? Math.floor(Date.now() / 1000)
  if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > 300) return false
  const secretValue = input.secret.startsWith('whsec_') ? input.secret.slice(6) : input.secret
  let key: Buffer
  try { key = Buffer.from(secretValue, 'base64') } catch { return false }
  const expected = createHmac('sha256', key).update(`${input.id}.${input.timestamp}.${input.body}`).digest('base64')
  return input.signature.split(' ').some((part) => {
    const [version, value] = part.split(',')
    if (version !== 'v1' || !value) return false
    const actual = Buffer.from(value)
    const wanted = Buffer.from(expected)
    return actual.length === wanted.length && timingSafeEqual(actual, wanted)
  })
}

export async function resendRequest<T>(environment: Record<string, string | undefined>, path: string, init: RequestInit = {}, fetcher: typeof fetch = fetch): Promise<T> {
  const apiKey = environment.RESEND_API_KEY?.trim()
  if (!apiKey) throw new Error('Resend API key is not configured')
  const response = await fetcher(`https://api.resend.com${path}`, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(8_000),
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...init.headers },
  })
  const payload = await response.json().catch(() => ({})) as T & { message?: string; name?: string }
  if (!response.ok) throw new Error(`Resend ${response.status}: ${payload.message ?? payload.name ?? 'request failed'}`)
  return payload
}

export function retryDelayMs(attempt: number) {
  return Math.min(60 * 60 * 1000, 60_000 * 2 ** Math.max(0, attempt - 1))
}

export async function readRawBody(request: AsyncIterable<Uint8Array>) {
  const chunks: Uint8Array[] = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.byteLength
    if (size > 1_000_000) throw new Error('Request body too large')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}
