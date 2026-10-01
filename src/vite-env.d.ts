/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REFERRAL_BINANCE_URL?: string
  readonly VITE_REFERRAL_OKX_URL?: string
  readonly VITE_REFERRAL_COINBASE_URL?: string
  readonly VITE_REFERRAL_AXIOM_URL?: string
  readonly VITE_REFERRAL_GMGN_URL?: string
  readonly VITE_REFERRAL_FOMO_URL?: string
  readonly VITE_REFERRAL_PHOTON_URL?: string
  readonly VITE_REFERRAL_TROJAN_URL?: string
  readonly VITE_REFERRAL_BYBIT_URL?: string
  readonly VITE_REFERRAL_BITGET_URL?: string
  readonly VITE_REFERRAL_MEXC_URL?: string
  readonly VITE_REFERRAL_HYPERLIQUID_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
