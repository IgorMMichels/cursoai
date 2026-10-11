import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react'
import { WalletReadyState, type WalletName } from '@solana/wallet-adapter-base'
import { Connection } from '@solana/web3.js'
import { Check, Copy, Loader2, Wallet } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { localizedPath, type UiLocale } from '@/lib/localization'
import { buildSolanaPayUrl, buildTransferTransaction, isWalletRejection, lamportsToSol, type CryptoOrder, type PaymentOutcome } from '@/lib/solana-checkout'
import { supabase } from '@/lib/supabase'
import type { PlanId } from '@/lib/offers'

const copy = {
  'pt-BR': {
    payWithWallet: 'Pagar com carteira', working: 'Preparando o pedido…', chooseWallet: 'Escolha sua carteira', noWallet: 'Nenhuma carteira Solana foi detectada neste navegador. Use o QR code ou o link abaixo.',
    showQr: 'Pagar pelo celular (QR code)', hideQr: 'Ocultar QR code', qrHint: 'Escaneie com a câmera da sua carteira Solana ou abra o link no celular.', openLink: 'Abrir na carteira', copyLink: 'Copiar link', copied: 'Link copiado',
    amount: 'Valor exato', recipient: 'Destino', expiresIn: 'Pedido válido por', testNetwork: 'Rede de teste (devnet): nenhum valor real é cobrado.',
    stateWallet: 'Aguardando a carteira. Confira o valor e o destino na janela da carteira e confirme.',
    stateNetwork: 'Pagamento enviado. Aguardando a confirmação na rede Solana. Seu acesso só é liberado depois dela.',
    stateConfirmed: 'Pagamento confirmado. Seu acesso foi liberado.', goCourse: 'Ir para o curso',
    stateExpired: 'O pedido expirou e nenhum pagamento foi encontrado. Gere um novo pedido para continuar.', newOrder: 'Gerar novo pedido',
    stateCancelled: 'Pagamento cancelado na carteira. Nada foi enviado.', retry: 'Tentar de novo',
    errorGeneric: 'Não foi possível concluir o pagamento. Se a carteira já enviou o valor, aguarde: confirmamos automaticamente.',
    errorInvalid: 'Encontramos um envio que não corresponde ao pedido (valor ou destino diferente). O acesso não foi liberado. Fale com o suporte.',
    errorNotConfigured: 'O pagamento em cripto ainda não foi configurado no servidor. Nada foi cobrado.',
    errorNetwork: 'A rede Solana demorou a responder. Continuamos tentando.',
    payMessage: 'Acesso ao curso Ômega', hint: 'Você confirma tudo na sua carteira. A Ômega nunca pede sua frase secreta nem sua chave privada.',
  },
  en: {
    payWithWallet: 'Pay with wallet', working: 'Preparing the order…', chooseWallet: 'Choose your wallet', noWallet: 'No Solana wallet was detected in this browser. Use the QR code or the link below.',
    showQr: 'Pay from your phone (QR code)', hideQr: 'Hide QR code', qrHint: 'Scan it with your Solana wallet camera or open the link on your phone.', openLink: 'Open in wallet', copyLink: 'Copy link', copied: 'Link copied',
    amount: 'Exact amount', recipient: 'Recipient', expiresIn: 'Order valid for', testNetwork: 'Test network (devnet): no real value is charged.',
    stateWallet: 'Waiting for the wallet. Check the amount and recipient in the wallet window and confirm.',
    stateNetwork: 'Payment sent. Waiting for confirmation on the Solana network. Your access opens only after it.',
    stateConfirmed: 'Payment confirmed. Your access is open.', goCourse: 'Go to the course',
    stateExpired: 'The order expired and no payment was found. Create a new order to continue.', newOrder: 'Create new order',
    stateCancelled: 'Payment cancelled in the wallet. Nothing was sent.', retry: 'Try again',
    errorGeneric: 'We could not complete the payment. If the wallet already sent the amount, wait: we confirm it automatically.',
    errorInvalid: 'We found a transfer that does not match the order (different amount or recipient). Access was not released. Contact support.',
    errorNotConfigured: 'Crypto payment is not configured on the server yet. Nothing was charged.',
    errorNetwork: 'The Solana network is slow to respond. We keep trying.',
    payMessage: 'Omega course access', hint: 'You confirm everything in your wallet. Omega never asks for your seed phrase or private key.',
  },
  es: {
    payWithWallet: 'Pagar con billetera', working: 'Preparando el pedido…', chooseWallet: 'Elige tu billetera', noWallet: 'No se detectó ninguna billetera Solana en este navegador. Usa el código QR o el enlace de abajo.',
    showQr: 'Pagar desde el móvil (código QR)', hideQr: 'Ocultar código QR', qrHint: 'Escanéalo con la cámara de tu billetera Solana o abre el enlace en el móvil.', openLink: 'Abrir en la billetera', copyLink: 'Copiar enlace', copied: 'Enlace copiado',
    amount: 'Importe exacto', recipient: 'Destino', expiresIn: 'Pedido válido por', testNetwork: 'Red de prueba (devnet): no se cobra ningún valor real.',
    stateWallet: 'Esperando la billetera. Revisa el importe y el destino en la ventana de la billetera y confirma.',
    stateNetwork: 'Pago enviado. Esperando la confirmación en la red Solana. Tu acceso se abre solo después de ella.',
    stateConfirmed: 'Pago confirmado. Tu acceso está abierto.', goCourse: 'Ir al curso',
    stateExpired: 'El pedido venció y no se encontró ningún pago. Crea un pedido nuevo para continuar.', newOrder: 'Crear pedido nuevo',
    stateCancelled: 'Pago cancelado en la billetera. No se envió nada.', retry: 'Intentar de nuevo',
    errorGeneric: 'No pudimos completar el pago. Si la billetera ya envió el importe, espera: lo confirmamos automáticamente.',
    errorInvalid: 'Encontramos un envío que no coincide con el pedido (importe o destino distinto). No se liberó el acceso. Contacta con soporte.',
    errorNotConfigured: 'El pago en cripto aún no está configurado en el servidor. No se cobró nada.',
    errorNetwork: 'La red Solana tarda en responder. Seguimos intentando.',
    payMessage: 'Acceso al curso Omega', hint: 'Confirmas todo en tu billetera. Omega nunca pide tu frase secreta ni tu clave privada.',
  },
} as const

type Phase = 'idle' | 'creating' | 'choose' | 'connecting' | 'wallet' | 'network' | 'confirmed' | 'expired' | 'cancelled' | 'error'
type ErrorKey = 'errorGeneric' | 'errorInvalid' | 'errorNotConfigured'

const POLL_MS = 3500

async function accessToken() {
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } }
  return data.session?.access_token ?? ''
}

async function api<T>(path: string, body: unknown): Promise<{ ok: boolean; status: number; data: T & { code?: string } }> {
  const response = await fetch(path, { method: 'POST', headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return { ok: response.ok, status: response.status, data: await response.json().catch(() => ({})) as T & { code?: string } }
}

// The RPC key stays on the server: the browser talks to our own proxy. The cluster word in the URL tells wallets which chain to use.
function rpcEndpoint(cluster?: CryptoOrder['cluster']) {
  return `${window.location.origin}/api/crypto/rpc${cluster && cluster !== 'mainnet-beta' ? `?cluster=${cluster}` : ''}`
}

function createRpcConnection(cluster?: CryptoOrder['cluster']) {
  return new Connection(rpcEndpoint(cluster), {
    commitment: 'confirmed',
    disableRetryOnRateLimit: true,
    fetchMiddleware: (info, init, send) => {
      void accessToken().then((token) => send(info, { ...init, headers: { ...(init?.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` } }))
    },
  })
}

type Props = { planId: PlanId; locale: UiLocale; priceLabel: string }

export default function SolanaCheckout(props: Props) {
  const connectionEndpoint = useMemo(() => rpcEndpoint(), [])
  // wallets={[]}: only Wallet Standard wallets the browser exposes (Phantom, Solflare, Backpack, ...) are used.
  return <ConnectionProvider endpoint={connectionEndpoint}><WalletProvider wallets={[]} autoConnect={false}><CryptoPanel {...props} /></WalletProvider></ConnectionProvider>
}

function CryptoPanel({ planId, locale, priceLabel }: Props) {
  const labels = copy[locale]
  const { wallets, wallet, select, connect, connected, publicKey, sendTransaction } = useWallet()
  const [phase, setPhase] = useState<Phase>('idle')
  const [order, setOrder] = useState<CryptoOrder | null>(null)
  const [errorKey, setErrorKey] = useState<ErrorKey>('errorGeneric')
  const [qrOpen, setQrOpen] = useState(false)
  const [noWallet, setNoWallet] = useState(false)
  const [slow, setSlow] = useState(false)
  const [copied, setCopied] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [pendingWallet, setPendingWallet] = useState<string | null>(null)
  const signatureRef = useRef<string | undefined>(undefined)
  const detected = wallets.filter((entry) => entry.readyState === WalletReadyState.Installed || entry.readyState === WalletReadyState.Loadable)

  const remainingMs = order ? new Date(order.expiresAt).getTime() - now : 0
  const closed = phase === 'confirmed' || phase === 'expired'
  const payUrl = useMemo(() => order ? buildSolanaPayUrl(order, 'Ômega', labels.payMessage) : '', [order, labels.payMessage])

  useEffect(() => {
    if (!order || closed) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [order, closed])

  // Before any payment is in flight an elapsed timer means the order can no longer be paid.
  useEffect(() => {
    if (order && remainingMs <= 0 && ['idle', 'choose', 'connecting', 'wallet', 'cancelled', 'error'].includes(phase)) setPhase('expired')
  }, [order, remainingMs, phase])

  const fail = useCallback((key: ErrorKey) => { setErrorKey(key); setPhase('error') }, [])

  const createOrder = useCallback(async () => {
    setPhase('creating')
    const result = await api<Partial<CryptoOrder> & { error?: string }>('/api/crypto/create-order', { planId })
    if (!result.ok || !result.data.orderId) {
      // 404 means the /api routes are not being served (plain Vite dev server), which is also a server setup problem.
      fail(result.data.code === 'not_configured' || result.status === 404 ? 'errorNotConfigured' : 'errorGeneric')
      return null
    }
    const created = result.data as CryptoOrder
    signatureRef.current = undefined
    setOrder(created)
    setNow(Date.now())
    return created
  }, [planId, fail])

  const sendPayment = useCallback(async (target: CryptoOrder) => {
    if (!publicKey) return
    setPhase('wallet')
    try {
      const connection = createRpcConnection(target.cluster)
      const transaction = buildTransferTransaction(target, publicKey)
      transaction.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash
      signatureRef.current = await sendTransaction(transaction, connection)
      setPhase('network')
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[solana-checkout] send failed', error)
      if (isWalletRejection(error)) setPhase('cancelled')
      else fail('errorGeneric')
    }
  }, [publicKey, sendTransaction, fail])

  // Wallet selection is asynchronous state, so connecting and paying continue from effects once the adapter is ready.
  useEffect(() => {
    if (!pendingWallet || phase !== 'connecting' || connected || wallet?.adapter.name !== pendingWallet) return
    connect().catch((error: unknown) => { if (import.meta.env.DEV) console.warn('[solana-checkout] connect failed', error); setPendingWallet(null); if (isWalletRejection(error)) setPhase('cancelled'); else fail('errorGeneric') })
  }, [pendingWallet, phase, connected, wallet, connect, fail])

  useEffect(() => {
    if (pendingWallet && phase === 'connecting' && connected && publicKey && order) {
      setPendingWallet(null)
      void sendPayment(order)
    }
  }, [pendingWallet, phase, connected, publicKey, order, sendPayment])

  const startWalletPayment = useCallback(async (existing?: CryptoOrder | null) => {
    setNoWallet(false)
    const target = existing ?? await createOrder()
    if (!target) return
    if (connected && publicKey) return void sendPayment(target)
    if (detected.length === 0) { setNoWallet(true); setQrOpen(true); setPhase('idle'); return }
    if (detected.length === 1) return void chooseWallet(detected[0]!.adapter.name, target)
    setPhase('choose')
  }, [connected, publicKey, detected.length, createOrder, sendPayment])

  function chooseWallet(name: string, target = order) {
    if (!target) return
    setOrder(target)
    setPendingWallet(name)
    setPhase('connecting')
    select(name as WalletName)
  }

  const openQr = useCallback(async () => {
    setQrOpen(true)
    if (!order) await createOrder().then((created) => { if (created) setPhase('idle') })
  }, [order, createOrder])

  // The server is the only judge of a payment: poll it with the signature (when the wallet gave one) or just the order.
  const watching = !!order && (phase === 'network' || (qrOpen && !closed && phase !== 'creating' && phase !== 'error'))
  useEffect(() => {
    if (!watching || !order) return
    let stop = false
    let timer = 0
    const tick = async () => {
      try {
        const result = await api<PaymentOutcome>('/api/crypto/confirm', { orderId: order.orderId, signature: signatureRef.current })
        if (stop) return
        if (!result.ok) {
          setSlow(true)
        } else {
          setSlow(false)
          const outcome = result.data
          if (outcome.status === 'confirmed') return void setPhase('confirmed')
          if (outcome.status === 'expired') return void setPhase('expired')
          if (outcome.status === 'invalid') return fail('errorInvalid')
          if (outcome.status === 'failed' || outcome.status === 'signature_used') return fail('errorGeneric')
        }
      } catch {
        if (!stop) setSlow(true)
      }
      if (!stop) timer = window.setTimeout(tick, POLL_MS)
    }
    timer = window.setTimeout(tick, 1200)
    return () => { stop = true; window.clearTimeout(timer) }
  }, [watching, order, fail])

  function reset() {
    setOrder(null)
    setQrOpen(false)
    setNoWallet(false)
    setPhase('idle')
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(payUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch { /* The link stays visible and selectable. */ }
  }

  const busy = phase === 'creating' || phase === 'connecting' || phase === 'wallet'
  const minutes = Math.max(0, Math.floor(remainingMs / 60000))
  const seconds = Math.max(0, Math.floor(remainingMs / 1000) % 60)
  const stateText = phase === 'wallet' ? labels.stateWallet : phase === 'network' ? labels.stateNetwork : phase === 'confirmed' ? labels.stateConfirmed
    : phase === 'expired' ? labels.stateExpired : phase === 'cancelled' ? labels.stateCancelled : phase === 'error' ? labels[errorKey] : ''
  const tone = phase === 'confirmed' ? 'border-emerald-300/50 text-emerald-200' : phase === 'error' ? 'border-rose-300/50 text-rose-300' : phase === 'expired' || phase === 'cancelled' ? 'border-[#e8bc76]/60 text-[#e8bc76]' : 'border-[#a78bfa]/60 text-[#d2c8ee]'

  return <div className="mt-8">
    {order?.cluster && order.cluster !== 'mainnet-beta' && <p className="mb-4 border-l-2 border-[#e8bc76]/60 pl-4 text-xs leading-5 text-[#e8bc76]">{labels.testNetwork}</p>}

    {order && !closed && <dl className="mb-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 border-y border-white/[.08] py-4 text-xs">
      <dt className="uppercase tracking-[.14em] text-[#8e8a97]">{labels.amount}</dt>
      <dd className="text-right font-mono tabular-nums text-[#f1eff5]">{lamportsToSol(order.amountLamports).replace('.', locale === 'en' ? '.' : ',')} SOL</dd>
      <dt className="uppercase tracking-[.14em] text-[#8e8a97]">{labels.recipient}</dt>
      <dd className="truncate text-right font-mono text-[#c4bfcc]" title={order.recipient}>{order.recipient.slice(0, 6)}…{order.recipient.slice(-6)}</dd>
      <dt className="uppercase tracking-[.14em] text-[#8e8a97]">{labels.expiresIn}</dt>
      <dd className="text-right font-mono tabular-nums text-[#c4bfcc]">{minutes}:{String(seconds).padStart(2, '0')}</dd>
    </dl>}

    {phase === 'confirmed'
      ? <a href={localizedPath('/curso', locale)} className="flex min-h-12 w-full items-center justify-center bg-[#a78bfa] px-5 text-sm font-semibold tracking-[.02em] text-[#17131e] transition hover:bg-[#c4b5fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4d9ff]">{labels.goCourse}</a>
      : phase === 'expired'
        ? <button type="button" onClick={reset} className="flex min-h-12 w-full items-center justify-center bg-[#a78bfa] px-5 text-sm font-semibold tracking-[.02em] text-[#17131e] transition hover:bg-[#c4b5fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4d9ff]">{labels.newOrder}</button>
        : phase === 'network'
          ? null
          : phase === 'choose'
            ? <div role="group" aria-label={labels.chooseWallet}>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.2em] text-[#d9d3e6]">{labels.chooseWallet}</p>
              <ul className="divide-y divide-white/[.08] border-y border-white/[.08]">
                {detected.map((entry) => <li key={entry.adapter.name}>
                  <button type="button" onClick={() => chooseWallet(entry.adapter.name)} className="flex min-h-12 w-full items-center gap-3 px-1 text-left text-sm text-[#f1eff5] transition hover:bg-white/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]">
                    {entry.adapter.icon ? <img src={entry.adapter.icon} alt="" width={24} height={24} className="size-6 rounded" /> : <Wallet size={20} aria-hidden="true" />}
                    {entry.adapter.name}
                  </button>
                </li>)}
              </ul>
            </div>
            : <button type="button" disabled={busy} onClick={() => void startWalletPayment(phase === 'cancelled' || phase === 'error' ? order : null)} className="flex min-h-12 w-full items-center justify-center gap-3 bg-[#a78bfa] px-5 text-sm font-semibold tracking-[.02em] text-[#17131e] transition hover:bg-[#c4b5fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4d9ff] disabled:cursor-wait disabled:opacity-60">
              {busy ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" /> : <Wallet size={16} aria-hidden="true" />}
              {phase === 'creating' ? labels.working : phase === 'cancelled' || phase === 'error' ? labels.retry : `${labels.payWithWallet} · ${priceLabel}`}
            </button>}

    <div aria-live="polite" className="empty:hidden">
      {stateText && <p role="status" className={`mt-4 border-l-2 pl-4 text-sm leading-6 ${tone}`}>
        {phase === 'network' && <Loader2 size={14} className="mr-2 inline animate-spin align-[-2px] motion-reduce:animate-none" aria-hidden="true" />}{stateText}
      </p>}
      {slow && phase === 'network' && <p className="mt-2 pl-4 text-xs text-[#8e8a97]">{labels.errorNetwork}</p>}
      {noWallet && <p className="mt-4 text-xs leading-5 text-[#b9b1a0]">{labels.noWallet}</p>}
    </div>

    {!closed && phase !== 'network' && <div className="mt-6 border-t border-white/[.08] pt-4">
      <button type="button" aria-expanded={qrOpen} onClick={() => qrOpen ? setQrOpen(false) : void openQr()} className="min-h-11 text-xs font-medium uppercase tracking-[.16em] text-[#b9a5ff] underline-offset-4 transition hover:text-[#e4d9ff] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]">
        {qrOpen ? labels.hideQr : labels.showQr}
      </button>
      {qrOpen && order && <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="shrink-0 bg-[#f1eff5] p-3"><QRCodeSVG value={payUrl} size={168} bgColor="#f1eff5" fgColor="#09090d" level="M" title={labels.showQr} /></div>
        <div className="min-w-0 text-xs leading-5 text-[#aaa6b2]">
          <p>{labels.qrHint}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a href={payUrl} className="inline-flex min-h-11 items-center border border-white/[.16] px-4 font-medium text-[#f1eff5] transition hover:bg-white/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]">{labels.openLink}</a>
            <button type="button" onClick={() => void copyLink()} className="inline-flex min-h-11 items-center gap-2 border border-white/[.16] px-4 font-medium text-[#f1eff5] transition hover:bg-white/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]">
              {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied ? labels.copied : labels.copyLink}
            </button>
          </div>
        </div>
      </div>}
    </div>}

    <p className="mt-6 text-center text-xs text-[#8e8a97]">{labels.hint}</p>
  </div>
}
