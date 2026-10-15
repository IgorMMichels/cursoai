import assert from 'node:assert/strict'
import test from 'node:test'
import { createAsaasClient, getAsaasConfig, AsaasRequestError } from './asaas.ts'
import { tokenMatches } from '../../api/asaas/webhook.ts'

type Call = { url: string; method: string; headers: Record<string, string>; body?: string }

function fakeFetch(responses: Array<{ status?: number; body: unknown }>) {
  const calls: Call[] = []
  const fetchImpl = async (url: string, init: { method: string; headers: Record<string, string>; body?: string }) => {
    calls.push({ url, ...init })
    const next = responses.shift() ?? { body: {} }
    const status = next.status ?? 200
    return { ok: status >= 200 && status < 300, status, json: async () => next.body }
  }
  return { calls, fetchImpl }
}

test('sandbox is the default and production needs an explicit opt-in', () => {
  assert.equal(getAsaasConfig({ ASAAS_API_KEY: 'k' }).baseUrl, 'https://api-sandbox.asaas.com/v3')
  assert.equal(getAsaasConfig({ ASAAS_API_KEY: 'k', ASAAS_ENVIRONMENT: 'production' }).baseUrl, 'https://api.asaas.com/v3')
  assert.throws(() => getAsaasConfig({ ASAAS_API_KEY: 'k', ASAAS_ENVIRONMENT: 'prod' }), /not configured/)
})

test('missing API key reports not configured without echoing anything', () => {
  assert.throws(() => getAsaasConfig({}), /Asaas is not configured/)
})

test('sends the API key in the access_token header and never in the URL', async () => {
  const { calls, fetchImpl } = fakeFetch([{ body: { id: 'pay_1', status: 'PENDING', value: 299, externalReference: 'o1', billingType: 'PIX' } }])
  const client = createAsaasClient({ apiKey: 'secret-key', baseUrl: 'https://api-sandbox.asaas.com/v3', webhookToken: '' }, fetchImpl)
  await client.getPayment('pay_1')
  assert.equal(calls[0].url, 'https://api-sandbox.asaas.com/v3/payments/pay_1')
  assert.equal(calls[0].headers.access_token, 'secret-key')
  assert.ok(!calls[0].url.includes('secret-key'))
})

test('creates a Pix charge with the PIX billing type and our order reference', async () => {
  const { calls, fetchImpl } = fakeFetch([{ body: { id: 'pay_9', status: 'PENDING', value: 299, externalReference: 'order-1', billingType: 'PIX' } }])
  const client = createAsaasClient({ apiKey: 'k', baseUrl: 'https://api-sandbox.asaas.com/v3', webhookToken: '' }, fetchImpl)
  const payment = await client.createPixPayment({ customerId: 'cus_1', value: 299, dueDate: '2026-10-13', externalReference: 'order-1', description: 'Ômega' })
  assert.equal(payment.id, 'pay_9')
  assert.equal(calls[0].method, 'POST')
  const body = JSON.parse(calls[0].body ?? '{}') as Record<string, unknown>
  assert.deepEqual(body, { customer: 'cus_1', billingType: 'PIX', value: 299, dueDate: '2026-10-13', externalReference: 'order-1', description: 'Ômega' })
})

test('reuses an existing customer with the same CPF', async () => {
  const { calls, fetchImpl } = fakeFetch([{ body: { data: [{ id: 'cus_existing' }] } }])
  const client = createAsaasClient({ apiKey: 'k', baseUrl: 'https://api-sandbox.asaas.com/v3', webhookToken: '' }, fetchImpl)
  const id = await client.findOrCreateCustomer({ name: 'Ana Silva', cpfCnpj: '52998224725', externalReference: 'user-1' })
  assert.equal(id, 'cus_existing')
  assert.equal(calls.length, 1)
})

test('surfaces Asaas HTTP errors with status and code only', async () => {
  const { fetchImpl } = fakeFetch([{ status: 400, body: { errors: [{ code: 'invalid_cpfCnpj', description: 'CPF inválido' }] } }])
  const client = createAsaasClient({ apiKey: 'k', baseUrl: 'https://api-sandbox.asaas.com/v3', webhookToken: '' }, fetchImpl)
  await assert.rejects(client.getPayment('pay_x'), (error: unknown) => error instanceof AsaasRequestError && error.status === 400 && error.code === 'invalid_cpfCnpj')
})

test('webhook token must match exactly and cannot be empty', () => {
  assert.equal(tokenMatches('abc123', 'abc123'), true)
  assert.equal(tokenMatches('abc124', 'abc123'), false)
  assert.equal(tokenMatches('abc', 'abc123'), false)
  assert.equal(tokenMatches(undefined, 'abc123'), false)
  assert.equal(tokenMatches('', ''), false)
})
