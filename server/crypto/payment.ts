import { findReference, FindReferenceError, validateTransfer, ValidateTransferError } from '@solana/pay'
import { LAMPORTS_PER_SOL, PublicKey, type Connection } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import { EXPIRY_GRACE_SECONDS } from './config.ts'

export type PaymentConnection = Pick<Connection, 'getSignaturesForAddress' | 'getTransaction'>

export type SolanaOrder = {
  id: string
  currency: string
  status: string
  reference: string | null
  amount_lamports: number | string | null
  expires_at: string | null
}

export type InvalidReason = 'amount' | 'recipient' | 'reference' | 'transfer' | 'failed_tx' | 'late'

export type PaymentOutcome =
  | { status: 'confirmed' }
  | { status: 'pending' }
  | { status: 'expired' }
  | { status: 'failed' }
  | { status: 'invalid'; reason: InvalidReason }
  | { status: 'signature_used' }

export type PaymentStore = {
  // Releases access through the shared SQL function. Resolves false when the order was already paid with another signature.
  fulfill(args: { orderId: string; signature: string; amountLamports: bigint; blockTime: Date }): Promise<boolean>
  markExpired(orderId: string): Promise<void>
}

export class RpcUnavailableError extends Error {}

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{64,90}$/

export function isSignatureShape(value: unknown): value is string {
  return typeof value === 'string' && BASE58.test(value)
}

type Verified = { blockTime: Date }
type Verification = { ok: true; verified: Verified } | { ok: false; reason: InvalidReason | 'not_found' }

// validateTransfer checks the recipient, the reference and "at least" the amount at confirmed commitment.
// The Omega price is exact, so the credited difference must also match to the lamport.
async function verifyTransfer(connection: PaymentConnection, signature: string, merchant: PublicKey, reference: PublicKey, lamports: bigint): Promise<Verification> {
  let rpcError: unknown = null
  const watched: PaymentConnection = {
    getSignaturesForAddress: connection.getSignaturesForAddress.bind(connection),
    getTransaction: async (...args) => {
      try {
        return await connection.getTransaction(...args)
      } catch (error) {
        rpcError = error
        throw error
      }
    },
  }
  try {
    const response = await validateTransfer(
      watched as Connection,
      signature,
      { recipient: merchant, amount: new BigNumber(lamports.toString()).dividedBy(LAMPORTS_PER_SOL), reference },
      { commitment: 'confirmed' },
    )
    const meta = response.meta
    const keys = response.transaction.message.accountKeys
    const index = keys.findIndex((key) => key.equals(merchant))
    if (!meta || index === -1) return { ok: false, reason: 'recipient' }
    const credited = BigInt(meta.postBalances[index] ?? 0) - BigInt(meta.preBalances[index] ?? 0)
    if (credited !== lamports) return { ok: false, reason: 'amount' }
    if (!response.blockTime) return { ok: false, reason: 'not_found' }
    return { ok: true, verified: { blockTime: new Date(response.blockTime * 1000) } }
  } catch (error) {
    if (rpcError) throw new RpcUnavailableError('Solana RPC request failed')
    if (error instanceof ValidateTransferError) {
      const message = error.message
      if (message === 'not found' || message === 'missing meta') return { ok: false, reason: 'not_found' }
      if (message === 'recipient not found') return { ok: false, reason: 'recipient' }
      if (message.startsWith('invalid reference')) return { ok: false, reason: 'reference' }
      if (message === 'amount not transferred') return { ok: false, reason: 'amount' }
      return { ok: false, reason: 'transfer' }
    }
    // validateTransfer rethrows the on-chain error object when the transaction itself failed.
    if (!(error instanceof Error)) return { ok: false, reason: 'failed_tx' }
    return { ok: false, reason: 'transfer' }
  }
}

async function locateSignature(connection: PaymentConnection, reference: PublicKey) {
  try {
    return (await findReference(connection as Connection, reference, { finality: 'confirmed' })).signature
  } catch (error) {
    if (error instanceof FindReferenceError) return null
    throw new RpcUnavailableError('Solana RPC request failed')
  }
}

export type SettleInput = {
  connection: PaymentConnection
  store: PaymentStore
  merchant: PublicKey
  order: SolanaOrder
  // Signature reported by the browser. It is only a hint: it is verified like any other candidate.
  signatureHint?: string
  now?: Date
}

/**
 * Looks for the order's payment on-chain and, only if it matches exactly, releases access.
 * Nothing the browser sends decides the amount, the recipient or the status.
 */
export async function settleOrder({ connection, store, merchant, order, signatureHint, now = new Date() }: SettleInput): Promise<PaymentOutcome> {
  if (order.currency !== 'SOL' || !order.reference || order.amount_lamports === null || !order.expires_at) return { status: 'failed' }
  if (order.status === 'confirmed') return { status: 'confirmed' }
  if (order.status !== 'pending' && order.status !== 'expired') return { status: 'failed' }

  const lamports = BigInt(order.amount_lamports)
  const reference = new PublicKey(order.reference)
  const expiresAt = new Date(order.expires_at)

  const candidates = new Set<string>()
  if (signatureHint) candidates.add(signatureHint)
  const located = await locateSignature(connection, reference)
  if (located) candidates.add(located)

  let invalid: InvalidReason | null = null
  for (const signature of candidates) {
    const result = await verifyTransfer(connection, signature, merchant, reference, lamports)
    if (!result.ok) {
      if (result.reason !== 'not_found') invalid = invalid ?? result.reason
      continue
    }
    if (result.verified.blockTime.getTime() > expiresAt.getTime() + 60_000) {
      invalid = 'late'
      continue
    }
    try {
      const released = await store.fulfill({ orderId: order.id, signature, amountLamports: lamports, blockTime: result.verified.blockTime })
      return released ? { status: 'confirmed' } : { status: 'failed' }
    } catch (error) {
      const code = (error as { code?: string } | null)?.code
      if (code === '23505') return { status: 'signature_used' }
      // The database refused (amount, expiry or state); it is the last line of defense and never releases access.
      if (code === '22023') return { status: 'failed' }
      throw error
    }
  }

  if (invalid) return { status: 'invalid', reason: invalid }
  if (now.getTime() > expiresAt.getTime()) {
    if (now.getTime() > expiresAt.getTime() + EXPIRY_GRACE_SECONDS * 1000 && order.status === 'pending') await store.markExpired(order.id)
    return { status: 'expired' }
  }
  return { status: 'pending' }
}

type RpcClient = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }>
  from(table: string): {
    update(values: Record<string, unknown>): { eq(column: string, value: string): { eq(column: string, value: string): PromiseLike<{ error: { message: string } | null }> } }
  }
}

export function createSupabaseStore(admin: RpcClient): PaymentStore {
  return {
    async fulfill({ orderId, signature, amountLamports, blockTime }) {
      const { data, error } = await admin.rpc('fulfill_crypto_order', {
        p_order_id: orderId,
        p_signature: signature,
        p_amount_lamports: amountLamports.toString(),
        p_block_time: blockTime.toISOString(),
      })
      if (error) throw error
      return data === true
    },
    async markExpired(orderId) {
      const { error } = await admin.from('orders').update({ status: 'expired' }).eq('id', orderId).eq('status', 'pending')
      if (error) throw new Error('Could not mark order expired')
    },
  }
}
