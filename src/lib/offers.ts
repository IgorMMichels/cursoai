export type PlanId = 'month' | 'quarter' | 'lifetime'
export type Currency = 'SOL' | 'BRL'

export const plans: Record<PlanId, { name: string; term: string; prices: Record<Currency, string>; description: string; features: string[]; featured?: boolean }> = {
  month: { name: '1 mês', term: '30 dias de acesso', prices: { SOL: '0,4 SOL', BRL: 'R$ 299' }, description: 'Uma primeira etapa para conhecer o método.', features: ['9 módulos e 27 aulas', 'Quizzes e atividades práticas', 'Acesso durante 30 dias'] },
  quarter: { name: '3 meses', term: '90 dias de acesso', prices: { SOL: '0,7 SOL', BRL: 'R$ 549' }, description: 'Mais tempo para estudar, rever e construir sua rotina.', features: ['Tudo do plano de 1 mês', '90 dias para revisar as aulas', 'Progresso salvo entre sessões'] },
  lifetime: { name: 'Vitalício', term: 'Acesso sem prazo', prices: { SOL: '0,9 SOL', BRL: 'R$ 699' }, description: 'Acesso completo para estudar, voltar e revisar sem prazo.', features: ['Acesso permanente aos 9 módulos', 'Revisite aulas e quizzes quando quiser', 'Atualizações futuras desta trilha'], featured: true }
}

export const affiliateRate = 0.2
