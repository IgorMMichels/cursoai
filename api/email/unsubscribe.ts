import type { IncomingMessage, ServerResponse } from 'node:http'
import { createAdminClient, readRawBody, verifyUnsubscribeToken, type EmailLocale } from '../../server/email/runtime.ts'
import { optOutUser } from '../../server/email/lifecycle.ts'

const copy: Record<EmailLocale, {
  invalid: string; title: string; intro: string; confirm: string; successTitle: string; success: string
  failure: string; invalidPost: string; method: string
}> = {
  'pt-BR': {
    invalid: 'Este link de cancelamento é inválido ou expirou.', title: 'Cancelar e-mails da Omega',
    intro: 'Confirme para parar de receber mensagens de marketing. Isso não altera seu acesso ao curso.',
    confirm: 'Confirmar cancelamento', successTitle: 'Inscrição cancelada',
    success: 'Você não receberá novos e-mails de marketing da Omega.',
    failure: 'Não foi possível atualizar sua preferência agora. Tente novamente mais tarde.',
    invalidPost: 'Token inválido', method: 'Método não permitido',
  },
  en: {
    invalid: 'This unsubscribe link is invalid or has expired.', title: 'Unsubscribe from Omega emails',
    intro: 'Confirm to stop receiving marketing messages. This will not change your course access.',
    confirm: 'Confirm unsubscribe', successTitle: 'You are unsubscribed',
    success: 'You will not receive new Omega marketing emails.',
    failure: 'Your preference could not be updated right now. Please try again later.',
    invalidPost: 'Invalid token', method: 'Method not allowed',
  },
  es: {
    invalid: 'Este enlace para cancelar la suscripción no es válido o ha caducado.', title: 'Cancelar correos de Omega',
    intro: 'Confirma para dejar de recibir mensajes de marketing. Esto no cambiará tu acceso al curso.',
    confirm: 'Confirmar cancelación', successTitle: 'Suscripción cancelada',
    success: 'No recibirás nuevos correos de marketing de Omega.',
    failure: 'No se pudo actualizar tu preferencia ahora. Inténtalo de nuevo más tarde.',
    invalidPost: 'Token no válido', method: 'Método no permitido',
  },
}

function normalizeLocale(value: string | null): EmailLocale {
  return value === 'en' || value === 'es' ? value : 'pt-BR'
}

function page(locale: EmailLocale, title: string, content: string) {
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head><body style="font:16px Arial,sans-serif;max-width:560px;margin:64px auto;padding:0 20px;color:#18231e"><p style="color:#137c59;font-weight:bold;letter-spacing:3px"><span aria-hidden="true">Ω</span> OMEGA</p><h1>${title}</h1>${content}<footer style="margin-top:48px;color:#68756e;font-size:12px">© Omega Courses</footer></body></html>`
}

export default async function unsubscribe(request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  const url = new URL(request.url ?? '/', 'https://local.invalid')
  const locale = normalizeLocale(url.searchParams.get('locale'))
  const text = copy[locale]
  const token = url.searchParams.get('token') ?? ''
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET?.trim()
  const userId = secret ? verifyUnsubscribeToken(token, secret) : null
  if (!userId) {
    response.statusCode = 400
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end(page(locale, text.title, `<p>${text.invalid}</p>`))
    return
  }
  if (request.method === 'GET') {
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    const action = `/api/email/unsubscribe?token=${encodeURIComponent(token)}&locale=${encodeURIComponent(locale)}`
    const button = `<form method="post" action="${action}"><button style="padding:12px 18px;background:#163b2e;color:white;border:0;border-radius:8px">${text.confirm}</button></form>`
    response.end(page(locale, text.title, `<p>${text.intro}</p>${button}`))
    return
  }
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST')
    response.statusCode = 405
    response.setHeader('Content-Type', 'text/plain; charset=utf-8')
    response.end(text.method)
    return
  }
  try {
    const body = await readRawBody(request)
    const params = new URLSearchParams(body)
    const bodyToken = params.get('token')
    if (bodyToken && bodyToken !== token) {
      response.statusCode = 400
      response.setHeader('Content-Type', 'text/plain; charset=utf-8')
      response.end(text.invalidPost)
      return
    }
    const client = createAdminClient(process.env)
    await optOutUser(process.env, userId, 'unsubscribe_link', client)
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end(page(locale, text.successTitle, `<p>${text.success}</p>`))
  } catch {
    response.statusCode = 503
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end(page(locale, text.title, `<p>${text.failure}</p>`))
  }
}
