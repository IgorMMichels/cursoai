export const moduleCovers: Record<string, string> = {
  m1: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1000&q=78',
  m2: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=1000&q=78',
  m8: 'https://images.unsplash.com/photo-1641266794308-45cef9acb4cb?auto=format&fit=crop&w=1000&q=78',
  m3: 'https://images.unsplash.com/photo-1742076553114-cfd4f27de46f?auto=format&fit=crop&w=1000&q=78',
  m4: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1000&q=78',
  m5: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1000&q=78',
  m6: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1000&q=78',
  m9: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1000&q=78',
  m7: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=78',
}

export const moduleVisualGuides: Record<string, { title: string; caption: string; steps: [string, string, string, string] }> = {
  m1: { title: 'Como uma transação entra no histórico', caption: 'A imagem representa redes distribuídas; cada blockchain tem regras próprias.', steps: ['Transação proposta', 'Nós verificam regras', 'Bloco é confirmado', 'Histórico é atualizado'] },
  m2: { title: 'Uma compra exige conferências', caption: 'Use sequência de verificação antes de confirmar uma ordem ou transferência.', steps: ['Confira a plataforma', 'Some taxas e limites', 'Escolha tipo de ordem', 'Revise destino e rede'] },
  m8: { title: 'Compare o que você está comprando', caption: 'Exposição por ETF, compra à vista e P2P não entregam os mesmos direitos ou custódia.', steps: ['Escolha o formato', 'Compare custos', 'Entenda custódia', 'Guarde comprovantes'] },
  m3: { title: 'Da curiosidade a uma hipótese verificável', caption: 'Uma tese melhora quando pode ser confrontada com evidências e revisada.', steps: ['Defina a pergunta', 'Busque dados primários', 'Cheque oferta e liquidez', 'Registre o que refutaria'] },
  m4: { title: 'Defina limites antes do cenário', caption: 'Simulações ajudam a visualizar perdas possíveis; não estimam probabilidades.', steps: ['Proteja despesas', 'Escolha limite de perda', 'Calcule exposição', 'Revise sem pressa'] },
  m5: { title: 'Proteção começa no acesso', caption: 'Nenhum suporte legítimo precisa da sua frase de recuperação ou senha.', steps: ['Proteja dispositivo', 'Ative autenticação', 'Revise permissões', 'Tenha plano de resposta'] },
  m6: { title: 'Rendimento anunciado tem dependências', caption: 'Contrato, liquidez, oráculo, emissão e custódia podem falhar de formas diferentes.', steps: ['Identifique o protocolo', 'Localize os contratos', 'Entenda a origem do retorno', 'Mapeie como sair'] },
  m9: { title: 'Direção e exposição são variáveis distintas', caption: 'Este mapa explica mecânica, não indica entradas nem antecipa movimentos.', steps: ['Escolha direção', 'Defina exposição', 'Considere margem', 'Avalie cenário contrário'] },
  m7: { title: 'Transforme estudo em rotina', caption: 'Um processo documentado ajuda a não confundir ruído com evidência.', steps: ['Anote a hipótese', 'Defina limites', 'Espere evidências', 'Marque a revisão'] },
}
