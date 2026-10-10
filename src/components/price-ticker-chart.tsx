import { translateUi, translateTemplate, getUiLocale } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Period, PricePoint } from '@/lib/market-prices'

export function PriceTickerChart({ points, color, period, currency = 'USD' }: { points: PricePoint[]; color: string; period: Period; currency?: 'USD' | 'BRL' }) {
  useUiTranslation();
  const prices = points.map((point) => point.price)
  const low = Math.min(...prices)
  const high = Math.max(...prices)
  const padding = Math.max((high - low) * 0.18, high * 0.001)
  const formatPrice = (price: number) => currency === 'BRL'
    ? new Intl.NumberFormat(getUiLocale(), { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(price)
    : `US$ ${price.toLocaleString(getUiLocale(), { maximumFractionDigits: 2 })}`
  return <div className="h-[118px] w-full" role="img" aria-label={translateUi(translateTemplate("Gráfico de preço: início {{value0}}, fim {{value1}}", [formatPrice(prices[0] ?? 0), formatPrice(prices.at(-1) ?? 0)]))}>
    <ResponsiveContainer width="100%" height="100%"><AreaChart data={points} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
      <defs><linearGradient id="ticker-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.28} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
      <XAxis dataKey="time" hide /><YAxis domain={[low - padding, high + padding]} hide />
      <Tooltip contentStyle={{ background: '#171820', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#eaf2ec', fontSize: 10 }} labelFormatter={(value) => period === '1W' || period === '1M' ? new Date(Number(value)).toLocaleString(getUiLocale(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : new Date(Number(value)).toLocaleTimeString(getUiLocale(), { hour: '2-digit', minute: '2-digit' })} formatter={(value) => [formatPrice(Number(value)), translateUi('Preço')]} />
      <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill="url(#ticker-fill)" isAnimationActive={false} />
    </AreaChart></ResponsiveContainer>
  </div>
}
