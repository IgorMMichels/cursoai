# Simulador de trade — primeira versão

## Acesso e objetivo

- `/simulador`: ferramenta pública, sem login.
- `/curso/simulador`: a mesma experiência dentro do layout do curso.
- Acessos no header, na central de ferramentas e na barra lateral do curso.
- Treinar decisões sobre tokens de Solana, Ethereum e Base, sem depósitos, conexão de carteira ou ordens reais.

## O que está implementado

O usuário escolhe a rede e cola o CA. O DEX Screener retorna pools do token; a primeira seleção prioriza liquidez informada. O usuário pode trocar de pool. Preço, liquidez, volume, valor de mercado e FDV aparecem quando disponíveis. O GeckoTerminal fornece velas históricas para o gráfico em 1m, 5m, 15m e 1h. Os intervalos 1s, 5s, 10s e 15s agregam os negócios reais recentes da pool em OHLCV, sem inventar velas para períodos vazios. A imagem usa DEX Screener quando disponível e metadata da pool no GeckoTerminal como fallback.

Uma carteira fictícia começa com US$ 10.000. Compras usam um orçamento total, incluindo taxa percentual e custo fixo. O slippage estimado desloca o preço contra a ordem. Vendas podem fechar 25%, 50%, 75% ou 100% da posição. O resultado realizado usa o custo médio proporcional, incluindo custos de entrada e saída. O diário permite anotar o raciocínio da operação.

O exemplo LUMA tem preços e métricas explicitamente fictícios, com um botão para avançar o cenário. As operações do exemplo são identificadas no histórico.

## Arquitetura e carga

- React/Vite existente, com a biblioteca oficial `lightweight-charts` do TradingView (5.2.1).
- Página carregada por `lazy`; o gráfico usa o canvas e as interações nativas do TradingView Lightweight Charts: velas, volume, cursor, escalas, zoom e navegação. Mantém atribuição e link para o TradingView. A biblioteca renderiza os dados obtidos pelo simulador, não fornece cotações e não é o widget completo Advanced Charts.
- APIs consultadas diretamente pelo navegador, sem chaves ou servidor intermediário.
- Preço da pool selecionada consultado a cada 5 segundos; negócios de todos os intervalos a cada 15 segundos e histórico a cada 60 segundos. Outras posições são consultadas em lotes por rede a cada 30 segundos. Retomada imediata ao voltar à aba ou recuperar a conexão.
- Timeout de 12 segundos; falhas usam backoff progressivo até 60 segundos, sem requisições sobrepostas.
- Compra e venda consultam o preço antes de executar. Cancelamento ou falha preserva o saldo; cotação inválida/antiga não produz execução.
- Carteira salva em `localStorage`, chave `cripto-paper-wallet-v1`.
- Limites: 30 posições, 200 operações, gráfico com até 180 pontos recentes.
- Sem sincronização entre contas, dispositivos ou abas.

## Limites do modelo

O preço é indicativo, não uma cotação executável. Não são calculados impacto real na pool, gas on-chain, MEV, impostos do token ou restrições de venda. Taxa, slippage e custo fixo são hipóteses inseridas pelo usuário. O horário mostrado é o da consulta, não uma garantia da idade do último negócio. Tokens ou pools podem ainda não estar indexados pelas fontes.

A pool selecionada recebe atualizações a cada 5 segundos. Outras posições são consultadas em lote a cada 30 segundos; falhas mantêm o último preço, identificado na tabela. Posições são agregadas por rede e CA, preservando custo e quantidade ao trocar de pool. O patrimônio exibido não inclui os custos hipotéticos de saída.

Esta versão oferece spot a mercado. Limit, stop, take-profit, replay, ranking e execução em segundo plano ficam para uma etapa futura. Limpar o armazenamento do navegador apaga a carteira. Rede, CA e pool são restaurados pela URL. O avanço do exemplo e os demais controles reiniciam ao abrir novamente; a carteira e o histórico persistem.

## Arquivos principais

- `src/pages/simulator-page.tsx`: experiência pública e interna.
- `src/styles/simulator.css`: apresentação responsiva.
- `src/lib/paper-market.ts`: validação de CA e integração de mercado.
- `src/lib/paper-trading.ts`: carteira, execução, custos, resultado e persistência.
- `src/lib/paper-trading.test.ts`: testes do motor de simulação.

## Validação

```powershell
node --experimental-strip-types --test src/lib/paper-feed.test.ts src/lib/paper-order.test.ts src/lib/paper-market.test.ts src/lib/paper-chart-data.test.ts src/lib/paper-trading.test.ts src/lib/tool-calculations.test.ts
npm run build
```

31 testes passaram, incluindo lifecycle de polling, execução com nova cotação, troca de pool sem perder a posição, portfolio em lote, integração de imagens/velas e calculadoras. Build de produção concluído. Verificação no navegador externo em desktop e celular: dados e gráfico de Wrapped SOL/Solana e WETH/Base, compra com dados reais, compra fictícia, venda parcial, recuperação da carteira e bloqueio de contrato inválido.

Pesquisa de viabilidade e fontes: `docs/pesquisa-paper-trading-memecoins.md`.

Intervalo de vela não significa atualização a cada segundo. A versão gratuita agrega a janela recente de negócios retornada pela API (e pode acumular até 3.000 negócios durante a sessão); não oferece feed de ticks ao vivo, histórico completo de segundos ou a mesma latência de um terminal comercial.

Revisão de dados, enquadramento e layout do terminal: `docs/superpowers/plans/2026-10-03-simulador-terminal.md`. O intervalo inicial agora é 1m; os intervalos em segundos continuam disponíveis. MCap estimado, volume separado e expansão do gráfico foram adicionados.


Pesquisa e arquitetura da atualização automática: [pesquisa-terminal-trade-2026-10-03.md](pesquisa-terminal-trade-2026-10-03.md).
