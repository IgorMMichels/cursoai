import assert from 'node:assert/strict'
import test from 'node:test'
import { Keypair, SystemProgram, Transaction, type TransactionError } from '@solana/web3.js'
import bs58 from 'bs58'
import { isSignatureShape, RpcUnavailableError, settleOrder, type PaymentConnection, type PaymentStore, type SolanaOrder } from './payment.ts'

const merchant = Keypair.generate().publicKey
const buyer = Keypair.generate().publicKey
const reference = Keypair.generate().publicKey
const LAMPORTS = 700_000_000n
const expiresAt = new Date('2026-10-11T12:30:00Z')
const beforeExpiry = new Date('2026-10-11T12:10:00Z')
const afterExpiry = new Date('2026-10-11T12:40:00Z')
const signature = bs58.encode(new Uint8Array(64).fill(7))
const otherSignature = bs58.encode(new Uint8Array(64).fill(9))

const order = (overrides: Partial<SolanaOrder> = {}): SolanaOrder => ({
  id: '11111111-1111-4111-8111-111111111111',
  currency: 'SOL',
  status: 'pending',
  reference: reference.toBase58(),
  amount_lamports: LAMPORTS.toString(),
  expires_at: expiresAt.toISOString(),
  ...overrides,
})

type ChainOptions = { to?: typeof merchant; paid?: bigint; credited?: bigint; ref?: typeof reference; blockTime?: Date; err?: TransactionError | null; indexed?: boolean; rpcDown?: boolean }

// Builds a real legacy transfer so @solana/pay's validateTransfer runs against genuine message bytes.
function chain(options: ChainOptions = {}) {
  const { to = merchant, paid = LAMPORTS, credited = paid, ref = reference, blockTime = beforeExpiry, err = null, indexed = true, rpcDown = false } = options
  const transfer = SystemProgram.transfer({ fromPubkey: buyer, toPubkey: to, lamports: paid })
  transfer.keys.push({ pubkey: ref, isSigner: false, isWritable: false })
  const transaction = new Transaction({ feePayer: buyer, recentBlockhash: bs58.encode(new Uint8Array(32).fill(1)) }).add(transfer)
  const message = transaction.compileMessage()
  const keys = message.accountKeys
  const toIndex = keys.findIndex((key) => key.equals(to))
  const pre = keys.map(() => 5_000_000_000)
  const post = pre.slice()
  post[toIndex] = pre[toIndex]! + Number(credited)
  const connection: PaymentConnection = {
    getSignaturesForAddress: async (address) => {
      if (rpcDown) throw new Error('fetch failed')
      return indexed && address.equals(reference) ? [{ signature, slot: 1, err: null, memo: null, blockTime: Math.floor(blockTime.getTime() / 1000) }] : []
    },
    getTransaction: (async (requested: string) => {
      if (rpcDown) throw new Error('fetch failed')
      if (requested !== signature) return null
      return { slot: 1, blockTime: Math.floor(blockTime.getTime() / 1000), transaction: { message, signatures: [signature] }, meta: { err, fee: 5000, preBalances: pre, postBalances: post, innerInstructions: [], logMessages: [], preTokenBalances: [], postTokenBalances: [], rewards: [] } }
    }) as never,
  }
  return connection
}

function memoryStore(options: { usedSignatures?: string[]; releasesOrder?: boolean } = {}) {
  const calls = { fulfilled: [] as Array<{ orderId: string; signature: string; amountLamports: bigint }>, expired: [] as string[] }
  const store: PaymentStore = {
    async fulfill(args) {
      if (options.usedSignatures?.includes(args.signature)) throw Object.assign(new Error('duplicate key value'), { code: '23505' })
      calls.fulfilled.push({ orderId: args.orderId, signature: args.signature, amountLamports: args.amountLamports })
      return options.releasesOrder ?? true
    },
    async markExpired(orderId) { calls.expired.push(orderId) },
  }
  return { store, calls }
}

const settle = (connection: PaymentConnection, store: PaymentStore, overrides: Partial<SolanaOrder> = {}, extra: { signatureHint?: string; now?: Date } = {}) =>
  settleOrder({ connection, store, merchant, order: order(overrides), now: beforeExpiry, ...extra })

test('releases access for the exact amount to the Omega address with the order reference', async () => {
  const { store, calls } = memoryStore()
  assert.deepEqual(await settle(chain(), store), { status: 'confirmed' })
  assert.equal(calls.fulfilled.length, 1)
  assert.equal(calls.fulfilled[0]!.signature, signature)
  assert.equal(calls.fulfilled[0]!.amountLamports, LAMPORTS)
})

test('accepts a signature hint from the browser only after verifying it on-chain', async () => {
  const { store, calls } = memoryStore()
  assert.deepEqual(await settle(chain({ indexed: false }), store, {}, { signatureHint: signature }), { status: 'confirmed' })
  assert.equal(calls.fulfilled.length, 1)
  assert.deepEqual(await settle(chain({ indexed: false }), memoryStore().store, {}, { signatureHint: otherSignature }), { status: 'pending' })
})

test('rejects an amount that is lower or higher by even one lamport', async () => {
  for (const paid of [LAMPORTS - 1n, LAMPORTS + 1n]) {
    const { store, calls } = memoryStore()
    assert.deepEqual(await settle(chain({ paid }), store), { status: 'invalid', reason: 'amount' })
    assert.equal(calls.fulfilled.length, 0)
  }
})

test('rejects a transfer whose recipient is not the Omega address', async () => {
  const { store, calls } = memoryStore()
  assert.deepEqual(await settle(chain({ to: Keypair.generate().publicKey }), store, {}, { signatureHint: signature }), { status: 'invalid', reason: 'recipient' })
  assert.equal(calls.fulfilled.length, 0)
})

test('rejects a transfer carrying a different reference', async () => {
  const { store, calls } = memoryStore()
  assert.deepEqual(await settle(chain({ ref: Keypair.generate().publicKey, indexed: false }), store, {}, { signatureHint: signature }), { status: 'invalid', reason: 'reference' })
  assert.equal(calls.fulfilled.length, 0)
})

test('rejects a transaction that failed on-chain', async () => {
  const { store, calls } = memoryStore()
  assert.deepEqual(await settle(chain({ err: { InstructionError: [0, 'Custom'] } as TransactionError }), store), { status: 'invalid', reason: 'failed_tx' })
  assert.equal(calls.fulfilled.length, 0)
})

test('stays pending while nothing has reached the network, then reports expiry', async () => {
  const { store, calls } = memoryStore()
  assert.deepEqual(await settle(chain({ indexed: false }), store), { status: 'pending' })
  assert.deepEqual(await settle(chain({ indexed: false }), store, {}, { now: new Date(expiresAt.getTime() + 30_000) }), { status: 'expired' })
  assert.equal(calls.expired.length, 0, 'a payment may still land just after the deadline')
  assert.deepEqual(await settle(chain({ indexed: false }), store, {}, { now: afterExpiry }), { status: 'expired' })
  assert.deepEqual(calls.expired, [order().id])
})

test('accepts a payment made before expiry but verified later, and rejects one made after', async () => {
  const late = memoryStore()
  assert.deepEqual(await settle(chain({ blockTime: new Date(expiresAt.getTime() + 5 * 60_000) }), late.store, {}, { now: afterExpiry }), { status: 'invalid', reason: 'late' })
  assert.equal(late.calls.fulfilled.length, 0)
  const inTime = memoryStore()
  assert.deepEqual(await settle(chain({ blockTime: beforeExpiry }), inTime.store, { status: 'expired' }, { now: afterExpiry }), { status: 'confirmed' })
  assert.equal(inTime.calls.fulfilled.length, 1)
})

test('a signature that already released another order is refused', async () => {
  const { store, calls } = memoryStore({ usedSignatures: [signature] })
  assert.deepEqual(await settle(chain(), store), { status: 'signature_used' })
  assert.equal(calls.fulfilled.length, 0)
})

test('an order that is already paid is not released again', async () => {
  const { store, calls } = memoryStore()
  assert.deepEqual(await settle(chain(), store, { status: 'confirmed' }), { status: 'confirmed' })
  assert.equal(calls.fulfilled.length, 0)
  assert.deepEqual(await settle(chain(), memoryStore({ releasesOrder: false }).store), { status: 'failed' })
})

test('orders that cannot be paid on-chain are never released', async () => {
  const { store, calls } = memoryStore()
  for (const overrides of [{ status: 'failed' }, { status: 'refunded' }, { currency: 'BRL' }, { reference: null }, { amount_lamports: null }]) {
    assert.deepEqual(await settle(chain(), store, overrides), { status: 'failed' })
  }
  assert.equal(calls.fulfilled.length, 0)
})

test('surfaces an RPC outage instead of guessing', async () => {
  await assert.rejects(settle(chain({ rpcDown: true }), memoryStore().store), RpcUnavailableError)
})

test('only well-formed base58 signatures are accepted from the browser', () => {
  assert.equal(isSignatureShape(signature), true)
  for (const bad of ['', 'short', `${signature}0`, 123, null, `${signature}!`]) assert.equal(isSignatureShape(bad), false)
})
