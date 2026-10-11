import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js'

// Order data returned by POST /api/crypto/create-order. The server owns every value; the browser only displays and signs them.
export type CryptoOrder = {
  orderId: string
  reference: string
  recipient: string
  amountLamports: string
  expiresAt: string
  cluster: 'devnet' | 'testnet' | 'mainnet-beta'
}

export type PaymentOutcome =
  | { status: 'confirmed' | 'pending' | 'expired' | 'failed' | 'signature_used' }
  | { status: 'invalid'; reason: string }

const LAMPORTS_PER_SOL = 1_000_000_000n

// Exact decimal text for a lamport amount. Never goes through a floating point number.
export function lamportsToSol(lamports: string) {
  const value = BigInt(lamports)
  const whole = value / LAMPORTS_PER_SOL
  const fraction = (value % LAMPORTS_PER_SOL).toString().padStart(9, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}

// SystemProgram.transfer with the order reference appended as a read-only key of the instruction,
// the shape Solana Pay validates and findReference can search for.
export function buildTransferTransaction(order: CryptoOrder, payer: PublicKey) {
  const instruction = SystemProgram.transfer({ fromPubkey: payer, toPubkey: new PublicKey(order.recipient), lamports: BigInt(order.amountLamports) })
  instruction.keys.push({ pubkey: new PublicKey(order.reference), isSigner: false, isWritable: false })
  return new Transaction({ feePayer: payer }).add(instruction)
}

// Solana Pay transfer request (https://github.com/solana-foundation/pay): any Solana wallet can open it.
export function buildSolanaPayUrl(order: CryptoOrder, label: string, message: string) {
  const url = new URL(`solana:${order.recipient}`)
  url.searchParams.append('amount', lamportsToSol(order.amountLamports))
  url.searchParams.append('reference', order.reference)
  url.searchParams.append('label', label)
  url.searchParams.append('message', message)
  return url.toString()
}

export function isWalletRejection(error: unknown) {
  const text = [error, (error as { error?: unknown } | null)?.error].map((item) => `${(item as { name?: string } | null)?.name ?? ''} ${(item as { message?: string } | null)?.message ?? ''} ${(item as { code?: unknown } | null)?.code ?? ''}`).join(' ')
  return /reject|denied|declin|cancel|4001/i.test(text)
}
