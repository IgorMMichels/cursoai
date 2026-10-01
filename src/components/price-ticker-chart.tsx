import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Period, PricePoint } from '@/lib/market-prices'

export function PriceTickerChart({ points, color, period }: { points: PricePoint[]; color: string; period: Period }) {
  const prices = points.map((point) => point.price)
  const low = Math.min(...prices)
  const high = Math.max(...prices)
  const padding = Math.max((high - low) * 0.18, high * 0.001)
  return <div className="h-[118px] w-full" role="img" aria-label={`Gráfico de preço: início US$ ${prices[0]?.toFixed(2)}, fim US$ ${prices.at(-1)?.toFixed(2)}`}>
    <ResponsiveContainer width="100%" height="100%"><AreaChart data={points} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
      <defs><linearGradient id="ticker-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.28} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
      <XAxis dataKey="time" hide /><YAxis domain={[low - padding, high + padding]} hide />
      <Tooltip contentStyle={{ background: '#171820', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#eaf2ec', fontSize: 10 }} labelFormatter={(value) => period === '1W' || period === '1M' ? new Date(Number(value)).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : new Date(Number(value)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} formatter={(value) => [`US$ ${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`, 'Preço']} />
      <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill="url(#ticker-fill)" isAnimationActive={false} />
    </AreaChart></ResponsiveContainer>
  </div>
}
