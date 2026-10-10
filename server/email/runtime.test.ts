import assert from 'node:assert/strict'
import { createHmac, randomBytes } from 'node:crypto'
import test from 'node:test'
import {
  isEnabled,
  makeUnsubscribeToken,
  renderMarketingEmail,
  retryDelayMs,
  verifyResendWebhook,
  verifyUnsubscribeToken,
} from './runtime.ts'

test('marketing delivery remains disabled unless explicitly enabled', () => {
  assert.equal(isEnabled({}), false)
  assert.equal(isEnabled({ MARKETING_EMAILS_ENABLED: 'false' }), false)
  assert.equal(isEnabled({ MARKETING_EMAILS_ENABLED: 'true' }), true)
})

test('unsubscribe tokens are signed, user-bound, and expire', () => {
  const userId = '14fdd985-0e21-4d80-bf57-542a546b7bd6'
  const secret = 'test-only-secret'
  const expiresAt = 2_000_000_000
  const token = makeUnsubscribeToken(userId, secret, expiresAt)
  assert.equal(verifyUnsubscribeToken(token, secret, 1_999_999_999_000), userId)
  assert.equal(verifyUnsubscribeToken(token, 'different-secret', 1_999_999_999_000), null)
  assert.equal(verifyUnsubscribeToken(token, secret, 2_000_000_000_000), null)
  assert.equal(verifyUnsubscribeToken(`${token}x`, secret, 1_999_999_999_000), null)
})

test('Resend webhook verification uses the exact raw body and rejects stale signatures', async () => {
  const secret = `whsec_${randomBytes(32).toString('base64')}`
  const key = Buffer.from(secret.slice('whsec_'.length), 'base64')
  const body = '{"type":"email.bounced","data":{"to":["a@example.com"]}}'
  const id = 'msg_123'
  const timestamp = '1791500000'
  const digest = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64')
  const signature = `v1,${digest}`
  const input = { body, id, timestamp, signature, secret, now: Number(timestamp) }
  assert.equal(await verifyResendWebhook(input), true)
  assert.equal(await verifyResendWebhook({ ...input, body: `${body} ` }), false)
  assert.equal(await verifyResendWebhook({ ...input, now: Number(timestamp) + 301 }), false)
})

test('lifecycle templates include accessible text, UTM links, company identity, and unsubscribe headers', () => {
  const email = renderMarketingEmail({
    kind: 'reengagement',
    segment: 'active',
    name: '<Investidor>',
    siteUrl: 'https://omega.courses',
    unsubscribeUrl: 'https://omega.courses/api/email/unsubscribe?token=abc',
    companyName: 'Omega Educação',
    postalAddress: 'Rua Um, 100, São Paulo, SP',
  })
  assert.match(email.html, /&lt;Investidor&gt;/)
  assert.match(email.text, /utm_campaign=reengagement/)
  assert.doesNotMatch(email.html, /List-Unsubscribe/i)
  assert.equal(email.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click')
  assert.match(email.text, /Omega Educação · Rua Um/)
  assert.match(email.html, /assinatura está ativa/)
  assert.match(email.html, /<span aria-hidden="true">Ω<\/span> OMEGA/)
  assert.match(email.html, /© Omega Courses/)
  const inactive = renderMarketingEmail({ kind: 'welcome', segment: 'inactive', name: '', siteUrl: 'https://omega.courses', unsubscribeUrl: 'https://omega.courses/unsubscribe', companyName: 'Omega', postalAddress: 'São Paulo' })
  assert.match(inactive.text, /Conhecer os planos: https:\/\/omega\.courses\/planos/)
  assert.doesNotMatch(inactive.text, /Seu acesso está pronto/)
  for (const [locale, language, unsubscribeLabel] of [['en', 'en', 'Unsubscribe'], ['es', 'es', 'Cancelar suscripción']] as const) {
    const localized = renderMarketingEmail({ kind: 'welcome', segment: 'inactive', locale, name: '', siteUrl: 'https://omega.courses', unsubscribeUrl: 'https://omega.courses/api/email/unsubscribe?token=abc', companyName: 'Omega Educação', postalAddress: 'Rua Um, 100, São Paulo, SP' })
    assert.match(localized.html, new RegExp(`<html lang="${language}">`))
    assert.match(localized.html, new RegExp(unsubscribeLabel))
    assert.match(localized.text, /List-Unsubscribe:|Cancelar inscripción|Unsubscribe|Cancelar suscripción/)
    assert.equal(localized.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click')
    assert.match(localized.text, /© Omega Courses/)
  }
})

test('retry delay grows exponentially and stays bounded', () => {
  assert.equal(retryDelayMs(1), 60_000)
  assert.equal(retryDelayMs(2), 120_000)
  assert.equal(retryDelayMs(20), 60 * 60 * 1000)
})
