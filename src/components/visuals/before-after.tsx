import type { FlowStep } from '@/lib/visual-datasets'

export function BeforeAfter({
  title,
  desc,
  steps,
}: {
  title: string
  desc: string
  steps: FlowStep[]
}) {
  const width = 560
  const height = 260
  const boxWidth = 140
  const boxHeight = 120
  const boxY = 60
  const gap = 56
  const totalWidth = boxWidth * steps.length + gap * (steps.length - 1)
  const startX = (width - totalWidth) / 2

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block h-auto w-full"
      aria-hidden="true"
      focusable="false"
    >
      <title>{title}</title>
      <desc>{desc}</desc>
      {steps.map((step, index) => {
        const x = startX + index * (boxWidth + gap)
        const isLast = index === steps.length - 1
        return (
          <g key={`${step.top}-${index}`} className="lesson-viz-fade" style={{ animationDelay: `${index * 140}ms` }}>
            <rect
              x={x}
              y={boxY}
              width={boxWidth}
              height={boxHeight}
              rx={14}
              fill={isLast ? 'rgba(167,139,250,.14)' : 'rgba(255,255,255,.04)'}
              stroke={isLast ? 'rgba(167,139,250,.45)' : 'rgba(255,255,255,.14)'}
              strokeWidth={1.2}
            />
            <text x={x + boxWidth / 2} y={boxY + 26} textAnchor="middle" fontSize={11} fontWeight={600} fill="#b9b3c7">
              {step.top}
            </text>
            <text x={x + boxWidth / 2} y={boxY + 62} textAnchor="middle" fontSize={22} fontWeight={700} fill="#eef3ee">
              {step.value}
            </text>
            <text x={x + boxWidth / 2} y={boxY + 88} textAnchor="middle" fontSize={11} fill="#9aa5a0">
              {step.sub}
            </text>
            {index < steps.length - 1 && (
              <g>
                <line
                  x1={x + boxWidth + 10}
                  y1={boxY + boxHeight / 2}
                  x2={x + boxWidth + gap - 10}
                  y2={boxY + boxHeight / 2}
                  stroke="rgba(255,255,255,.3)"
                  strokeWidth={1.5}
                />
                <path
                  d={`M ${x + boxWidth + gap - 18} ${boxY + boxHeight / 2 - 6} L ${x + boxWidth + gap - 10} ${boxY + boxHeight / 2} L ${x + boxWidth + gap - 18} ${boxY + boxHeight / 2 + 6}`}
                  fill="none"
                  stroke="rgba(255,255,255,.3)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}
          </g>
        )
      })}
      <text x={width / 2} y={height - 22} textAnchor="middle" fontSize={10} fill="#777b8c">
        Conta aritmética fictícia, sem previsão de retorno.
      </text>
    </svg>
  )
}
