# Exportação das transcrições

Inventário local: 78 transcrições, cobrindo todos os 78 áudios encontrados em `public/audio`. Inclui 70 aulas atuais, boas-vindas e 7 gravações antigas.

## Como usar

- Cada aula tem um Markdown próprio, com curso, módulo, número da aula, título, ID, áudio de origem e transcrição integral.
- [Todas as transcrições](TODAS-AS-TRANSCRICOES.md) reúne o conteúdo completo em ordem de curso, módulo e aula, para fornecer contexto de uma vez.
- [Manifesto JSON](manifesto.json) relaciona arquivos, áudios, IDs e fontes.
- A numeração dos módulos segue o catálogo atual; IDs internos podem ter outra ordem (por exemplo, `m8` é o módulo 03 do Cripto do Zero).

## Origem e limites

Os áudios atuais foram gerados por síntese de voz. A exportação utiliza o texto original preservado nos JSON de legendas que acompanham cada MP3, sem resumir nem reescrever. As 7 gravações antigas não tinham esse texto: foram transcritas por reconhecimento automático de fala local (faster-whisper, modelo small, português), sem revisão humana; podem conter erros de nomes, pontuação ou palavras. Seus nomes de arquivo foram preservados, sem atribuir uma equivalência não confirmada às aulas atuais.

Este inventário cobre arquivos do repositório local, não alterações exclusivas de um banco remoto. A pasta fica em `public`: quando o site for publicado, seu conteúdo será acessível por URL.

## Regenerar a exportação

Execute `node --experimental-strip-types scripts/export-transcriptions.mjs` na raiz do projeto (Node.js 24). Para transcrever novamente os áudios legados que ainda não tenham JSON, execute antes `python scripts/transcribe-legacy-audio.py`; requer faster-whisper e o modelo small já disponível no cache local. O exportador verifica se todos os áudios locais têm transcrição e falha se faltar algum.

## Índice por curso

### Cripto do Zero (28 transcrições)

| Módulo | Aula / gravação | ID | Arquivo |
| --- | --- | --- | --- |
| Apresentação | Boas-vindas: Boas-vindas ao Cripto do Zero | `welcome` | [Transcrição](cripto-do-zero/00-boas-vindas.md) |
| 01 — Entenda o terreno | Aula 1 do módulo 01: Uma rede que mantém o próprio livro-caixa | `m1l1` | [Transcrição](cripto-do-zero/modulo-01/aula-01-uma-rede-que-mantem-o-proprio-livro-caixa.md) |
| 01 — Entenda o terreno | Aula 2 do módulo 01: Bitcoin, ether e tokens: ativos diferentes | `m1l2` | [Transcrição](cripto-do-zero/modulo-01/aula-02-bitcoin-ether-e-tokens-ativos-diferentes.md) |
| 01 — Entenda o terreno | Aula 3 do módulo 01: Carteiras, chaves e custódia | `m1l3` | [Transcrição](cripto-do-zero/modulo-01/aula-03-carteiras-chaves-e-custodia.md) |
| 02 — Faça o básico bem feito | Aula 1 do módulo 02: Como avaliar uma exchange | `m2l1` | [Transcrição](cripto-do-zero/modulo-02/aula-01-como-avaliar-uma-exchange.md) |
| 02 — Faça o básico bem feito | Aula 2 do módulo 02: Ordens a mercado, limitadas e stop | `m2l2` | [Transcrição](cripto-do-zero/modulo-02/aula-02-ordens-a-mercado-limitadas-e-stop.md) |
| 02 — Faça o básico bem feito | Aula 3 do módulo 02: A primeira transferência sem improviso | `m2l3` | [Transcrição](cripto-do-zero/modulo-02/aula-03-a-primeira-transferencia-sem-improviso.md) |
| 03 — Compre Bitcoin com clareza | Aula 1 do módulo 03: Bitcoin à vista, ETF ou P2P? | `m8l1` | [Transcrição](cripto-do-zero/modulo-03/aula-01-bitcoin-a-vista-etf-ou-p2p.md) |
| 03 — Compre Bitcoin com clareza | Aula 2 do módulo 03: Uma compra simulada do começo ao fim | `m8l2` | [Transcrição](cripto-do-zero/modulo-03/aula-02-uma-compra-simulada-do-comeco-ao-fim.md) |
| 03 — Compre Bitcoin com clareza | Aula 3 do módulo 03: Depois da compra: registro e custódia | `m8l3` | [Transcrição](cripto-do-zero/modulo-03/aula-03-depois-da-compra-registro-e-custodia.md) |
| 04 — Leia além do ticker | Aula 1 do módulo 04: Comece pelo problema, não pelo preço | `m3l1` | [Transcrição](cripto-do-zero/modulo-04/aula-01-comece-pelo-problema-nao-pelo-preco.md) |
| 04 — Leia além do ticker | Aula 2 do módulo 04: Oferta, desbloqueios e liquidez | `m3l2` | [Transcrição](cripto-do-zero/modulo-04/aula-02-oferta-desbloqueios-e-liquidez.md) |
| 04 — Leia além do ticker | Aula 3 do módulo 04: Dados, fontes e sinais de alerta | `m3l3` | [Transcrição](cripto-do-zero/modulo-04/aula-03-dados-fontes-e-sinais-de-alerta.md) |
| 05 — Defina o risco antes da entrada | Aula 1 do módulo 05: Capacidade de risco e dinheiro necessário | `m4l1` | [Transcrição](cripto-do-zero/modulo-05/aula-01-capacidade-de-risco-e-dinheiro-necessario.md) |
| 05 — Defina o risco antes da entrada | Aula 2 do módulo 05: Dimensione pelo prejuízo que tolera | `m4l2` | [Transcrição](cripto-do-zero/modulo-05/aula-02-dimensione-pelo-prejuizo-que-tolera.md) |
| 05 — Defina o risco antes da entrada | Aula 3 do módulo 05: Aportes periódicos, diversificação e revisão | `m4l3` | [Transcrição](cripto-do-zero/modulo-05/aula-03-aportes-periodicos-diversificacao-e-revisao.md) |
| 06 — Proteja o acesso | Aula 1 do módulo 06: Golpes que começam com pressa | `m5l1` | [Transcrição](cripto-do-zero/modulo-06/aula-01-golpes-que-comecam-com-pressa.md) |
| 06 — Proteja o acesso | Aula 2 do módulo 06: Assinaturas, permissões e links | `m5l2` | [Transcrição](cripto-do-zero/modulo-06/aula-02-assinaturas-permissoes-e-links.md) |
| 06 — Proteja o acesso | Aula 3 do módulo 06: Sua rotina de segurança e plano de resposta | `m5l3` | [Transcrição](cripto-do-zero/modulo-06/aula-03-sua-rotina-de-seguranca-e-plano-de-resposta.md) |
| 07 — Explore sem confundir rendimento e segurança | Aula 1 do módulo 07: DeFi: contratos, protocolos e dependências | `m6l1` | [Transcrição](cripto-do-zero/modulo-07/aula-01-defi-contratos-protocolos-e-dependencias.md) |
| 07 — Explore sem confundir rendimento e segurança | Aula 2 do módulo 07: Staking, empréstimos e provisão de liquidez | `m6l2` | [Transcrição](cripto-do-zero/modulo-07/aula-02-staking-emprestimos-e-provisao-de-liquidez.md) |
| 07 — Explore sem confundir rendimento e segurança | Aula 3 do módulo 07: Registros e impostos no Brasil | `m6l3` | [Transcrição](cripto-do-zero/modulo-07/aula-03-registros-e-impostos-no-brasil.md) |
| 08 — Futuros: long, short e padrões | Aula 1 do módulo 08: Spot, futuro e posição comprada ou vendida | `m9l1` | [Transcrição](cripto-do-zero/modulo-08/aula-01-spot-futuro-e-posicao-comprada-ou-vendida.md) |
| 08 — Futuros: long, short e padrões | Aula 2 do módulo 08: Tendência, suporte, resistência e rompimentos | `m9l2` | [Transcrição](cripto-do-zero/modulo-08/aula-02-tendencia-suporte-resistencia-e-rompimentos.md) |
| 08 — Futuros: long, short e padrões | Aula 3 do módulo 08: Simulador de exposição e liquidação | `m9l3` | [Transcrição](cripto-do-zero/modulo-08/aula-03-simulador-de-exposicao-e-liquidacao.md) |
| 09 — Transforme estudo em processo | Aula 1 do módulo 09: Decida fora do ruído | `m7l1` | [Transcrição](cripto-do-zero/modulo-09/aula-01-decida-fora-do-ruido.md) |
| 09 — Transforme estudo em processo | Aula 2 do módulo 09: Escreva sua política pessoal | `m7l2` | [Transcrição](cripto-do-zero/modulo-09/aula-02-escreva-sua-politica-pessoal.md) |
| 09 — Transforme estudo em processo | Aula 3 do módulo 09: Seu roteiro de 30 dias | `m7l3` | [Transcrição](cripto-do-zero/modulo-09/aula-03-seu-roteiro-de-30-dias.md) |

### Jornada de Memecoins (17 transcrições)

| Módulo | Aula / gravação | ID | Arquivo |
| --- | --- | --- | --- |
| 01 — Fundamentos | Aula 1 do módulo 01: O que são memecoins | `meme-m1l1` | [Transcrição](memecoins/modulo-01/aula-01-o-que-sao-memecoins.md) |
| 01 — Fundamentos | Aula 2 do módulo 01: Market cap e FDV | `meme-m1l2` | [Transcrição](memecoins/modulo-01/aula-02-market-cap-e-fdv.md) |
| 01 — Fundamentos | Aula 3 do módulo 01: Liquidez: o que sustenta o preço | `meme-m1l3` | [Transcrição](memecoins/modulo-01/aula-03-liquidez-o-que-sustenta-o-preco.md) |
| 01 — Fundamentos | Aula 4 do módulo 01: Volume e holders | `meme-m1l4` | [Transcrição](memecoins/modulo-01/aula-04-volume-e-holders.md) |
| 01 — Fundamentos | Aula 5 do módulo 01: DEX e swaps | `meme-m1l5` | [Transcrição](memecoins/modulo-01/aula-05-dex-e-swaps.md) |
| 02 — Análise | Aula 1 do módulo 02: Como encontrar tokens | `meme-m2l1` | [Transcrição](memecoins/modulo-02/aula-01-como-encontrar-tokens.md) |
| 02 — Análise | Aula 2 do módulo 02: Como analisar liquidez e LP | `meme-m2l2` | [Transcrição](memecoins/modulo-02/aula-02-como-analisar-liquidez-e-lp.md) |
| 02 — Análise | Aula 3 do módulo 02: Contrato e permissões perigosas | `meme-m2l3` | [Transcrição](memecoins/modulo-02/aula-03-contrato-e-permissoes-perigosas.md) |
| 02 — Análise | Aula 4 do módulo 02: Distribuição de holders e insiders | `meme-m2l4` | [Transcrição](memecoins/modulo-02/aula-04-distribuicao-de-holders-e-insiders.md) |
| 02 — Análise | Aula 5 do módulo 02: Comunidade e narrativa | `meme-m2l5` | [Transcrição](memecoins/modulo-02/aula-05-comunidade-e-narrativa.md) |
| 03 — Operação | Aula 1 do módulo 03: Ferramentas e preparo da carteira | `meme-m3l1` | [Transcrição](memecoins/modulo-03/aula-01-ferramentas-e-preparo-da-carteira.md) |
| 03 — Operação | Aula 2 do módulo 03: Entradas e saídas com plano | `meme-m3l2` | [Transcrição](memecoins/modulo-03/aula-02-entradas-e-saidas-com-plano.md) |
| 03 — Operação | Aula 3 do módulo 03: Slippage, taxas e MEV | `meme-m3l3` | [Transcrição](memecoins/modulo-03/aula-03-slippage-taxas-e-mev.md) |
| 03 — Operação | Aula 4 do módulo 03: Gestão de posição e banca | `meme-m3l4` | [Transcrição](memecoins/modulo-03/aula-04-gestao-de-posicao-e-banca.md) |
| 04 — Riscos e golpes | Aula 1 do módulo 04: Rug pulls e soft rugs | `meme-m4l1` | [Transcrição](memecoins/modulo-04/aula-01-rug-pulls-e-soft-rugs.md) |
| 04 — Riscos e golpes | Aula 2 do módulo 04: Golpes comuns fora do contrato | `meme-m4l2` | [Transcrição](memecoins/modulo-04/aula-02-golpes-comuns-fora-do-contrato.md) |
| 04 — Riscos e golpes | Aula 3 do módulo 04: Checklist final do operador | `meme-m4l3` | [Transcrição](memecoins/modulo-04/aula-03-checklist-final-do-operador.md) |

### Jornada de Futuros (12 transcrições)

| Módulo | Aula / gravação | ID | Arquivo |
| --- | --- | --- | --- |
| 01 — Base dos contratos | Aula 1 do módulo 01: O que são futuros perpétuos | `fut-m1l1` | [Transcrição](futuros/modulo-01/aula-01-o-que-sao-futuros-perpetuos.md) |
| 01 — Base dos contratos | Aula 2 do módulo 01: Long e short na prática | `fut-m1l2` | [Transcrição](futuros/modulo-01/aula-02-long-e-short-na-pratica.md) |
| 01 — Base dos contratos | Aula 3 do módulo 01: Alavancagem e margem | `fut-m1l3` | [Transcrição](futuros/modulo-01/aula-03-alavancagem-e-margem.md) |
| 01 — Base dos contratos | Aula 4 do módulo 01: Funding rate e basis | `fut-m1l4` | [Transcrição](futuros/modulo-01/aula-04-funding-rate-e-basis.md) |
| 02 — Execução | Aula 1 do módulo 02: Tipos de ordem nos futuros | `fut-m2l1` | [Transcrição](futuros/modulo-02/aula-01-tipos-de-ordem-nos-futuros.md) |
| 02 — Execução | Aula 2 do módulo 02: Preço de marca e liquidação | `fut-m2l2` | [Transcrição](futuros/modulo-02/aula-02-preco-de-marca-e-liquidacao.md) |
| 02 — Execução | Aula 3 do módulo 02: Stop, alvo e ordens combinadas | `fut-m2l3` | [Transcrição](futuros/modulo-02/aula-03-stop-alvo-e-ordens-combinadas.md) |
| 02 — Execução | Aula 4 do módulo 02: Tamanho de posição e risco por trade | `fut-m2l4` | [Transcrição](futuros/modulo-02/aula-04-tamanho-de-posicao-e-risco-por-trade.md) |
| 03 — Estratégia e risco | Aula 1 do módulo 03: Contexto e padrões de mercado | `fut-m3l1` | [Transcrição](futuros/modulo-03/aula-01-contexto-e-padroes-de-mercado.md) |
| 03 — Estratégia e risco | Aula 2 do módulo 03: Hedge com futuros | `fut-m3l2` | [Transcrição](futuros/modulo-03/aula-02-hedge-com-futuros.md) |
| 03 — Estratégia e risco | Aula 3 do módulo 03: Erros que liquidam contas | `fut-m3l3` | [Transcrição](futuros/modulo-03/aula-03-erros-que-liquidam-contas.md) |
| 03 — Estratégia e risco | Aula 4 do módulo 03: Plano de trade completo | `fut-m3l4` | [Transcrição](futuros/modulo-03/aula-04-plano-de-trade-completo.md) |

### Jornada de Trading (14 transcrições)

| Módulo | Aula / gravação | ID | Arquivo |
| --- | --- | --- | --- |
| 01 — Leitura de mercado | Aula 1 do módulo 01: Candles e o que eles contam | `trd-m1l1` | [Transcrição](trading/modulo-01/aula-01-candles-e-o-que-eles-contam.md) |
| 01 — Leitura de mercado | Aula 2 do módulo 01: Suporte e resistência | `trd-m1l2` | [Transcrição](trading/modulo-01/aula-02-suporte-e-resistencia.md) |
| 01 — Leitura de mercado | Aula 3 do módulo 01: Tendência e estrutura de mercado | `trd-m1l3` | [Transcrição](trading/modulo-01/aula-03-tendencia-e-estrutura-de-mercado.md) |
| 01 — Leitura de mercado | Aula 4 do módulo 01: Volume como confirmação | `trd-m1l4` | [Transcrição](trading/modulo-01/aula-04-volume-como-confirmacao.md) |
| 02 — Análise técnica aplicada | Aula 1 do módulo 02: Médias móveis | `trd-m2l1` | [Transcrição](trading/modulo-02/aula-01-medias-moveis.md) |
| 02 — Análise técnica aplicada | Aula 2 do módulo 02: RSI e momentum | `trd-m2l2` | [Transcrição](trading/modulo-02/aula-02-rsi-e-momentum.md) |
| 02 — Análise técnica aplicada | Aula 3 do módulo 02: Confluência de sinais | `trd-m2l3` | [Transcrição](trading/modulo-02/aula-03-confluencia-de-sinais.md) |
| 02 — Análise técnica aplicada | Aula 4 do módulo 02: Timeframes e o quadro maior | `trd-m2l4` | [Transcrição](trading/modulo-02/aula-04-timeframes-e-o-quadro-maior.md) |
| 03 — Gestão de risco | Aula 1 do módulo 03: Risco por operação | `trd-m3l1` | [Transcrição](trading/modulo-03/aula-01-risco-por-operacao.md) |
| 03 — Gestão de risco | Aula 2 do módulo 03: Relação risco-retorno | `trd-m3l2` | [Transcrição](trading/modulo-03/aula-02-relacao-risco-retorno.md) |
| 03 — Gestão de risco | Aula 3 do módulo 03: Drawdown e recuperação | `trd-m3l3` | [Transcrição](trading/modulo-03/aula-03-drawdown-e-recuperacao.md) |
| 04 — Rotina do trader | Aula 1 do módulo 04: Plano de trading | `trd-m4l1` | [Transcrição](trading/modulo-04/aula-01-plano-de-trading.md) |
| 04 — Rotina do trader | Aula 2 do módulo 04: Diário de operações | `trd-m4l2` | [Transcrição](trading/modulo-04/aula-02-diario-de-operacoes.md) |
| 04 — Rotina do trader | Aula 3 do módulo 04: Psicologia e disciplina | `trd-m4l3` | [Transcrição](trading/modulo-04/aula-03-psicologia-e-disciplina.md) |

### Áudios legados (7 transcrições)

| Módulo | Aula / gravação | ID | Arquivo |
| --- | --- | --- | --- |
| Nomenclatura original; sem associação confirmada com as aulas atuais | Gravação antiga: Boas-vindas (versão antiga) | `boas_vindas` | [Transcrição](legado/boas_vindas.md) |
| Nomenclatura original; sem associação confirmada com as aulas atuais | Gravação antiga: Blockchain | `m1_blockchain` | [Transcrição](legado/m1_blockchain.md) |
| Nomenclatura original; sem associação confirmada com as aulas atuais | Gravação antiga: Comprar com segurança | `m2_comprar_seguro` | [Transcrição](legado/m2_comprar_seguro.md) |
| Nomenclatura original; sem associação confirmada com as aulas atuais | Gravação antiga: Análise | `m3_analise` | [Transcrição](legado/m3_analise.md) |
| Nomenclatura original; sem associação confirmada com as aulas atuais | Gravação antiga: Risco | `m4_risco` | [Transcrição](legado/m4_risco.md) |
| Nomenclatura original; sem associação confirmada com as aulas atuais | Gravação antiga: Golpes | `m5_golpes` | [Transcrição](legado/m5_golpes.md) |
| Nomenclatura original; sem associação confirmada com as aulas atuais | Gravação antiga: Mentalidade | `m7_mentalidade` | [Transcrição](legado/m7_mentalidade.md) |
