import { Check, Copy, Loader2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { localizedPath, type UiLocale } from '@/lib/localization'
import { formatCpf, isValidCpf } from '@/lib/cpf'
import { supabase } from '@/lib/supabase'
import type { PlanId } from '@/lib/offers'

const copy = {
  'pt-BR': {
    name: 'Nome completo', cpf: 'CPF', cpfHint: 'Necessário para emitir o Pix. Usamos só para o pagamento.',
    create: 'Gerar Pix', creating: 'Gerando Pix…', invalidCpf: 'CPF inválido. Confira os números.', invalidName: 'Informe seu nome completo.',
    scan: 'Pague pelo app do seu banco: escaneie o QR code ou use o código copia e cola.', copy: 'Copiar código Pix', copied: 'Código copiado',
    waiting: 'Aguardando o pagamento. Assim que o banco confirmar, seu acesso é liberado automaticamente.',
    expires: 'O Pix vence em', confirmed: 'Pagamento confirmado. Seu acesso foi liberado.', goCourse: 'Ir para o curso',
    error: 'Não foi possível gerar o Pix agora. Tente novamente em instantes.', notConfigured: 'O Pix ainda não foi configurado no servidor. Nada foi cobrado.', amount: 'Valor exato',
  },
  en: {
    name: 'Full name', cpf: 'Tax ID (CPF)', cpfHint: 'Required to issue the Pix. We use it only for this payment.',
    create: 'Generate Pix', creating: 'Generating Pix…', invalidCpf: 'Invalid CPF. Check the numbers.', invalidName: 'Enter your full name.',
    scan: 'Pay in your bank app: scan the QR code or use the copy-and-paste code.', copy: 'Copy Pix code', copied: 'Code copied',
    waiting: 'Waiting for the payment. As soon as your bank confirms it, your access opens automatically.',
    expires: 'The Pix expires on', confirmed: 'Payment confirmed. Your access is open.', goCourse: 'Go to the course',
    error: 'We could not generate the Pix right now. Please try again shortly.', notConfigured: 'Pix is not configured on the server yet. Nothing was charged.', amount: 'Exact amount',
  },
  es: {
    name: 'Nombre completo', cpf: 'CPF', cpfHint: 'Necesario para emitir el Pix. Lo usamos solo para este pago.',
    create: 'Generar Pix', creating: 'Generando Pix…', invalidCpf: 'CPF inválido. Revisa los números.', invalidName: 'Ingresa tu nombre completo.',
    scan: 'Paga en la app de tu banco: escanea el código QR o usa el código copia y pega.', copy: 'Copiar código Pix', copied: 'Código copiado',
    waiting: 'Esperando el pago. En cuanto el banco lo confirme, tu acceso se abre automáticamente.',
    expires: 'El Pix vence el', confirmed: 'Pago confirmado. Tu acceso está abierto.', goCourse: 'Ir al curso',
    error: 'No pudimos generar el Pix ahora. Inténtalo de nuevo en unos instantes.', notConfigured: 'El Pix aún no está configurado en el servidor. No se cobró nada.', amount: 'Importe exacto',
  },
} satisfies Record<UiLocale, Record<string, string>>

type PixOrder = { orderId: string; payload: string; encodedImage: string; expiresAt: string; amount: number }
type Phase = 'form' | 'creating' | 'waiting' | 'confirmed'

const POLL_MS = 5000

export default function PixCheckout({ planId, locale, priceLabel }: { planId: PlanId; locale: UiLocale; priceLabel: string }) {
  const labels = copy[locale]
  const [phase, setPhase] = useState<Phase>('form')
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [order, setOrder] = useState<PixOrder | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Once the Pix is shown, the page reads the order status (the webhook is the only writer) until it is confirmed.
  useEffect(() => {
    if (phase !== 'waiting' || !order || !supabase) return
    const client = supabase
    let active = true
    const check = async () => {
      const { data } = await client.from('orders').select('status').eq('id', order.orderId).maybeSingle()
      if (active && data?.status === 'confirmed') setPhase('confirmed')
    }
    void check()
    const timer = window.setInterval(() => void check(), POLL_MS)
    return () => { active = false; window.clearInterval(timer) }
  }, [phase, order])

  async function createPix(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (name.trim().length < 3) return setError(labels.invalidName)
    if (!isValidCpf(cpf)) return setError(labels.invalidCpf)
    if (!supabase) return setError(labels.error)
    setPhase('creating')
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session?.access_token) throw new Error('no session')
      const response = await fetch('/api/pix/create-order', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, name, cpf }),
      })
      const result = await response.json() as Partial<PixOrder> & { error?: string; code?: string; field?: string }
      if (!response.ok || !result.orderId || !result.payload) {
        if (result.code === 'not_configured') setError(labels.notConfigured)
        else setError(result.error ?? labels.error)
        setPhase('form')
        return
      }
      setOrder(result as PixOrder)
      setPhase('waiting')
    } catch {
      setError(labels.error)
      setPhase('form')
    }
  }

  async function copyCode() {
    if (!order) return
    try {
      await navigator.clipboard.writeText(order.payload)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch { /* The code stays visible and selectable. */ }
  }

  if (phase === 'confirmed') {
    return <div className="mt-8">
      <p role="status" className="border-l-2 border-emerald-300/50 pl-4 text-sm leading-6 text-emerald-200">{labels.confirmed}</p>
      <a href={localizedPath('/curso', locale)} className="mt-5 flex min-h-12 w-full items-center justify-center bg-[#a78bfa] px-5 text-sm font-semibold tracking-[.02em] text-[#17131e] transition hover:bg-[#c4b5fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4d9ff]">{labels.goCourse}</a>
    </div>
  }

  if (phase === 'waiting' && order) {
    const expires = new Date(order.expiresAt)
    return <div className="mt-8">
      <dl className="mb-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 border-y border-white/[.08] py-4 text-xs">
        <dt className="uppercase tracking-[.14em] text-[#8e8a97]">{labels.amount}</dt>
        <dd className="text-right font-mono tabular-nums text-[#f1eff5]">{priceLabel}</dd>
      </dl>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="shrink-0 bg-[#f1eff5] p-3">
          <img src={order.encodedImage.startsWith('data:') ? order.encodedImage : `data:image/png;base64,${order.encodedImage}`} alt={labels.scan} width={200} height={200} className="size-[200px]" />
        </div>
        <div className="min-w-0 text-xs leading-5 text-[#aaa6b2]">
          <p>{labels.scan}</p>
          <button type="button" onClick={() => void copyCode()} className="mt-3 inline-flex min-h-11 items-center gap-2 border border-white/[.16] px-4 font-medium text-[#f1eff5] transition hover:bg-white/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]">
            {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied ? labels.copied : labels.copy}
          </button>
          <p className="mt-3 break-all font-mono text-[10px] text-[#8e8a97]">{order.payload.slice(0, 48)}…</p>
          {!Number.isNaN(expires.getTime()) && <p className="mt-3">{labels.expires} {expires.toLocaleDateString(locale)}.</p>}
        </div>
      </div>
      <p role="status" className="mt-6 border-l-2 border-[#a78bfa]/60 pl-4 text-sm leading-6 text-[#d2c8ee]"><Loader2 size={14} className="mr-2 inline animate-spin align-[-2px] motion-reduce:animate-none" aria-hidden="true" />{labels.waiting}</p>
    </div>
  }

  return <form className="mt-8 space-y-5" onSubmit={(event) => void createPix(event)} noValidate>
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[.14em] text-[#8e8a97]">{labels.name}</span>
      <input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} autoComplete="name" required className="h-12 w-full border-b border-white/[.16] bg-transparent text-[15px] text-[#f1eff5] outline-none transition focus:border-[#a78bfa]" />
    </label>
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[.14em] text-[#8e8a97]">{labels.cpf}</span>
      <input value={cpf} onChange={(event) => setCpf(formatCpf(event.target.value))} inputMode="numeric" autoComplete="off" maxLength={14} required className="h-12 w-full border-b border-white/[.16] bg-transparent font-mono text-[15px] text-[#f1eff5] outline-none transition focus:border-[#a78bfa]" />
      <span className="mt-2 block text-xs text-[#8e8a97]">{labels.cpfHint}</span>
    </label>
    {error && <p role="alert" className="border-l-2 border-rose-300/50 pl-4 text-sm leading-6 text-rose-300">{error}</p>}
    <button type="submit" disabled={phase === 'creating'} className="flex min-h-12 w-full items-center justify-center gap-3 bg-[#a78bfa] px-5 text-sm font-semibold tracking-[.02em] text-[#17131e] transition hover:bg-[#c4b5fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4d9ff] disabled:cursor-wait disabled:opacity-60">
      {phase === 'creating' && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
      {phase === 'creating' ? labels.creating : labels.create}
    </button>
  </form>
}
