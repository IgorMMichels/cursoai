export const moduleCovers: Record<string, string> = {
  m1: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1800&q=88',
  m2: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=1800&q=88',
  m8: 'https://images.unsplash.com/photo-1641266794308-45cef9acb4cb?auto=format&fit=crop&w=1800&q=88',
  m3: 'https://images.unsplash.com/photo-1742076553114-cfd4f27de46f?auto=format&fit=crop&w=1800&q=88',
  m4: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1800&q=88',
  m5: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1800&q=88',
  m6: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1800&q=88',
  m9: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1800&q=88',
  m7: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1800&q=88',
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

export const journeyModuleVisuals: Record<string, { title: string; description: string; alt: string }> = {
  'meme-m1': { title: 'Peças que formam um mercado de token', description: 'Esquema fictício relacionando oferta, preço, liquidez e atividade.', alt: 'Diagrama: oferta circulante multiplicada pelo preço forma uma capitalização estimada; liquidez e volume aparecem como medidas separadas.' },
  'meme-m2': { title: 'Investigação antes de qualquer conclusão', description: 'Fluxo de pesquisa com dados sintéticos; cada etapa pode encerrar a análise.', alt: 'Fluxo de triagem: candidato, contrato, liquidez, distribuição de carteiras e evidências, com pontos de parada para riscos.' },
  'meme-m3': { title: 'O caminho de um swap', description: 'Representação educacional de uma cotação e execução em DEX.', alt: 'Carteira solicita uma cotação, confere impacto e custos, interage com um pool e recebe confirmação da rede.' },
  'meme-m4': { title: 'Superfícies de risco em memecoins', description: 'Mapa de sinais de atenção; exemplos não representam um token real.', alt: 'Quatro áreas de verificação: contrato, liquidez, concentração de carteiras e links ou mensagens suspeitas.' },
  'fut-m1': { title: 'Componentes de contrato perpétuo', description: 'Mapa conceitual sem preço ou recomendação de operação.', alt: 'Long e short são lados de um contrato; margem sustenta exposição, preço de referência ajuda a liquidar e funding transfere pagamentos.' },
  'fut-m2': { title: 'Controles numa ordem de futuros', description: 'Sequência fictícia para estudar tipos de ordem e limites.', alt: 'Fluxo: definir exposição, enviar ordem, acompanhar preço de referência, aplicar proteção reduce-only e encerrar ou revisar.' },
  'fut-m3': { title: 'Plano, exposição e cenários', description: 'Estrutura de revisão de risco, sem indicação de entrada.', alt: 'Processo educacional: escrever hipótese, limitar risco, comparar cenário favorável e adverso e revisar o resultado.' },
  'trd-m1': { title: 'Ler estrutura antes de nomear padrões', description: 'Candles e níveis totalmente sintéticos para fins didáticos.', alt: 'Gráfico fictício com candles, zona de suporte e resistência, sequência de topos e fundos e volume ilustrativo.' },
  'trd-m2': { title: 'Indicadores como camadas de contexto', description: 'Exemplo sintético: indicadores resumem dados passados e podem divergir.', alt: 'Gráfico fictício com preço e média móvel, faixa de momentum e barras de volume; nenhuma camada isolada define uma decisão.' },
  'trd-m3': { title: 'Perda e recuperação não são simétricas', description: 'Exemplo aritmético hipotético; não estima retornos futuros.', alt: 'Escada mostra que uma queda de cinquenta por cento precisa de alta de cem por cento para retornar ao valor inicial.' },
  'trd-m4': { title: 'Rotina de estudo e revisão', description: 'Ciclo de processo para registrar decisões e aprender com elas.', alt: 'Ciclo contínuo: plano, espera por condições, execução conforme regras, registro no diário e revisão.' },
}
