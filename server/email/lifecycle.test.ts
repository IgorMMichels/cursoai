import assert from 'node:assert/strict'
import test from 'node:test'
import { createHmac } from 'node:crypto'
import { optOutUser, recordResendWebhook, runMarketingLifecycle } from './lifecycle.ts'
import type { QueueItem } from './runtime.ts'
import { handleResendWebhook } from '../../api/email/webhook.ts'
import unsubscribe from '../../api/email/unsubscribe.ts'
import { makeUnsubscribeToken } from './runtime.ts'

const DAY = 86_400_000
const userId = '14fdd985-0e21-4d80-bf57-542a546b7bd6'
const initialNow = new Date('2026-10-09T12:00:00.000Z')
const baseEnvironment = {
  MARKETING_EMAILS_ENABLED: 'true', RESEND_API_KEY: 're_test_only', SITE_URL: 'https://omega.example',
  RESEND_FROM: 'Omega <hello@omega.example>', RESEND_INTERESTED_SEGMENT_ID: 'interested',
  RESEND_ACTIVE_SEGMENT_ID: 'active', EMAIL_UNSUBSCRIBE_SECRET: 'test-secret',
  MARKETING_COMPANY_NAME: 'Omega Educação', MARKETING_POSTAL_ADDRESS: 'Rua Um, São Paulo',
}

function response(status: number, value: unknown) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })
}

class FakeQuery {
  db: FakeDatabase
  table: string
  operation: 'select' | 'update' | 'upsert' | 'delete' = 'select'
  values: any
  rangeStart = 0
  rangeSize = Infinity
  orders: Array<{ key: string; ascending: boolean }> = []
  filters: Array<(row: any) => boolean> = []
  ignoreDuplicates = false
  constructor(db: FakeDatabase, table: string) { this.db = db; this.table = table }
  select() { return this }
  order(key: string, options?: { ascending?: boolean }) { this.orders.push({ key, ascending: options?.ascending !== false }); return this }
  range(start: number, end: number) { this.rangeStart = start; this.rangeSize = end - start + 1; return this }
  limit() { return this }
  eq(key: string, value: unknown) { this.filters.push((row) => row[key] === value); return this }
  in(key: string, values: unknown[]) { this.filters.push((row) => values.includes(row[key])); return this }
  is(key: string, value: unknown) { this.filters.push((row) => row[key] === value); return this }
  update(values: unknown) { this.operation = 'update'; this.values = values; return this }
  delete() { this.operation = 'delete'; return this }
  upsert(values: any, options?: { ignoreDuplicates?: boolean }) { this.operation = 'upsert'; this.values = values; this.ignoreDuplicates = Boolean(options?.ignoreDuplicates); return this }
  async maybeSingle() { const result = await this.execute(); return { ...result, data: result.data?.[0] ?? null } }
  then(resolve: (value: any) => unknown, reject: (reason: unknown) => unknown) { return this.execute().then(resolve, reject) }
  async execute() {
    if (this.db.failTable === this.table) { this.db.failTable = ''; return { data: null, error: new Error(`mock ${this.table} failure`) } }
    const rows = this.db.tables[this.table]
    if (this.operation === 'select') {
      const selected = rows.filter((row) => this.filters.every((filter) => filter(row)))
      selected.sort((left, right) => {
        for (const order of this.orders) {
          const a = left[order.key] ?? ''
          const b = right[order.key] ?? ''
          if (a === b) continue
          const comparison = a < b ? -1 : 1
          return order.ascending ? comparison : -comparison
        }
        return 0
      })
      return { data: selected.slice(this.rangeStart, this.rangeStart + this.rangeSize).map((row) => ({ ...row })), error: null }
    }
    if (this.operation === 'update') {
      for (const row of rows.filter((entry) => this.filters.every((filter) => filter(entry)))) Object.assign(row, this.values)
      return { data: null, error: null }
    }
    if (this.operation === 'delete') {
      const matched = rows.filter((row) => this.filters.every((filter) => filter(row)))
      this.db.tables[this.table] = rows.filter((row) => !matched.includes(row))
      return { data: matched, error: null }
    }
    const incoming = Array.isArray(this.values) ? this.values : [this.values]
    const inserted: any[] = []
    for (const value of incoming) {
      const key = this.table === 'email_marketing_queue' ? ['user_id', 'kind', 'campaign_key']
        : this.table === 'email_marketing_deliveries' ? ['queue_id']
          : this.table === 'email_marketing_events' ? ['event_id']
            : this.table === 'email_marketing_contacts' ? ['user_id']
              : this.table === 'email_marketing_suppressions' ? ['email'] : ['id']
      const existing = rows.find((row) => key.every((part) => row[part] === value[part]))
      if (existing) {
        if (this.ignoreDuplicates) continue
        Object.assign(existing, value)
        inserted.push(existing)
      } else {
        const row = { id: `${this.table}-${rows.length + 1}`, created_at: initialNow.toISOString(), ...(this.table === 'email_marketing_queue' ? { status: 'pending', attempts: 0, available_at: this.db.now.toISOString(), payload: null } : {}), ...value }
        rows.push(row)
        inserted.push(row)
      }
    }
    return { data: inserted.map((row) => ({ ...row })), error: null }
  }
}

class FakeDatabase {
  tables: Record<string, any[]> = Object.fromEntries(['email_preferences', 'lesson_progress', 'subscriptions', 'email_marketing_queue', 'email_marketing_deliveries', 'email_marketing_events', 'email_marketing_suppressions', 'email_marketing_contacts', 'email_marketing_user_locks'].map((name) => [name, []]))
  failTable = ''
  now = initialNow
  users: any[]
  client: any
  constructor(options: { optedIn?: boolean; confirmationAge?: number; subscriptionExpiry?: string | null; progressAt?: string | null; locale?: string; consentGrantedAt?: string | null } = {}) {
    this.users = [{ id: userId, email: 'learner@example.com', email_confirmed_at: new Date(initialNow.getTime() - (options.confirmationAge ?? 2 * DAY)).toISOString() }]
    if (options.optedIn !== false) this.tables.email_preferences.push({ user_id: userId, marketing_opt_in: true, email_locale: options.locale ?? 'pt-BR', consent_granted_at: options.consentGrantedAt ?? null })
    if (options.subscriptionExpiry) this.tables.subscriptions.push({ user_id: userId, status: 'active', starts_at: null, expires_at: options.subscriptionExpiry })
    if (options.progressAt) this.tables.lesson_progress.push({ user_id: userId, completed_at: options.progressAt })
    this.client = {
      from: (table: string) => new FakeQuery(this, table),
      auth: { admin: {
        listUsers: async ({ page, perPage }: { page: number; perPage: number }) => ({ data: { users: this.users.slice((page - 1) * perPage, page * perPage) }, error: null }),
        getUserById: async (id: string) => ({ data: { user: this.users.find((user) => user.id === id) ?? null }, error: null }),
      } },
      rpc: async (name: string, params: Record<string, string>) => {
        if (name === 'record_email_marketing_suppression') {
          const rows = this.tables.email_marketing_suppressions
          const current = rows.find((row) => row.email === params.p_email)
          if (!current) rows.push({ email: params.p_email, reason: params.p_reason, source: params.p_source, created_at: params.p_created_at })
          else if (!['bounce', 'complaint'].includes(current.reason) || ['bounce', 'complaint'].includes(params.p_reason)) {
            current.reason = params.p_reason
            current.source = params.p_source
            current.created_at = new Date(Math.max(Date.parse(current.created_at), Date.parse(params.p_created_at))).toISOString()
          }
          return { data: null, error: null }
        }
        assert.equal(name, 'claim_email_marketing_queue')
        const sentRecently = new Set(this.tables.email_marketing_deliveries.filter((item) => Date.parse(item.sent_at ?? this.now.toISOString()) > this.now.getTime() - DAY).map((item) => item.user_id))
        const lockedUsers = new Set(this.tables.email_marketing_user_locks.filter((lock) => lock.last_attempt_at && Date.parse(lock.last_attempt_at) > this.now.getTime() - DAY).map((lock) => lock.user_id))
        const claimed: any[] = []
        const usersClaimed = new Set<string>()
        for (const item of this.tables.email_marketing_queue.filter((row) => row.status === 'pending' && Date.parse(row.available_at ?? this.now.toISOString()) <= this.now.getTime()).sort((a, b) => a.created_at.localeCompare(b.created_at))) {
          const sameQueue = this.tables.email_marketing_user_locks.find((lock) => lock.user_id === item.user_id && lock.queue_id === item.id)
          if (claimed.length >= 25 || item.attempts >= 5 || usersClaimed.has(item.user_id) || sentRecently.has(item.user_id) || (lockedUsers.has(item.user_id) && !sameQueue)) continue
          item.status = 'processing'; item.attempts = (item.attempts ?? 0) + 1; item.claimed_at = this.now.toISOString(); item.first_attempt_at ??= this.now.toISOString()
          const lock = this.tables.email_marketing_user_locks.find((row) => row.user_id === item.user_id)
          if (lock) Object.assign(lock, { queue_id: item.id, claimed_at: this.now.toISOString(), last_attempt_at: this.now.toISOString() })
          else this.tables.email_marketing_user_locks.push({ user_id: item.user_id, queue_id: item.id, claimed_at: this.now.toISOString(), last_attempt_at: this.now.toISOString(), last_sent_at: null })
          usersClaimed.add(item.user_id); claimed.push({ ...item })
        }
        return { data: claimed, error: null }
      },
    }
  }
}

function resendMock(emailFailures: Array<'network' | number> = ['network']) {
  const contacts = new Map<string, any>()
  const emailBodies: Array<{ idempotencyKey: string | null; body: any }> = []
  const segmentActions: Array<{ method: string | undefined; path: string }> = []
  const fetcher: typeof fetch = async (input, init = {}) => {
    const url = new URL(String(input))
    if (url.pathname === '/contacts' && init.method === 'POST') {
      const request = JSON.parse(String(init.body))
      const contact = { id: 'contact-1', email: request.email, unsubscribed: false }
      contacts.set(request.email.toLowerCase(), contact)
      return response(200, contact)
    }
    if (url.pathname.startsWith('/contacts/')) {
      const key = decodeURIComponent(url.pathname.split('/')[2]).toLowerCase()
      if (url.pathname.includes('/segments/')) { segmentActions.push({ method: init.method, path: url.pathname }); return response(200, {}) }
      if (init.method === 'PATCH') {
        const contact = contacts.get(key)
        if (contact) Object.assign(contact, JSON.parse(String(init.body)))
        return contact ? response(200, contact) : response(404, { message: 'not found' })
      }
      const contact = contacts.get(key)
      return contact ? response(200, contact) : response(404, { message: 'not found' })
    }
    if (url.pathname === '/emails') {
      const body = JSON.parse(String(init.body))
      emailBodies.push({ idempotencyKey: new Headers(init.headers).get('Idempotency-Key'), body })
      const failure = emailFailures.shift()
      if (failure === 'network') throw new TypeError('network connection reset')
      if (typeof failure === 'number') return response(failure, { message: 'mock send failure' })
      return response(200, { id: 'email-1' })
    }
    throw new Error(`Unexpected mocked Resend request ${init.method} ${url.pathname}`)
  }
  return { fetcher, contacts, emailBodies, segmentActions }
}

test('lifecycle retries an uncertain send with persisted payload and sends inactive users to plans', async () => {
  const db = new FakeDatabase({ subscriptionExpiry: '2026-10-08T12:00:00.000Z' })
  const resend = resendMock()
  const first = await runMarketingLifecycle(baseEnvironment, { client: db.client, fetcher: resend.fetcher, now: initialNow })
  assert.equal(first.queued, 1)
  assert.equal(first.retried, 1, JSON.stringify(first))
  const queue = db.tables.email_marketing_queue[0] as QueueItem
  assert.equal(queue.status, 'pending')
  assert.ok(queue.payload)
  assert.match(queue.payload!.text, /Conhecer os planos: https:\/\/omega\.example\/planos/)
  assert.doesNotMatch(queue.payload!.text, /Seu acesso está pronto/)
  assert.equal(db.tables.email_marketing_queue.filter((item) => item.kind === 'first_lesson').length, 0)

  const changedEnvironment = { ...baseEnvironment, SITE_URL: 'https://changed.example', RESEND_FROM: 'New <new@example.com>', MARKETING_COMPANY_NAME: 'Changed' }
  db.now = new Date(initialNow.getTime() + 2 * 60_000)
  const second = await runMarketingLifecycle(changedEnvironment, { client: db.client, fetcher: resend.fetcher, now: db.now })
  assert.equal(second.sent, 1)
  assert.equal(queue.status, 'sent')
  assert.deepEqual(resend.emailBodies[1].body, queue.payload)
  assert.equal(resend.emailBodies[0].idempotencyKey, resend.emailBodies[1].idempotencyKey)
  assert.equal(db.tables.email_marketing_deliveries.length, 1)
  assert.equal(db.tables.email_marketing_contacts[0].resend_subscribed, true)
})

test('lifecycle does not enqueue without consent; non-revocation contact events do not opt users out', async () => {
  const db = new FakeDatabase({ optedIn: false })
  const resend = resendMock()
  const stats = await runMarketingLifecycle(baseEnvironment, { client: db.client, fetcher: resend.fetcher, now: initialNow })
  assert.equal(stats.queued, 0)
  assert.equal(stats.sent, 0)
  await recordResendWebhook(baseEnvironment, { id: 'event-false', type: 'contact.updated', data: { email: 'learner@example.com', unsubscribed: false } }, db.client)
  await recordResendWebhook(baseEnvironment, { id: 'event-unknown', type: 'contact.updated', data: { email: 'learner@example.com' } }, db.client)
  assert.equal(db.tables.email_preferences[0], undefined)
  assert.equal(db.tables.email_marketing_suppressions.length, 0)
})

test('explicit unsubscribe events locally revoke consent and failures propagate for webhook 5xx handling', async () => {
  const db = new FakeDatabase()
  await recordResendWebhook(baseEnvironment, { id: 'event-optout', type: 'contact.unsubscribed', data: { email: 'learner@example.com' } }, db.client)
  assert.equal(db.tables.email_preferences[0].marketing_opt_in, false)
  assert.equal(db.tables.email_marketing_suppressions[0].reason, 'unsubscribe')
  db.failTable = 'email_marketing_events'
  await assert.rejects(recordResendWebhook(baseEnvironment, { id: 'event-db-error', type: 'email.delivered', data: { email: 'learner@example.com' } }, db.client), /mock email_marketing_events failure/)
})

test('stale welcome and completed first-lesson candidates are not queued', async () => {
  const db = new FakeDatabase({ confirmationAge: 20 * DAY, progressAt: new Date(initialNow.getTime() - DAY).toISOString() })
  const resend = resendMock()
  const stats = await runMarketingLifecycle(baseEnvironment, { client: db.client, fetcher: resend.fetcher, now: initialNow })
  assert.equal(stats.queued, 0)
  assert.equal(resend.emailBodies.length, 0)
})

test('lifecycle paginates lesson progress beyond the PostgREST default page', async () => {
  const db = new FakeDatabase()
  db.tables.lesson_progress.push(...Array.from({ length: 1_001 }, (_, index) => ({
    user_id: userId,
    lesson_id: `lesson-${index}`,
    completed_at: new Date(initialNow.getTime() - (index === 1_000 ? 8 : 10) * DAY).toISOString(),
  })))
  const resend = resendMock()
  const stats = await runMarketingLifecycle(baseEnvironment, { client: db.client, fetcher: resend.fetcher, now: initialNow })
  assert.equal(stats.queued, 2)
  assert.ok(db.tables.email_marketing_queue.some((item) => item.campaign_key === `inactive-v1-${new Date(initialNow.getTime() - 8 * DAY).toISOString()}`))
})

test('daily reconciliation still honors local opt-outs when campaigns are disabled', async () => {
  const db = new FakeDatabase({ optedIn: false })
  db.tables.email_marketing_contacts.push({ id: 'tracked', user_id: userId, email: 'learner@example.com', resend_subscribed: true })
  const resend = resendMock()
  resend.contacts.set('learner@example.com', { id: 'contact-1', email: 'learner@example.com', unsubscribed: false })
  const stats = await runMarketingLifecycle({ ...baseEnvironment, MARKETING_EMAILS_ENABLED: 'false', MARKETING_POSTAL_ADDRESS: undefined }, { client: db.client, fetcher: resend.fetcher, now: initialNow })
  assert.equal(stats.sent, 0)
  assert.equal(db.tables.email_marketing_contacts[0].resend_subscribed, false)
  assert.equal(resend.contacts.get('learner@example.com').unsubscribed, true)
})

test('daily reconciliation removes stale active segments after access expires', async () => {
  const db = new FakeDatabase({ subscriptionExpiry: '2026-10-08T12:00:00.000Z' })
  db.tables.email_marketing_contacts.push({ id: 'tracked', user_id: userId, email: 'learner@example.com', resend_subscribed: true, email_segment: 'active' })
  const resend = resendMock()
  resend.contacts.set('learner@example.com', { id: 'contact-1', email: 'learner@example.com', unsubscribed: false })
  const stats = await runMarketingLifecycle({ ...baseEnvironment, MARKETING_EMAILS_ENABLED: 'false' }, { client: db.client, fetcher: resend.fetcher, now: initialNow })
  assert.equal(stats.sent, 0)
  assert.deepEqual(resend.segmentActions.map((action) => action.method), ['DELETE'])
  assert.equal(db.tables.email_marketing_contacts[0].email_segment, 'inactive')
})

test('local opt-out survives a Resend outage and the next disabled cron reconciles it', async () => {
  const db = new FakeDatabase()
  db.tables.email_marketing_contacts.push({ id: 'tracked', user_id: userId, email: 'learner@example.com', resend_subscribed: true, email_segment: 'active' })
  await assert.rejects(optOutUser(baseEnvironment, userId, 'profile', db.client, async () => { throw new TypeError('network unavailable') }), /network unavailable/)
  assert.equal(db.tables.email_preferences[0].marketing_opt_in, false)
  assert.equal(db.tables.email_marketing_contacts[0].resend_subscribed, true)
  const resend = resendMock()
  resend.contacts.set('learner@example.com', { id: 'contact-1', email: 'learner@example.com', unsubscribed: false })
  await runMarketingLifecycle({ ...baseEnvironment, MARKETING_EMAILS_ENABLED: 'false' }, { client: db.client, fetcher: resend.fetcher, now: initialNow })
  assert.equal(db.tables.email_marketing_contacts[0].resend_subscribed, false)
  assert.equal(resend.contacts.get('learner@example.com').unsubscribed, true)
})

test('a later affirmative consent restores an unsubscribed Resend contact and clears only that suppression', async () => {
  const grantedAt = new Date(initialNow.getTime() + 60_000).toISOString()
  const db = new FakeDatabase({ consentGrantedAt: grantedAt })
  db.tables.email_marketing_suppressions.push({ email: 'learner@example.com', reason: 'unsubscribe', source: 'profile', created_at: initialNow.toISOString() })
  db.tables.email_marketing_contacts.push({ id: 'tracked', user_id: userId, email: 'learner@example.com', resend_subscribed: false, email_segment: 'inactive' })
  const resend = resendMock()
  resend.contacts.set('learner@example.com', { id: 'contact-1', email: 'learner@example.com', unsubscribed: true })
  await runMarketingLifecycle({ ...baseEnvironment, MARKETING_EMAILS_ENABLED: 'false' }, { client: db.client, fetcher: resend.fetcher, now: new Date(initialNow.getTime() + 2 * 60_000) })
  assert.equal(db.tables.email_marketing_suppressions.length, 0)
  assert.equal(resend.contacts.get('learner@example.com').unsubscribed, false)
  assert.equal(db.tables.email_marketing_contacts[0].resend_subscribed, true)
})

test('stale unsubscribe webhook cannot revoke newer consent and a complaint remains suppressed', async () => {
  const grantedAt = new Date(initialNow.getTime() + 60_000).toISOString()
  const db = new FakeDatabase({ consentGrantedAt: grantedAt })
  await recordResendWebhook(baseEnvironment, { id: 'old-optout', type: 'contact.unsubscribed', created_at: initialNow.toISOString(), data: { email: 'learner@example.com' } }, db.client)
  assert.equal(db.tables.email_preferences[0].marketing_opt_in, true)
  assert.equal(db.tables.email_marketing_suppressions.length, 0)
  db.tables.email_marketing_suppressions.push({ email: 'learner@example.com', reason: 'complaint', source: 'resend', created_at: initialNow.toISOString() })
  const resend = resendMock()
  resend.contacts.set('learner@example.com', { id: 'contact-1', email: 'learner@example.com', unsubscribed: true })
  await runMarketingLifecycle({ ...baseEnvironment, MARKETING_EMAILS_ENABLED: 'false' }, { client: db.client, fetcher: resend.fetcher, now: new Date(initialNow.getTime() + 2 * 60_000) })
  assert.equal(db.tables.email_marketing_suppressions[0].reason, 'complaint')
  assert.equal(resend.contacts.get('learner@example.com').unsubscribed, true)
})

test('an unsubscribe cannot downgrade a hard bounce suppression', async () => {
  const db = new FakeDatabase()
  db.tables.email_marketing_suppressions.push({ email: 'learner@example.com', reason: 'bounce', source: 'resend', created_at: initialNow.toISOString() })
  await optOutUser(baseEnvironment, userId, 'unsubscribe_link', db.client, async () => response(404, { message: 'not found' }))
  assert.equal(db.tables.email_marketing_suppressions[0].reason, 'bounce')
})

test('consented locale preference is persisted into the claimed queue item', async () => {
  const db = new FakeDatabase({ locale: 'es' })
  const resend = resendMock()
  await runMarketingLifecycle(baseEnvironment, { client: db.client, fetcher: resend.fetcher, now: initialNow })
  assert.equal(db.tables.email_marketing_queue[0].email_locale, 'es')
  assert.match(db.tables.email_marketing_queue[0].payload.html, /<html lang="es">/)
  assert.match(db.tables.email_marketing_queue[0].payload.subject, /Tu próximo paso/)
})

test('valid webhook processing failures return 500 while invalid signatures return 400', async () => {
  const secret = `whsec_${Buffer.from('local-test-signing-key').toString('base64')}`
  const body = JSON.stringify({ type: 'email.delivered', data: { email: 'learner@example.com' } })
  const id = 'msg_local_test'
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = `v1,${createHmac('sha256', Buffer.from(secret.slice(6), 'base64')).update(`${id}.${timestamp}.${body}`).digest('base64')}`
  const makeRequest = (givenSignature: string) => ({
    method: 'POST', headers: { 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': givenSignature },
    async *[Symbol.asyncIterator]() { yield Buffer.from(body) },
  })
  const makeResponse = () => ({
    statusCode: 0, headers: {} as Record<string, string>, body: '',
    setHeader(key: string, value: string) { this.headers[key] = value },
    end(value = '') { this.body = value },
  })
  const failedResponse = makeResponse()
  await handleResendWebhook(makeRequest(signature) as any, failedResponse as any, { secret, record: async () => { throw new Error('database unavailable') } })
  assert.equal(failedResponse.statusCode, 500)
  const invalidResponse = makeResponse()
  await handleResendWebhook(makeRequest('v1,invalid') as any, invalidResponse as any, { secret, record: async () => { throw new Error('must not be reached') } })
  assert.equal(invalidResponse.statusCode, 400)
})

test('unsubscribe confirmation page follows the frozen message locale and preserves it in the form action', async () => {
  const originalSecret = process.env.EMAIL_UNSUBSCRIBE_SECRET
  process.env.EMAIL_UNSUBSCRIBE_SECRET = 'test-unsubscribe-secret'
  try {
    const token = makeUnsubscribeToken(userId, process.env.EMAIL_UNSUBSCRIBE_SECRET, Math.floor(Date.now() / 1000) + DAY / 1000)
    for (const [locale, language, title] of [['pt-BR', 'pt-BR', 'Cancelar e-mails da Omega'], ['en', 'en', 'Unsubscribe from Omega emails'], ['es', 'es', 'Cancelar correos de Omega']] as const) {
      const request = { method: 'GET', url: `/api/email/unsubscribe?token=${encodeURIComponent(token)}&locale=${locale}` }
      const response = {
        statusCode: 0, headers: {} as Record<string, string>, body: '',
        setHeader(key: string, value: string) { this.headers[key] = value },
        end(value = '') { this.body = value },
      }
      await unsubscribe(request as any, response as any)
      assert.equal(response.statusCode, 200)
      assert.match(response.body, new RegExp(`<html lang="${language}">`))
      assert.match(response.body, new RegExp(title))
      assert.match(response.body, new RegExp(`locale=${locale}`))
      assert.match(response.body, /Ω/)
      assert.match(response.body, /© Omega Courses/)
    }
  } finally {
    if (originalSecret === undefined) delete process.env.EMAIL_UNSUBSCRIBE_SECRET
    else process.env.EMAIL_UNSUBSCRIBE_SECRET = originalSecret
  }
})

test('permanent Resend 4xx errors fail without retry; uncertain network retries stop after five attempts', async () => {
  const permanentDb = new FakeDatabase()
  const permanentResend = resendMock([400])
  const permanent = await runMarketingLifecycle(baseEnvironment, { client: permanentDb.client, fetcher: permanentResend.fetcher, now: initialNow })
  assert.equal(permanent.failed, 1)
  assert.equal(permanent.retried, 0)
  assert.equal(permanentDb.tables.email_marketing_queue[0].status, 'failed')

  const retryDb = new FakeDatabase()
  const retryResend = resendMock(['network', 'network', 'network', 'network', 'network', 'network'])
  const offsets = [0, 1, 3, 7, 15].map((minutes) => minutes * 60_000)
  for (const offset of offsets) {
    retryDb.now = new Date(initialNow.getTime() + offset)
    await runMarketingLifecycle(baseEnvironment, { client: retryDb.client, fetcher: retryResend.fetcher, now: retryDb.now })
  }
  assert.equal(retryDb.tables.email_marketing_queue[0].attempts, 5)
  assert.equal(retryDb.tables.email_marketing_queue[0].status, 'failed')
  assert.equal(retryResend.emailBodies.length, 5)
  assert.equal(new Set(retryResend.emailBodies.map((entry) => entry.idempotencyKey)).size, 1)
})
