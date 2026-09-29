export type Lesson = {
  id: string
  title: string
  duration: string
  content: string[]
  takeaway: string
  sources?: { label: string; url: string }[]
  exercise: { title: string; prompt: string; options?: string[]; answer?: number; note: string }
}

export type Question = { question: string; options: string[]; answer: number; explanation: string }

export type CourseModule = {
  id: string
  number: string
  title: string
  subtitle: string
  icon: string
  color: string
  duration: string
  lessons: Lesson[]
  quiz: Question[]
}

export const modules: CourseModule[] = [
  {
    id: 'm1', number: '01', title: 'Entenda o terreno', subtitle: 'Blockchain, Bitcoin e o que uma carteira realmente guarda.', icon: 'Blocks', color: 'mint', duration: '24 min',
    lessons: [
      { id: 'm1l1', title: 'Uma rede que mantém o próprio livro-caixa', duration: '7 min', content: [
        'Imagine um livro-caixa que milhares de computadores mantêm em conjunto. Quando um grupo de transações é confirmado, a rede acrescenta uma nova página ligada criptograficamente à anterior. Alterar uma página antiga exigiria convencer a rede a reescrever também as seguintes.',
        'Esse registro distribuído é a blockchain. Participantes seguem regras públicas para validar as transações; cada rede define como chega a um acordo. Isso reduz a dependência de um único operador, mas não torna todo projeto confiável nem toda transação reversível.',
        'A rede resolve um problema de coordenação. O preço de um ativo continua dependendo de procura, oferta, utilidade percebida, liquidez e confiança. Tecnologia interessante não é sinônimo de bom investimento.'
      ], takeaway: 'A blockchain organiza registros. Ela não garante o valor do que está registrado.', exercise: { title: 'Cheque seu modelo mental', prompt: 'Se um bloco já foi confirmado, o que a rede oferece principalmente?', options: ['Uma garantia de lucro para quem aparece nele', 'Um registro compartilhado e difícil de alterar sem o consenso da rede', 'Um banco central para reverter pagamentos'], answer: 1, note: 'O mecanismo protege a integridade do histórico segundo as regras da rede. Ele não protege o investidor de preço, fraude fora da rede ou erro de envio.' } },
      { id: 'm1l2', title: 'Bitcoin, ether e tokens: ativos diferentes', duration: '8 min', content: [
        'Bitcoin é o ativo nativo de uma rede com regras próprias. Ether é o ativo nativo da Ethereum e também é usado para pagar operações nessa rede. Já um token pode ser criado sobre uma rede existente e pode representar utilidade, governança ou outra promessa definida pelo emissor.',
        'Stablecoins tentam acompanhar o valor de uma referência, como o dólar. Para isso, dependem de reservas, mecanismos e confiança em quem as administra. “Estável” descreve a intenção de preço, não elimina risco de emissor, liquidez, regulação ou descolamento.',
        'Antes de comparar dois ativos, descubra quem pode emitir mais unidades, para que o ativo é usado, quem mantém a infraestrutura e em quais mercados ele pode ser negociado.'
      ], takeaway: '“Cripto” é uma categoria ampla. Identifique o ativo e as regras antes de olhar o gráfico.', exercise: { title: 'Classifique antes de comparar', prompt: 'Um token de governança costuma dar ao titular:', options: ['Voto em certas decisões do protocolo, conforme regras definidas', 'Participação garantida nos lucros de uma empresa', 'Proteção contra queda de preço'], answer: 0, note: 'Direitos variam por projeto e jurisdição. Leia as regras do token; o nome da categoria, sozinho, não cria direitos.' } },
      { id: 'm1l3', title: 'Carteiras, chaves e custódia', duration: '9 min', content: [
        'As moedas não ficam dentro do aplicativo da carteira. O que a carteira protege são as chaves que permitem autorizar operações na blockchain. Uma carteira custodial guarda as chaves por você; uma carteira autocustodial deixa esse controle com você.',
        'Autocustódia acrescenta responsabilidade. A frase de recuperação pode restaurar o acesso e deve permanecer fora de sites, mensagens, fotos e serviços de nuvem. Quem obtém essa frase pode controlar os ativos, e uma transação confirmada normalmente não tem um botão de estorno.',
        'Para começar, pratique com valores pequenos, confirme rede e endereço, entenda taxas e mantenha uma cópia de recuperação offline. Segurança depende também de como você usa o dispositivo e de como verifica o destinatário.'
      ], takeaway: 'Controle das chaves traz controle das decisões — e responsabilidade pelos erros.', exercise: { title: 'Regra de custódia', prompt: 'Uma pessoa do “suporte” pede sua frase de recuperação para corrigir um erro. O que fazer?', options: ['Enviar só as primeiras palavras', 'Não compartilhar; encerrar contato e verificar o canal oficial por conta própria', 'Compartilhar se o perfil tiver selo'], answer: 1, note: 'Suporte legítimo não precisa da frase de recuperação. Procure você mesmo o endereço oficial do serviço.' } }
    ],
    quiz: [
      { question: 'O que descreve melhor uma blockchain pública?', options: ['Um cadastro compartilhado validado por regras da rede', 'Um aplicativo que guarda moedas no celular', 'Uma promessa de rentabilidade automática'], answer: 0, explanation: 'A blockchain registra operações de acordo com regras verificadas pela rede.' },
      { question: 'O que uma carteira digital controla?', options: ['O preço de mercado', 'As chaves usadas para autorizar transações', 'A emissão de todos os tokens'], answer: 1, explanation: 'A carteira gerencia chaves. Os ativos são registrados na rede.' },
      { question: 'Qual é a prática segura com a frase de recuperação?', options: ['Não compartilhá-la e mantê-la protegida offline', 'Enviar ao suporte quando pedirem', 'Salvar uma captura de tela no e-mail'], answer: 0, explanation: 'Quem conhece a frase pode recuperar e controlar a carteira.' }
    ]
  },
  {
    id: 'm2', number: '02', title: 'Faça o básico bem feito', subtitle: 'Exchanges, ordens e transferências sem pressa.', icon: 'ArrowLeftRight', color: 'blue', duration: '20 min',
    lessons: [
      { id: 'm2l1', title: 'Como avaliar uma exchange', duration: '7 min', content: [
        'Uma exchange aproxima compradores e vendedores, mas cada plataforma tem regras, custos, limites e formas de custódia diferentes. Compare quem opera o serviço, onde está estabelecido, quais ativos e redes oferece e como publica taxas e regras de saque.',
        'Procure histórico verificável de incidentes, avisos de órgãos oficiais, demonstrações de reservas com escopo claro e canais de atendimento que você consiga confirmar fora de anúncios. Nenhum selo ou grande volume substitui sua própria verificação.',
        'Faça um depósito pequeno de teste e entenda como retirar antes de concentrar saldo. Não deixe a facilidade de comprar esconder a pergunta mais importante: como e quando você pode recuperar seus recursos?'
      ], takeaway: 'Confirme identidade, taxas, redes e saques antes de transferir valores relevantes.', exercise: { title: 'Lista de verificação', prompt: 'Quais dois dados precisam estar claros antes de comprar?', options: ['Taxas totais e condições de saque', 'Cor do aplicativo e número de seguidores', 'Promessa de valorização e bônus de cadastro'], answer: 0, note: 'Custos e acesso ao saque afetam sua experiência diretamente. Popularidade não prova segurança.' } },
      { id: 'm2l2', title: 'Ordens a mercado, limitadas e stop', duration: '6 min', content: [
        'Uma ordem a mercado prioriza execução rápida pelo preço disponível. Em um livro raso ou mercado em movimento, o preço final pode diferir do que você viu ao tocar no botão; esse efeito é chamado de slippage.',
        'Uma ordem limitada define o preço máximo de compra ou mínimo de venda que você aceita. Ela pode não ser executada. Uma ordem stop dispara outra ordem quando um nível é alcançado, mas não garante o preço de execução, sobretudo em movimentos rápidos.',
        'Antes de enviar, confira o par negociado, o tipo de ordem, o valor total, as taxas e o efeito de uma execução parcial. Treine com um ambiente simulado e leia como a plataforma implementa cada opção.'
      ], takeaway: 'Uma ordem controla instruções de negociação; ela não controla o mercado.', exercise: { title: 'Escolha a instrução', prompt: 'Você prefere não pagar acima de um preço definido e pode esperar. Qual ordem combina com essa instrução?', options: ['A mercado', 'Limitada', 'Stop a mercado'], answer: 1, note: 'A ordem limitada pode ficar sem execução. Escolher um tipo de ordem não torna a tese de investimento melhor.' } },
      { id: 'm2l3', title: 'A primeira transferência sem improviso', duration: '7 min', content: [
        'Uma transferência depende de endereço, rede e formato compatíveis. Mesmo duas redes com nomes parecidos podem ser incompatíveis. Transações confirmadas costumam ser irreversíveis; um erro de destino pode significar perda permanente.',
        'Copiar e colar também merece atenção: malware pode substituir um endereço. Confira o começo e o fim do endereço no dispositivo de origem, confirme a rede nos dois lados e verifique se há memo ou tag obrigatória.',
        'Faça um envio pequeno de teste e aguarde a confirmação antes de enviar o restante. Esse cuidado custa uma taxa extra, mas pode revelar um erro de configuração antes que ele fique caro.'
      ], takeaway: 'Confira endereço, rede, tag e destinatário; teste antes de aumentar o valor.', exercise: { title: 'Antes de confirmar', prompt: 'A exchange e a carteira mostram redes diferentes. Qual é o próximo passo?', options: ['Enviar uma pequena parte e torcer', 'Parar e confirmar compatibilidade com as fontes oficiais dos dois serviços', 'Escolher a rede mais barata'], answer: 1, note: 'Taxa baixa não compensa uma rede incompatível. Não envie até entender o caminho completo.' } }
    ],
    quiz: [
      { question: 'Uma ordem limitada pode não executar porque:', options: ['O preço não atingiu seu limite ou não havia liquidez suficiente', 'Ela sempre aguarda aprovação do Banco Central', 'Toda ordem limitada expira imediatamente'], answer: 0, explanation: 'O preço pode nunca atingir seu limite; execução depende do mercado e das regras da plataforma.' },
      { question: 'Antes de enviar cripto para uma carteira, confira:', options: ['Endereço, rede e eventuais tags/memos', 'Apenas o nome da moeda', 'Somente o valor da taxa'], answer: 0, explanation: 'Todos esses campos precisam corresponder ao destino.' },
      { question: 'O que uma ordem stop garante?', options: ['Preço de saída exato em qualquer condição', 'Que outra ordem seja disparada ao nível configurado, segundo as regras da plataforma', 'Que a posição não tenha prejuízo'], answer: 1, explanation: 'Uma ordem stop pode sofrer slippage e não limita perdas a um valor exato.' }
    ]
  },
  {
    id: 'm8', number: '03', title: 'Compre Bitcoin com clareza', subtitle: 'Compare caminhos de compra, custos e custódia.', icon: 'Bitcoin', color: 'lilac', duration: '22 min',
    lessons: [
      { id: 'm8l1', title: 'Bitcoin à vista, ETF ou P2P?', duration: '8 min', content: [
        '“Comprar Bitcoin” pode significar adquirir o ativo à vista em uma exchange, negociar uma cota de fundo ou ETF que acompanha uma referência de cripto, ou negociar diretamente com outra pessoa. Esses caminhos têm direitos, custos, horários, riscos e formas de custódia diferentes.',
        'Na compra à vista, o saldo pode ser mantido pela exchange ou retirado para uma carteira própria, conforme regras e redes disponíveis. Uma cota negociada na bolsa dá exposição conforme a estrutura do produto, mas não entrega as chaves nem necessariamente permite resgate em BTC. Leia regulamento, índice, taxas e documentos atuais.',
        'No P2P, você negocia com uma contraparte. Escrow, reputação e comprovantes ajudam a organizar a operação, mas não removem fraude, disputa, bloqueio bancário ou risco de contraparte. Cartão, Pix e transferência também podem ter custos e regras diferentes por plataforma.'
      ], takeaway: 'Compare o que você recebe e quem controla as chaves antes de comparar apenas o preço.', sources: [{ label: 'B3: diferenças entre comprar diretamente, ETF e futuro de Bitcoin', url: 'https://borainvestir.b3.com.br/tipos-de-investimentos/renda-variavel/criptoativos/futuro-de-bitcoin-etf-de-bitcoin-ou-comprar-diretamente-entenda-as-diferencas-desses-investimentos/' }, { label: 'B3: ETFs de criptoativos e fatores para analisar', url: 'https://borainvestir.b3.com.br/tipos-de-investimentos/renda-variavel/criptoativos/7-coisas-que-voce-precisa-saber-antes-de-investir-em-etfs-de-criptoativos/' }], exercise: { title: 'Escolha o que comparar', prompt: 'Você quer entender se uma cota de ETF é equivalente a manter BTC em carteira própria. Qual pergunta ajuda mais?', options: ['A cota dá controle de chaves ou resgate em Bitcoin? Quais são suas regras e custos?', 'Qual ativo teve a maior alta nesta semana?', 'Qual produto tem o nome mais parecido com Bitcoin?'], answer: 0, note: 'Exposição econômica, propriedade de cotas e custódia direta são coisas diferentes. Verifique documentos do produto.' } },
      { id: 'm8l2', title: 'Uma compra simulada do começo ao fim', duration: '7 min', content: [
        '1. Escolha o caminho e confirme que entende o produto. 2. Verifique a empresa ou intermediário em fontes oficiais, acesse o endereço por conta própria e habilite autenticação forte. 3. Compare taxa de negociação, spread, depósito, saque, rede e custo total.',
        '4. Planeje um valor que não comprometa despesas, dívidas ou reserva. Se decidir seguir, comece pelo fluxo de menor complexidade disponível; confira ativo, par, total em reais, tipo de ordem e taxa na tela final. Não aceite pressão ou promessa de rentabilidade.',
        '5. Depois, confira o extrato e salve comprovantes. Se retirar BTC para autocustódia, valide endereço e rede, faça primeiro um envio pequeno e confirme o recebimento. Transferências confirmadas em blockchain normalmente não têm estorno.'
      ], takeaway: 'Use uma lista de verificação; não decida sob urgência ou por promessa de retorno.', exercise: { title: 'Antes de confirmar', prompt: 'Uma pessoa no direct oferece “ajudar” e pede que você compartilhe a tela para comprar Bitcoin. O que fazer?', options: ['Recusar, encerrar a conversa e abrir o canal oficial por conta própria', 'Aceitar se ela conhece o nome da exchange', 'Compartilhar a tela, mas ocultar o saldo'], answer: 0, note: 'Não entregue senhas, códigos, seed phrase nem controle remoto. Suporte legítimo não precisa da sua chave privada.' } },
      { id: 'm8l3', title: 'Depois da compra: registro e custódia', duration: '7 min', content: [
        'Decida onde o ativo fica guardado. Manter saldo na exchange depende dos controles, solvência, disponibilidade de saques e regras da empresa. Autocustódia transfere a responsabilidade das chaves para você e exige cópias de recuperação seguras e procedimentos testados.',
        'Uma tela de saldo não é histórico suficiente. Guarde data, valor em reais, quantidade, taxa, comprovante e, quando houver, identificador da transação. Isso ajuda a explicar custos e movimentações futuras; obrigações fiscais dependem das regras vigentes e do seu caso.',
        'Um plano de aportes periódicos pode organizar decisões no tempo, mas não garante lucro, reduz todas as perdas nem torna o preço previsível. Reveja objetivos e limites sem transformar uma rotina em compra automática que você não entende.'
      ], takeaway: 'Comprar é só uma etapa. Registro, acesso e plano de segurança também fazem parte.', sources: [{ label: 'Banco Central: informações e alertas sobre criptoativos', url: 'https://www.bcb.gov.br/estabilidadefinanceira/criptoativos' }], exercise: { title: 'Organize sua trilha de auditoria', prompt: 'Qual registro é mais útil para acompanhar uma compra?', options: ['Data, valor em reais, quantidade, taxa, comprovante e eventual hash', 'Uma captura do preço atual', 'Só o nome do ativo'], answer: 0, note: 'Registros completos ajudam a entender operações e podem ser úteis para obrigações fiscais. Consulte a regra oficial vigente.' } }
    ],
    quiz: [
      { question: 'O que diferencia uma compra à vista de uma cota de ETF de Bitcoin?', options: ['A cota é um valor mobiliário com regras próprias; compra à vista envolve o ativo e sua custódia', 'Ambas sempre entregam as mesmas chaves privadas', 'Nenhuma tem taxas ou riscos de intermediário'], answer: 0, explanation: 'Estruturas, direitos, custos, negociação e custódia variam; leia documentos do produto.' },
      { question: 'Antes de enviar BTC para uma carteira, o que conferir?', options: ['Endereço, rede e compatibilidade; testar com valor pequeno', 'Somente a cotação do dia', 'Apenas o nome exibido no aplicativo'], answer: 0, explanation: 'Endereço ou rede incorretos podem causar perda irreversível.' },
      { question: 'Aportes periódicos garantem um preço médio melhor?', options: ['Sim, em qualquer cenário', 'Não; organizam datas, mas não garantem lucro ou menor perda', 'Sim, desde que feitos por cartão'], answer: 1, explanation: 'O resultado depende do mercado, custos, período e decisões. Não há garantia.' }
    ]
  },
  {
    id: 'm3', number: '04', title: 'Leia além do ticker', subtitle: 'Uma rotina de pesquisa antes de formar opinião.', icon: 'ScanSearch', color: 'lilac', duration: '23 min',
    lessons: [
      { id: 'm3l1', title: 'Comece pelo problema, não pelo preço', duration: '8 min', content: [
        'Toda análise começa com uma hipótese verificável. Que problema o projeto tenta resolver? Quem tem esse problema? Por que essa rede ou aplicação seria útil, e o que mudaria se o token deixasse de existir?',
        'Leia a documentação original e identifique o que já funciona, o que ainda é promessa e quem mantém o projeto. Diferencie código aberto, auditorias, uso real e linguagem promocional; cada item informa algo distinto e nenhum, sozinho, elimina o risco.',
        'Escreva sua tese em poucas linhas e anote o que a refutaria. Uma tese que não admite evidência contrária vira torcida, não método.'
      ], takeaway: 'Uma tese útil pode ser questionada e atualizada quando surgem fatos novos.', exercise: { title: 'Teste de hipótese', prompt: 'Qual frase permite pesquisa mais objetiva?', options: ['“Esse token vai subir porque todo mundo fala dele.”', '“A aplicação processa X operações; vou verificar usuários, custos e concentração.”', '“O fundador parece confiante.”'], answer: 1, note: 'Uma hipótese observável permite comparar discurso com dados e revisar a conclusão.' } },
      { id: 'm3l2', title: 'Oferta, desbloqueios e liquidez', duration: '8 min', content: [
        'A oferta em circulação é apenas uma parte da história. Veja o total máximo ou previsto, os cronogramas de emissão e desbloqueio, quem controla grandes carteiras e quais incentivos distribuem tokens a equipe, investidores ou usuários.',
        'Um valor de mercado totalmente diluído pode destacar o efeito de toda a oferta prevista ao preço atual. Ele não significa que essa oferta possa ser vendida por esse preço; liquidez e profundidade do mercado mudam o resultado.',
        'Pergunte quem recebe novos tokens, quando pode vendê-los e que demanda sustentaria a utilidade. Compare o fluxo de desbloqueios com a profundidade negociada e não trate escassez anunciada como prova de valorização.'
      ], takeaway: 'Oferta, concentração e liquidez ajudam a entender quem pode vender e a que custo.', exercise: { title: 'Encontre a pergunta certa', prompt: 'O projeto anuncia um limite de oferta. O que ainda vale investigar?', options: ['Quem já possui tokens e quando eles podem ser desbloqueados', 'Somente a cor do símbolo', 'Se o nome aparece em uma lista de tendências'], answer: 0, note: 'O cronograma de emissão e a distribuição podem mudar incentivos e pressão de venda.' } },
      { id: 'm3l3', title: 'Dados, fontes e sinais de alerta', duration: '7 min', content: [
        'Volume, usuários ativos, taxas e valor total bloqueado são medidas diferentes. Verifique como cada painel calcula seus números, se a métrica pode incluir atividade automatizada e se houve mudança de metodologia.',
        'Cruze a documentação do projeto com exploradores da rede, dados independentes e comunicados verificáveis. Uma manchete ou captura de tela não revela contexto, período, fonte nem conflito de interesse.',
        'Guarde a data das evidências e faça perguntas incômodas: o dado continua crescendo depois de incentivos? A atividade vem de poucos endereços? O preço depende de uma única exchange?' 
      ], takeaway: 'Métrica sem definição e fonte verificável é uma afirmação, não evidência.', exercise: { title: 'Pese a evidência', prompt: 'Um gráfico viral mostra “usuários recordes”. Qual verificação vem primeiro?', options: ['Abrir a fonte, o período e a definição de usuário', 'Repassar o gráfico para não perder a alta', 'Presumir que usuários são pessoas únicas'], answer: 0, note: 'Métricas on-chain podem contar endereços e contratos, não pessoas.' } }
    ],
    quiz: [
      { question: 'Uma análise de projeto fica mais forte quando:', options: ['Anota evidências e também o que refutaria a tese', 'Ignora informações que contradizem a expectativa', 'Repete a opinião de influenciadores'], answer: 0, explanation: 'Critérios de revisão reduzem viés de confirmação.' },
      { question: '“Oferta máxima” responde sozinha à pergunta sobre diluição?', options: ['Sim; tokens ainda bloqueados não afetam o futuro', 'Não; cronograma e distribuição também importam', 'Sim; basta dividir o preço por dois'], answer: 1, explanation: 'Emissões futuras, desbloqueios e concentração alteram incentivos e oferta disponível.' },
      { question: 'Um dashboard mostra endereços ativos. Isso prova quantas pessoas usam o produto?', options: ['Sim, cada endereço pertence a uma pessoa', 'Não; endereços e pessoas são unidades diferentes', 'Sim, se o gráfico for colorido'], answer: 1, explanation: 'Uma pessoa pode ter vários endereços, e um endereço pode representar automação ou contrato.' }
    ]
  },
  {
    id: 'm4', number: '05', title: 'Defina o risco antes da entrada', subtitle: 'Orçamento, cenários e uma estratégia que caiba na sua vida.', icon: 'Scale', color: 'amber', duration: '22 min',
    lessons: [
      { id: 'm4l1', title: 'Capacidade de risco e dinheiro necessário', duration: '7 min', content: [
        'Capacidade de risco é o que suas finanças suportam sem comprometer necessidades e planos. Tolerância é como você se sente diante da oscilação. Uma pessoa pode tolerar uma queda emocionalmente, mas não ter capacidade de esperar pela recuperação.',
        'Separe reserva de emergência, despesas próximas e dívidas do capital especulativo. Não use dinheiro necessário para aluguel, saúde ou obrigações. Se perder o valor alteraria sua rotina, o tamanho provavelmente está grande demais para seu contexto.',
        'Criptoativos podem perder grande parte ou todo o valor. Antes de investir, considere também risco de plataforma, custódia, fraude, liquidez, tecnologia e regulação.'
      ], takeaway: 'Defina primeiro o que não pode ser comprometido.', exercise: { title: 'Ordene as prioridades', prompt: 'Você ainda não tem reserva para despesas essenciais. Qual próximo passo é mais prudente?', options: ['Definir a reserva e o orçamento antes de pensar em ativos voláteis', 'Usar o limite do cartão para não perder oportunidade', 'Escolher a moeda com maior alta recente'], answer: 0, note: 'Prioridades financeiras vêm antes de uma estratégia de investimento especulativo.' } },
      { id: 'm4l2', title: 'Dimensione pelo prejuízo que tolera', duration: '8 min', content: [
        'Uma posição pequena o bastante para ser ignorada tende a ser mais administrável do que uma que domina sua atenção. Uma maneira de visualizar isso é perguntar: se o ativo caísse 50%, que valor seria perdido e que decisões essa perda provocaria?',
        'Não existe tamanho universal. Horizontes, renda, obrigações, experiência e diversificação importam. Stop, limite de perda e ordens automáticas podem falhar em gaps, falta de liquidez e indisponibilidade de plataforma.',
        'Use a simulação ao lado para tornar o impacto visível. Ela não estima a probabilidade de cada cenário nem recomenda percentual; serve apenas para testar se você entende o que uma oscilação significa em reais.'
      ], takeaway: 'Pense em perda possível em reais antes de pensar em retorno percentual.', exercise: { title: 'Uma regra que ajuda', prompt: 'Por que simular uma queda antes de comprar?', options: ['Para provar que a queda não acontecerá', 'Para estimar impacto e checar se ele cabe no orçamento', 'Para descobrir o melhor momento de entrada'], answer: 1, note: 'A simulação é educativa e não prevê preço nem probabilidade de mercado.' } },
      { id: 'm4l3', title: 'Aportes periódicos, diversificação e revisão', duration: '7 min', content: [
        'Aportes periódicos, chamados de DCA, distribuem compras em datas planejadas. Podem reduzir a dependência de uma única data, mas não garantem lucro, não evitam perdas e podem resultar em retorno inferior a outras estratégias dependendo do mercado.',
        'Diversificar significa não depender de uma única tese ou fonte de risco. Ter muitos tokens correlacionados não é diversificação real; examine exposição por rede, setor, custodiante e liquidez.',
        'Defina uma rotina de revisão: frequência, dados que acompanham a tese e eventos que pedem reavaliação. Evite mudar o plano a cada manchete; atualize quando a evidência importante mudar.'
      ], takeaway: 'Uma rotina pode organizar decisões. Ela não remove risco de mercado.', exercise: { title: 'Escolha o uso adequado', prompt: 'Qual afirmação sobre DCA é correta?', options: ['Garante preço médio baixo e lucro', 'Automatiza compras em datas planejadas, sem garantir resultado', 'Funciona apenas com stablecoins'], answer: 1, note: 'DCA muda a distribuição temporal das compras; não elimina risco nem substitui análise.' } }
    ],
    quiz: [
      { question: 'Capacidade de risco se refere principalmente a:', options: ['Quanto a vida financeira consegue suportar perder ou deixar oscilando', 'Quanto você gostaria de ganhar', 'Quantos gráficos você sabe ler'], answer: 0, explanation: 'Capacidade considera obrigações, horizonte e impacto concreto de perdas.' },
      { question: 'A simulação de queda exibida no curso:', options: ['Prevê o próximo preço', 'Mostra um cenário hipotético para visualizar impacto', 'Indica quanto investir'], answer: 1, explanation: 'É uma ferramenta educativa, sem previsão ou recomendação individual.' },
      { question: 'A estratégia DCA:', options: ['Elimina volatilidade', 'Pode organizar aportes, mas não garante retorno', 'Impede perdas se o preço cair'], answer: 1, explanation: 'Aportes periódicos não removem riscos do ativo nem garantem resultado.' }
    ]
  },
  {
    id: 'm5', number: '06', title: 'Proteja o acesso', subtitle: 'Engenharia social, permissões e resposta a incidentes.', icon: 'ShieldCheck', color: 'mint', duration: '21 min',
    lessons: [
      { id: 'm5l1', title: 'Golpes que começam com pressa', duration: '7 min', content: [
        'Golpistas costumam combinar urgência, autoridade e uma promessa atraente: sorteio, airdrop, suporte, vaga de investimento ou recuperação de carteira. A história muda; a pressão para agir antes de verificar se repete.',
        'Rug pull, phishing e falso suporte exploram pontos diferentes. Em todos, confira o domínio por um canal independente, pesquise a equipe e a operação, leia o que você está assinando e interrompa qualquer processo que peça uma transferência urgente.',
        'Desconfie de lucro garantido, retorno extraordinário ou “última chance”. Alertas da CVM sobre criptoativos e ofertas irregulares são uma boa referência para reconhecer sinais de fraude.'
      ], takeaway: 'Pressa é um sinal para parar, confirmar e procurar a fonte por conta própria.', exercise: { title: 'Classifique o sinal', prompt: 'Um perfil promete dobrar o depósito em 48 horas se você enviar agora. Como agir?', options: ['Enviar uma quantia pequena para testar', 'Não enviar; verificar oferta e responsável em fontes oficiais', 'Pedir ao perfil uma captura de tela de lucro'], answer: 1, note: 'Promessas de ganho alto e rápido sem risco são forte sinal de alerta. Não envie fundos.' } },
      { id: 'm5l2', title: 'Assinaturas, permissões e links', duration: '7 min', content: [
        'Conectar uma carteira a um site pode expor muito além do endereço público. Uma assinatura pode autorizar ações e permissões de contrato inteligente podem deixar um aplicativo movimentar tokens no futuro.',
        'Use favoritos salvos para serviços importantes, verifique o domínio letra por letra e entenda a mensagem de assinatura. Não conecte a carteira principal a páginas encontradas em comentários, anúncios ou mensagens diretas.',
        'Mantenha uma carteira separada para experimentos e revise autorizações que não usa mais com ferramentas oficiais da rede. Revogar uma permissão não recupera fundos já transferidos.'
      ], takeaway: 'Ler uma assinatura e conferir o domínio são parte de cada interação com Web3.', exercise: { title: 'Antes de assinar', prompt: 'A página pede uma assinatura que você não consegue explicar. O que fazer?', options: ['Recusar e entender a solicitação por uma fonte independente', 'Aceitar se o saldo não mudou na tela', 'Desativar o antivírus'], answer: 0, note: 'Não assine instruções que não entende; mensagens podem autorizar operações relevantes.' } },
      { id: 'm5l3', title: 'Sua rotina de segurança e plano de resposta', duration: '7 min', content: [
        'Use senhas únicas em um gerenciador confiável, autenticação em dois fatores por aplicativo ou chave física e atualizações regulares. SMS é vulnerável a troca indevida de chip; use uma alternativa mais forte quando disponível.',
        'Separe dispositivos ou carteiras por função e mantenha cópias de recuperação protegidas de acesso digital. Pratique o processo de recuperação sem expor segredos e confirme instruções nos sites oficiais.',
        'Se suspeitar de comprometimento, pare de assinar, não responda ao invasor, acesse a conta por canal oficial e procure ajuda independente. Registre horários e transações; não pague “taxa de resgate” para quem promete recuperar fundos.'
      ], takeaway: 'Segurança eficaz é uma rotina praticada antes do incidente.', exercise: { title: 'Primeira resposta', prompt: 'Você percebe uma transação que não reconhece. O que vem primeiro?', options: ['Interromper novas assinaturas e acessar o serviço pelo canal oficial', 'Clicar no primeiro anúncio de recuperação', 'Mandar a frase-semente ao suporte'], answer: 0, note: 'Evite novos danos e confirme o canal oficial antes de qualquer ação.' } }
    ],
    quiz: [
      { question: 'Um sinal comum de fraude é:', options: ['Promessa de alto retorno garantido com urgência para pagar', 'Documentação pública com riscos explicados', 'Possibilidade clara de recusar uma oferta'], answer: 0, explanation: 'Urgência e promessa de retorno extraordinário merecem desconfiança.' },
      { question: 'Uma permissão de contrato inteligente pode:', options: ['Autorizar operações conforme o escopo aprovado', 'Garantir que o token nunca caia', 'Reverter qualquer fraude'], answer: 0, explanation: 'Entenda o escopo da autorização e revogue o que não usa.' },
      { question: 'Se um suporte pedir sua frase de recuperação:', options: ['Compartilhe se o perfil for verificado', 'Não compartilhe; acesse o serviço por um canal confirmado por você', 'Envie em uma mensagem temporária'], answer: 1, explanation: 'A frase é um segredo de acesso. Não a envie a terceiros.' }
    ]
  },
  {
    id: 'm6', number: '07', title: 'Explore sem confundir rendimento e segurança', subtitle: 'DeFi, staking, liquidez e o contexto tributário brasileiro.', icon: 'Orbit', color: 'blue', duration: '25 min',
    lessons: [
      { id: 'm6l1', title: 'DeFi: contratos, protocolos e dependências', duration: '8 min', content: [
        'Finanças descentralizadas reúnem protocolos que executam regras financeiras em contratos inteligentes. Uma exchange descentralizada pode trocar tokens por meio de pools; um protocolo de empréstimo pode usar garantias para automatizar crédito.',
        'O código pode ser público sem ser seguro. Bugs, chaves administrativas, oráculos, pontes entre redes, liquidez baixa e incentivos temporários criam riscos distintos. Auditoria reduz algumas incertezas, mas não certifica que perdas não ocorrerão.',
        'Antes de interagir, descubra qual contrato recebe seus ativos, como encerrar a posição, que permissões está concedendo e quais dependências podem falhar. Comece estudando o fluxo em uma rede de testes.'
      ], takeaway: '“Sem intermediário” transfere mais operações e riscos para o usuário.', exercise: { title: 'Encontre a dependência', prompt: 'Um protocolo usa um preço externo para liquidar posições. Qual componente também merece análise?', options: ['O oráculo e suas fontes de preço', 'A cor da página', 'O número de curtidas da equipe'], answer: 0, note: 'Dados externos são uma dependência técnica e podem falhar ou ser manipulados.' } },
      { id: 'm6l2', title: 'Staking, empréstimos e provisão de liquidez', duration: '8 min', content: [
        'Staking ajuda certas redes a validar blocos; suas regras podem incluir período de saída, variação da recompensa e penalidade por comportamento inválido do validador. Um serviço custodial de staking acrescenta risco de contraparte.',
        'Emprestar tokens, fornecer liquidez e fazer yield farming são atividades diferentes. Liquidez em pools pode sofrer perda impermanente e exposição a ativos com preços que mudam em ritmos diferentes. Recompensas altas podem refletir risco, emissão inflacionária ou incentivos temporários.',
        'Compare retorno anunciado com origem das recompensas, riscos de contrato, custos de saída, liquidez e cenário de perda. Não confunda taxa exibida com resultado líquido nem anualize um período curto como se fosse garantido.'
      ], takeaway: 'Toda recompensa tem origem e condições. Descubra ambas antes de avaliar o número.', exercise: { title: 'Leia a recompensa', prompt: 'Um protocolo anuncia 80% ao ano em tokens recém-emitidos. O que investigar?', options: ['De onde vem a recompensa e qual diluição, liquidez e risco de contrato existem', 'Somente quantas pessoas estão divulgando', 'Quanto tempo falta para entrar'], answer: 0, note: 'A taxa pode não ser sustentável e pode ser superada por perdas ou queda do token.' } },
      { id: 'm6l3', title: 'Registros e impostos no Brasil', duration: '9 min', content: [
        'A forma de declarar ou tributar ativos virtuais depende do tipo de operação, da localização da custodiante, das normas vigentes e da situação de cada pessoa. Uma transação pode gerar obrigações distintas de manter um saldo parado.',
        'Guarde extratos, comprovantes, datas, valores em reais, taxas, endereços e a identificação da plataforma. Registros organizados ajudam a reconstruir o custo de aquisição e a explicar movimentações entre carteiras próprias.',
        'As regras brasileiras mudam. Consulte as páginas de criptoativos e a DeCripto da Receita Federal na data da operação; procure um contador para análise do seu caso. Esta aula organiza perguntas e registros, não substitui orientação tributária.'
      ], takeaway: 'Registre cada operação e confirme a regra oficial vigente antes de declarar.', exercise: { title: 'Prepare seus registros', prompt: 'Qual conjunto é mais útil para reconstruir uma operação?', options: ['Data, ativo, quantidade, custo em reais, taxa e comprovante', 'Apenas o preço lembrado no fim do ano', 'Uma captura de tela do saldo atual'], answer: 0, note: 'O histórico detalhado e os comprovantes ajudam a explicar compras, vendas e transferências.' } }
    ],
    quiz: [
      { question: 'Uma auditoria de contrato inteligente:', options: ['Ajuda a identificar problemas, mas não elimina todos os riscos', 'Garante que não haverá perdas', 'Substitui a pesquisa sobre liquidez e custódia'], answer: 0, explanation: 'Auditorias têm escopo e data; novas versões e outros componentes também importam.' },
      { question: 'Uma recompensa de staking ou DeFi deve ser avaliada junto com:', options: ['Origem, custos, bloqueios, riscos técnicos e liquidez', 'Somente o percentual anunciado', 'O número de emojis no aplicativo'], answer: 0, explanation: 'Retorno isolado não mostra perdas possíveis nem sustentabilidade.' },
      { question: 'Para impostos sobre criptoativos no Brasil, o curso recomenda:', options: ['Usar sempre uma regra antiga da internet', 'Consultar a orientação oficial vigente e um profissional para seu caso', 'Não guardar comprovantes'], answer: 1, explanation: 'Normas podem mudar e o tratamento depende dos fatos e das regras em vigor.' }
    ]
  },
  {
    id: 'm9', number: '08', title: 'Futuros: long, short e padrões', subtitle: 'Derivativos, margem e leitura de mercado — nível avançado.', icon: 'ChartNoAxesCombined', color: 'amber', duration: '26 min',
    lessons: [
      { id: 'm9l1', title: 'Spot, futuro e posição comprada ou vendida', duration: '9 min', content: [
        'No mercado à vista, uma compra pode resultar em saldo do ativo, sujeito à custódia usada. Um contrato futuro cria exposição às variações de preço segundo especificações próprias; ele não significa necessariamente receber Bitcoin. Na B3, por exemplo, contratos futuros de Bitcoin têm liquidação financeira. Contratos e regras variam por mercado.',
        'Long (posição comprada) tende a ganhar com a alta do contrato e perder com a queda; short (posição vendida) tende ao contrário. Ambos são exposições: o preço pode se mover na direção oposta, e a perda pode crescer rapidamente. Short não é simplesmente “vender Bitcoin que você tem”.',
        'Margem é garantia de cumprimento, não o preço total da exposição. Alavancagem amplifica a variação sobre o capital comprometido. Ajustes, taxas, margem de manutenção, funding em contratos perpétuos, vencimento e liquidação forçada dependem do produto e da plataforma. Leia a especificação atual antes de sequer simular.'
      ], takeaway: 'Long e short descrevem direção. Margem e alavancagem determinam como pequenas oscilações afetam a conta.', sources: [{ label: 'B3: características técnicas do futuro de Bitcoin em reais', url: 'https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/criptoativos/futuro-de-bitcoin-em-reais.htm' }, { label: 'CFTC: riscos de operar futuros de criptomoedas com margem', url: 'https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/understand_risks_of_virtual_currency.html' }], exercise: { title: 'Interprete a posição', prompt: 'Uma posição short está aberta e o preço do contrato sobe. Qual leitura é correta?', options: ['A posição tende a perder, antes de custos e regras específicas', 'A posição ganha porque o ativo ficou mais caro', 'O efeito é sempre zero até a liquidação'], answer: 0, note: 'O resultado depende do tamanho, contrato, preço de entrada, ajustes e custos. A direção sozinha não calcula o risco total.' } },
      { id: 'm9l2', title: 'Tendência, suporte, resistência e rompimentos', duration: '8 min', content: [
        'Padrões de mercado são formas de resumir o que ocorreu em um gráfico, não garantias sobre o que ocorrerá. Uma tendência de alta costuma ser descrita por máximas e mínimas ascendentes; em uma tendência de baixa, por máximas e mínimas descendentes. Em consolidação, preço oscila numa faixa observada.',
        'Suporte e resistência são zonas aproximadas onde o preço encontrou oferta ou procura no passado. Um rompimento pode continuar, falhar ou voltar à faixa. Volume, volatilidade, liquidez, período analisado e notícias mudam a leitura; nenhuma linha prevê o próximo movimento.',
        'Ao estudar um gráfico, escreva a hipótese e um cenário que a invalidaria. Compare períodos diferentes, identifique o que já se sabe depois do fato e teste a ideia em dados históricos sem escolher exemplos só porque funcionaram. Um padrão isolado não é recomendação de entrada.'
      ], takeaway: 'Leia padrões como hipóteses sobre dados passados; não como sinais certos de compra ou venda.', exercise: { title: 'Evite a certeza retrospectiva', prompt: 'O preço rompeu uma resistência e depois recuou. O que essa observação permite concluir?', options: ['O rompimento falhou naquele trecho; um evento não prova regra futura', 'Todo próximo rompimento também falhará', 'O gráfico garante uma reversão para baixo'], answer: 0, note: 'Registre contexto, período e critérios antes de avaliar padrões. Um exemplo isolado não estima probabilidade.' } },
      { id: 'm9l3', title: 'Simulador de exposição e liquidação', duration: '9 min', content: [
        'Este laboratório usa valor nocional e movimento hipotético para mostrar como a direção e a alavancagem mudam o resultado aritmético. Ele não usa preços atuais, não estima chance de liquidação e não reproduz as regras de uma exchange ou contrato.',
        'O resultado simplificado é nocional × variação do preço × direção. A margem inicial é aproximada por nocional ÷ alavancagem. Custos, funding, ajustes, margem de manutenção, slippage, gaps e regras de liquidação podem mudar muito o resultado real — e uma posição pode ser encerrada antes que o cenário selecionado aconteça.',
        'Use a simulação para perguntar “quanto posso perder?” antes de perguntar “quanto posso ganhar?”. Futuros são instrumentos complexos e não são necessários para aprender sobre Bitcoin ou concluir esta trilha.'
      ], takeaway: 'Simulação de alavancagem ensina escala de risco; não encontra entrada nem sugere operar.', sources: [{ label: 'B3: especificações atuais do futuro de Bitcoin', url: 'https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/criptoativos/futuro-de-bitcoin-em-reais.htm' }, { label: 'CFTC: alavancagem pode ampliar perdas e exigir mais margem', url: 'https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/understand_risks_of_virtual_currency.html' }], exercise: { title: 'Leia a escala', prompt: 'Em uma exposição nocional hipotética de R$ 1.000, o preço se move 5% contra uma posição. O que a alavancagem altera primeiro?', options: ['O valor nocional exposto em relação à margem e a perda como proporção dela', 'A direção do movimento de preço', 'A certeza de lucro na operação seguinte'], answer: 0, note: 'Alavancagem não muda a variação do subjacente; muda a relação entre exposição, margem e resultado na conta.' } }
    ],
    quiz: [
      { question: 'Uma posição long em futuro normalmente se beneficia quando:', options: ['O preço do contrato sobe, antes de custos e regras específicas', 'O preço do contrato cai', 'A margem inicial desaparece'], answer: 0, explanation: 'Long é a direção comprada. O resultado final ainda depende do contrato, tamanho e custos.' },
      { question: 'Um nível de suporte no gráfico:', options: ['É uma zona observada no passado, não uma garantia futura', 'Impede o preço de cair', 'É sempre o preço justo do ativo'], answer: 0, explanation: 'Níveis técnicos são interpretações históricas e podem falhar.' },
      { question: 'O que a margem de um futuro representa?', options: ['Garantia vinculada à exposição; não é o custo total nem a perda máxima', 'O preço integral do Bitcoin', 'Uma proteção que impede liquidação'], answer: 0, explanation: 'Exigências de margem e liquidação dependem das regras do produto; perdas podem exceder o valor inicialmente depositado.' }
    ]
  },
  {
    id: 'm7', number: '09', title: 'Transforme estudo em processo', subtitle: 'Psicologia, política pessoal e próximos 30 dias.', icon: 'Compass', color: 'lilac', duration: '18 min',
    lessons: [
      { id: 'm7l1', title: 'Decida fora do ruído', duration: '6 min', content: [
        'Euforia pode levar a comprar depois de uma alta; medo pode levar a vender no pior momento para seus objetivos. Alertas, redes sociais e gráficos em tempo real aumentam a pressão por uma decisão imediata.',
        'Crie uma pausa operacional: escreva a tese, a perda possível, o tamanho e o que mudou. Espere até conseguir explicar a decisão sem depender de uma manchete ou de um influenciador.',
        'Um diário de decisões registra expectativa, evidências e resultado. Ele ajuda a distinguir uma decisão coerente com as informações disponíveis de uma decisão que apenas terminou bem ou mal.'
      ], takeaway: 'Avalie a qualidade do processo, não apenas o resultado de uma operação.', exercise: { title: 'Pausa de decisão', prompt: 'O ativo disparou e você sente que está ficando para trás. Qual é a pausa mais útil?', options: ['Rever tese, tamanho e evidências antes de decidir', 'Comprar qualquer quantia imediatamente', 'Ignorar o orçamento porque a tendência está clara'], answer: 0, note: 'A pausa não prevê o preço; ela impede que urgência substitua seu próprio critério.' } },
      { id: 'm7l2', title: 'Escreva sua política pessoal', duration: '6 min', content: [
        'Uma política pessoal pode caber em uma página. Inclua seu objetivo de aprendizagem, horizonte, dinheiro que não será comprometido, limites de exposição, custódia, frequência de revisão e condições para interromper uma operação.',
        'Registre o que você ainda não sabe. Decida que fontes consulta, como guarda comprovantes e qual sinal faria a tese perder validade. Regras são úteis quando conseguem ser lembradas sob pressão.',
        'Revise a política com eventos da vida e fatos relevantes, não por causa de todo movimento diário. Se não conseguir cumprir as regras escritas, ajuste o tamanho e a complexidade.'
      ], takeaway: 'Um plano pessoal começa com limites e perguntas, não com uma lista de moedas.', exercise: { title: 'Complete uma regra', prompt: 'Qual frase forma um limite verificável?', options: ['“Vou investir o que for preciso.”', '“Não uso dinheiro de contas ou reserva; reviso a tese no primeiro domingo do mês.”', '“Vendo quando achar que está caro.”'], answer: 1, note: 'Uma regra clara descreve o que fazer e quando revisar.' } },
      { id: 'm7l3', title: 'Seu roteiro de 30 dias', duration: '6 min', content: [
        'Na primeira semana, revise segurança e faça seu orçamento de estudo. Na segunda, compare duas teses usando as mesmas perguntas. Na terceira, pratique uma transferência em ambiente de teste ou com simulação. Na quarta, reveja o que aprendeu e atualize sua política.',
        'Não precisa abrir conta, comprar um ativo ou entrar em DeFi para concluir o curso. O próximo passo pode ser estudar mais, conversar com um profissional ou decidir que o risco não combina com seus objetivos.',
        'Parabéns por concluir a trilha. Seu certificado registra participação no curso; não atesta rentabilidade, habilitação profissional ou domínio completo do mercado.'
      ], takeaway: 'Estudar com método também significa reconhecer quando não agir.', exercise: { title: 'Escolha seu próximo passo', prompt: 'Qual sequência representa melhor uma continuação responsável?', options: ['Revisar orçamento, segurança e evidências antes de tomar qualquer decisão', 'Comprar o ativo mais comentado no dia', 'Prometer retorno a outras pessoas'], answer: 0, note: 'O curso é educativo. Cada pessoa deve considerar seu contexto e os riscos.' } }
    ],
    quiz: [
      { question: 'Um diário de decisões ajuda a:', options: ['Separar processo, evidências e resultado', 'Garantir que todas as escolhas serão lucrativas', 'Descobrir sinais secretos no gráfico'], answer: 0, explanation: 'O diário melhora a revisão e ajuda a perceber vieses.' },
      { question: 'Um bom plano pessoal começa por:', options: ['Limites, horizonte e critérios de revisão', 'Uma lista de tokens populares', 'Uma meta fixa de lucro mensal'], answer: 0, explanation: 'Objetivos e limites dão contexto para qualquer escolha posterior.' },
      { question: 'O certificado do curso:', options: ['Comprova lucro futuro', 'Registra conclusão das aulas, sem garantir resultado financeiro', 'Substitui formação profissional'], answer: 1, explanation: 'É um registro de participação e conclusão educativa.' }
    ]
  }
]

export const findLesson = (moduleId: string, lessonId: string) =>
  modules.find((item) => item.id === moduleId)?.lessons.find((lesson) => lesson.id === lessonId)

export const allLessons = modules.flatMap((item) => item.lessons.map((lesson) => ({ ...lesson, moduleId: item.id, moduleTitle: item.title })))
