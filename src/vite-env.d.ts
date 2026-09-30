/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REFERRAL_BINANCE_URL?: string
  readonly VITE_REFERRAL_OKX_URL?: string
  readonly VITE_REFERRAL_COINBASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
