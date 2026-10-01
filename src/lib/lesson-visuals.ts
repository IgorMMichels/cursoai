export type LessonVisualType = 'bars-compare' | 'before-after'

export type LessonVisualSpec = {
  type: LessonVisualType
  title: string
  description: string
  alt: string
}

export const lessonVisualsById: Record<string, LessonVisualSpec> = {
  'meme-m1l2': {
    type: 'bars-compare',
    title: 'Preço igual, base diferente',
    description: 'Exemplo fictício com preço de R$ 2: 10 mi circulantes formam R$ 20 mi; 100 mi totais formam R$ 200 mi.',
    alt: 'Duas barras comparam market cap de R$ 20 milhões com FDV de R$ 200 milhões ao preço de R$ 2.',
  },
  'fut-m1l3': {
    type: 'bars-compare',
    title: 'Mais alavancagem, menos margem',
    description: 'Nocional fictício de R$ 1.000: 1x exige R$ 1.000, 5x exige R$ 200 e 10x exige R$ 100.',
    alt: 'Três barras mostram margem de R$ 1.000, R$ 200 e R$ 100 para 1x, 5x e 10x.',
  },
  'trd-m3l3': {
    type: 'before-after',
    title: 'Perder metade exige dobrar',
    description: 'Conta direta: R$ 100 cai a R$ 50 com -50% e só volta a R$ 100 com +100%.',
    alt: 'Diagrama mostra queda de R$ 100 para R$ 50 e alta de R$ 50 para R$ 100.',
  },
}

export function getLessonVisual(lessonId: string | undefined): LessonVisualSpec | undefined {
  if (!lessonId) return undefined
  return lessonVisualsById[lessonId]
}
