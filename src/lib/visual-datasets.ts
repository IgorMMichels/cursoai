export type CompareBar = {
  label: string
  detail: string
  valueLabel: string
  heightPct: number
}

export const lessonCompareDatasets: Record<string, CompareBar[]> = {
  'meme-m1l2': [
    { label: 'Market cap', detail: '10 mi x R$ 2', valueLabel: 'R$ 20 mi', heightPct: 12 },
    { label: 'FDV', detail: '100 mi x R$ 2', valueLabel: 'R$ 200 mi', heightPct: 100 },
  ],
  'fut-m1l3': [
    { label: '1x', detail: 'margem R$ 1.000', valueLabel: 'R$ 1.000', heightPct: 100 },
    { label: '5x', detail: 'margem R$ 200', valueLabel: 'R$ 200', heightPct: 20 },
    { label: '10x', detail: 'margem R$ 100', valueLabel: 'R$ 100', heightPct: 12 },
  ],
}

export type FlowStep = {
  top: string
  value: string
  sub: string
}

export const lessonFlowDatasets: Record<string, FlowStep[]> = {
  'trd-m3l3': [
    { top: 'Início', value: 'R$ 100', sub: 'saldo inicial' },
    { top: 'Queda -50%', value: 'R$ 50', sub: '-R$ 50' },
    { top: 'Alta +100%', value: 'R$ 100', sub: '+R$ 50' },
  ],
}
