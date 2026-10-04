# Revisão do simulador — terminal de treino

## Referências e direção

Gravação `WhatsApp Video 2026-10-03 at 21.03.31.mp4` e capturas fornecidas pelo usuário: gráfico amplo, ordem à direita, controles de Preço/MCap e intervalos compactos. Inspiração de composição e interação; não reproduz dados de holders, notificações de carteiras ou indicadores sem integração real. Mantém o tema e a navegação do curso.

## Correções implementadas

- Negócios com o mesmo timestamp conservam a ordem da fonte, em vez de ordenação alfabética do ID. Respostas newest-first são invertidas antes da agregação. OHLC é calculado por essa ordem, com volume deduplicado por ID.
- Atualização incremental da última vela e inclusão de novas velas quando possível. Snapshots idênticos não redesenham as séries. Revisões históricas usam substituição de dados com preservação do intervalo lógico visível.
- Zoom e ponto de navegação preservados quando o histórico desliza ou recebe dados anteriores. ResizeObserver redimensiona o canvas preservando o enquadramento.
- Recarregar o mesmo CA dispara imediatamente uma nova consulta de histórico; não deixa o gráfico vazio até o próximo timer.
- Volume em painel separado, leitura OHLC acima do canvas, controles nativos de escala e ajuste automático.
- Preço/MCap estimado. MCap usa a oferta implícita na seleção da pool, congelada para aquela seleção; não altera orçamento, carteira ou volume. Opção desabilitada quando não há capitalização informada.
- Escala log/linear, zoom, visão do histórico disponível e expansão do gráfico na janela, com saída por botão ou Esc.
- Layout compacto de terminal, com painel de ordem ao lado no desktop e abaixo no celular. Intervalo inicial 1m para apresentar histórico; 1s, 5s, 10s e 15s continuam disponíveis.

## Limites explícitos

Lightweight Charts é o renderizador oficial do TradingView, não o produto Advanced Charts completo. Dados continuam vindo de DEX Screener e GeckoTerminal. Os intervalos em segundos agregam a janela de negócios retornada pela API gratuita, não um stream completo em tempo real. Não há velas inventadas em períodos sem negócios. Horário da última vela e quantidade de velas ficam visíveis nesse modo.

A gravação mostra o terminal de referência; não é uma reprodução dos defeitos na aplicação local. As correções acima foram motivadas pela inspeção do código e validadas no simulador.

## Validação

23 testes passaram: cálculos, preservação de viewport, OHLC por ordem da fonte, conversão de MCap e rejeição de dados inválidos. Build de produção concluído. No navegador: zoom preservado após avanço do exemplo, moeda real, Preço/MCap, 5s, recarga do mesmo CA, expansão/saída e largura de 390px sem overflow horizontal. Nenhum erro de execução registrado na aba de revisão.

```powershell
node --experimental-strip-types --test src/lib/paper-chart-data.test.ts src/lib/paper-market.test.ts src/lib/paper-trading.test.ts src/lib/tool-calculations.test.ts
npm run build
```

Arquivos: `src/components/tools/paper-chart.tsx`, `src/lib/paper-chart-data.ts`, `src/lib/paper-market.ts`, `src/pages/simulator-page.tsx` e `src/styles/simulator.css`.
