import { translateUi } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import type { CompareBar } from '@/lib/visual-datasets'

export function BarsCompare({
  title,
  desc,
  bars,
}: {
  title: string
  desc: string
  bars: CompareBar[]
}) {
  useUiTranslation();
  const width = 560
  const height = 300
  const baseline = 232
  const maxBarHeight = 150
  const gap = 28
  const barWidth = Math.min(120, (width - 80 - gap * (bars.length - 1)) / Math.max(1, bars.length))
  const totalWidth = barWidth * bars.length + gap * (bars.length - 1)
  const startX = (width - totalWidth) / 2

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block h-auto w-full"
      aria-hidden="true"
      focusable="false"
    >
      <title>{translateUi(title)}</title>
      <desc>{translateUi(desc)}</desc>
      {[0.25, 0.5, 0.75, 1].map((fraction) => {
        const y = baseline - maxBarHeight * fraction
        return (
          <g key={fraction}>
            <line x1={40} y1={y} x2={width - 24} y2={y} stroke="rgba(255,255,255,.08)" strokeWidth={1} />
          </g>
        )
      })}
      <line x1={40} y1={baseline} x2={width - 24} y2={baseline} stroke="rgba(255,255,255,.22)" strokeWidth={1} />
      {bars.map((bar, index) => {
        const barHeight = Math.max(14, (Math.min(100, Math.max(0, bar.heightPct)) / 100) * maxBarHeight)
        const x = startX + index * (barWidth + gap)
        const y = baseline - barHeight
        return (
          <g key={bar.label} className="lesson-viz-bar" style={{ animationDelay: `${index * 120}ms` }}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={10} fill={index === bars.length - 1 ? '#a78bfa' : '#5b5470'} />
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={10} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={1} />
            <text x={x + barWidth / 2} y={y - 10} textAnchor="middle" fontSize={15} fontWeight={700} fill="#eef3ee">
              {translateUi(bar.valueLabel)}
            </text>
            <text x={x + barWidth / 2} y={baseline + 22} textAnchor="middle" fontSize={13} fontWeight={600} fill="#d8dee0">
              {translateUi(bar.label)}
            </text>
            <text x={x + barWidth / 2} y={baseline + 40} textAnchor="middle" fontSize={11} fill="#9aa5a0">
              {translateUi(bar.detail)}
            </text>
          </g>
        )
      })}
      <text x={40} y={height - 8} fontSize={10} fill="#777b8c">
        {translateUi("Exemplo fictício, sem escala de mercado.")}</text>
    </svg>
  )
}
