import assert from 'node:assert/strict'
import test from 'node:test'
import { encodeURL } from '@solana/pay'
import { Keypair, SystemInstruction, SystemProgram } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import { buildSolanaPayUrl, buildTransferTransaction, isWalletRejection, lamportsToSol, type CryptoOrder } from '../../src/lib/solana-checkout.ts'

const payer = Keypair.generate().publicKey
const order: CryptoOrder = {
  orderId: '11111111-1111-4111-8111-111111111111',
  reference: Keypair.generate().publicKey.toBase58(),
  recipient: Keypair.generate().publicKey.toBase58(),
  amountLamports: '700000000',
  expiresAt: '2026-10-11T12:30:00Z',
  cluster: 'devnet',
}

test('formats lamports as exact SOL text', () => {
  assert.equal(lamportsToSol('700000000'), '0.7')
  assert.equal(lamportsToSol('1300000000'), '1.3')
  assert.equal(lamportsToSol('1000000000'), '1')
  assert.equal(lamportsToSol('123456789'), '0.123456789')
  assert.equal(lamportsToSol('9007199254740993000'), '9007199254.740993')
})

test('builds a transfer of the exact lamports to the recipient with the reference in the instruction keys', () => {
  const transaction = buildTransferTransaction(order, payer)
  const [instruction] = transaction.instructions
  assert.equal(transaction.instructions.length, 1)
  assert.ok(instruction!.programId.equals(SystemProgram.programId))
  const decoded = SystemInstruction.decodeTransfer(instruction!)
  assert.equal(decoded.lamports, 700_000_000n)
  assert.equal(decoded.toPubkey.toBase58(), order.recipient)
  assert.equal(decoded.fromPubkey.toBase58(), payer.toBase58())
  assert.equal(instruction!.keys.at(-1)!.pubkey.toBase58(), order.reference)
  assert.equal(instruction!.keys.at(-1)!.isWritable, false)
  assert.equal(transaction.feePayer!.toBase58(), payer.toBase58())
})

test('the QR link matches the official Solana Pay encoder', () => {
  const official = encodeURL({
    recipient: Keypair.generate().publicKey,
    amount: new BigNumber('0.7'),
    reference: Keypair.generate().publicKey,
    label: 'Omega',
    message: 'Curso',
  })
  const fields = { ...order, recipient: official.pathname, reference: official.searchParams.get('reference')! }
  assert.equal(buildSolanaPayUrl(fields, 'Omega', 'Curso'), official.toString())
})

test('recognizes a wallet rejection', () => {
  assert.equal(isWalletRejection(Object.assign(new Error('User rejected the request.'), { name: 'WalletSendTransactionError' })), true)
  assert.equal(isWalletRejection({ message: 'x', error: { code: 4001 } }), true)
  assert.equal(isWalletRejection(new Error('Blockhash not found')), false)
})
