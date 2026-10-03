# Cripto do Zero: contexto e ideias de crescimento

Atualizado em 03/10/2026. Registro de contexto solicitado pelo usuário e brainstorming inicial; propostas não representam funcionalidades aprovadas para implementação.

## Intenção do usuário

Entender a aplicação antes de propor bots para Telegram/site, automações, calculadoras de cripto e outras formas de atrair visitantes. Manter as propostas coerentes com o curso e com as skills de exploração e planejamento. O usuário esclareceu que “DA” significava mercado cripto; não assumir outro domínio.

## Aplicação observada no código

- Marca: Cripto do Zero. Mensagem principal: “Entenda cripto. Decida com critério.” Educação, segurança e gestão de risco, sem promessa de lucro.
- Público inferido: iniciantes e pessoas avançando para trading, futuros e memecoins. Segmentação ainda precisa ser validada com usuários.
- Catálogo local: curso básico com 9 módulos/27 aulas, memecoins com 4/17, futuros com 3/12 e trading com 4/14. Total: 4 jornadas, 20 módulos e 70 aulas. Catálogo publicado no banco pode diferir.
- Aulas com áudio, transcrição, exercícios, quizzes, progresso, revisão e certificado; guias de carteiras e plataformas.
- React/TypeScript/Vite, Tailwind/shadcn, Supabase para autenticação e dados. Existe painel administrativo e programa de afiliados, com taxa prevista de 20%.
- Rotas públicas: /landing, /planos, /explorar e /login. /quiz redireciona para /landing, embora exista um componente de quiz de perfil.
- src/lib/market-prices.ts consulta BTC, ETH e SOL via Binance, com alternativa CoinGecko. Binance usa pares USDT e CoinGecko retorna USD: explicitar a unidade antes de reutilizar em calculadoras. Não há conversão BRL implementada nesse serviço.
- Checkout e processamento de pagamento ainda estão pendentes, conforme /planos e painel de afiliados. Considerar isso antes de campanhas orientadas a vendas.
- Conteúdo de aula é carregado de lesson_content por learning-service.ts. O README descreve uma versão anterior; não usar seu diagnóstico de conteúdo público como conclusão sobre a versão atual sem auditoria própria.
- Não foram encontrados bots, calculadoras ou backend de automação no escopo examinado. Leitura de código local não comprova estado de produção nem migrações aplicadas.

Fontes locais principais: src/App.tsx, src/pages/landing-page.tsx, src/lib/course.ts, src/lib/generated/journeys.json, src/lib/offers.ts, src/lib/market-prices.ts, src/lib/learning-service.ts, src/pages/plans-page.tsx e src/pages/affiliate-page.tsx.

## Direção proposta

Resolver uma dúvida prática gratuitamente, explicar o resultado e oferecer a aula correspondente. Fluxo: conteúdo/busca/Telegram → ferramenta pública → explicação útil → aula de amostra → cadastro → curso. Cadastro deve agregar histórico, alertas ou acompanhamento, sem bloquear o primeiro cálculo.

Oportunidade central: “Laboratório Cripto”, uma central de ferramentas educativas. Esse nome é uma proposta. As ferramentas devem funcionar no celular e cada página deve ter propósito claro, exemplo, hipóteses de cálculo e ligação com a jornada relevante.

## Calculadoras e simuladores

| Proposta | O que entrega | Ligação com o curso | Ordem sugerida |
|---|---|---|---|
| Risco, stop e tamanho da posição | Banca, risco escolhido, entrada e stop → perda planejada, quantidade e exposição | Gestão de risco/trading | 1 |
| Long/short | Entrada, saída, quantidade ou margem/alavancagem → resultado estimado e custos | Futuros | 2 |
| Risco/retorno | Entrada, stop e alvo → relação entre ganho e perda planejados | Trading | Integrar à primeira |
| Preço médio | Compras, quantidades e taxas → custo médio e ponto de equilíbrio | Bitcoin/spot | 3 |
| Recuperação de perdas | Queda percentual → alta necessária para voltar ao valor inicial | Gestão de risco | 3 |
| BTC/satoshis/BRL | Conversões com fonte, unidade e horário da cotação | Fundamentos/Bitcoin | 3 |
| Aportes recorrentes históricos | Aportes em período passado → quantidade, custo e resultado histórico | Bitcoin e rotina | Depois de obter dados históricos confiáveis |
| Custos de operação | Taxas, spread, slippage e funding informado → impacto estimado | Plataformas/futuros | Depois do núcleo |
| Liquidação | Estimativa condicionada ao contrato, corretora e regras de margem | Futuros | Adiar até definir suporte por produto |
| Market cap hipotético | Preço × oferta escolhida → valor de mercado hipotético | Análise de projetos/memecoins | Posterior |

Long/short e compra/venda spot são modos distintos. Começar com contratos lineares; contratos inversos exigem outro cálculo. Alavancagem altera exposição quando a entrada é margem, mas não deve multiplicar novamente o resultado se a quantidade da posição já estiver definida. Stop é um preço de acionamento, não garantia de execução naquele preço. Custos e liquidez podem ampliar a perda efetiva.

Cálculos devem ser funções determinísticas compartilhadas entre site e bot. IA pode explicar, mas não deve ser responsável pela aritmética. BTC/BRL exige fonte de câmbio/preço adequada; não tratar USDT e USD como equivalentes exatos.

## Bots e assistentes

Preferir um bot do produto com vários comandos a vários bots desconectados.

| Proposta | Experiência concreta | Como leva ao site |
|---|---|---|
| Bot de risco | /risco inicia perguntas sobre entrada, stop e banca | Abre a simulação completa e sua explicação |
| Desafio de sete dias | Uma lição curta e um quiz por dia após adesão | Cada dia oferece uma aula/atividade pública relevante |
| Tutor do curso no site | Explica uma dúvida com base em material revisado e indica a aula | Conecta ferramentas ao conteúdo e ajuda alunos a concluir |
| Revisão no Telegram | Lembra cartões/conceitos no horário escolhido | Link para revisão e continuação da aula |
| Alertas personalizados | Notifica quando um preço informado pelo usuário cruza um limite | Link direto para gráfico e cenário salvo |
| Checklist de segurança | Perguntas sobre práticas de custódia, links e permissões | Relatório educativo e guia de segurança |
| Diário de estudo/trade simulado | Registra hipótese, risco e aprendizado | Histórico e análise de disciplina no site |
| Atendimento inicial | Responde dúvidas sobre jornadas, acesso e planos | Direciona para prévia, cadastro ou suporte humano |

Não apresentar checklist ou análise automatizada de token como certificação de segurança. Tutor público deve usar material público; conteúdo pago requer autorização da conta. Não coletar seed/chave privada. Vincular Telegram e conta por fluxo autenticado com token de uso único. Alertas devem ter adesão, frequência configurável e opção de parar.

Telegram oferece comandos, quizzes, botões com URL, links com parâmetros e Mini Apps. Começar com botões para o site; Mini App pode reutilizar as telas depois. Manter conteúdo suficiente no site para que o fluxo alcance o objetivo de aquisição.

## Outros métodos de atração

1. Páginas de ferramentas para buscas específicas: stop loss Bitcoin, tamanho de posição, preço médio e long/short. Conteúdo próprio, exemplos e títulos claros; validar interesse e concorrência antes de estimar tráfego.
2. Vídeos curtos mostrando uma simulação real da ferramenta: o efeito de mudar o stop ou a alavancagem. Link para repetir o cenário.
3. Quiz educativo de conhecimento/perfil de aprendizagem: resultado útil e recomendação de jornada. Reaproveitar o componente existente após revisar perguntas e ativar uma rota; não tratá-lo como teste de adequação financeira.
4. Minicurso gratuito de sete dias, integrado ao bot, com aulas públicas explicitamente selecionadas.
5. Checklist de primeira transferência e guia de reconhecimento de golpes, com versão interativa e compartilhável.
6. Cards de cenários compartilháveis com marca e URL: risco, custos ou recuperação de perdas; ocultar dados pessoais por padrão.
7. Parcerias com criadores e comunidades: links para uma ferramenta útil, preservando a indicação já existente. Evitar comissões fictícias antes de pagamento confirmado.
8. Simulador de decisões com saldo fictício e feedback educativo. Valorizar processo e consistência, não ranking de rentabilidade.
9. Glossário ligado a exemplos interativos: stop, margem, funding, liquidez, satoshis.
10. Sessões de dúvidas e desafios de segurança que conduzam a recursos permanentes no site.

Essas são hipóteses de produto e aquisição, sem promessa de tráfego ou conversão. SEO exige páginas acessíveis/indexáveis; o projeto é uma SPA, então revisar metadados, renderização e indexação das futuras páginas públicas. O Google recomenda conteúdo útil e organização clara, sem garantia de posicionamento.

## Primeira entrega sugerida

1. Central pública /ferramentas e calculadora de risco/stop/tamanho com risco-retorno.
2. Simulador long/short com hipóteses e taxas explícitas, mais uma explicação/aula pública.
3. Um bot Telegram com desafio de sete dias e botão para as ferramentas.
4. Cadastro opcional para salvar cenários; medir uso real antes de investir em tutor com IA, alertas e Mini App.

Medir por origem: visitante → cálculo concluído → aula de amostra → cadastro → início de aula → retorno em sete dias. Quando checkout estiver funcionando: pagamento confirmado. Usar eventos agregados sem registrar valores financeiros digitados por padrão. Preservar código de afiliado na jornada site/bot por identificadores opacos, com atribuição validada no servidor.

Bots precisam de webhook/backend e, para envios programados, agendamento persistente. Token do bot e credenciais de IA ficam no servidor. Não iniciar contratação de serviços ou mudanças na produção neste brainstorming.

## Skills para continuidade

- gsd-explore: explorar público, proposta e prioridades; usada nesta leitura e ideação. Seu workflow foi localizado em C:/Users/igor/.claude/get-shit-done/workflows/explore.md, pois o caminho .Codex indicado pelo SKILL.md não existe.
- gsd-spec-phase / gsd-discuss-phase: detalhar a funcionalidade escolhida e seus critérios antes de implementar.
- gsd-plan-phase: sequenciar implementação quando houver escopo definido.
- gsd-ui-phase e design-taste-frontend: definir telas coerentes com a identidade existente quando o trabalho de UI for solicitado.
- gsd-verify-work: validar fluxos após implementação.

As skills acima, exceto gsd-explore, são encaminhamentos futuros, não foram executadas. Ao retomar, ler este documento e conferir os arquivos atuais. Preservar alterações já presentes do usuário. Não considerar as propostas aprovadas nem converter automaticamente em fases/commits.

## Fontes externas verificadas

- Telegram, recursos dos bots: https://core.telegram.org/bots/features
- Telegram, Mini Apps: https://core.telegram.org/bots/webapps
- Google, SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- CFTC, riscos de mercado e alavancagem: https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/understand_risks_of_virtual_currency.html

O arquivo crypto-do-zero-para-ia.md é material introdutório, não uma base factual automaticamente validada para o tutor. Revisar generalizações, números, exemplos de seed e regras tributárias antes de utilizá-lo em respostas públicas.
