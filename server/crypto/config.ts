import { Connection, PublicKey } from '@solana/web3.js'
import { getRegionalCatalog, type RegionalOffer } from '../../src/lib/regional-offers.ts'
import type { PlanId } from '../../src/lib/offers.ts'

type Environment = Record<string, string | undefined>

export type SolanaCluster = 'devnet' | 'testnet' | 'mainnet-beta'

export const ORDER_TTL_MINUTES = 30
// A transfer that lands moments before the deadline can still be indexed after it.
export const EXPIRY_GRACE_SECONDS = 180

export function getMerchantAddress(environment: Environment) {
  const raw = environment.SOLANA_MERCHANT_ADDRESS?.trim()
  if (!raw) throw new Error('Solana merchant address is not configured')
  try {
    return new PublicKey(raw)
  } catch {
    throw new Error('Solana merchant address is not configured: invalid public key')
  }
}

export function getRpcUrl(environment: Environment) {
  const raw = environment.SOLANA_RPC_URL?.trim()
  if (!raw) throw new Error('Solana RPC is not configured')
  // Shorthands keep local setups simple; real deployments should use a provider URL with a key.
  if (raw === 'devnet') return 'https://api.devnet.solana.com'
  if (raw === 'mainnet-beta' || raw === 'mainnet') return 'https://api.mainnet-beta.solana.com'
  const url = new URL(raw)
  if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') throw new Error('Solana RPC is not configured: must use HTTPS')
  return url.toString()
}

// Only used to label the environment in the UI and to tell wallets which chain to use. Never trusted for payment checks.
export function getCluster(environment: Environment): SolanaCluster {
  const hint = `${environment.SOLANA_CLUSTER ?? ''} ${environment.SOLANA_RPC_URL ?? ''}`.toLowerCase()
  if (/\bdevnet\b/.test(hint)) return 'devnet'
  if (/\btestnet\b/.test(hint)) return 'testnet'
  return 'mainnet-beta'
}

export function createSolanaConnection(environment: Environment) {
  return new Connection(getRpcUrl(environment), 'confirmed')
}

export function getCryptoOffer(country: string | undefined, planId: PlanId): RegionalOffer | null {
  const catalog = getRegionalCatalog(country?.trim().toUpperCase() || null)
  return catalog.offers.find((offer) => offer.planId === planId && offer.paymentMethod === 'crypto' && offer.currency === 'SOL') ?? null
}
