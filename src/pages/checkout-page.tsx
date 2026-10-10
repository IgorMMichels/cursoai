import { Brand } from '@/components/brand'
import { LocalizedLink as Link } from '@/components/localized-router'
import { useLocalization } from '@/contexts/localization-context'
import { useSession } from '@/contexts/session-context'
import { PageMeta } from '@/components/tools/page-meta'
import { translateUi } from '@/lib/ui-translation'
import { plans, type PlanId } from '@/lib/offers'
import { formatRegionalOffer, getPublishedRegionalOffer } from '@/lib/regional-offers'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Bitcoin, Check, CreditCard, LockKeyhole, QrCode, ShieldCheck, Sparkles } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'

type PaymentChoice = 'crypto' | 'fiat' | 'pix'

const copy = {
  'pt-BR': {
    title: 'Um passo mais perto de entender o mercado.', subtitle: 'Escolha como deseja concluir sua compra.',
    order: 'Seu acesso ao Ômega', included: 'O que está incluído', oneTime: 'Pagamento único · sem renovação automática',
    founder: 'Os primeiros 25 pagamentos confirmados recebem o emblema Founder permanente.',
    crypto: 'Cripto', cryptoSub: 'Pague em Solana', stripe: 'Cartão e outros meios', stripeSub: 'Checkout seguro da Stripe', pix: 'Pix', pixSub: 'Pagamento via Asaas',
    available: 'Disponível agora', soon: 'Em breve', region: 'Pix estará disponível para compras no Brasil.',
    continue: 'Continuar para pagamento seguro', login: 'Entrar ou criar conta', selectedPlan: 'Plano escolhido',
    unavailable: 'Estamos preparando esta forma de pagamento. Escolha Stripe para continuar agora.',
    noPlan: 'Nenhum plano foi selecionado. Volte aos planos para escolher seu acesso.', backPlans: 'Alterar plano',
    secure: 'Pagamento processado pela Stripe', encrypted: 'Ao pagar com Stripe, seus dados de pagamento são processados pela própria Stripe.',
    trust: 'Confirmação automática e acesso liberado após o pagamento.',
    success: 'Retorno recebido. Estamos confirmando seu pagamento com segurança e preparando seu acesso.',
    cancelled: 'Pagamento cancelado. Nenhuma cobrança foi concluída.', working: 'Abrindo checkout seguro…',
    error: 'Não foi possível iniciar o pagamento. Tente novamente.', choose: 'Selecione uma forma de pagamento para continuar.',
  },
  en: {
    title: 'One step closer to understanding the markets.', subtitle: 'Choose how you would like to complete your purchase.',
    order: 'Your Omega access', included: 'What’s included', oneTime: 'One-time payment · no automatic renewal',
    founder: 'The first 25 confirmed purchases receive a permanent Founder badge.',
    crypto: 'Crypto', cryptoSub: 'Pay with Solana', stripe: 'Card and other methods', stripeSub: 'Secure Stripe Checkout', pix: 'Pix', pixSub: 'Payment through Asaas',
    available: 'Available now', soon: 'Coming soon', region: 'Pix will be available for purchases in Brazil.',
    continue: 'Continue to secure payment', login: 'Sign in or create an account', selectedPlan: 'Selected plan',
    unavailable: 'We’re preparing this payment method. Choose Stripe to continue now.',
    noPlan: 'No plan was selected. Return to the plans page to choose your access.', backPlans: 'Change plan',
    secure: 'Payment processed by Stripe', encrypted: 'When you pay with Stripe, your payment details are handled by Stripe.',
    trust: 'Automatic confirmation and access after payment.',
    success: 'We received your return. We’re securely confirming your payment and preparing your access.',
    cancelled: 'Payment cancelled. No charge was completed.', working: 'Opening secure checkout…',
    error: 'We could not start the payment. Please try again.', choose: 'Select a payment method to continue.',
  },
  es: {
    title: 'Un paso más cerca de entender el mercado.', subtitle: 'Elige cómo quieres completar tu compra.',
    order: 'Tu acceso a Omega', included: 'Qué incluye', oneTime: 'Pago único · sin renovación automática',
    founder: 'Las primeras 25 compras confirmadas reciben la insignia Founder permanente.',
    crypto: 'Cripto', cryptoSub: 'Paga con Solana', stripe: 'Tarjeta y otros medios', stripeSub: 'Pago seguro con Stripe', pix: 'Pix', pixSub: 'Pago mediante Asaas',
    available: 'Disponible ahora', soon: 'Próximamente', region: 'Pix estará disponible para compras en Brasil.',
    continue: 'Continuar al pago seguro', login: 'Iniciar sesión o crear una cuenta', selectedPlan: 'Plan elegido',
    unavailable: 'Estamos preparando este método de pago. Elige Stripe para continuar ahora.',
    noPlan: 'No se seleccionó ningún plan. Vuelve a los planes para elegir tu acceso.', backPlans: 'Cambiar plan',
    secure: 'Pago procesado por Stripe', encrypted: 'Al pagar con Stripe, Stripe procesa tus datos de pago.',
    trust: 'Confirmación automática y acceso después del pago.',
    success: 'Recibimos tu regreso. Estamos confirmando el pago de forma segura y preparando tu acceso.',
    cancelled: 'Pago cancelado. No se completó ningún cargo.', working: 'Abriendo el pago seguro…',
    error: 'No pudimos iniciar el pago. Inténtalo de nuevo.', choose: 'Selecciona un método de pago para continuar.',
  },
} as const

export function CheckoutPage() {
  const { locale, market } = useLocalization()
  const { user } = useSession()
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
  const options = [
    { id: 'crypto' as const, label: labels.crypto, hint: labels.cryptoSub, icon: Bitcoin, active: false },
    { id: 'fiat' as const, label: labels.stripe, hint: labels.stripeSub, icon: CreditCard, active: true },
    { id: 'pix' as const, label: labels.pix, hint: labels.pixSub, icon: QrCode, active: false },
  ]

  return <div className="min-h-[100dvh] bg-[#080c0b] text-[#e8eee9] selection:bg-[#d8b66d]/30">
    <PageMeta title={locale === 'en' ? 'Secure checkout · Omega' : locale === 'es' ? 'Pago seguro · Omega' : 'Checkout seguro · Ômega'} description={labels.subtitle} path="/checkout" />
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Brand />
      <div className="inline-flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.025] px-3 py-2 text-[11px] text-[#a6b5ab]"><LockKeyhole size={13} className="text-[#d8b66d]" />{locale === 'en' ? 'Secure checkout' : locale === 'es' ? 'Pago seguro' : 'Checkout seguro'}</div>
    </header>

    <main className="mx-auto grid w-full max-w-7xl gap-7 px-5 pb-14 pt-3 sm:px-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,.98fr)] lg:gap-12 lg:pb-20 lg:pt-7">
      <section className="min-w-0">
        <div className="relative isolate min-h-[220px] overflow-hidden rounded-[26px] border border-white/[.08] bg-[#101815] sm:min-h-[280px]">
          <img src="/omega-checkout-orbits.webp" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-[62%_52%]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,14,12,.96)_0%,rgba(7,14,12,.83)_40%,rgba(7,14,12,.1)_100%),linear-gradient(0deg,rgba(7,14,12,.35),transparent_60%)]" />
          <div className="flex min-h-[220px] flex-col justify-end p-6 sm:min-h-[280px] sm:p-8">
            <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[#d8b66d]/30 bg-[#111914]/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-[#e8cb8b]"><Sparkles size={12} />{locale === 'en' ? 'Omega · digital macroeconomics' : locale === 'es' ? 'Omega · macroeconomía digital' : 'Ômega · macroeconomia digital'}</p>
            <h1 className="max-w-xl font-display text-3xl font-medium leading-[1.08] tracking-[-.045em] text-[#f0f4ef] sm:text-4xl">{labels.title}</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#c0cbc2]">{labels.subtitle}</p>
          </div>
        </div>

        {plan ? <div className="mt-5 overflow-hidden rounded-[22px] border border-white/[.09] bg-[#101613]">
          <div className="flex items-start justify-between gap-4 border-b border-white/[.07] px-5 py-5 sm:px-6">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#98a89d]">{labels.order}</p><h2 className="mt-2 font-display text-2xl font-medium tracking-[-.035em] text-[#eef3ef]">{translateUi(plan.name)}</h2><p className="mt-1 text-sm text-[#aab8ae]">{translateUi(plan.term)}</p></div>
            <Link to="/planos" className="mt-1 shrink-0 text-xs font-medium text-[#d8b66d] underline decoration-[#d8b66d]/40 underline-offset-4 hover:text-[#f1d898]">{labels.backPlans}</Link>
          </div>
          <div className="px-5 py-5 sm:px-6">
            <div className="flex items-end justify-between gap-3"><span className="text-sm text-[#b4c0b7]">{labels.oneTime}</span><span className="font-display text-2xl font-semibold tracking-[-.04em] text-[#f2e4bd]">{offer ? formatRegionalOffer(offer, locale) : '—'}</span></div>
            <div className="my-5 h-px bg-white/[.07]" />
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[#98a89d]">{labels.included}</p>
            <ul className="grid gap-2.5 sm:grid-cols-2">{plan.features.slice(0, 4).map((feature) => <li key={feature} className="flex items-start gap-2.5 text-xs leading-5 text-[#c4cec7]"><Check size={14} className="mt-0.5 shrink-0 text-[#82b99a]" />{translateUi(feature)}</li>)}</ul>
            <div className="mt-5 flex gap-3 rounded-xl border border-[#d8b66d]/20 bg-[#d8b66d]/[.055] p-3.5"><Sparkles size={15} className="mt-0.5 shrink-0 text-[#d8b66d]" /><p className="text-xs leading-5 text-[#d7c99f]">{labels.founder}</p></div>
          </div>
        </div> : <div className="mt-5 rounded-[22px] border border-[#d8b66d]/20 bg-[#d8b66d]/[.055] p-5 text-sm leading-6 text-[#e0ce9c]"><Link to="/planos" className="underline underline-offset-4">{labels.noPlan}</Link></div>}

        <div className="mt-5 grid gap-3 rounded-[22px] border border-white/[.07] bg-white/[.02] p-4 sm:grid-cols-2 sm:p-5">
          <div className="flex gap-3"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#82b99a]" /><p className="text-xs leading-5 text-[#aab8ae]">{labels.trust}</p></div>
          <div className="flex gap-3"><LockKeyhole size={16} className="mt-0.5 shrink-0 text-[#82b99a]" /><p className="text-xs leading-5 text-[#aab8ae]">{labels.encrypted}</p></div>
        </div>
      </section>

      <section className="min-w-0 lg:pt-1">
        <div className="mb-5"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#d8b66d]">{locale === 'en' ? 'Payment method' : locale === 'es' ? 'Método de pago' : 'Forma de pagamento'}</p><h2 className="mt-2 font-display text-2xl font-medium tracking-[-.04em] text-[#f1f4ef] sm:text-3xl">{locale === 'en' ? 'How would you like to pay?' : locale === 'es' ? '¿Cómo quieres pagar?' : 'Como você prefere pagar?'}</h2><p className="mt-2 text-sm leading-6 text-[#9ca99f]">{labels.choose}</p></div>

        <div className="grid gap-3" role="radiogroup" aria-label={locale === 'en' ? 'Payment method' : locale === 'es' ? 'Método de pago' : 'Forma de pagamento'}>
          {options.map(({ id, label, hint, icon: Icon, active }) => {
            const selected = selectedMethod === id
            const disabled = id === 'pix' && market !== 'BR'
            return <button key={id} type="button" role="radio" aria-checked={selected} onClick={() => { if (!disabled) { setSelectedMethod(id); setError(''); setSearch((previous) => { const next = new URLSearchParams(previous); if (planId) next.set('plan', planId); next.set('payment', id); next.delete('status'); next.delete('session_id'); return next }, { replace: true }) } }} className={`group flex min-h-[82px] w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b66d]/70 sm:px-5 ${selected ? 'border-[#d8b66d]/70 bg-[#d8b66d]/[.075] shadow-[0_10px_35px_rgba(0,0,0,.18)]' : 'border-white/[.09] bg-[#111714] hover:border-white/20'} ${disabled ? 'cursor-not-allowed opacity-55' : ''}`}>
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl border ${selected ? 'border-[#d8b66d]/30 bg-[#d8b66d]/10 text-[#e9cd8e]' : 'border-white/[.07] bg-black/20 text-[#9eafa3]'}`}><Icon size={19} /></span>
              <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-[#e8eee9]">{label}<span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] ${active ? 'bg-[#82b99a]/10 text-[#9bd0af]' : 'bg-white/[.06] text-[#99a59c]'}`}>{active ? labels.available : labels.soon}</span></span><span className="mt-1 block text-xs text-[#9ca99f]">{hint}</span></span>
              <span aria-hidden="true" className={`grid size-[18px] shrink-0 place-items-center rounded-full border ${selected ? 'border-[#d8b66d] bg-[#d8b66d]' : 'border-white/25'}`}>{selected && <span className="size-1.5 rounded-full bg-[#101411]" />}</span>
            </button>
          })}
        </div>

        {selectedMethod === 'pix' && market !== 'BR' && <p role="status" className="mt-3 rounded-xl border border-white/[.08] bg-white/[.025] px-4 py-3 text-xs leading-5 text-[#aab8ae]">{copy[locale].region}</p>}
        {status === 'success' ? <p role="status" className="mt-5 rounded-xl border border-[#82b99a]/20 bg-[#82b99a]/[.06] p-4 text-sm leading-6 text-[#b9ddc3]">{labels.success}</p>
          : status === 'cancelled' ? <p role="status" className="mt-5 rounded-xl border border-[#d8b66d]/20 bg-[#d8b66d]/[.05] p-4 text-sm leading-6 text-[#e0ce9c]">{labels.cancelled}</p>
            : !user && planId ? <Link to={`/login?plano=${planId}&payment=${selectedMethod}`} className="mt-5 flex min-h-14 w-full items-center justify-center rounded-xl bg-[#d8b66d] px-5 text-center text-sm font-bold text-[#111510] transition hover:bg-[#ebcb83] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2dfa8]">{labels.login}</Link>
              : selectedMethod === 'fiat' ? <button type="button" disabled={busy || !planId || !offer} onClick={() => planId && void beginStripeCheckout(planId)} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#d8b66d] px-5 text-sm font-bold text-[#111510] shadow-[0_12px_35px_rgba(216,182,109,.13)] transition hover:bg-[#ebcb83] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2dfa8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080c0b] disabled:cursor-wait disabled:opacity-60">{busy ? labels.working : <>{labels.continue}<ArrowLeft size={16} className="rotate-180" /></>}</button>
                : <p role="status" className="mt-5 rounded-xl border border-[#d8b66d]/20 bg-[#d8b66d]/[.05] p-4 text-sm leading-6 text-[#d9c99d]">{labels.unavailable}</p>}
        {error && <p role="alert" className="mt-3 text-center text-xs text-[#f0a3a5]">{error || labels.error}</p>}
        {selectedMethod === 'fiat' && <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-[#85938a]"><LockKeyhole size={12} />{labels.secure}</p>}
        <Link to="/planos" className="mx-auto mt-5 flex w-fit items-center gap-2 text-xs text-[#98a69d] transition hover:text-[#e5ece6]"><ArrowLeft size={13} />{labels.backPlans}</Link>
      </section>
    </main>
  </div>

  async function beginStripeCheckout(selectedPlan: PlanId) {
    if (!supabase || busy) return
    setBusy(true)
    setError('')
    try {
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !data.session?.access_token) throw new Error(labels.error)
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan, locale }),
      })
      const result = await response.json() as { url?: string }
      if (!response.ok || !result.url) throw new Error(labels.error)
      window.location.assign(result.url)
    } catch {
      setError(labels.error)
      setBusy(false)
    }
  }
}
