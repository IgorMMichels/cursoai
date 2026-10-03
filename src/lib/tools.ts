export type ToolSlug = 'risco-stop' | 'long-short' | 'recuperacao-perdas'
export const tools = [
  { slug: 'risco-stop' as const, title: 'Risco e stop', description: 'Calcule a quantidade da posição a partir do risco escolhido e do preço do stop.', category: 'Gestão de risco', illustration: 'risk' as const, lesson: '/curso/aula/m4/m4l2' },
  { slug: 'long-short' as const, title: 'Long e short', description: 'Compare como direção, exposição, alavancagem e custos afetam o resultado.', category: 'Futuros', illustration: 'position' as const, lesson: '/curso/aula/m9/m9l1' },
  { slug: 'recuperacao-perdas' as const, title: 'Recuperação de perdas', description: 'Calcule a alta necessária para recuperar uma queda no saldo.', category: 'Gestão de risco', illustration: 'recovery' as const, lesson: '/curso/aula/m4/m4l1' },
]

export const toolBase = (insideCourse: boolean) => insideCourse ? '/curso/ferramentas' : '/ferramentas'
