import { translateUi } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useId } from 'react'

type Illustration = 'risk' | 'position' | 'recovery'

export function ToolArt({ kind, compact = false }: { kind: Illustration; compact?: boolean }) {
  useUiTranslation();
  const id = useId().replaceAll(':','')
  const color = kind === 'position' ? '#70d9ef' : kind === 'recovery' ? '#e8bc76' : '#b49cff'
  const lines = kind === 'recovery' ? 'M12 88L45 88L76 58L108 58L140 36L175 36L208 17' : kind === 'position' ? 'M12 78L45 69L76 82L108 47L140 55L175 28L208 18' : 'M12 20H208M12 52H208M12 84H208'
  return <svg viewBox="0 0 220 100" className={compact ? 'tool-art tool-art-compact' : 'tool-art'} role="img" aria-label={translateUi(kind === 'risk' ? 'Linhas de referência de preço' : kind === 'position' ? 'Trajetória ilustrativa de preço' : 'Comparação ilustrativa de saldo')}>
    <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop stopColor={color} stopOpacity=".25"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
    <path d="M0 99H220M0 67H220M0 34H220" stroke="white" strokeOpacity=".07"/>
    {kind === 'risk' ? <><path d="M12 20H208" stroke="#92d4ab" strokeDasharray="4 5"/><path d="M12 52H208" stroke="#b49cff" strokeDasharray="4 5"/><path d="M12 84H208" stroke="#f28c9a" strokeDasharray="4 5"/></> : <><path d={`${lines}V100H12Z`} fill={`url(#${id})`}/><path d={lines} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/></>}
  </svg>
}
