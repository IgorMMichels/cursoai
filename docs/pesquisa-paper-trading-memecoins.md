# Pesquisa: paper trading de memecoins no navegador

Pesquisa inicial realizada em 03/10/2026. Escopo desta etapa: viabilidade, fontes e arquitetura. A implementação e a revisão posterior estão documentadas em [pesquisa-terminal-trade-2026-10-03.md](pesquisa-terminal-trade-2026-10-03.md).

## Conclusão

É viável lançar gratuitamente um simulador educativo predominantemente client-side: escolher Solana/Ethereum/Base, colar o endereço do token, consultar pools e preço, fazer compras/vendas fictícias com custos configurados e guardar histórico no navegador. Dados externos são necessários; “client-side” significa consumir APIs diretamente, não operar sem serviços de terceiros.

Não prometer preços tick a tick, cobertura de todo token recém-criado ou execução realista apenas com preço indicativo. As APIs gratuitas verificadas usam cache e limites de chamadas. Para memecoins rápidas, distinguir atualização periódica de monitoramento de cada negócio.

## Fontes e limites verificados

| Serviço | Uso proposto | Condições observadas/documentadas |
|---|---|---|
| DEX Screener | Descobrir pools por rede/endereço; preço, liquidez, volume e identificação | API pública; endpoints de pares/tokens documentam 300 requisições/minuto; endpoint de tokens aceita até 30 endereços por chamada |
| GeckoTerminal Public API | Pools e histórico OHLCV para candles | Gratuito; documentação atual indica aproximadamente 10 chamadas/minuto, variável com tráfego, enquanto suporte menciona 30. Não assumir 30 como garantia; atribuir fonte; não confundir com planos CoinGecko Demo/Pro |
| Jupiter Swap V2 | Cotação de tamanho de ordem na Solana, sem executar | Documenta modo sem chave de 30 chamadas/minuto; plano Free com chave de 60/minuto; sem `taker`, `/order` retorna cotação sem transação |
| 0x | Candidato para cotação por ordem em redes EVM | Documentação exige API key; Free Tier aproximadamente 5 RPS; não testado nesta pesquisa. Usar backend mínimo para chave, se selecionado |

Limites podem mudar. Não assumir que limites do DEX Screener são um orçamento independente e garantido por visitante: o escopo efetivo não foi demonstrado. API gratuita não equivale a capacidade ilimitada ou SLA.

## Testes HTTP reais, somente leitura

Requisições realizadas com `Origin: http://localhost:5173`, sem chave:

1. DEX Screener `/token-pairs/v1/solana/So11111111111111111111111111111111111111112`: HTTP 200, `Access-Control-Allow-Origin: *`, `Cache-Control: public, max-age=30`.
2. DEX Screener `/token-pairs/v1/ethereum/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`: HTTP 200, CORS `*`, pares identificados como Ethereum/WETH.
3. DEX Screener `/token-pairs/v1/base/0x4200000000000000000000000000000000000006`: HTTP 200, CORS `*`, pares identificados como Base/WETH.
4. GeckoTerminal `/api/v2/networks/solana/tokens/So11111111111111111111111111111111111111112/pools?page=1`: HTTP 200, CORS `*`, `max-age=30, s-maxage=60`.
5. Após obter uma pool da resposta anterior, consulta `/pools/{pool}/ohlcv/minute?aggregate=1&limit=10`: HTTP 200, CORS `*`, dez candles, mesmo cache de 30/60 segundos.
6. Jupiter `/swap/v2/order?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=100000000`, sem `taker`: HTTP 200, CORS permitindo a origem enviada, valores de entrada/saída e rota, sem transação utilizável.

Esses são testes HTTP pelo terminal, com verificação dos headers; não foram testes ponta a ponta da aplicação no navegador. Os exemplos usam ativos conhecidos para validar infraestrutura, não memecoins recém-lançadas. Não foi medido atraso ponta a ponta do indexador, testada carga, nem comprovada cobertura universal. Cache observado não prova idade exata de todos os preços ou frequência garantida de atualização.

## Experiência recomendada

1. Selecionar rede explicitamente: Solana, Ethereum ou Base.
2. Colar CA; na Solana, é o mint address. Ethereum e Base são redes distintas e um endereço EVM sozinho não identifica qual rede usar.
3. Encontrar pools que correspondam ao token exato. Mostrar nome, símbolo, contrato, rede, DEX, liquidez e pool selecionada. Sugerir uma pool com dados/liquidez válidos, mas permitir escolha; não selecionar por símbolo nem somar preços de pools arbitrárias.
4. Carregar gráfico histórico da pool e identificar qual lado da pool corresponde ao token pesquisado.
5. Disponibilizar saldo fictício em USD e compras/vendas spot, parciais ou totais, com taxa percentual e custo fixo identificados.
6. Mostrar quantidade, custo médio, P&L realizado e não realizado, além de valor líquido estimado para encerrar.
7. Salvar operações e saldo localmente; exportação/importação JSON opcional. Atualizar preço apenas com a ferramenta em uso.

Registrar identidade completa: `chain + tokenAddress + pairAddress + ladoDoToken`, moeda/unidade, fonte, preço observado e horário da observação. Hora da consulta não é necessariamente hora do negócio. Trocar pool não deve reescrever fills históricos; o histórico registra a pool usada em cada operação.

## Modelos de execução

### Modo indicativo multichain

Usar preço da pool e custos escolhidos. Definir se o valor digitado inclui taxas. Exemplo de orçamento total: quantidade = `(orçamento - custo fixo) / (preço efetivo × (1 + taxa percentual))`. Receita de venda = `quantidade × preço efetivo × (1 - taxa percentual) - custo fixo`.

Slippage estimado altera o preço efetivo adversamente; é hipótese editável, não medição da execução. Tolerância de slippage é limite permitido e não taxa automaticamente cobrada. Impacto de preço é efeito do tamanho da ordem e não pode ser inferido com precisão universal a partir de liquidez total em USD.

Não afirmar que um token pode ser vendido só porque há preço exibido. Taxas de transferência, restrições, honeypots, liquidez insuficiente, MEV e falhas de rota podem tornar a simulação otimista.

### Modo cotação Solana

Ao clicar em comprar ou vender, pedir cotação Jupiter para o tamanho exato. Usar `outAmount` e decimais confiáveis; consultar rota de volta para estimar saída. Não assinar nem chamar `/execute`. A cotação já considera componentes da rota: evitar descontar as mesmas taxas/impacto duas vezes. Taxas adicionais escolhidas pelo usuário devem ser discriminadas.

Uma cotação é estimativa naquele instante, não promessa de fill. Decimais/metadados, cobertura de token e ausência de rota precisam de tratamento explícito. O sucesso SOL→USDC observado não demonstra suporte a qualquer memecoin.

## Desempenho e atualização

- Carregar a página e código do simulador sob demanda, seguindo o lazy loading existente.
- Descobrir pools na busca; depois consultar apenas a pool selecionada, em vez de repetir todas as pools a cada ciclo.
- Preço indicativo a cada 30 segundos como ponto de partida; candles a cada 60 segundos. Ajustar ao cache e limites, sem chamar de tempo real por transação.
- Jupiter sob ação de compra/venda; não consultar toda a carteira a cada segundo no modo gratuito.
- Pausar polling quando aba estiver oculta e ao sair da rota; cancelar chamadas antigas na troca de CA e evitar chamadas sobrepostas.
- Deduplicar chamadas por pool dentro da aplicação. Coordenar abas se necessário; não prometer deduplicação entre visitantes sem serviço compartilhado.
- Tratar 429 com backoff e jitter; timeout/erro não pode gerar fill com preço zero ou dado antigo apresentado como atual.
- Guardar histórico estruturado em IndexedDB e preferências pequenas em localStorage. Limitar candles/pontos retidos e carregar uma série inicial pequena.
- Aproveitar Recharts já instalado para um gráfico simples; avaliar candles apenas se necessários. Um iframe externo reduz trabalho, mas adiciona scripts/rede e dificulta ligar fills ao gráfico, então não é a primeira escolha para leveza.

Uma pool consultada a cada 30 segundos gera aproximadamente duas chamadas/minuto por visitante ativo, além de busca/candles/cotações. Isso reduz carga no servidor próprio, mas mantém tráfego e limites dos provedores. Backend com cache pode ser mais eficiente se muitas pessoas seguirem a mesma pool.

## Limitações importantes

- Histórico local pertence ao navegador/dispositivo e pode desaparecer ao limpar dados; não há sincronização automática.
- Saldo local é editável, adequado a treinamento pessoal. Ranking confiável e resultados oficiais exigem validação no servidor.
- Stop automático só pode ser observado enquanto a página está ativa. Ao fechar, não há monitoramento garantido; candles futuros não provam a ordem exata de cruzamentos de stop e alvo.
- Sem dado recente, sinalizar indisponibilidade e suspender fills, preservando o último dado identificado.
- Token sem pool ou ainda não indexado deve produzir estado de não encontrado, não preço inventado.
- Leitura direta dos eventos de todas as DEXs exigiria RPC/WebSocket, indexação e tratamento específico por protocolo; não é uma simplificação gratuita universal.

## Integração com o projeto

Já existem `src/pages/tools-page.tsx`, catálogo `src/lib/tools.ts`, calculadoras, artigos e rotas públicas/internas. A proposta pode virar nova ferramenta, por exemplo `paper-trade-memecoins`, reutilizando o mesmo motor nos contextos público e do curso. Não usar Binance para resolver CA de tokens DEX: o serviço atual cobre símbolos específicos, não contratos arbitrários.

Primeira entrega sugerida: multichain indicativo + histórico local + custos manuais. Segunda: cotações por ordem na Solana. Terceira: avaliar integração EVM e backend mínimo para credenciais/cache. Dados tick a tick ficam como projeto separado, com provedor e orçamento definidos.

## Fontes primárias

- DEX Screener referência: https://docs.dexscreener.com/api/reference
- DEX Screener FAQ/API gratuita: https://docs.dexscreener.com/
- DEX Screener termos de uso: https://docs.dexscreener.com/api/api-terms-and-conditions
- GeckoTerminal limite gratuito: https://support.coingecko.com/hc/en-us/articles/22612838274841-Does-GeckoTerminal-have-an-API
- GeckoTerminal endpoints: https://api.geckoterminal.com/docs/index.html
- CoinGecko guia de OHLCV: https://www.coingecko.com/learn/dex-data-api
- Jupiter limites: https://developers.jup.ag/docs/portal/rate-limits
- Jupiter cotação sem taker: https://developers.jup.ag/docs/swap/order-and-execute
- 0x chave obrigatória: https://docs.0x.org/api-reference/api-overview
- 0x limites: https://docs.0x.org/docs/developer-resources/rate-limits

DEX Screener permite uso comercial sujeito aos termos e restringe produtos cujo propósito principal concorra diretamente com seu serviço. A proposta é ferramenta educativa do curso; não assumir autorização irrestrita para revenda de dados. Revisar termos vigentes ao integrar.
