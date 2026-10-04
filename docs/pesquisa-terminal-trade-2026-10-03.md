# Terminal de paper trade: pesquisa e correção do fluxo

Pesquisa em 03/10/2026. Context7 não está exposto pelas ferramentas desta sessão; foram consultadas as fontes oficiais abaixo. Revisão de código e testes no localhost complementam a pesquisa.

## O problema encontrado

Não era somente a aparência das velas. O preço atualizava em um loop, enquanto o gráfico usava outro loop de 60 segundos sem incorporar os negócios recentes aos intervalos de minutos. Voltar de uma aba oculta não acionava atualização imediata. Reabrir a mesma pool podia carregar uma cotação antiga de uma posição. Trocar de token preservava o modo Venda, deixando o botão desabilitado quando não havia posição. Erros de busca se misturavam com erros de cotação. Comprar na aba Histórico não revelava a posição aberta. As posições eram identificadas pela pool, fazendo o mesmo token parecer outro ativo ao trocar de pool.

## O que as APIs realmente oferecem

| Opção | O que entrega | Limitação relevante |
| --- | --- | --- |
| TradingView Lightweight Charts | Canvas, velas, volume, zoom, cursor e escalas | Não entrega dados de mercado; é necessário alimentar `setData` e `update` |
| DEX Screener REST público | Descoberta por CA, pools, preço indicativo, liquidez, volume e metadata | A referência pública não oferece uma assinatura WebSocket de trades ou histórico OHLCV |
| GeckoTerminal REST público | OHLCV por pool e janela de negócios recentes | Tem cache, limites variáveis e cobertura de pools indexadas; não equivale ao streaming de um terminal comercial |
| CoinGecko WebSocket | Preços, trades e OHLCV por pool; intervalos de até 1 segundo | A página atual do produto informa acesso em planos pagos, com chave e créditos |

A documentação pública do GeckoTerminal atualmente indica aproximadamente 10 chamadas/minuto, variável com tráfego; a página de suporte menciona 30. Por isso não se deve projetar usando 30 como garantia. A implementação mantém aproximadamente 4 consultas de negócios + 1 consulta histórica por minuto para a pool selecionada, com tentativas progressivamente espaçadas em falhas. Busca, troca de intervalo e imagens adicionam chamadas pontuais. Várias abas ou clientes no mesmo IP ainda podem compartilhar limites.

Fontes oficiais:

- [TradingView: comparação dos produtos e responsabilidade pelo datafeed](https://tradingview.github.io/lightweight-charts/docs/product-comparison).
- [TradingView: atualizar dados sem substituir o gráfico a cada tick](https://tradingview.github.io/lightweight-charts/tutorials/demos/realtime-updates).
- [DEX Screener: referência REST e limites por endpoint](https://docs.dexscreener.com/api/reference).
- [GeckoTerminal: documentação da API pública](https://api.geckoterminal.com/docs/index.html).
- [CoinGecko: suporte sobre a API do GeckoTerminal](https://support.coingecko.com/hc/en-us/articles/22612838274841-Does-GeckoTerminal-have-an-API).
- [CoinGecko: streaming de preços, swaps e velas](https://www.coingecko.com/en/api/websocket).
- [CoinGecko: contrato de OHLCV por pool, formato e intervalos](https://docs.coingecko.com/reference/pool-ohlcv-contract-address).

## Implementação gratuita aplicada

1. Lifecycle comum de polling: consulta imediata, sem sobreposição, pausa quando a aba está oculta/offline, retoma em visibility/focus/online, cancela ao trocar a seleção e usa backoff até 60 segundos.
2. Cotação da pool selecionada consultada a cada 5 segundos. A conclusão de uma consulta mede a idade da resposta, não a idade do último swap.
3. Negócios consultados a cada 15 segundos para todos os intervalos. Velas de segundos vêm desses swaps; velas de minutos/horas combinam o histórico com a extensão da janela recente. Não há interpolação de negócios ou velas artificiais. O volume de janelas sobrepostas usa o maior valor disponível, sem somá-las duas vezes; ele pode ser parcial enquanto o histórico não consolida.
4. Linha pontilhada "Cotação" no TradingView separa o preço indicativo atual das velas baseadas nos negócios do GeckoTerminal. As fontes podem divergir em valor e idade. Uma pool sem swaps novos não ganha velas inventadas.
5. Compra/venda consulta o preço antes de executar. Valores, custos e lado da ordem ficam congelados durante a consulta; clique repetido não duplica a ordem. Falha, cancelamento ou resposta de outra pool não altera o saldo. Uma nova seleção cancela a operação pendente.
6. Posições agregadas por rede + CA. A pool é o local de execução, não a identidade da posição. Custo médio permanece ao trocar de pool. Outras posições são consultadas em lotes por rede a cada 30 segundos.
7. Busca, gráfico e operação têm erros separados. Selecionar outro token volta ao modo Compra. Comprar abre Posições; vender abre Histórico. Saldo, quantidade e resultado aberto aparecem no painel da ordem.
8. Rede, CA e pool ficam na URL. Atualizar ou compartilhar o link restaura a seleção e inicia as consultas automaticamente. A carteira continua local ao navegador. O eixo temporal e o cursor usam o horário local para moedas reais e UTC no exemplo fictício, preservando rótulos de dia/mês.

## Como chegar à experiência de Axiom/GMGN

Recomendação para uma segunda etapa: manter o gráfico e o motor local, substituindo o adapter REST por um feed licenciado de swaps/velas em WebSocket. Um gateway pequeno mantém a chave no servidor, compartilha uma assinatura por pool entre usuários, faz snapshot REST inicial e transmite apenas eventos normalizados. Isso evita expor a chave num bundle Vite e reduz assinaturas duplicadas. Frontend e simulação continuam leves.

Contrato sugerido: `snapshot {network, token, pool, bars, sourceTime}`; `trade {id, time, priceUsd, volumeUsd}`; `quote {priceUsd, sourceTime, receivedAt}`; `status {connected, delayed, reconnecting}`. Deduplicar por ID, ordenar trades na mesma marca temporal, consolidar OHLCV por intervalo, recuperar lacunas após reconexão e não retroceder a versão da seleção.

Um RPC público isolado não fornece um feed normalizado de todas as DEXs: seria preciso decodificar programas/eventos de cada protocolo, conversão para USD, trades de bonding curves e migração de pools em cada rede. Isso é um indexador, não uma pequena melhoria client-side. Não foi adotada API privada de GMGN/Axiom nem um WebSocket não documentado do DEX Screener.

## Validação

31 testes passaram, cobrindo retomada automática, falhas/backoff, requisições lentas, cancelamento, atualização de velas por novos swaps, execução com nova cotação, falha sem débito, identidade do ativo entre pools e consultas em lote. No navegador, compra simulada de SOL com dados reais, venda parcial, crescimento automático da série, restauração pela URL, troca para WETH/Base e busca inválida sem bloquear a ordem foram verificados. A largura de 390px não produziu overflow horizontal. Build e typecheck da seleção exata destinada aos commits passaram, sem incluir alterações paralelas de áudio/login. O modo gratuito continua com atraso/cache de fornecedor; não entrega fidelidade ou latência de execução real.
