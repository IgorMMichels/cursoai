# Prompt de implementação — Central de ferramentas do Cripto do Zero

Data: 03/10/2026.

Este documento consolida o pedido do usuário e o brainstorming para uma futura implementação no projeto existente. Pode ser enviado integralmente a uma IA. Nesta rodada foi solicitada somente a documentação; implementar quando o usuário enviar este contexto e pedir execução.

## 1. Objetivo

Evolua o Cripto do Zero com uma central de ferramentas educativas e interativas sobre mercado cripto. As ferramentas devem servir tanto ao aluno dentro do curso quanto ao visitante que chega pela landing, por uma busca ou por uma URL compartilhada, sem login.

A central deve comportar novas ferramentas no futuro e reservar uma seção de destaque com exatamente três cards de bots. Os bots serão exclusivos de usuários com acesso ativo à plataforma. Suas funções ainda não foram escolhidas: preparar os lugares e os estados visuais, sem inventar funcionalidades operacionais.

Resultado esperado: a pessoa consegue experimentar um conceito, entender o resultado e descobrir a aula relacionada. O aluno consegue usar a mesma ferramenta dentro de seu ambiente de estudo.

## 2. Contexto da aplicação

Aplicação existente em React, TypeScript e Vite, com React Router, Tailwind, componentes shadcn locais e identidade escura com acentos lilás. O catálogo local contém quatro jornadas e 70 aulas: fundamentos, memecoins, futuros e trading. Há áudio, transcrições, exercícios, quizzes, progresso, guias de carteiras e afiliados.

Arquivos de referência:

- `src/App.tsx`: rotas e layouts.
- `src/components/site-header.tsx`: header e navegação móvel da landing.
- `src/components/course-layout.tsx`: sidebar, header móvel e conteúdo da área do aluno.
- `src/components/guards.tsx`: controles de sessão e acesso ativo.
- `src/pages/landing-page.tsx`: apresentação pública.
- `src/pages/preview-page.tsx`: prévia pública da plataforma.
- `src/lib/course.ts` e `src/lib/generated/journeys.json`: catálogo de aulas.
- `src/lib/market-prices.ts`: cotações e gráficos de BTC, ETH e SOL.
- `docs/contexto-e-ideias-de-crescimento.md`: contexto anterior e propostas amplas.

O README contém partes referentes a uma versão anterior. Confira o código atual antes de concluir o que já existe. Leia eventuais AGENTS.md e preserve alterações preexistentes. O checkout está pendente: não simule pagamentos, ativação de assinatura nem bot funcionando.

## 3. Decisões confirmadas pelo usuário

1. Ferramentas interativas acessíveis publicamente por URL, sem cadastro ou assinatura.
2. Acesso às mesmas ferramentas pela barra lateral do curso.
3. Item “Ferramentas” no header da landing, inclusive no menu móvel.
4. Página separada com o catálogo das ferramentas, preparada para expansão.
5. Três cards de bots em uma seção fixa de destaque do catálogo.
6. Uso dos bots exclusivo de quem tem acesso à plataforma.
7. Funções e nomes definitivos dos bots ainda não definidos.
8. Na implementação, abrir navegador externo em `http://localhost:5173` para inspecionar e melhorar a experiência.

Estas decisões substituem sugestões anteriores de acesso público a bots. Artigos e distribuição continuam como propostas futuras; não implementar toda a lista de brainstorming automaticamente.

## 4. Arquitetura de navegação proposta

| URL proposta | Experiência | Acesso |
|---|---|---|
| `/ferramentas` | Catálogo com header público, ferramentas e seção de bots | Público |
| `/ferramentas/:slug` | Ferramenta, explicação e conteúdo educativo | Público |
| `/curso/ferramentas` | Mesmo catálogo dentro do CourseLayout | Sessão da área do aluno; ferramentas sem exigência de plano |
| `/curso/ferramentas/:slug` | Mesmo componente interativo dentro do curso | Sessão da área do aluno; ferramentas sem exigência de plano |

As rotas são uma proposta concreta de implementação, não funcionalidades já existentes. O endereço público continua disponível mesmo para quem nunca criou conta. As rotas do curso preservam a proteção da área do aluno, mas não devem exigir assinatura para os cálculos gratuitos. Posicione as rotas de ferramentas fora do guard de assinatura das aulas; isso não libera o restante do curso.

O link do header deve navegar para `/ferramentas`, não tratar a ferramenta como âncora da landing. Na sidebar, adicionar “Ferramentas” com estado ativo para catálogo e páginas internas; no celular, fornecer navegação equivalente sem sobrecarregar o header.

Reutilizar componentes, catálogo e funções de cálculo entre os dois contextos. Layout público e layout do curso são envoltórios diferentes da mesma experiência. Não duplicar calculadoras nem manter duas versões do conteúdo.

Reservar os slugs dessas rotas em relação à rota dinâmica de afiliados `/:affiliateId`. URL desconhecida deve exibir estado de página não encontrada, sem virar indicação ou ferramenta válida.

## 5. Experiência da central

Proposta de estrutura:

1. Título “Ferramentas cripto” e apresentação curta: “Explore cenários e entenda os números antes de decidir.”
2. Catálogo das ferramentas gratuitas, com cards que dizem qual pergunta cada recurso resolve.
3. Seção fixa “Bots da plataforma”, com os três cards, ordem estável e sinalização de acesso exclusivo.
4. Conteúdo educativo relacionado, quando estiver disponível.

“Fixos” significa três posições permanentes no catálogo; não significa cards presos à tela durante a rolagem. No desktop, apresentar os três bots em uma linha quando houver espaço. No celular, empilhar. Busca e filtros afetam o catálogo gratuito; a seção dos bots permanece com seus três lugares.

Cada card de ferramenta deve ter nome, descrição concreta, categoria, ícone e ação “Abrir ferramenta”. Não exibir cartões que aparentem estar funcionando quando ainda não foram implementados. O catálogo pode crescer a partir de um registro central com ID, slug, título, descrição, categoria, disponibilidade e relação com conteúdo.

Busca e filtros são opcionais para o primeiro catálogo pequeno. Se usados, prever resultado vazio e limpar filtros. Para expansão, categorias sugeridas: Bitcoin, risco, trading, futuros e segurança.

## 6. Anatomia de uma ferramenta

- Pergunta clara no título e explicação curta de uso.
- Exemplo preenchido e explicitamente fictício para experimentar imediatamente.
- Entradas com unidades, validação e controles acessíveis; tratar vírgula decimal em português.
- Resultado que muda conforme os valores, com gráfico ou visualização quando ajudar.
- Explicação do que mudou e por quê, com linguagem simples.
- Hipóteses e custos considerados próximos ao resultado.
- Ações de limpar e carregar exemplo; compartilhamento de cenário pode entrar depois.
- Conteúdo público relacionado e link para aula quando a relação estiver validada no catálogo.

Não depender de arrastar um gráfico: fornecer campos equivalentes e uso por teclado. Não exigir login, conectar carteira ou fornecer dados reais para experimentar. Não expor aulas pagas na explicação pública; produzir explicação educativa própria. Links para aulas mantêm os controles de acesso atuais.

Histórico, favoritos e sincronização entre dispositivos ficam para depois. A experiência principal deve funcionar sem conexão com serviços de conta e sem credenciais de ambiente configuradas.

## 7. Brainstorm de ferramentas e recorte inicial

| ID | Ferramenta | Interação e objetivo | Momento sugerido |
|---|---|---|---|
| F01 | Mesa visual de risco e stop | Variar entrada, stop, alvo, banca e risco escolhido; entender quantidade, exposição e relação risco/retorno | Primeira entrega |
| F02 | Long/short e alavancagem | Comparar resultados em cenários definidos; distinguir margem fixa de exposição fixa | Primeira entrega |
| F03 | Você cairia neste golpe? | Escolher ações em mensagens fictícias e entender as pistas | Expansão prioritária |
| F04 | Primeira transferência simulada | Conferir ativo, rede e destino em cenários revisados, sem envio real | Expansão |
| F05 | Laboratório de liquidez | Alterar tamanho de ordem em modelo fictício e observar impacto | Expansão |
| F06 | Laboratório de ordens | Comparar execução de mercado/limitada em livro de ofertas fictício | Expansão |
| F07 | Raio-X dos custos | Separar resultado bruto de taxas, spread, slippage e funding informado | Expansão |
| F08 | Recuperação de perdas | Arrastar queda percentual e visualizar recuperação necessária | Primeira entrega |
| F09 | Preço médio | Adicionar compras e taxas; calcular média ponderada e equilíbrio | Expansão prioritária |
| F10 | Preço versus market cap | Variar preço e oferta em exemplo hipotético | Expansão |
| F11 | Candle misterioso | Revelar gráfico gradualmente e registrar observações | Futuro |
| F12 | Memecoin fictícia | Investigar oferta, liquidez, concentração e permissões | Futuro |

**Sugestão de escopo inicial, ainda não escolhida individualmente pelo usuário:** central, navegação pública/interna, três ferramentas F01/F02/F08 e os três lugares de bots. O pedido atual define a estrutura; esta seleção é recomendação para tornar a futura primeira entrega manejável. Ao receber autorização genérica para implementar este documento, declarar esse recorte antes de executar. Se o usuário selecionar outros IDs, sua seleção prevalece.

BTC/satoshis/BRL e comparação histórica de aportes são ideias adicionais. A primeira exige cotação/câmbio identificados; a segunda exige dados históricos e tratamento de períodos. Não são dependências do lançamento.

## 8. Regras para cálculos e cenários

Usar funções determinísticas e verificáveis, separadas da apresentação. Não delegar aritmética a um modelo de IA. Identificar moeda/unidade e diferenciar preço de acionamento de preço de execução. Não chamar perda planejada de perda máxima garantida.

F01: validar valores positivos, entrada diferente de stop, risco escolhido dentro dos limites aceitos e stop/alvo coerentes com direção. Não sugerir um percentual de risco como recomendação pessoal. Para spot, validar compatibilidade da exposição com a banca; para futuros, explicitar o modelo de margem. Quantidade decorre do risco escolhido e da distância do stop, com hipóteses de custo identificadas.

F02: começar com contratos lineares em moeda de cotação. Se a quantidade já estiver definida, não multiplicar novamente o lucro/prejuízo pela alavancagem. Se entrada for margem, derivar a exposição uma vez. Separar compra/venda spot de long/short. Não simular liquidação por uma regra genérica: depende do produto e das regras de margem.

F08: recuperação percentual = `queda / (1 - queda)`, usando queda em fração. Uma queda de 50% exige alta de 100%. Queda de 100% não tem recuperação percentual finita a partir de saldo zero. Tratar esse limite sem Infinity/NaN na interface.

O serviço atual usa pares USDT na Binance e USD na alternativa CoinGecko. Não apresentar esses dados automaticamente como BRL nem tratá-los como unidades idênticas. Cenários manuais e fictícios são suficientes para a primeira entrega. Se cotações forem utilizadas, mostrar fonte, unidade e horário; uma falha de mercado não deve impedir simulação manual.

## 9. Três cards de bots: acesso e disponibilidade

Reservar IDs estáveis `bot-01`, `bot-02` e `bot-03`. Na primeira entrega, nomes neutros “Bot 01”, “Bot 02” e “Bot 03”, com descrição honesta “Funcionalidade em definição”. Não inventar estatísticas, nomes comerciais ou links de Telegram.

Separar dois estados: direito de acesso e disponibilidade do produto.

| Pessoa | Bot não publicado | Bot publicado no futuro |
|---|---|---|
| Visitante sem login | “Exclusivo para assinantes · Em breve”; opção de conhecer os planos e entrar | Bloqueado; pedir login e verificar plano antes de liberar |
| Conta sem plano ativo ou com plano expirado | Mesmo aviso, sem ação de uso | Bloqueado; ação para conhecer/renovar plano |
| Aluno com acesso ativo | “Incluído no seu acesso · Em breve”; sem botão de abrir | Ação para acessar após validação |
| Sessão em carregamento | Estado neutro sem anunciar acesso liberado | Aguardar verificação, sem disparar integração |

Login isolado não libera bots. Para esta proposta, “acesso à plataforma” significa direito ativo ao curso, aproveitando a regra existente; respeitar exceções administrativas já definidas pelo projeto, sem inventá-las.

Os cards ficam visíveis para todos. Disponibilidade futura não pode ser mascarada como bloqueio comercial: assinante também vê “Em breve” enquanto o bot não existe. Como o checkout está pendente, não prometer ativação imediata por pagamento.

Na futura integração, bloquear ações no servidor e validar vínculo da conta; esconder botão no front não protege um serviço. Não publicar link compartilhável que por si só dê acesso a um bot privado. Nesta primeira etapa não integrar Telegram, agendamento, IA ou backend de bots.

Possíveis funções para discussão futura: tutor do curso, revisão de conceitos e acompanhamento de estudos/cenários. São candidatas, não seleção definitiva. Os B01–B06 do brainstorming anterior não ficam automaticamente atribuídos aos três cards.

## 10. Artigos, busca e crescimento futuro

Criar futuramente páginas públicas que respondam a perguntas específicas e levem ao recurso correspondente. Sugestões iniciais:

- Como calcular stop loss no Bitcoin → F01.
- Quanto comprar em uma operação? → F01.
- Long ou short: o que muda quando o preço sobe ou cai? → F02.
- Alavancagem 2x, 5x e 10x: compare o mesmo movimento → F02.
- Se caiu 50%, por que precisa subir 100%? → F08.
- Como calcular o preço médio de Bitcoin → F09.
- Você reconheceria um golpe cripto? → F03.
- Transferência cripto: rede, endereço e memo → F04.

Esses são títulos propostos, sem volume de busca validado. Cada ferramenta já pode ter explicação útil na própria página. Artigo separado só quando desenvolver outra pergunta; evitar duplicar páginas para cada moeda ou sinônimo.

Para páginas públicas, preparar títulos e descrições próprios, URLs estáveis, links acessíveis e estratégia de renderização/indexação. Usar `/ferramentas/:slug` como endereço público preferencial; variantes internas do curso não devem competir na busca. Não indexar cenários privados nem produzir uma URL indexável para cada combinação de valores.

Ao planejar a expansão editorial, avaliar pré-renderização das páginas públicas no projeto existente. Não migrar toda a aplicação para outro framework como condição automática. Fontes já consultadas: [Google — conteúdo útil](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) e [Google — SEO para JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

## 11. Direção visual

Preservar marca, tipografia e tokens existentes. A central deve parecer parte do Cripto do Zero. Dar mais destaque ao uso das ferramentas que a efeitos decorativos. Resultados precisam ser legíveis; a pessoa deve reconhecer o que pode editar e o que foi calculado.

Separar visualmente “Ferramentas gratuitas” e “Bots da plataforma”. Cadeado só nos recursos exclusivos. Evitar cadeado em ferramenta pública, excesso de blur sobre texto e cards de bots maiores que todo o catálogo. Incluir estados de erro, vazio, indisponibilidade e carregamento quando necessários. Movimentos respeitam preferência de redução de animação.

## 12. Sequência da futura execução

1. Inspecionar instruções locais, código atual, alterações preexistentes e componentes reutilizáveis.
2. Declarar o recorte de ferramentas escolhido para a primeira entrega.
3. Criar catálogo e componentes compartilhados, com lógica de cálculo independente.
4. Adicionar rotas públicas, rotas no curso, item no header e navegação da sidebar/mobile.
5. Construir os três cards de bots com os estados honestos descritos neste documento.
6. Implementar e verificar as ferramentas do recorte, com exemplos e explicações.
7. Rodar build/lint e validações pertinentes aos cálculos e aos controles de acesso.
8. Abrir navegador externo em `http://localhost:5173`, inspecionar desktop e mobile e corrigir problemas encontrados.

Durante a etapa 8, usar servidor local na porta 5173. Se outro processo já servir esse projeto ali, reutilizar; se a porta estiver ocupada por serviço diferente, identificar o conflito sem encerrar processos desconhecidos. Se o navegador externo não estiver disponível, informar a limitação e registrar a alternativa; não alegar verificação que não ocorreu.

## 13. Critérios de aceite

- Visitante abre catálogo e ferramenta diretamente por URL, inclusive após refresh, e consegue interagir sem login.
- Ferramentas públicas continuam funcionando quando não há serviço de conta configurado.
- Header da landing e menu móvel levam à central.
- Sidebar e navegação móvel do curso levam à mesma experiência no layout do aluno.
- Ferramentas não exigem assinatura; aulas e bots mantêm seus controles próprios.
- Catálogo e cálculos são compartilhados entre rotas internas e públicas.
- Existem exatamente três cards de bots em seção estável, independentemente de filtros das ferramentas.
- Sem plano ativo, bots não são liberados; com plano ativo, bots ainda não implementados continuam “Em breve”.
- Nenhum card afirma disponibilidade de uma integração inexistente.
- Entradas inválidas, valores limites e operações incoerentes recebem feedback claro; interface não mostra NaN/Infinity.
- Campos e resultados têm unidades, exemplos identificados e uso por teclado.
- Não há rolagem horizontal acidental no celular nem resultados cortados pela sidebar/ticker.
- Novas ferramentas podem ser incluídas pelo catálogo sem duplicar os dois contextos.
- Build/lint e verificações relevantes são relatados com seus resultados reais.
- Revisão visual acontece no navegador externo local quando houver implementação.

## 14. Limites desta solicitação

Nesta rodada: brainstorm consolidado e prompt em Markdown. Não implementar telas, publicar artigos, escolher definitivamente os bots, contratar serviços, alterar produção ou abrir navegador para avaliar mudanças ainda inexistentes.

Na futura execução: implementar o recorte indicado pelo usuário; usar este documento para manter coerência. Para cada ideia escolhida, um MD específico poderá detalhar entradas, cálculos, exemplos, estados e critérios de aceite. Documentação de resumo não torna todo o backlog uma entrega obrigatória.
