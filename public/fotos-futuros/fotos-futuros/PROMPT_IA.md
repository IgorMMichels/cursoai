# PROMPT PARA IA — Inserção das 29 fotos nos guias de FUTUROS

> Copie e cole o prompt abaixo na IA que vai mexer no código (Cursor, Copilot etc.), com esta pasta disponível no projeto.

---

Você é um desenvolvedor front-end sênior trabalhando no projeto "Cripto do Zero" (React + TypeScript + Tailwind). Sua tarefa é inserir as 29 capturas de tela desta pasta nos guias de futuros, **exatamente** nos passos indicados na tabela abaixo, na ordem dos prefixos numéricos (01 → 29).

## Regras obrigatórias

1. **Arquivos canônicos:** as mesmas imagens já existem SEM o prefixo numérico em `public/platform-tutorials/` — o código deve referenciar `/platform-tutorials/<nome>.webp` (sem o número). Os prefixos desta pasta servem apenas para indicar a ordem de inserção.
2. **Destaque NUNCA gravado na imagem.** O círculo de destaque é um overlay CSS posicionado sobre a imagem:
   - círculo vazado `border: 4px solid #FF4444`, diâmetro `60px` (exceção: `hl-01-connect` usa `90px`);
   - animação `pulse 1.5s infinite` (scale 1 → 1.15 + leve fade);
   - posicionado por `left/top` em `%` relativos ao contêiner da imagem — calibre visualmente sobre o elemento indicado na coluna "Destacar".
3. **Legenda** logo abaixo de cada imagem: texto da coluna "Legenda", cor `#FF4444`, `14px`, prefixo `▲ `.
4. Se o elemento a destacar tiver menos de `80px` na tela, use a versão já ampliada (as imagens de zoom desta pasta já resolvem isso).
5. Imagens em dark mode, WebP < 200KB — não recomprimir nem converter.
6. A interface das capturas está em inglês (telas reais das corretoras); a legenda em PT-BR abaixo da imagem é obrigatória.
7. Não crie páginas/seções novas: as imagens entram DENTRO dos passos já existentes dos guias.

## Tabela de inserção (ordem exata)

| # | Arquivo (canônico) | Guia | Entra no passo | Destacar (círculo pulse) | Legenda |
|---|---|---|---|---|---|
| 01 | `binance-fut-01-enable` | binance-futures | Passo 1 · Habilite a conta de Futuros | item "Futures" no menu superior | ▲ Clique aqui: abra "Futuros" no menu superior — confira o endereço binance.com |
| 02 | `binance-fut-02-transfer` | binance-futures | Passo 2 · Transfira margem | ícone ⇄ ao lado de "Avbl … USDC" | ▲ Clique aqui: transfira do Spot para a carteira de Futuros |
| 03 | `binance-fut-03-leverage` | binance-futures | Passo 3 · Configure antes de operar | chips "Cross" e "20x" | ▲ Clique aqui: mude para Isolada e reduza a alavancagem |
| 04 | `binance-fut-04-order` | binance-futures | Passo 4 · Monte a ordem completa | checkbox "TP/SL" + botão "Buy/Long" | ▲ Clique aqui: Take Profit · Stop Loss · Comprar/Long |
| 05 | `binance-fut-05-positions` | binance-futures | Passo 5 · Monitore | "PNL(ROE)" na seção Positions | ▲ Clique aqui: acompanhe o PnL e feche pela própria aba |
| 06 | `bybit-01-transfer` | bybit | Passo 2 · Transferir margem | botão "Transfer" | ▲ Clique aqui: Spot → Derivativos → Transferir |
| 07 | `bybit-02-isolated` | bybit | Passo 3 · Isolated + alavancagem | "Margin 5X" | ▲ Clique aqui: Isolada · ajuste a alavancagem |
| 08 | `bybit-03-order` | bybit | Passo 4 · Ordem com TP/SL | aba "TP/SL" + botão "Buy" | ▲ Clique aqui: TP · SL · Comprar/Long |
| 09 | `bybit-04-positions` | bybit | Passo 5 · Monitorar | aba "TP/SL Order" | ▲ Clique aqui: P&L · Fechar |
| 10 | `okx-fut-01-menu` | okx-futures | Passo 1 · Ativar futuros | "Trade" no menu superior | ▲ Clique aqui: abra Futuros no menu Negociar — confira okx.com |
| 11 | `okx-fut-02-transfer` | okx-futures | Passo 3 · Transferir | linha "Available -- USD" | ▲ Clique aqui: transfira para a conta de trading antes de operar |
| 12 | `okx-fut-03-pair-leverage` | okx-futures | Passo 4 · Par + alavancagem | seletor "BTC/USD" | ▲ Clique aqui: escolha o par · ajuste margem e alavancagem |
| 13 | `okx-fut-04-order` | okx-futures | Passo 5 · Ordem TP/SL | aba "TP/SL" + botão de compra | ▲ Clique aqui: TP · SL · executar a ordem |
| 14 | `okx-fut-05-positions` | okx-futures | Passo 5 · Monitorar | botões de execução/fechamento | ▲ Clique aqui: PnL · Fechar Posição |
| 15 | `bitget-01-menu-transfer` | bitget | Passo 2 · Ativar + transferir | "Futures" no nav | ▲ Clique aqui: Futuros · Transferir |
| 16 | `bitget-02-pair-isolated` | bitget | Passo 4 · Par + Isolated | aba "Isolated 10x" | ▲ Clique aqui: par · Isolada · alavancagem |
| 17 | `bitget-03-order` | bitget | Passo 4 · Ordem TP/SL | checkbox "TP/SL" + botão "Buy" | ▲ Clique aqui: TP · SL · executar |
| 18 | `bitget-04-copy` | bitget | Passo 3 · Copy trading | item "Copy" no nav | ▲ Clique aqui: analise Top Traders · copie com limite |
| 19 | `bitget-05-positions` | bitget | Passo 5 · Monitorar | aba "TP/SL" na régua inferior | ▲ Clique aqui: P&L · Fechar |
| 20 | `hl-01-connect` | hyperliquid | Passo 1 · Conectar wallet | botão "Enable Trading" (círculo 90px) | ▲ Clique aqui: conecte a carteira para liberar o trading |
| 21 | `hl-02-deposit` | hyperliquid | Passo 2 · Depositar USDC | botão "Deposit" | ▲ Clique aqui: confira a rede Arbitrum · Depositar |
| 22 | `hl-03-trade` | hyperliquid | Passo 4 · Par + alavancagem | chips "Cross · 10x" + toggle Long/Short | ▲ Clique aqui: par · alavancagem · Long/Short |
| 23 | `hl-04-stop` | hyperliquid | Passo 4 · Stop loss | checkbox "Take Profit / Stop Loss" | ▲ Clique aqui: defina o stop na mesma tela, antes de confirmar |
| 24 | `hl-05-positions` | hyperliquid | Passo 6 · Monitorar | coluna "PNL (ROE %)" | ▲ Clique aqui: PnL · Fechar |
| 25 | `mexc-01-menu-transfer` | mexc | Passo 2 · Ativar + transferir | botão "Transfer" do modal | ▲ Clique aqui: Futuros · Transferir |
| 26 | `mexc-02-pair` | mexc | Passo 3 · Par (altcoins) | badge de alavancagem (ex.: 500x) na lista | ▲ Clique aqui: escolha o par · confira a alavancagem máxima |
| 27 | `mexc-03-isolated` | mexc | Passo 4 · Isolated + alavancagem | chip "Cross \| 10X" | ▲ Clique aqui: mude para Isolada · alavancagem baixa (ex.: 3x) |
| 28 | `mexc-04-order` | mexc | Passo 6 · Ordem TP/SL | botão "Open Long" + campo TP/SL | ▲ Clique aqui: TP · SL · executar |
| 29 | `mexc-05-positions` | mexc | Passo 6 · Monitorar | opção "Hedge Mode"/posição | ▲ Clique aqui: gerencie o modo de posição · acompanhe o P&L |

## Observações

- Spec completa de posições x/y% dos destaques: seção B6 de `docs/ticker-e-plataformas-contexto.md` (calibrar na implementação, pois as capturas reais substituíram os mockups).
- Capturas 01, 10 e 15 incluem barra de navegador com o domínio oficial — use-as nos passos de "confira o site oficial" sem overlay adicional na barra, apenas círculo sobre o item de menu.

## Capas
Subpasta `capas/` contém os cards 800x450 (PNG, fundo #0D1117, logo oficial real). Usar como imagem de capa/hero do guia de cada plataforma deste bloco.

## Logos (avatars dos cards)
Subpasta `logos/` contém os ícones oficiais 128x128 PNG (1-11KB). No repositório ficam em `public/platform-logos/<slug>.png` — usar como foto de perfil/avatar dos cards de plataforma: `<img src="/platform-logos/<slug>.png" />`.
