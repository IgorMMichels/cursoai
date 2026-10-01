# PROMPT PARA IA — Inserção das 21 fotos nos guias de MEMECOINS

> Copie e cole o prompt abaixo na IA que vai mexer no código (Cursor, Copilot etc.), com esta pasta disponível no projeto.

---

Você é um desenvolvedor front-end sênior trabalhando no projeto "Cripto do Zero" (React + TypeScript + Tailwind). Sua tarefa é inserir as 21 capturas de tela desta pasta nos guias de plataformas de memecoin (Axiom, GMGN, FOMO, Photon, Trojan), **exatamente** nos passos indicados na tabela abaixo, na ordem dos prefixos numéricos (01 → 21).

## Regras obrigatórias

1. **Arquivos canônicos:** as mesmas imagens já existem SEM o prefixo numérico em `public/platform-tutorials/` — o código deve referenciar `/platform-tutorials/<nome>.webp` (sem o número). Os prefixos desta pasta servem apenas para indicar a ordem de inserção.
2. **Destaque NUNCA gravado na imagem.** O círculo de destaque é um overlay CSS sobre a imagem:
   - círculo vazado `border: 4px solid #FF4444`, diâmetro `60px`;
   - animação `pulse 1.5s infinite` (scale 1 → 1.15 + leve fade);
   - posicionado por `left/top` em `%` relativos ao contêiner — calibre visualmente sobre o elemento da coluna "Destacar".
3. **Legenda** logo abaixo de cada imagem: texto da coluna "Legenda", cor `#FF4444`, `14px`, prefixo `▲ `.
4. Se o elemento a destacar tiver menos de `80px`, use a versão ampliada (os zooms desta pasta já resolvem isso).
5. Imagens em dark mode, WebP < 200KB — não recomprimir nem converter.
6. A interface das capturas está em inglês (telas reais das plataformas); a legenda em PT-BR abaixo da imagem é obrigatória.
7. Não crie páginas/seções novas: as imagens entram DENTRO dos passos já existentes dos guias.
8. Nunca exiba dados reais: endereços de carteira já foram pixelados nas imagens — mantenha assim.

## Tabela de inserção (ordem exata)

| # | Arquivo (canônico) | Guia | Entra no passo | Destacar (círculo pulse) | Legenda |
|---|---|---|---|---|---|
| 01 | `axiom-passo1-url` | axiom | Passo 1 · Acesse o site oficial | barra de URL "axiom.trade" | ▲ Confira o endereço: axiom.trade — salve nos favoritos |
| 02 | `axiom-passo2-banca` | axiom | Passo 2 · Defina a banca de risco | botão "Deposit" | ▲ Deposite só a banca de risco — valor que pode perder |
| 03 | `axiom-passo3-pulse` | axiom | Passo 3 · Explore o Pulse + filtros | título "Pulse" / colunas New Pairs · Final Stretch · Migrated | ▲ Use o Pulse: New Pairs → Final Stretch → Migrated |
| 04 | `axiom-passo4-custos` | axiom | Passo 4 · Slippage + priority fee | presets de slippage no painel | ▲ Ajuste slippage e priority fee ANTES de operar |
| 05 | `axiom-passo5-ordem` | axiom | Passo 5 · Entrada e saída | abas Market/Limit + botão de compra | ▲ Defina o valor e execute — planeje a saída antes de entrar |
| 06 | `gmgn-passo1-url` | gmgn | Passo 1 · Acesse o site oficial | barra de URL "gmgn.ai" | ▲ Confira o endereço: gmgn.ai — salve nos favoritos |
| 07 | `gmgn-passo2-wallet` | gmgn | Passo 2 · Conecte carteira dedicada | botão "Sign Up / Log In" | ▲ Conecte uma carteira DEDICADA — nunca a principal |
| 08 | `gmgn-passo3-token` | gmgn | Passo 3 · Avalie o token | colunas "Degen Audit" (NoMint · Burnt · Top 10) | ▲ Confira contrato, liquidez e Top 10 holders antes de entrar |
| 09 | `gmgn-passo4-smartmoney` | gmgn | Passo 4 · Smart money | "Total PnL" + taxa de acerto | ▲ Siga carteiras com PnL consistente — não copie às cegas |
| 10 | `gmgn-passo5-exec` | gmgn | Passo 5 · Execução | botão "Buy" / "Quick Buy" | ▲ Execute pelo Buy — revise o valor antes de confirmar |
| 11 | `fomo-passo1-app` | fomo | Passo 1 · Baixe o app oficial | desenvolvedor "fomo Labs Inc." | ▲ Baixe APENAS o app oficial da fomo Labs Inc. |
| 12 | `fomo-passo3-dex` | fomo | Passo 3 · Investigue no DEX Screener | colunas "LIQUIDITY" e "AGE" | ▲ Investigue no DEX Screener: liquidez, volume e idade do token |
| 13 | `fomo-passo4-custos` | fomo | Passo 4 · Breakdown de custos | market cap do token na lista | ▲ Compare custos e market cap antes de entrar |
| 14 | `photon-passo1-url` | photon | Passo 1 · Confira o domínio | barra de URL "photon-sol.tinyastro.io" | ▲ Confira o domínio: photon-sol.tinyastro.io |
| 15 | `photon-passo2-conexao` | photon | Passo 2 · Conectar + saldo | saldo SOL no topo | ▲ Conecte a wallet e confira o saldo antes de operar |
| 16 | `photon-passo3-memescope` | photon | Passo 3 · Memescope + filtros | botão "Filter" da coluna Newly Created | ▲ Memescope: Newly Created → About to Graduate → Graduated |
| 17 | `photon-passo4-slippage` | photon | Passo 4 · Slippage + saída | régua "Quick Buy · Presets · Snipe" | ▲ Ajuste Quick Buy, presets e Snipe antes de operar |
| 18 | `trojan-passo1-site` | trojan | Passo 1 · Acesse pelo site oficial | título "Trojan on Solana" no Telegram | ▲ Use apenas o bot oficial — confira o username no site trojan.app |
| 19 | `trojan-passo2-custodia` | trojan | Passo 2 · Custódia | linha do endereço (pixelada) + Balance | ▲ O bot CUSTODIA seus fundos — deposite pouco e saque sempre |
| 20 | `trojan-passo3-ordens` | trojan | Passo 3 · Configure ordens | botões "Limit Orders" e "DCA Orders" | ▲ Configure ordens: Buy · Sell · Limit · DCA |
| 21 | `trojan-passo4-confirmacao` | trojan | Passo 4 · Confirmação | botão "Settings" | ▲ Revise as configurações antes de confirmar qualquer ordem |

## Pendências conhecidas

- **FOMO Passo 2 (frase de recuperação):** não existe captura real pública dessa tela (conteúdo sensível). Capturar manualmente no app com frase de teste, pixelar as 12 palavras e salvar como `fomo-passo2-frase.webp` em `public/platform-tutorials/` — entraria entre os itens 11 e 12 desta ordem.
- As capturas 01, 06 e 14 incluem barra de navegador com o domínio oficial; o círculo pulse vai sobre a pílula da URL.

## Capas
Subpasta `capas/` contém os cards 800x450 (PNG, fundo #0D1117, logo oficial real). Usar como imagem de capa/hero do guia de cada plataforma deste bloco.

## Logos (avatars dos cards)
Subpasta `logos/` contém os ícones oficiais 128x128 PNG (1-11KB). No repositório ficam em `public/platform-logos/<slug>.png` — usar como foto de perfil/avatar dos cards de plataforma: `<img src="/platform-logos/<slug>.png" />`.
