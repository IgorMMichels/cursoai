import { Brand, OmegaSymbol } from '@/components/brand'
import { HeaderLanguageSelect } from '@/components/header-language-select'
import { LocalizedLink as Link, useLocalizedNavigate } from '@/components/localized-router'
import { PageMeta } from '@/components/tools/page-meta'
import { useLocalization } from '@/contexts/localization-context'
import { useSession } from '@/contexts/session-context'
import { translateUi } from '@/lib/ui-translation'
import { plans, type PlanId } from '@/lib/offers'
import { formatRegionalOffer, getPublishedRegionalOffer } from '@/lib/regional-offers'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'

type PaymentChoice = 'crypto' | 'fiat' | 'pix'

const copy = {
  'pt-BR': {
    title: 'Finalizar compra', subtitle: 'Um acesso, sem renovação. Escolha como pagar e entre no curso assim que o pagamento for confirmado.',
    eyebrow: 'Voucher de acesso', heroLine: 'Método, prática e revisão, sem pressa.',
    steps: ['Plano', 'Pagamento', 'Acesso'], method: 'Forma de pagamento', order: 'Resumo', included: 'O que você leva',
    oneTime: 'Valor único', founderTitle: 'Selo Founder', founder: 'Os primeiros 25 compradores confirmados recebem o selo. Ele fica na conta e vale para compras futuras.',
    sealText: 'FOUNDER · PRIMEIROS 25 COMPRADORES ·',
    crypto: 'Cripto', cryptoSub: 'Pague com Solana', stripe: 'Cartão e outros meios', stripeSub: 'Checkout seguro da Stripe', pix: 'Pix', pixSub: 'Pagamento instantâneo no Brasil',
    available: 'Disponível agora', soon: 'Em breve', region: 'Pix está disponível para compras no Brasil.',
    continue: 'Continuar para pagamento seguro', login: 'Entrar ou criar conta para pagar', loginHint: 'Você volta para esta página com o plano escolhido.',
    unavailable: 'Esta forma de pagamento ainda não está disponível.', noPlan: 'Escolha um plano para continuar.', backPlans: 'Voltar aos planos',
    trust: ['Os dados do cartão são digitados direto na Stripe.', 'O acesso é liberado depois da confirmação.', 'Pagamento único, sem renovação automática.'],
    secure: 'Pagamento processado pela Stripe. A Ômega não guarda dados de cartão.',
    success: 'Estamos confirmando o pagamento e preparando seu acesso.', cancelled: 'Pagamento cancelado. Nenhuma cobrança foi concluída.',
    working: 'Abrindo pagamento seguro…', error: 'Não foi possível iniciar o pagamento. Tente novamente.',
    secureBadge: 'Checkout seguro', cheaper: 'Mais barato', cryptoPerk: 'Pagando em cripto o valor é menor: queremos estimular o uso de criptomoedas, e é isso que praticamos aqui na plataforma.', notConfigured: 'O pagamento ainda não foi configurado no servidor (chaves da Stripe e do Supabase). Nada foi cobrado.', pricingError: 'Não foi possível carregar o preço. Atualize a página.', noPrice: 'Este plano ainda não tem preço disponível na sua região.',
  },
  en: {
    title: 'Complete your purchase', subtitle: 'One access, no renewal. Choose how to pay and enter the course as soon as the payment is confirmed.',
    eyebrow: 'Access voucher', heroLine: 'Method, practice and review, without rush.',
    steps: ['Plan', 'Payment', 'Access'], method: 'Payment method', order: 'Summary', included: 'What you get',
    oneTime: 'One-time amount', founderTitle: 'Founder seal', founder: 'The first 25 confirmed buyers receive the seal. It stays on the account and applies to future purchases.',
    sealText: 'FOUNDER · FIRST 25 CONFIRMED BUYERS ·',
    crypto: 'Crypto', cryptoSub: 'Pay with Solana', stripe: 'Card and other methods', stripeSub: 'Secure Stripe checkout', pix: 'Pix', pixSub: 'Instant payment in Brazil',
    available: 'Available now', soon: 'Coming soon', region: 'Pix is available for purchases in Brazil.',
    continue: 'Continue to secure payment', login: 'Sign in or create an account to pay', loginHint: 'You will come back to this page with your plan selected.',
    unavailable: 'This payment method is not available yet.', noPlan: 'Choose a plan to continue.', backPlans: 'Back to plans',
    trust: ['Card details are entered directly on Stripe.', 'Access opens after confirmation.', 'One-time payment, no automatic renewal.'],
    secure: 'Payment processed by Stripe. Omega does not store card details.',
    success: 'We’re confirming your payment and preparing your access.', cancelled: 'Payment cancelled. No charge was completed.',
    working: 'Opening secure payment…', error: 'We could not start the payment. Please try again.',
    secureBadge: 'Secure checkout', cheaper: 'Cheaper', cryptoPerk: 'Paying with crypto costs less: we want to encourage the use of cryptocurrencies, and that is what we practice on this platform.', notConfigured: 'Payment is not configured on the server yet (Stripe and Supabase keys). Nothing was charged.', pricingError: 'We could not load the price. Refresh the page.', noPrice: 'This plan does not have a price available in your region yet.',
  },
  es: {
    title: 'Finalizar compra', subtitle: 'Un acceso, sin renovación. Elige cómo pagar y entra al curso en cuanto se confirme el pago.',
    eyebrow: 'Vale de acceso', heroLine: 'Método, práctica y repaso, sin prisa.',
    steps: ['Plan', 'Pago', 'Acceso'], method: 'Método de pago', order: 'Resumen', included: 'Lo que te llevas',
    oneTime: 'Importe único', founderTitle: 'Sello Founder', founder: 'Los primeros 25 compradores confirmados reciben el sello. Se queda en la cuenta y vale para compras futuras.',
    sealText: 'FOUNDER · PRIMEROS 25 COMPRADORES ·',
    crypto: 'Cripto', cryptoSub: 'Paga con Solana', stripe: 'Tarjeta y otros medios', stripeSub: 'Pago seguro con Stripe', pix: 'Pix', pixSub: 'Pago instantáneo en Brasil',
    available: 'Disponible ahora', soon: 'Próximamente', region: 'Pix está disponible para compras en Brasil.',
    continue: 'Continuar al pago seguro', login: 'Inicia sesión o crea una cuenta para pagar', loginHint: 'Volverás a esta página con el plan elegido.',
    unavailable: 'Este método de pago aún no está disponible.', noPlan: 'Elige un plan para continuar.', backPlans: 'Volver a los planes',
    trust: ['Los datos de la tarjeta se ingresan directamente en Stripe.', 'El acceso se abre tras la confirmación.', 'Pago único, sin renovación automática.'],
    secure: 'Pago procesado por Stripe. Omega no guarda datos de la tarjeta.',
    success: 'Estamos confirmando el pago y preparando tu acceso.', cancelled: 'Pago cancelado. No se completó ningún cargo.',
    working: 'Abriendo el pago seguro…', error: 'No pudimos iniciar el pago. Inténtalo de nuevo.',
    secureBadge: 'Pago seguro', cheaper: 'Más barato', cryptoPerk: 'Pagando con cripto el valor es menor: queremos fomentar el uso de criptomonedas, y eso es lo que practicamos en esta plataforma.', notConfigured: 'El pago aún no está configurado en el servidor (claves de Stripe y Supabase). No se cobró nada.', pricingError: 'No pudimos cargar el precio. Actualiza la página.', noPrice: 'Este plan aún no tiene precio disponible en tu región.',
  },
} as const

const numerals = ['I', 'II', 'III'] as const

export function CheckoutPage() {
  const { locale, market, marketLoading, pricingError } = useLocalization()
  const { user } = useSession()
  const navigate = useLocalizedNavigate()
  const reducedMotion = useReducedMotion()
  const [search, setSearch] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const rawPlan = search.get('plan')
  const planId = rawPlan && rawPlan in plans ? rawPlan as PlanId : null
  const requestedMethod = search.get('payment')
  const initialMethod: PaymentChoice = requestedMethod === 'crypto' || requestedMethod === 'pix' ? requestedMethod : 'fiat'
  const [selectedMethod, setSelectedMethod] = useState<PaymentChoice>(initialMethod)
  const status = search.get('status')
  const labels = copy[locale]
  const plan = planId ? plans[planId] : null
  const offer = planId ? getPublishedRegionalOffer(market, planId, selectedMethod === 'crypto' ? 'crypto' : 'fiat') : null
  const priceLabel = offer ? formatRegionalOffer(offer, locale) : marketLoading ? '…' : '—'
  const priceNotice = marketLoading || !planId || offer ? '' : pricingError ? labels.pricingError : labels.noPrice
  const currentStep = status === 'success' ? 2 : 1
  // Each method shows its own catalog price; the plans page keeps the fiat price and nothing is converted here.
  const fiatOffer = planId ? getPublishedRegionalOffer(market, planId, 'fiat') : null
  const cryptoOffer = planId ? getPublishedRegionalOffer(market, planId, 'crypto') : null
  const withPrice = (hint: string, methodOffer: typeof offer) => methodOffer ? `${hint} · ${formatRegionalOffer(methodOffer, locale)}` : hint
  const options = [
    { id: 'crypto' as const, label: labels.crypto, hint: withPrice(labels.cryptoSub, cryptoOffer), active: false, perk: !!cryptoOffer },
    { id: 'fiat' as const, label: labels.stripe, hint: withPrice(labels.stripeSub, fiatOffer), active: true, perk: false },
    { id: 'pix' as const, label: labels.pix, hint: labels.pixSub, active: false, perk: false },
  ]
  const localeLabel = labels.secureBadge
  // Uma entrada escalonada no carregamento; com movimento reduzido, tudo aparece de uma vez.
  const rise = (delay = 0) => ({
    initial: { opacity: 0, y: reducedMotion ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reducedMotion ? 0 : .7, delay: reducedMotion ? 0 : delay, ease: [.22, 1, .36, 1] as const },
  })

  return <div className="min-h-[100dvh] bg-[#09090d] text-[#f1eff5] selection:bg-[#a78bfa]/30">
    <PageMeta title={locale === 'en' ? 'Checkout · Omega' : locale === 'es' ? 'Pago · Omega' : 'Checkout · Ômega'} description={labels.subtitle} path="/checkout" />
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-10">
      <Brand />
      <div className="flex items-center gap-3">
        <span className="hidden text-[11px] font-medium uppercase tracking-[.2em] text-[#8e8a97] sm:inline">{localeLabel}</span>
        <HeaderLanguageSelect />
      </div>
    </header>

    <main className="mx-auto w-full max-w-6xl px-5 pb-24 sm:px-10">
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
        <div className="min-w-0">
          <motion.div {...rise(0)} className="relative">
            <Link to="/planos" className="relative text-[11px] uppercase tracking-[.18em] text-[#8e8a97] transition hover:text-[#d9d3e6]">← {labels.backPlans}</Link>
            <p className="mt-10 text-[11px] font-semibold uppercase tracking-[.22em] text-[#a78bfa]">{labels.eyebrow}</p>
            <h1 className="relative mt-3 font-display text-[44px] font-semibold leading-[1.02] tracking-[-.045em] sm:text-6xl">{labels.title}</h1>
            <p className="relative mt-4 max-w-lg text-[15px] leading-7 text-[#aaa6b2]">{labels.subtitle}</p>
          </motion.div>

          <motion.ol {...rise(.08)} className="mt-9 flex items-center justify-between gap-3 border-y border-white/[.08] py-3 text-[11px] uppercase tracking-[.14em] sm:justify-start sm:gap-4 sm:tracking-[.16em]" aria-label={labels.title}>
            {labels.steps.map((step, index) => {
              const done = index < currentStep
              const current = index === currentStep
              return <li key={step} aria-current={current ? 'step' : undefined} className={`flex items-center gap-2 ${current ? 'text-[#e4d9ff]' : done ? 'text-[#b9a5ff]' : 'text-[#5f5b68]'}`}>
                <span className="font-mono text-[10px]">{numerals[index]}</span>{step}
                {index < labels.steps.length - 1 && <span aria-hidden="true" className="ml-2 hidden h-px w-8 bg-white/[.12] sm:block sm:w-14" />}
              </li>
            })}
          </motion.ol>


          <motion.section {...rise(.2)} className="mt-12">
            <h2 className="flex items-baseline gap-3 text-[11px] font-semibold uppercase tracking-[.2em] text-[#d9d3e6]"><span className="font-mono text-[#a78bfa]">II</span>{labels.method}</h2>
            <div className="mt-4 border-t border-white/[.1]" role="radiogroup" aria-label={labels.method}>
              {options.map(({ id, label, hint, active, perk }, index) => {
                const selected = selectedMethod === id
                const disabled = id === 'pix' && market !== 'BR'
                return <button key={id} type="button" role="radio" aria-checked={selected} aria-disabled={disabled || undefined}
                  onClick={() => { if (!disabled) selectMethod(id) }}
                  className={`group relative grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[.1] py-5 pl-1 pr-1 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa] ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:bg-white/[.02]'}`}>
                  {selected && <motion.span layoutId="omega-method-rule" className="absolute inset-y-0 -left-4 w-px bg-[#a78bfa]" transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 34 }} />}
                  <span className={`font-mono text-sm transition ${selected ? 'text-[#c4b5fd]' : 'text-[#5f5b68]'}`}>{String(index + 1).padStart(2, '0')}</span>
                  <span className="min-w-0">
                    <span className={`block font-display text-lg font-medium tracking-[-.02em] transition ${selected ? 'text-[#f5f2fb]' : 'text-[#c9c4d2]'}`}>{label}{perk && <span className="ml-2 align-middle text-[10px] font-semibold uppercase tracking-[.16em] text-[#e4bc76]">{labels.cheaper}</span>}</span>
                    <span className="mt-1 block text-xs text-[#8e8a97]">{hint}</span>
                  </span>
                  <span className={`text-[10px] font-semibold uppercase tracking-[.16em] ${active ? 'text-[#a9e3c0]' : 'text-[#6f6b78]'}`}>{active ? labels.available : labels.soon}</span>
                </button>
              })}
            </div>

            {cryptoOffer && <p className="mt-4 text-xs leading-5 text-[#b9b1a0]">{labels.cryptoPerk}</p>}
            {priceNotice &&<p role="status" className="mt-4 border-l-2 border-[#e8bc76]/60 pl-4 text-sm leading-6 text-[#e8bc76]">{priceNotice}</p>}
            {selectedMethod === 'pix' && market !== 'BR' &&<p role="status" className="mt-4 text-xs text-[#8e8a97]">{labels.region}</p>}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={status ?? (user ? selectedMethod : 'guest')} initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .3 }}>
                {status === 'success' ? <p role="status" className="mt-8 border-l-2 border-emerald-300/50 pl-4 text-sm leading-6 text-emerald-200">{labels.success}</p>
                  : status === 'cancelled' ? <p role="status" className="mt-8 border-l-2 border-white/20 pl-4 text-sm leading-6 text-[#d2ced8]">{labels.cancelled}</p>
                    : selectedMethod === 'fiat' ? <div className="mt-8">
                        <button type="button" disabled={busy || !planId || !offer} onClick={() => planId && void beginStripeCheckout(planId)} className="flex min-h-12 w-full items-center justify-center gap-3 bg-[#a78bfa] px-5 text-sm font-semibold tracking-[.02em] text-[#17131e] transition hover:bg-[#c4b5fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4d9ff] disabled:cursor-wait disabled:opacity-60">
                          {busy && <Loader2 size={16} className="animate-spin" />}
                          {busy ? labels.working : user ? labels.continue : labels.login}
                        </button>
                        {!user && <p className="mt-3 text-center text-xs text-[#8e8a97]">{labels.loginHint}</p>}
                        <p className="mt-3 text-center text-xs text-[#8e8a97]">{labels.secure}</p>
                      </div>
                        : <p role="status" className="mt-8 border-l-2 border-white/20 pl-4 text-sm leading-6 text-[#aaa6b2]">{labels.unavailable}</p>}
              </motion.div>
            </AnimatePresence>
            {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
          </motion.section>

          <motion.ul {...rise(.26)} className="mt-14 grid gap-4 text-[13px] leading-6 text-[#8e8a97] sm:grid-cols-3 sm:gap-8">
            {labels.trust.map((item) => <li key={item} className="border-t border-white/[.1] pt-4">{item}</li>)}
          </motion.ul>
        </div>

        <motion.aside {...rise(.18)} className="relative bg-[#121119] px-6 pb-7 pt-8 sm:px-7 lg:sticky lg:top-8">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a78bfa]/60 to-transparent" />
          <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#8e8a97]">{labels.order}</p>
          {plan ? <>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-.04em]">{translateUi(plan.name)}</h2>
            <p className="mt-1 text-sm text-[#aaa6b2]">{translateUi(plan.term)}</p>

            <div className="mt-7 flex items-end justify-between gap-4 border-t border-white/[.08] pt-6">
              <span className="text-[11px] uppercase tracking-[.16em] text-[#8e8a97]">{labels.oneTime}</span>
              <span className="relative block h-11 overflow-hidden text-right">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={priceLabel} className="block font-display text-4xl font-semibold tabular-nums tracking-[-.03em]" initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -12 }} transition={{ duration: reducedMotion ? 0 : .3 }}>{priceLabel}</motion.span>
                </AnimatePresence>
              </span>
            </div>

            <p className="mb-4 mt-7 text-[11px] font-semibold uppercase tracking-[.2em] text-[#8e8a97]">{labels.included}</p>
            <ol className="divide-y divide-white/[.07] border-y border-white/[.07]">
              {plan.features.slice(0, 4).map((feature, index) => <motion.li key={feature} className="grid grid-cols-[28px_minmax(0,1fr)] gap-2 py-3 text-[13px] leading-5 text-[#c4bfcc]"
                initial={{ opacity: 0, x: reducedMotion ? 0 : -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reducedMotion ? 0 : .45, delay: reducedMotion ? 0 : .35 + index * .08 }}>
                <span className="font-mono text-[11px] text-[#6f6b78]">{String(index + 1).padStart(2, '0')}</span>
                <span>{translateUi(feature)}</span>
              </motion.li>)}
            </ol>

            <div className="relative -mx-6 mt-8 flex items-center gap-5 border-t border-dashed border-white/[.16] px-6 pt-7 sm:-mx-7 sm:px-7">
              <span aria-hidden="true" className="absolute left-0 -top-3 size-6 -translate-x-1/2 rounded-full bg-[#09090d]" />
              <span aria-hidden="true" className="absolute right-0 -top-3 size-6 translate-x-1/2 rounded-full bg-[#09090d]" />
              <FounderSeal text={labels.sealText} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#e4bc76]">{labels.founderTitle}</p>
                <p className="mt-2 text-xs leading-5 text-[#b9b1a0]">{labels.founder}</p>
              </div>
            </div>
          </> : <p className="mt-5 text-sm leading-6 text-[#aaa6b2]"><Link to="/planos" className="text-[#b9a5ff] underline underline-offset-4">{labels.noPlan}</Link></p>}
        </motion.aside>
      </div>
    </main>
  </div>

  function selectMethod(id: PaymentChoice) {
    setSelectedMethod(id)
    setError('')
    setSearch((previous) => {
      const next = new URLSearchParams(previous)
      if (planId) next.set('plan', planId)
      next.set('payment', id)
      next.delete('status')
      next.delete('session_id')
      return next
    }, { replace: true })
  }

  async function beginStripeCheckout(selectedPlan: PlanId) {
    if (busy) return
    if (!supabase) {
      setError(labels.error)
      return
    }
    setBusy(true)
    setError('')
    try {
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw new Error(labels.error)
      if (!data.session?.access_token) {
        const params = new URLSearchParams({ plano: selectedPlan, payment: selectedMethod })
        navigate(`/login?${params.toString()}`)
        return
      }
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan, locale }),
      })
      const result = await response.json() as { url?: string; code?: string }
      if (result.code === 'not_configured') {
        setError(labels.notConfigured)
        return
      }
      if (!response.ok || !result.url) throw new Error(labels.error)
      window.location.assign(result.url)
    } catch {
      setError(labels.error)
    } finally {
      setBusy(false)
    }
  }
}


// Selo tipográfico: o texto corre num anel estático e o Ω fica no centro.
function FounderSeal({ text }: { text: string }) {
  return <div className="relative grid size-[88px] shrink-0 place-items-center text-[#e4bc76]" aria-hidden="true">
    <svg viewBox="0 0 120 120" className="absolute inset-0 size-full">
      <defs><path id="omega-seal-ring" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" /></defs>
      <circle cx="60" cy="60" r="58" fill="none" stroke="currentColor" strokeOpacity=".35" />
      <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeOpacity=".2" />
      <text fill="currentColor" fontSize="8.4" letterSpacing="1.4" fontWeight="600">
        <textPath href="#omega-seal-ring" textLength="286" lengthAdjust="spacing">{text}</textPath>
      </text>
    </svg>
    <span className="w-[26px] text-[#e4bc76]"><OmegaSymbol /></span>
  </div>
}
