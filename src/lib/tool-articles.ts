export type ToolArticle = {
  slug: string
  title: string
  description: string
  toolSlug: string
  readingMinutes: number
  sections: Array<{ heading: string; paragraphs: string[]; example?: string }>
  sources: Array<{ label: string; url: string }>
}

const positionSource = {
  label: 'CME Group — tamanho da posição e distância do stop',
  url: 'https://www.cmegroup.com/education/courses/trade-and-risk-management/proper-position-size',
}
const stopSource = {
  label: 'FINRA — gatilho, execução e limites das ordens stop (mercado de ações)',
  url: 'https://www.finra.org/investors/insights/stop-orders-factors-consider-during-volatile-markets',
}
const marginSource = {
  label: 'CME Group — margem inicial e margem de manutenção',
  url: 'https://www.cmegroup.com/education/courses/introduction-to-futures/margin-know-what-is-needed',
}
const cryptoRiskSource = {
  label: 'CFTC — riscos de moedas virtuais e contratos alavancados',
  url: 'https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/understand_risks_of_virtual_currency.html',
}

export const toolArticles: ToolArticle[] = [
  {
    slug: 'rwa-tokenizacao-ativos-reais',
    title: 'Tokenização de ativos reais: o que o token representa?',
    description: 'Entenda a diferença entre registrar um token e possuir direitos sobre o ativo, além de custódia e liquidez.',
    toolSlug: 'risco-stop', readingMinutes: 5,
    sections: [
      { heading: 'Tokenização cria uma representação digital', paragraphs: [
        'Tokenização representa direitos ou instrumentos em um registro digital, como uma blockchain. O token representa um ativo financeiro ou real somente na medida em que contratos, registros e leis aplicáveis reconhecem essa ligação. Possuir o token não significa automaticamente ser proprietário direto de imóvel, título ou participação.',
        'O FMI descreve instrumentos tradicionais, como depósitos e cotas de fundos, representados em registros digitais. A tecnologia pode alterar emissão e liquidação, mas não elimina custódia, validade jurídica, governança e riscos operacionais.'
      ]},
      { heading: 'Quais direitos acompanham o token?', paragraphs: [
        'Identifique emissor, entidade que mantém o ativo, documento que estabelece direitos e forma de resolver disputas. Procure regras de transferência e resgate, restrições geográficas, prioridade em insolvência, custos e registros que confirmem a relação com o ativo.',
        'Um explorador pode mostrar que tokens existem e foram transferidos, mas não confirma sozinho a validade de registros fora da blockchain. Documentos legais e registros reconhecidos têm papel próprio.'
      ]},
      { heading: 'A infraestrutura pode continuar dependendo de intermediários', paragraphs: [
        'Uma oferta pode depender de custodiante, administrador, emissor, provedor de identidade, operador de rede ou serviço de dados. Automatizar uma etapa de liquidação não garante mercado secundário profundo nem resgate imediato.',
        'Relatórios do FMI e BIS discutem potenciais eficiências e riscos da tokenização. São análises institucionais, não endosso a um produto. Confira data, escopo e jurisdição antes de aplicar uma conclusão.'
      ]},
      { heading: 'Riscos de mercado, liquidez e tecnologia', paragraphs: [
        'O token pode negociar longe do valor de referência ou em mercado restrito. Também há riscos de contrato, oráculo, chave administrativa, bridge ou sistema de identidade. Divergência entre registros on-chain e externos pode gerar conciliação e disputas.',
        'Leia como atualizações são autorizadas, como se responde à perda de chave e qual sistema mantém registros e pagamentos. Código verificado ou auditoria técnica não substituem análise de direitos e contraparte.'
      ]},
      { heading: 'Roteiro para separar narrativa e direito', paragraphs: [
        'Resuma qual direito é oferecido. Identifique emissor, custodiante, documento vinculante, jurisdição, resgate, restrições e riscos tecnológicos. Compare a divulgação com documentos oficiais; não preencha lacunas com suposições.',
        'O enquadramento regulatório depende do produto e da jurisdição. Este artigo explica conceitos e não avalia ofertas nem recomenda investimentos.'
      ]}
    ],
    sources: [
      { label: 'FMI — Global Financial Stability Report, outubro de 2025', url: 'https://www.imf.org/en/publications/gfsr/issues/2025/10/14/global-financial-stability-report-october-2025' },
      { label: 'BIS — stablecoins e preços de ativos seguros', url: 'https://www.bis.org/publ/work1270.htm' },
      { label: 'CFTC — FAQ sobre ativos tokenizados como colateral', url: 'https://www.cftc.gov/PressRoom/PressReleases/9200-26' }
    ]
  },
  {
    slug: 'ordem-mercado-limite-slippage',
    title: 'Ordem a mercado, ordem limite e slippage em cripto',
    description: 'Veja como tipo de ordem, spread e profundidade afetam execução e por que preço exibido pode não ser o final.',
    toolSlug: 'long-short', readingMinutes: 5,
    sections: [
      { heading: 'Cotação não garante execução', paragraphs: [
        'Num livro de ofertas, compradores indicam preços de compra e vendedores preços de venda. Melhor bid e ask formam o spread visível. Última negociação, índice e mark price podem ter definições distintas; uma tela deve informar qual mostra.',
        'Uma ordem grande pode consumir várias ofertas e executar em preços diferentes. O resultado depende de profundidade, velocidade e regras da plataforma. A liquidez varia entre pares, exchanges e horários.'
      ]},
      { heading: 'Ordem a mercado prioriza execução', paragraphs: [
        'Uma ordem a mercado aceita os preços disponíveis para tentar executar rapidamente; não fixa o preço final. Em mercado rápido ou raso, slippage pode ser relevante. A execução também pode ser parcial conforme as regras.',
        'A FINRA explica, no contexto de ações, que stops podem acionar ordem a mercado cujo preço difere do gatilho. Exchanges cripto implementam seus tipos de ordem segundo regras próprias.'
      ]},
      { heading: 'Ordem limite prioriza o preço', paragraphs: [
        'Uma ordem limite compra no preço limite ou abaixo, ou vende no limite ou acima. Pode não executar, ser parcial ou esperar enquanto o mercado se afasta. O limite controla o preço da ordem, mas não garante preenchimento.',
        'Opções como post-only, reduce-only ou tempo em vigor mudam comportamento em alguns produtos. Em swaps, tolerância de slippage não é necessariamente igual a uma ordem limite tradicional.'
      ]},
      { heading: 'Spread e profundidade ajudam a estimar impacto', paragraphs: [
        'Observe spread e quantidade disponível em vários níveis do livro. Uma ordem maior que o primeiro nível pode atravessar os seguintes. Profundidade visível pode mudar antes da execução e não inclui necessariamente liquidez de outros locais.',
        'Volume diário alto sozinho não comprova execução barata para sua ordem. Considere taxas, liquidez acessível, funding e congestionamento, conforme o produto.'
      ]},
      { heading: 'Planeje cenários e confira as regras', paragraphs: [
        'Compare preço esperado, pior preço plausível, custos e possibilidade de não execução. Para stops, separe disparo, ordem enviada e preço executado. Em swaps, leia impacto estimado antes de assinar.',
        'Calculadoras educativas não garantem preço de saída. O simulador de posição usa os preços inseridos, mas não substitui livro ao vivo nem regras do contrato.'
      ]}
    ],
    sources: [
      { label: 'CME Group — guia de liquidez em futuros', url: 'https://www.cmegroup.com/content/dam/cmegroup/education/files/a-traders-guide-to-futures.pdf' },
      { label: 'FINRA — ordens stop em mercados voláteis (ações)', url: 'https://www.finra.org/investors/insights/stop-orders-factors-consider-during-volatile-markets' }
    ]
  },
  {
    slug: 'memecoin-liquidez-concentracao-riscos',
    title: 'Memecoins: liquidez, concentração e riscos para analisar',
    description: 'Um roteiro para investigar tokens, liquidez e permissões sem tratar indicadores como selo de segurança.',
    toolSlug: 'risco-stop', readingMinutes: 6,
    sections: [
      { heading: 'Preço unitário baixo não significa projeto barato', paragraphs: [
        'Uma moeda que custa frações de centavo não é automaticamente barata. Preço depende da oferta em circulação. Capitalização estimada multiplica preço pela oferta escolhida, mas oferta circulante, total e máxima podem divergir ou ser difíceis de verificar. Em tokens novos, preço e capitalização podem vir de um mercado pequeno.',
        'Confira metodologia e oferta em documentação ou explorador da rede. Capitalização diluída também não mede liquidez disponível para vender nem valor que todos os titulares conseguiriam realizar.'
      ]},
      { heading: 'Volume não é o mesmo que liquidez', paragraphs: [
        'Em livro de ofertas, spread e profundidade ajudam a estimar impacto. Em pool descentralizado, uma troca depende da liquidez disponível e da fórmula; ordens maiores alteram mais a cotação. Volume passado não garante compradores futuros.',
        'Considere slippage, taxas de rede, concentração e quem controla posições de liquidez. Entenda se ela pode ser retirada e por quem. Imagens de “liquidez travada” sem fonte verificável não bastam.'
      ]},
      { heading: 'Distribuição e controles do token', paragraphs: [
        'Investigue concentração de carteiras e cronograma de desbloqueios, distinguindo equipe, pools e custódia quando possível. Exploradores mostram atividade pública, mas identidade e intenção de uma carteira podem ser incertas.',
        'Padrões e redes podem oferecer emissão, congelamento, pausa ou delegação administrativa. Solana Token-2022, por exemplo, tem extensões opcionais; isso não se aplica automaticamente a todo token ou blockchain. Leia as permissões do contrato específico.'
      ]},
      { heading: 'Verificação e auditoria não são garantia', paragraphs: [
        'Código verificado facilita comparar fonte publicada com bytecode em certas redes, mas não prova segurança, confiança da equipe ou liquidez. Auditorias têm escopo, versão e data; alterações posteriores podem mudar o risco.',
        'Contratos, oráculos e bridges introduzem dependências e possíveis falhas. Ferramentas automáticas erram para os dois lados. Trate resultados como pistas de investigação, não certificado.'
      ]},
      { heading: 'Checklist sem promessa de segurança', paragraphs: [
        'Registre endereço e rede oficiais, oferta, concentração e desbloqueios, liquidez e mercado, permissões administrativas, código e auditoria, bridges e oráculos, documentação e cenário de perda total. Não conecte carteira a uma página suspeita para “reivindicar” tokens.',
        'O checklist organiza perguntas, mas não elimina fraude ou perda. Memecoins podem ter volatilidade extrema e dados incompletos. Use a calculadora de risco para um cenário hipotético; pontuação automática não é autorização para comprar.'
      ]}
    ],
    sources: [
      { label: 'Solana — extensões opcionais Token-2022', url: 'https://solana.com/docs/tokens/extensions' },
      { label: 'Ethereum.org — segurança de smart contracts', url: 'https://ethereum.org/developers/docs/smart-contracts/security/' },
      { label: 'Ethereum.org — riscos de bridges', url: 'https://ethereum.org/developers/docs/bridges/' },
      { label: 'Investor.gov — riscos de ofertas cripto', url: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-16' }
    ]
  },
  {
    slug: 'defi-riscos-smart-contract-bridge-oraculo',
    title: 'DeFi: smart contracts, bridges e oráculos explicados',
    description: 'Conheça componentes que podem falhar em protocolos DeFi e faça perguntas antes de conectar uma carteira.',
    toolSlug: 'risco-stop', readingMinutes: 6,
    sections: [
      { heading: 'O que uma aplicação descentralizada automatiza', paragraphs: [
        'Protocolos DeFi combinam contratos em blockchain, interfaces, ativos, liquidações e às vezes serviços externos. O usuário assina transações. “Descentralizado” não significa ausência de operadores, chaves privilegiadas, dependências ou pontos de falha.',
        'Entenda qual contrato recebe ativos, quem pode alterar parâmetros, como o código é atualizado e quais condições permitem pausar operações.'
      ]},
      { heading: 'Contratos executam regras e podem conter falhas', paragraphs: [
        'Bugs, integrações incorretas e permissões mal configuradas podem produzir resultados inesperados. Código imutável dificulta correções; contratos atualizáveis introduzem risco de quem controla a atualização. Código publicado facilita revisão, mas não prova que foi auditado ou está correto.',
        'Uma auditoria vale para escopo, versão e data específicos. Verifique endereço, rede e mudanças posteriores. “Auditado” sozinho não é um selo universal.'
      ]},
      { heading: 'Oráculos conectam dados externos', paragraphs: [
        'Contratos não buscam por conta própria qualquer informação fora da cadeia. Oráculos fornecem dados como preços; a segurança depende da origem, atualização, disponibilidade e modelo de confiança. Dados errados ou atrasados podem levar a empréstimos ou liquidações inadequados.',
        'Pergunte quantas fontes entram no preço, limites de movimento, atraso e resposta a falhas. Uma rede descentralizada de oráculos reduz algumas dependências, mas não torna qualquer dado infalível.'
      ]},
      { heading: 'Bridges adicionam novas dependências', paragraphs: [
        'Uma bridge pode bloquear, queimar, emitir ou liberar representações entre redes. O ativo recebido pode depender de contratos, validadores, multisig, custodiantes ou relayers. Um token wrapped traz risco do mecanismo que afirma lastreá-lo.',
        'Confirme rota e ativo oficiais, quem valida mensagens, como fundos são protegidos e o processo em caso de falha. Não escolha uma bridge apenas pela taxa exibida.'
      ]},
      { heading: 'Revise antes de assinar', paragraphs: [
        'Confira domínio, rede, contrato, token, valor, permissões e ação solicitada. Teste quantia pequena quando apropriado. Não compartilhe chave ou frase-semente com suporte, analistas ou serviços de recuperação.',
        'Considere perda de paridade, liquidação, congestionamento, governança, exploit e indisponibilidade da interface. Este checklist organiza questões; não audita um protocolo nem prevê retorno.'
      ]}
    ],
    sources: [
      { label: 'Ethereum.org — segurança de smart contracts', url: 'https://ethereum.org/developers/docs/smart-contracts/security/' },
      { label: 'Ethereum.org — oráculos', url: 'https://ethereum.org/developers/docs/oracles/' },
      { label: 'Ethereum.org — bridges e riscos', url: 'https://ethereum.org/developers/docs/bridges/' }
    ]
  },
  {
    slug: 'stablecoins-como-funcionam-riscos',
    title: 'Stablecoins: como funcionam e quais são os riscos',
    description: 'Entenda lastro, resgate, perda de paridade e por que um dólar digital não significa risco zero.',
    toolSlug: 'risco-stop', readingMinutes: 6,
    sections: [
      { heading: 'O que uma stablecoin tenta manter estável', paragraphs: [
        'Stablecoin é um criptoativo projetado para acompanhar uma referência, frequentemente uma moeda como o dólar. Esse objetivo não garante paridade permanente. Há modelos com reservas, criptoativos como garantia, mecanismos algorítmicos ou combinações, cada um com riscos diferentes.',
        'Identifique emissor ou protocolo, ativo de referência, rede, mecanismo de emissão e resgate, direitos do titular e onde há liquidez. Um ticker parecido em outra rede pode ser um ativo diferente ou uma representação sem relação com o emissor conhecido.'
      ]},
      { heading: 'Reservas e direito de resgate importam', paragraphs: [
        'Em modelos lastreados por reservas, confiança depende da composição, custódia, liquidez e disponibilidade dos ativos, além das regras de resgate. O FMI discute conexões entre stablecoins, ativos líquidos e mercados financeiros; isso não significa que todas tenham o mesmo lastro ou que qualquer usuário possa resgatar diretamente.',
        'Leia relatórios e termos: quem pode resgatar, mínimos, prazos, jurisdição e eventos que suspendem o serviço. Atestados têm escopo e data; não respondem automaticamente a questões de passivos, segregação e operação.'
      ]},
      { heading: 'A paridade pode falhar', paragraphs: [
        'Em momentos de estresse, a cotação pode se afastar da referência. Dúvidas sobre reservas, interrupção de resgates, congestionamento, liquidez concentrada ou falha algorítmica são fatores possíveis. Uma cotação exibida não garante conversão de qualquer quantidade naquele valor.',
        'O preço varia por rede, exchange e par. Confirme o contrato selecionado. Se uma aplicação usa stablecoin como garantia, entenda o que acontece com empréstimos e liquidações se a cotação cair.'
      ]},
      { heading: 'Custódia, rede e contrato também têm riscos', paragraphs: [
        'Mesmo mantendo paridade, existem riscos de custódia, bloqueio, perda de chave, falha de contrato, ponte entre redes, endereço incorreto e interrupção de serviços. Autocustódia e custódia de terceiros distribuem responsabilidades de formas diferentes.',
        'Confirme a rede e o endereço antes de transferir. Ao conectar uma carteira, leia permissões. Nunca forneça frase-semente ou chave privada. Uma stablecoin não elimina phishing nem garante a recuperação de transferência incorreta.'
      ]},
      { heading: 'Checklist antes de manter saldo', paragraphs: [
        'Confirme ticker e contrato em fonte oficial, mecanismo de paridade, data das informações sobre reservas, regras reais de resgate, rede, liquidez, custodiante ou contrato envolvido e controles que podem restringir transferências. Proteção e regulação variam por país, entidade e produto; não aplique automaticamente orientação dos Estados Unidos ao Brasil.',
        'O uso em liquidação de operações cripto não torna uma stablecoin equivalente a depósito bancário ou dinheiro garantido. Este guia explica conceitos e não recomenda ativos.'
      ]}
    ],
    sources: [
      { label: 'FMI — Global Financial Stability Report, outubro de 2025', url: 'https://www.imf.org/en/publications/gfsr/issues/2025/10/14/global-financial-stability-report-october-2025' },
      { label: 'FMI — stablecoins e finanças globais', url: 'https://www.imf.org/en/blogs/articles/2025/12/04/how-stablecoins-can-improve-payments-and-global-finance' },
      { label: 'SEC Investor.gov — fundamentos de custódia de criptoativos', url: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/crypto-asset-custody-basics-retail-investors-investor-bulletin-0' }
    ]
  },
  {
    slug: 'custodia-cripto-carteira-corretora',
    title: 'Como guardar cripto: carteira própria ou corretora?',
    description: 'Compare autocustódia e custódia de terceiros, entenda chaves privadas e crie uma rotina básica de proteção.',
    toolSlug: 'risco-stop', readingMinutes: 5,
    sections: [
      { heading: 'Carteiras gerenciam chaves', paragraphs: [
        'Uma carteira permite gerenciar chaves que autorizam movimentações registradas na blockchain. O saldo pertence ao estado da rede; o aplicativo ou dispositivo mantém credenciais e prepara assinaturas. Perder o aparelho pode ser diferente de perder a frase de recuperação, mas revelar essa frase pode entregar o controle dos ativos.',
        'A SEC explica que carteiras guardam chaves privadas, não criptoativos dentro do aparelho. Endereço público permite receber; chave privada autoriza transações. Nunca publique nem envie chave ou frase-semente.'
      ]},
      { heading: 'Autocustódia versus custódia de terceiros', paragraphs: [
        'Na autocustódia, você controla as chaves e assume backup, acesso e segurança. Isso reduz dependência de uma corretora, mas erros ou perda da frase podem tornar fundos inacessíveis. Carteiras conectadas à internet são convenientes e mais expostas a ameaças digitais.',
        'Com custódia de terceiros, uma corretora ou prestador controla as chaves operacionais. É importante entender solvência, acesso, termos, taxas, segurança e procedimentos em caso de falha. Pesquise se o provedor usa os ativos como garantia ou os mantém segregados.'
      ]},
      { heading: 'Proteja frase de recuperação e conta', paragraphs: [
        'Guarde a frase conforme instruções oficiais do dispositivo, protegida de acesso indevido e danos físicos. Fotos, nuvem, chats e arquivos podem criar cópias expostas. A solução adequada depende do modelo de ameaça e do suporte da carteira.',
        'Desconfie de suporte que pede frase-semente. Golpistas usam falsos airdrops, anúncios e páginas de atendimento. Confirme o domínio por canal confiável e não assine uma transação que não entende.'
      ]},
      { heading: 'Teste a transferência e confira a rede', paragraphs: [
        'Confirme endereço, rede e ativo antes de enviar. Ativos com o mesmo nome podem ter contratos distintos; selecionar uma rede incompatível pode causar perda ou recuperação complexa. Quando apropriado, faça uma transferência pequena de teste e confira o recebimento.',
        'Ative autenticação multifator, proteja e-mail e telefone, use senhas únicas e mantenha software atualizado. Senha forte não elimina engenharia social ou sessão comprometida.'
      ]},
      { heading: 'Escolha conforme responsabilidades que pode cumprir', paragraphs: [
        'Compare conveniência, controle, contraparte, recuperação, custos e procedimento de emergência. Nenhuma opção remove todos os riscos. Para valores relevantes, leia a documentação e teste a restauração sem revelar segredos.',
        'A plataforma educacional nunca precisa da sua chave ou frase. Este material não recomenda carteira nem custodiante específico.'
      ]}
    ],
    sources: [
      { label: 'SEC Investor.gov — Crypto Asset Custody Basics', url: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/crypto-asset-custody-basics-retail-investors-investor-bulletin-0' },
      { label: 'Ethereum.org — segurança de smart contracts', url: 'https://ethereum.org/developers/docs/smart-contracts/security/' }
    ]
  },
  {
    slug: 'como-ler-o-mercado-cripto-hoje',
    title: 'Como ler o mercado cripto hoje: preço, liquidez e contexto',
    description: 'Um roteiro para interpretar o mercado sem depender de um indicador isolado nem confundir dados com previsões.',
    toolSlug: 'long-short', readingMinutes: 6,
    sections: [
      { heading: 'Defina ativo, unidade e período', paragraphs: [
        '“O mercado está subindo?” depende do ativo, da moeda de cotação e do período observado. Bitcoin em reais pode se mover de forma diferente de BTC em dólares por causa do câmbio. Antes de comparar, defina ativo, par, intervalo e se está olhando preço à vista ou contrato futuro. Não misture uma janela de uma hora com uma conclusão sobre ciclos de anos.',
        'Uma fotografia de mercado envelhece rápido. Confira horário, fonte, unidade e atraso do dado. Este guia ensina um método de leitura em vez de congelar uma cotação que deixaria de ser atual. Um painel ao vivo deve identificar a fonte e a hora da última atualização.'
      ]},
      { heading: 'Preço, volume e liquidez medem coisas diferentes', paragraphs: [
        'Preço registra uma negociação ou uma referência definida pela plataforma. Volume soma negócios numa janela. Liquidez descreve a facilidade de executar uma ordem sem deslocar demais o preço. Um mercado pode ter volume agregado alto e pouca profundidade perto da cotação em um par ou exchange específicos.',
        'Observe spread entre melhor compra e venda, profundidade disponível e tamanho da ordem considerada. Slippage é a diferença entre preço esperado e executado. Agregadores podem combinar bolsas, moedas e janelas diferentes; o agregado não garante execução numa plataforma específica.'
      ]},
      { heading: 'Derivativos acrescentam contexto, não uma seta', paragraphs: [
        'Funding em contratos perpétuos é um pagamento periódico entre os lados do contrato conforme suas regras. Open interest contabiliza contratos em aberto; volume conta contratos negociados na janela. Nenhum dos dois informa sozinho se “dinheiro novo está entrando para comprar” ou prevê a direção seguinte.',
        'Taxa, intervalo e parâmetros de funding variam por plataforma e contrato. A documentação da Binance, por exemplo, descreve ajustes e regras específicos do produto. Compare fonte, mercado e horário antes de tirar conclusões, e consulte os termos atuais da exchange.'
      ]},
      { heading: 'Contexto macro e correlação', paragraphs: [
        'Juros, liquidez financeira, câmbio e apetite a risco podem influenciar investidores e coincidir com movimentos em cripto. Correlação observada em um período não prova causalidade, e a relação pode mudar. O FMI discute a conexão crescente entre stablecoins e mercados tradicionais; isso ajuda a formular perguntas, não a prever Bitcoin.',
        'Para estudar um evento, anote o que mudou, quando os mercados reagiram e quais explicações alternativas existem. Compare mais de uma janela. Mercados cripto negociam continuamente, mas a reação a um dado macro não é uniforme nem automática.'
      ]},
      { heading: 'Transforme observação em gestão de risco', paragraphs: [
        'Registre ativo e par, unidade, fonte e horário, período, spot ou derivativo, volume e profundidade, funding e open interest com suas definições, além da hipótese que quer testar. Se provedores divergem, confira se usam bolsas, moedas ou janelas distintas.',
        'Pergunte o que invalidaria a hipótese e quanto o cenário custaria, incluindo taxas e liquidez. O simulador long/short permite explorar cenários hipotéticos; não recomenda uma operação nem estima uma probabilidade de sucesso.'
      ]}
    ],
    sources: [
      { label: 'CME Group — diferença entre volume e open interest', url: 'https://www.cmegroup.com/education/lessons/open-interest' },
      { label: 'Binance Futures — taxas de funding em contratos perpétuos', url: 'https://www.binance.com/en/support/faq/detail/360033525031' },
      { label: 'FMI — Global Financial Stability Report, outubro de 2025', url: 'https://www.imf.org/en/publications/gfsr/issues/2025/10/14/global-financial-stability-report-october-2025' }
    ]
  },
  {
    slug: 'funding-rate-contratos-perpetuos',
    title: 'Funding rate em cripto: o que significa e como ler',
    description: 'Entenda pagamentos em contratos perpétuos, sinais positivos e negativos e por que funding não é rendimento garantido.',
    toolSlug: 'long-short', readingMinutes: 5,
    sections: [
      { heading: 'Por que existe funding', paragraphs: [
        'Um contrato perpétuo não tem vencimento como muitos futuros tradicionais. Plataformas usam funding para aproximar seu preço ao preço de referência do ativo à vista. O pagamento ocorre entre participantes comprados e vendidos conforme taxa e calendário do contrato.',
        'Na documentação da Binance, funding positivo significa pagamento de posições long para short; taxa negativa inverte o fluxo. Essa convenção é específica do produto. Confira regra, índice e próximo horário de liquidação na exchange usada.'
      ]},
      { heading: 'A taxa é uma fotografia, não uma promessa', paragraphs: [
        'A taxa exibida pode ser estimativa para a próxima liquidação ou valor realizado, conforme a tela. Ela varia com o prêmio do contrato e outros parâmetros. Fórmulas, intervalos e limites não são universais entre exchanges nem entre todos os símbolos.',
        'Projetar uma taxa observada por muitos períodos pressupõe que ela permanecerá igual. Essa hipótese pode falhar. Também é preciso considerar valor nominal, frequência, custos de negociação, margem e variação do preço.'
      ]},
      { heading: 'Exemplo didático', paragraphs: [
        'Considere apenas para ilustrar a conta uma posição nominal de 1.000 USDT e funding de 0,01% no próximo período. O valor teórico seria 0,10 USDT. Com taxa positiva, o lado long pagaria ao lado short segundo essa regra. O exemplo não inclui mudanças de posição ou arredondamentos.',
        'Cada produto define quando a posição precisa estar aberta para participar da liquidação. Uma taxa favorável não elimina uma perda de preço que pode ser muito maior que o pagamento recebido.'
      ], example: 'Cálculo simplificado: 1.000 USDT × 0,0001 = 0,10 USDT. Exemplo hipotético, não é taxa atual.' },
      { heading: 'Taxa alta não prevê reversão', paragraphs: [
        'Taxas extremas podem revelar um custo elevado ou desequilíbrio momentâneo, mas não identificam a intenção de cada participante nem quanto a condição vai durar. O preço pode seguir a tendência, reverter ou ficar lateral. Funding caro, por si só, não é sinal de reversão.',
        'Compare taxa estimada e realizada, preço do perpétuo versus índice, open interest, volume e liquidez. Open interest e volume têm definições diferentes e dependem de janela e mercado.'
      ]},
      { heading: 'Custos e margem mudam o resultado', paragraphs: [
        'Funding pode reduzir saldo disponível e afetar margem segundo as regras da plataforma. Com alavancagem, uma oscilação adversa pode consumir margem e levar à liquidação antes de uma hipótese de longo prazo se realizar. O simulador do site não calcula com precisão as regras de cada exchange.',
        'Consulte sempre os parâmetros atuais do contrato. A fonte citada descreve Binance, não todos os mercados. Este artigo é educacional e não recomenda arbitragem ou operação alavancada.'
      ]}
    ],
    sources: [
      { label: 'Binance Futures — introdução às taxas de funding', url: 'https://www.binance.com/en/support/faq/detail/360033525031' },
      { label: 'CME Group — open interest', url: 'https://www.cmegroup.com/education/lessons/open-interest' },
      { label: 'CFTC — riscos de moedas virtuais e contratos alavancados', url: 'https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/understand_risks_of_virtual_currency.html' }
    ]
  },
  {
    slug: 'open-interest-volume-cripto',
    title: 'Open interest e volume em cripto: entenda a diferença',
    description: 'Saiba o que cada métrica de derivativos contabiliza e por que nenhuma indica sozinha a direção do mercado.',
    toolSlug: 'long-short', readingMinutes: 4,
    sections: [
      { heading: 'Volume conta atividade na janela', paragraphs: [
        'Volume de derivativos conta contratos negociados durante um período. O mesmo contrato pode ser negociado várias vezes, então o volume pode crescer sem aumento proporcional no número de posições ainda abertas. Confira janela, unidade e se a tela mostra contratos ou valor nominal.',
        'Provedores podem agregar exchanges e contratos diferentes. Compare ativo, vencimento, unidade e mercados equivalentes. Um valor agregado não mostra necessariamente a profundidade onde sua ordem seria executada.'
      ]},
      { heading: 'Open interest conta contratos que continuam abertos', paragraphs: [
        'Open interest é o total de contratos abertos que ainda não foram compensados ou liquidados. Cada contrato tem parte comprada e vendida, mas é contado uma vez. A CME explica essa distinção para seus futuros.',
        'Aberturas podem aumentar a métrica e encerramentos reduzi-la. Ela não revela identidade, intenção ou qual lado seria “mais forte”. Em cripto, confirme se o dado está em contratos, moeda ou valor equivalente.'
      ]},
      { heading: 'O que as combinações não provam', paragraphs: [
        'Preço subindo com open interest maior indica que mais contratos permanecem abertos durante aquela janela. Não prova que só compradores chegaram: cada contrato tem uma contraparte vendida. Preço caindo com open interest menor tampouco revela quem fechou ou por quê.',
        'Preço, volume, funding e open interest podem descrever eventos passados quando fonte, período e unidades estão claros. Isoladamente, não fornecem próxima direção nem probabilidade de reversão.'
      ]},
      { heading: 'Exemplo hipotético', paragraphs: [
        'Imagine um contrato com 100 posições abertas no início do dia. Entradas e fechamentos mudam o saldo para 120 contratos ao final. O volume pode registrar várias negociações de entrada, saída e troca entre participantes; não é simplesmente o aumento líquido de 20.',
        'Se um painel informa alta de 20% no open interest, confira mercado e unidade comparados. O valor nominal agregado também pode mudar junto com o preço, mesmo que a quantidade não mude na mesma proporção.'
      ], example: 'Os números são inventados para ilustrar a diferença entre estoque de contratos abertos e fluxo de negociações.' },
      { heading: 'Use métricas para fazer perguntas melhores', paragraphs: [
        'Pergunte qual mercado e intervalo entram no cálculo, se a métrica é quantidade ou valor e se houve mudança de metodologia. O preço é spot, índice, mark price ou perpétuo? Qual funding e profundidade existem? Anotar isso evita comparar séries diferentes com nomes parecidos.',
        'O simulador long/short ajuda a visualizar cenários de preço. Ele não usa open interest e não converte leitura de painel em recomendação.'
      ]}
    ],
    sources: [
      { label: 'CME Group — open interest e volume', url: 'https://www.cmegroup.com/education/lessons/open-interest' },
      { label: 'CME Group — definições de volume e open interest', url: 'https://www.cmegroup.com/trading/about-volume.html' }
    ]
  },
  {
    slug: 'como-calcular-stop-loss-bitcoin',
    title: 'Como calcular stop loss no Bitcoin: veja o risco antes da entrada',
    description: 'Entenda distância do stop, perda planejada, execução e relação entre alvo e risco em um exemplo de Bitcoin.',
    toolSlug: 'risco-stop',
    readingMinutes: 4,
    sections: [
      {
        heading: 'O stop começa com uma hipótese',
        paragraphs: [
          'Um stop loss é uma instrução de saída condicionada a um preço. Antes de preencher esse preço, vale escrever qual hipótese está sendo testada e o que faria essa hipótese deixar de fazer sentido. A calculadora mostra a consequência de uma escolha; ela não encontra um ponto de entrada nem determina o melhor stop para o mercado.',
          'Imagine uma compra fictícia de Bitcoin a 300.000 USDT por BTC. Escolher 294.000 USDT como stop coloca a saída planejada 2% abaixo da entrada. Isso descreve a distância no preço do ativo. Ainda falta conhecer a quantidade comprada para descobrir quantos USDT estarão expostos a esse movimento. Todos os valores aqui são educativos e não representam cotação atual.',
        ],
      },
      {
        heading: 'Transforme distância em perda planejada',
        paragraphs: [
          'Em uma posição linear comprada, a diferença entre entrada e stop é a perda por unidade de BTC. Multiplicar essa diferença pela quantidade produz a perda bruta planejada. A mesa de risco também considera as taxas informadas ao dimensionar a quantidade. Os exemplos deste artigo usam taxas zeradas para isolar a distância do stop. Entrada e stop iguais não permitem dimensionar por essa fórmula.',
          'Essa conta precisa usar a mesma unidade em todos os valores: os preços são USDT por BTC e a banca é USDT. Misturar preços em reais com banca em USDT sem conversão produz um cálculo inconsistente. USDT é a unidade do modelo, sem equivalência automática com reais ou dólares. Também é importante separar exposição da perda planejada.',
        ],
        example: 'Banca: 6.000 USDT. Risco: 1%. Taxas: zero. Entrada: 300.000 USDT por BTC. Stop: 294.000 USDT por BTC. Quantidade calculada: 0,01 BTC. Perda planejada: (300.000 − 294.000) × 0,01 = 60 USDT. Exposição na entrada: 3.000 USDT.',
      },
      {
        heading: 'Gatilho não é preço garantido',
        paragraphs: [
          'No stop a mercado, atingir o gatilho normalmente envia uma ordem a mercado. No stop limitado, o gatilho ativa uma ordem limitada, que pode ficar sem execução. A FINRA explica essa diferença no contexto de ações; no mercado cripto, é necessário verificar como a plataforma implementa cada ordem, inclusive qual preço dispara o gatilho.',
          'A diferença entre preço esperado e preço executado é chamada de slippage. Uma saída pior que a simulada aumenta a perda; taxas de entrada e saída também alteram o total. Esses efeitos são particularmente relevantes quando a liquidez é baixa ou o preço muda rapidamente.',
        ],
      },
      {
        heading: 'O alvo não informa a chance de sucesso',
        paragraphs: [
          'Com alvo em 312.000 USDT, o ganho bruto do exemplo seria 120 USDT: duas vezes o risco bruto de 60 USDT. A relação potencial é 2:1. Isso compara duas distâncias; não significa que o alvo será atingido nem que a operação tem vantagem estatística.',
          'Para avaliar uma sequência de operações, também seriam necessários resultados observados, frequência de acertos, perdas efetivas e custos. Alterar o alvo apenas para deixar a relação mais bonita não fornece evidência sobre a probabilidade de execução.',
        ],
      },
      {
        heading: 'Experimente mudar uma variável por vez',
        paragraphs: [
          'Na mesa de risco, mantenha a banca e o risco escolhido e afaste o stop. Observe a quantidade calculada diminuir. Depois aproxime o stop e compare a quantidade e a exposição derivadas. Para estudar uma quantidade fixa, use o simulador long/short e varie a saída. Esses exercícios ajudam a perceber por que distância de saída e tamanho precisam ser considerados juntos.',
          'O resultado é um cenário simplificado, não uma ordem enviada à corretora. Ele não prevê gaps, liquidação, indisponibilidade do serviço ou execução parcial. Use a ferramenta para entender a aritmética e avance para a aula de gestão de risco para discutir as decisões que a conta não resolve.',
        ],
      },
    ],
    sources: [positionSource, stopSource],
  },
  {
    slug: 'como-calcular-tamanho-posicao',
    title: 'Quanto comprar? Entenda o tamanho da posição em cripto',
    description: 'Separe banca, exposição e risco e descubra por que mudar o stop altera a quantidade em uma simulação.',
    toolSlug: 'risco-stop',
    readingMinutes: 4,
    sections: [
      {
        heading: 'Três números que não são equivalentes',
        paragraphs: [
          'Banca é o capital usado como referência no exercício. Exposição é o valor representado pela posição no preço de entrada. Risco planejado é a perda estimada se a saída ocorrer no stop informado. Dizer “vou usar 2.000 USDT” não revela qual desses números está sendo descrito, e essa confusão muda completamente a interpretação do cenário.',
          'Em uma compra spot sem financiamento, a exposição costuma corresponder ao valor pago pelo ativo antes das taxas. Em derivativos, uma margem menor pode sustentar uma exposição maior. Por isso, a quantidade não deve ser confundida com a margem nem a margem com uma perda máxima garantida.',
        ],
      },
      {
        heading: 'Comece pelo orçamento de risco do exemplo',
        paragraphs: [
          'Sem taxas, dimensionar uma posição linear com stop envolve converter o percentual de risco em dinheiro e dividir pela distância entre entrada e stop. Quantidade = risco em dinheiro ÷ distância por unidade. Na mesa de risco, as taxas informadas também entram no dimensionamento. Os exemplos abaixo usam ambas as taxas zeradas. O percentual é uma hipótese, sem um número universalmente adequado para todas as pessoas.',
          'A CME apresenta a relação entre stop e risco escolhido como parte do dimensionamento. Aqui usamos valores próprios e uma quantidade fracionária de BTC para tornar a conta visível. Em contratos reais, multiplicador, lote mínimo e passo de quantidade precisam ser respeitados; arredondar para cima pode ultrapassar o orçamento.',
        ],
        example: 'Banca: 10.000 USDT. Risco fictício: 1%, ou 100 USDT. Entrada: 300.000 USDT por BTC. Stop: 294.000 USDT. Quantidade: 100 ÷ 6.000 = aproximadamente 0,016667 BTC. Exposição: aproximadamente 5.000 USDT, antes de custos.',
      },
      {
        heading: 'Afaste o stop e compare a quantidade',
        paragraphs: [
          'Se o stop passa para 288.000 USDT, a distância dobra para 12.000 USDT por BTC. Mantendo o risco bruto em 100 USDT, a quantidade cai para aproximadamente 0,008333 BTC e a exposição para 2.500 USDT. O orçamento de risco permanece igual porque a mudança na quantidade compensa a distância maior.',
          'Se uma posição já aberta mantiver a quantidade anterior, a perda bruta planejada passaria a aproximadamente 200 USDT. Mover o stop depois da entrada pode ampliar o risco sem depósito novo. Na mesa de risco, porém, a quantidade sempre é recalculada para respeitar o orçamento; ela não representa automaticamente a alteração de uma posição existente.',
        ],
      },
      {
        heading: 'A conta pode exceder o capital disponível',
        paragraphs: [
          'Um stop muito próximo pode gerar uma quantidade grande. Com risco de 100 USDT e distância de apenas 1.000 USDT por BTC, a fórmula retorna 0,1 BTC: 30.000 USDT de exposição na entrada do exemplo. Essa compra não cabe em uma banca de 10.000 USDT no spot sem financiamento.',
          'Esse resultado deve ser interpretado como incompatibilidade entre as hipóteses, e não como convite para usar alavancagem. É possível estudar outro orçamento, outra quantidade ou simplesmente descartar o cenário. Aumentar a exposição também altera custos e pode aumentar a dificuldade de execução.',
        ],
      },
      {
        heading: 'Considere a posição dentro do conjunto',
        paragraphs: [
          'Duas operações com risco planejado de 100 USDT cada não equivalem a apenas 100 USDT de risco total. Se ambas forem encerradas no stop, a soma bruta será 200 USDT. Ativos que se movem juntos podem tornar várias posições uma exposição concentrada ao mesmo evento.',
          'A mesa de risco inclui as taxas de entrada e saída informadas e mostra perda planejada e resultado no alvo após essas taxas. Ela não inclui slippage, funding, liquidação ou outras posições da conta. Registre as hipóteses e compare o resultado com o capital disponível. O objetivo é dar significado à quantidade, sem transformar uma fórmula em promessa de controle absoluto das perdas.',
        ],
      },
    ],
    sources: [positionSource, marginSource],
  },
  {
    slug: 'long-short-bitcoin-diferenca',
    title: 'Long ou short: o que muda quando o Bitcoin sobe ou cai?',
    description: 'Compare os sinais do resultado em posições compradas e vendidas e entenda a diferença entre vender spot e abrir short.',
    toolSlug: 'long-short',
    readingMinutes: 4,
    sections: [
      {
        heading: 'A direção define o sinal do resultado',
        paragraphs: [
          'Uma posição long, ou comprada, tem resultado bruto positivo quando o preço de saída supera o de entrada. Uma posição short, ou vendida, tem resultado bruto positivo quando a saída fica abaixo da entrada. O mesmo movimento pode beneficiar uma direção e prejudicar a outra; nenhuma delas descreve antecipadamente o que o mercado fará.',
          'A comparação do laboratório usa uma posição linear, com quantidade expressa em BTC e resultado na moeda dos preços. É um modelo para aprender o mecanismo. Contratos inversos, opções e outros produtos têm fórmulas diferentes e não devem ser interpretados a partir dessa conta simplificada.',
        ],
      },
      {
        heading: 'Vender Bitcoin que você tem não é abrir short',
        paragraphs: [
          'Vender uma quantidade de BTC que já está na carteira encerra ou reduz essa posse. Abrir uma posição short cria uma exposição que perde valor quando o preço sobe. Em futuros, é possível assumir essa direção por meio do contrato sem possuir o Bitcoin à vista, como explica a documentação de criptoderivativos da CME.',
          'Também existe venda com ativo emprestado, que envolve condições de empréstimo e devolução. Esses mecanismos não são intercambiáveis. Antes de usar uma plataforma, é necessário identificar qual produto está sendo oferecido, como a obrigação é encerrada e quais custos ou garantias são exigidos.',
        ],
      },
      {
        heading: 'Compare as duas direções com a mesma quantidade',
        paragraphs: [
          'Para long, calculamos quantidade × (saída − entrada). Para short, quantidade × (entrada − saída). Ao fixar entrada e quantidade, comparamos a direção sem mudar o tamanho. Todos os preços são fictícios, em USDT por BTC. No simulador, selecione quantidade fixa, zere as taxas de entrada e saída e informe funding zero para reproduzir o exemplo.',
          'O exemplo é bruto e considera encerramento integral no preço informado. O painel distingue resultado bruto e líquido: o líquido desconta taxas informadas e funding pago, ou soma funding recebido. Uma variação favorável não é lucro realizado enquanto a posição permanece aberta. Marcação, negociação e valor disponível para saque também podem representar coisas diferentes.',
        ],
        example: 'Entrada: 300.000 USDT por BTC. Quantidade: 0,01 BTC. Saída a 306.000 USDT: long +60 USDT e short −60 USDT. Saída a 294.000 USDT: long −60 USDT e short +60 USDT, antes de custos.',
      },
      {
        heading: 'A porcentagem depende da base usada',
        paragraphs: [
          'No exemplo, 60 USDT correspondem a 2% da exposição inicial de 3.000 USDT. Se um cenário de derivativo usa 600 USDT de margem para essa mesma exposição, 60 USDT representam 10% da margem. A diferença está no denominador; o resultado em USDT permanece o mesmo enquanto a quantidade não muda.',
          'Taxas e, quando aplicável, funding ou juros de empréstimo alteram o resultado líquido. Preço de entrada e saída iguais podem gerar perda líquida por custos. No caso de posições vendidas, uma alta não tem teto teórico de preço; isso exige atenção às obrigações do produto e aos mecanismos de encerramento.',
        ],
      },
      {
        heading: 'Use o simulador para testar compreensão',
        paragraphs: [
          'Experimente uma saída acima e outra abaixo da entrada. Antes de olhar o painel, tente prever apenas o sinal do resultado para cada direção. Depois compare margem e exposição separadamente. Esse exercício verifica compreensão do contrato sem exigir uma previsão de preço.',
          'O laboratório considera as taxas informadas e o funding acumulado em USDT: positivo significa pago; negativo, recebido. Ele não prevê funding futuro, preço de liquidação nem envia ordens. Requisitos de manutenção e regras da corretora podem encerrar a posição antes da saída. O cenário ensina o cálculo linear; operar um produto real exige compreender suas condições.',
        ],
      },
    ],
    sources: [
      { label: 'CME Group — posições long e short em futuros de criptomoedas', url: 'https://www.cmegroup.com/markets/cryptocurrencies/cryptocurrency-futures' },
      marginSource,
      cryptoRiskSource,
    ],
  },
  {
    slug: 'alavancagem-margem-fixa-exposicao-fixa',
    title: 'Alavancagem: margem fixa e exposição fixa são comparações diferentes',
    description: 'Veja por que aumentar a alavancagem pode mudar a quantidade ou apenas a margem usada, dependendo do que permanece fixo.',
    toolSlug: 'long-short',
    readingMinutes: 4,
    sections: [
      {
        heading: 'Pergunte primeiro o que está fixo',
        paragraphs: [
          'Comparar 2x, 5x e 10x sem dizer o que permanece igual pode levar a uma conclusão errada. Em um modelo simplificado, exposição = margem × alavancagem. Se a margem fica constante, a exposição aumenta. Se a exposição fica constante, a margem necessária diminui. São duas experiências distintas, embora o seletor de alavancagem pareça o mesmo.',
          'Margem é a garantia associada ao contrato, enquanto exposição representa o tamanho econômico da posição. A CME distingue margem inicial e margem de manutenção. Os produtos de uma plataforma cripto podem adotar regras próprias; o laboratório usa uma relação idealizada para explicar os números, sem reproduzir um contrato específico.',
        ],
      },
      {
        heading: 'Margem fixa: muda a exposição',
        paragraphs: [
          'Selecione margem fixa e informe 500 USDT. Para reproduzir as contas abaixo, zere ambas as taxas e o funding. A 2x, a exposição é 1.000 USDT. A 5x, 2.500 USDT. A 10x, 5.000 USDT. Na mesma entrada, isso representa quantidades diferentes. Um movimento de 2% produz resultados em dinheiro diferentes porque o tamanho mudou.',
          'Para um long e um movimento favorável de 2%, os ganhos brutos seriam 20 USDT, 50 USDT e 100 USDT. Com o mesmo movimento contrário, as perdas brutas seriam esses valores. A comparação mostra mais sensibilidade em USDT por manter a margem e aumentar a exposição, não por alterar a fórmula do resultado da quantidade já fixada.',
        ],
        example: '500 USDT de margem × 10 = 5.000 USDT de exposição. Variação de −2% em um long linear: −100 USDT antes de custos, equivalente a −20% da margem inicial.',
      },
      {
        heading: 'Exposição fixa: muda a margem',
        paragraphs: [
          'Agora selecione quantidade fixa. Com entrada fictícia de 300.000 USDT por BTC, aproximadamente 0,016667 BTC representam 5.000 USDT de exposição. A margem simplificada é 2.500 USDT a 2x, 1.000 USDT a 5x e 500 USDT a 10x. Uma variação adversa de 2% continua produzindo aproximadamente 100 USDT de perda bruta, desde que a quantidade seja mantida e a posição não seja encerrada antes.',
          'A perda representa 4%, 10% e 20% das margens respectivas. Uma porcentagem maior sobre a margem não significa que a perda em USDT aumentou neste exercício. Ela indica que há menos garantia inicial em relação à mesma exposição. A folga frente aos requisitos de manutenção pode diminuir.',
        ],
      },
      {
        heading: 'Liquidação não é simplesmente 1 dividido pela alavancagem',
        paragraphs: [
          'Uma conta como “10x suporta exatamente 10% de queda” ignora manutenção, taxas e regras de preço. Também não considera margem compartilhada entre posições. O saldo disponível e o mecanismo de liquidação precisam ser avaliados conforme o contrato; não existe um preço universal que o simulador possa garantir.',
          'A CFTC alerta que contratos alavancados ampliam riscos e podem exigir reforço de margem ou encerramento. Aqui a explicação serve para compreender a exposição. A margem mostrada não deve ser interpretada como limite absoluto de perda nem como reserva suficiente para sustentar qualquer trajetória de preço.',
        ],
      },
      {
        heading: 'Leia o painel sem misturar denominadores',
        paragraphs: [
          'Ao comparar cenários, anote entrada, direção, quantidade, exposição, margem e saída. Se uma dessas informações muda, identifique qual efeito está sendo medido. “Resultado sobre a margem” e “variação do ativo” respondem a perguntas diferentes e precisam aparecer com seus nomes.',
          'O painel mostra resultado bruto e líquido, incluindo taxas de entrada e saída e funding acumulado informado. Funding positivo é pago; negativo é recebido. O modelo não prevê funding futuro, juros de empréstimo, slippage ou liquidação. Refaça o exercício com movimento adverso e observe o valor em USDT. O aprendizado é reconhecer quando a posição aumentou e quando apenas a garantia foi reduzida.',
        ],
      },
    ],
    sources: [marginSource, cryptoRiskSource],
  },
  {
    slug: 'recuperacao-perdas-queda-cinquenta-por-cento',
    title: 'Caiu 50%: por que precisa subir 100% para recuperar?',
    description: 'Entenda a mudança de base dos percentuais, perdas consecutivas e a diferença entre recuperação do preço e da carteira.',
    toolSlug: 'recuperacao-perdas',
    readingMinutes: 4,
    sections: [
      {
        heading: 'A porcentagem muda de base',
        paragraphs: [
          'Se 1.000 USDT caem para 500 USDT, a perda é 500 USDT: metade do valor inicial. Para voltar de 500 USDT a 1.000 USDT, é preciso ganhar os mesmos 500 USDT, mas agora esse ganho equivale a todo o saldo restante. Por isso uma queda de 50% exige uma alta de 100% para retornar ao ponto inicial.',
          'Esse resultado é aritmético. Ele não informa se o ativo irá recuperar, quanto tempo isso levaria ou qual operação produziria o ganho. A calculadora foi criada para tornar a mudança de base visível e evitar interpretar percentuais de queda e alta como movimentos automaticamente simétricos.',
        ],
      },
      {
        heading: 'A fórmula usa o capital que sobrou',
        paragraphs: [
          'Para uma perda percentual p, o saldo restante é o capital inicial multiplicado por (1 − p/100). A alta necessária, em percentual, é p ÷ (100 − p) × 100. A fórmula vale para perdas entre zero e menos de 100%, sem aportes, retiradas ou custos no intervalo.',
          'Uma queda de 20% exige alta de 25%; uma queda de 40% exige aproximadamente 66,67%. Quanto menor o saldo restante, maior é a porcentagem necessária sobre ele. Na perda de 100%, o saldo é zero e não existe alta percentual finita capaz de reconstruir o capital sem entrada de dinheiro.',
        ],
        example: '10.000 USDT com perda de 30% deixam 7.000 USDT. Faltam 3.000 USDT para recuperar. 3.000 USDT ÷ 7.000 USDT × 100 = aproximadamente 42,86% de alta necessária.',
      },
      {
        heading: 'Perdas consecutivas não se somam diretamente',
        paragraphs: [
          'Duas quedas de 10% não produzem exatamente 20% de perda quando cada uma incide sobre o saldo daquele momento. Partindo de 1.000 USDT, a primeira deixa 900 USDT e a segunda deixa 810 USDT. A perda acumulada é de 19%, e a alta necessária para voltar a 1.000 USDT é aproximadamente 23,46%.',
          'Uma queda de 10% seguida de alta de 10% também não zera a diferença: 1.000 USDT viram 900 USDT e depois 990 USDT. O ganho foi calculado sobre uma base menor. Esse exemplo ajuda a entender resultados compostos e por que somar percentuais de dias diferentes pode distorcer o desempenho.',
        ],
      },
      {
        heading: 'O preço e a carteira podem ter recuperações diferentes',
        paragraphs: [
          'Se você manteve a mesma quantidade de um ativo, sem custos ou movimentações, a recuperação percentual da posição acompanha a do preço. Quando há compras adicionais, vendas parciais, taxas ou outros ativos, a evolução do patrimônio deixa de ser uma cópia simples do gráfico daquele ativo.',
          'Um aporte pode restaurar o saldo da conta sem recuperar a perda do investimento. Por exemplo, adicionar 500 USDT a uma carteira que caiu de 1.000 USDT para 500 USDT devolve o saldo a 1.000 USDT, mas a posição original continua valendo 500 USDT. Separar capital novo de rendimento evita atribuir recuperação ao mercado quando ela veio de um depósito.',
        ],
      },
      {
        heading: 'Transforme o número em uma pergunta melhor',
        paragraphs: [
          'Em vez de perguntar somente quanto precisa ganhar, investigue como a perda aconteceu e quais hipóteses continuam válidas. A necessidade matemática de uma alta não cria uma oportunidade nem justifica aumentar a posição. A CFTC destaca os riscos dos mercados cripto e de contratos alavancados; a calculadora não escolhe uma forma de compensar perdas.',
          'Experimente comparar quedas de 10%, 30% e 60% com o mesmo capital inicial. Observe tanto a alta necessária quanto o saldo restante. A ferramenta considera um único movimento líquido e valores nominais; não inclui inflação, tributos ou uma sequência real de negociações. A fórmula é uma demonstração própria, e a fonte abaixo oferece contexto de risco, não uma previsão de recuperação.',
        ],
      },
    ],
    sources: [cryptoRiskSource],
  },
]


