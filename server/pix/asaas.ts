// Thin Asaas REST client for Pix charges. Server-only: the API key never reaches the browser.
type Environment = Record<string, string | undefined>
type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body?: string }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>

export type AsaasConfig = { apiKey: string; baseUrl: string; webhookToken: string }

export class AsaasRequestError extends Error {
  status: number
  code: string | null

  constructor(status: number, code: string | null) {
    super(`Asaas request failed with status ${status}${code ? ` (${code})` : ''}`)
    this.status = status
    this.code = code
  }
}

export function getAsaasConfig(environment: Environment): AsaasConfig {
  const apiKey = environment.ASAAS_API_KEY?.trim()
  if (!apiKey) throw new Error('Asaas is not configured: ASAAS_API_KEY is missing')
  // Sandbox is the default so a forgotten variable never charges real money. Production must be opted into.
  const environmentName = environment.ASAAS_ENVIRONMENT?.trim() || 'sandbox'
  if (environmentName !== 'sandbox' && environmentName !== 'production') throw new Error('Asaas is not configured: ASAAS_ENVIRONMENT must be sandbox or production')
  const baseUrl = environmentName === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3'
  const webhookToken = environment.ASAAS_WEBHOOK_TOKEN?.trim() ?? ''
  return { apiKey, baseUrl, webhookToken }
}

export type AsaasPayment = { id: string; status: string; value: number; externalReference: string | null; billingType: string }
export type AsaasPixQrCode = { encodedImage: string; payload: string; expirationDate: string }

export function createAsaasClient(config: AsaasConfig, fetchImpl: FetchLike = fetch as unknown as FetchLike) {
  async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const response = await fetchImpl(`${config.baseUrl}${path}`, {
      method,
      headers: {
        access_token: config.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'omega-web',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    const payload = await response.json().catch(() => null) as { errors?: Array<{ code?: string }> } | null
    if (!response.ok) throw new AsaasRequestError(response.status, payload?.errors?.[0]?.code ?? null)
    return payload as T
  }

  return {
    // Reuses an existing Asaas customer with the same CPF; creates one otherwise.
    async findOrCreateCustomer(input: { name: string; cpfCnpj: string; externalReference: string }) {
      const existing = await request<{ data: Array<{ id: string }> }>('GET', `/customers?cpfCnpj=${encodeURIComponent(input.cpfCnpj)}&limit=1`)
      if (existing.data[0]?.id) return existing.data[0].id
      const created = await request<{ id: string }>('POST', '/customers', {
        name: input.name,
        cpfCnpj: input.cpfCnpj,
        externalReference: input.externalReference,
        notificationDisabled: true,
      })
      return created.id
    },

    createPixPayment(input: { customerId: string; value: number; dueDate: string; externalReference: string; description: string }) {
      return request<AsaasPayment>('POST', '/payments', {
        customer: input.customerId,
        billingType: 'PIX',
        value: input.value,
        dueDate: input.dueDate,
        externalReference: input.externalReference,
        description: input.description,
      })
    },

    getPixQrCode(paymentId: string) {
      return request<AsaasPixQrCode>('GET', `/payments/${encodeURIComponent(paymentId)}/pixQrCode`)
    },

    // The webhook only says "something happened"; the status and value come from here, never from the webhook body.
    getPayment(paymentId: string) {
      return request<AsaasPayment>('GET', `/payments/${encodeURIComponent(paymentId)}`)
    },
  }
}
