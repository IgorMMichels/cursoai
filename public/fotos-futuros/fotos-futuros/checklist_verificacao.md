# ✅ Checklist de Verificação — Fotos das Plataformas ("Cripto do Zero")

> Use este checklist ANTES de publicar cada guia. Referência completa: `GUIA_INSTALACAO_FOTOS.pdf` e os 3 `PROMPT_IA.md` (um por bloco).

---

## 1. Estrutura de arquivos

- [ ] `cursoai/public/platform-tutorials/` contém as 66 fotos canônicas `.webp` (sem prefixo numérico)
- [ ] Código referencia sempre `/platform-tutorials/<nome>.webp` (nunca os arquivos numerados dos zips)
- [ ] Capas presentes: `fotos-futuros/capas/` (6), `fotos-memecoins/capas/` (5), `fotos-wallets/capas/` (4)
- [ ] Zips íntegros: `fotos-futuros.zip`, `fotos-memecoins.zip`, `fotos-wallets.zip`

## 2. Regras visuais (por foto)

- [ ] Círculo de destaque: overlay **CSS** `#FF4444`, borda 4px, mín. 60px, `pulse 1.5s infinite` — **nunca** desenhado na imagem
- [ ] Legenda abaixo: `▲ texto em pt-BR`, cor `#FF4444`, 14px
- [ ] Elemento < 80px → usar versão com zoom da região
- [ ] Peso < 200KB (todas as entregues estão entre 6–92KB) e formato WebP
- [ ] Dark mode consistente com o tema do site
- [ ] Nenhum dado sensível visível (endereços/saldos já pixelizados)
- [ ] Interface em inglês OK **somente** se a legenda estiver em pt-BR

## 3. Cobertura por bloco

### 01 — FUTUROS (29 fotos)
- [ ] Binance 5 · Bybit 4 · OKX 5 · Bitget 5 · Hyperliquid 5 · MEXC 5
- [ ] ⚠️ `okx-fut-05`: fonte mais fraca — trocar se surgir captura melhor

### 02 — MEMECOINS (22 fotos)
- [ ] Axiom 5 · GMGN 5 · FOMO 3 · Photon 4 · Trojan 4 (+ substituições anotadas no PROMPT_IA.md)
- [ ] ⚠️ **PENDÊNCIA**: FOMO passo 2 (frase de recuperação) — exige print manual do app

### 03 — WALLETS (15 fotos)
- [ ] Phantom 4 · Solflare 4 · Backpack 3 · Rabby 4
- [ ] ⚠️ **PENDÊNCIA**: Backpack passo 2 (frase + PIN) — exige print manual do onboarding
- [ ] Nota: Phantom passo 3 usa aba "Sites" real como substituto do popup de conexão
- [ ] Nota: Rabby passo 4 usa Revoke.cash (ferramenta padrão de revogação EVM)

## 4. Capas (15)

- [ ] Capa no topo de cada guia (800×450, `#0D1117`, logo oficial real)
- [ ] Os 4 "cards fornecidos" (Axiom/GMGN/Photon/Trojan) **não foram anexados** — capas construídas com logo oficial; se os cards originais existirem, substituir mantendo o nome do arquivo

## 5. Decisões em aberto

- [ ] Branding dos títulos SEO: prompt original cita **"Forex Edge"** × site é **"Cripto do Zero"** — definir antes de publicar
- [ ] Prints manuais pendentes (FOMO passo 2, Backpack passo 2) capturados e otimizados (<200KB, WebP)

## 6. Pós-publicação

- [ ] Testar carregamento das fotos em mobile (lazy loading)
- [ ] Verificar animação pulse em Safari/Firefox
- [ ] Conferir alt-text em pt-BR em todas as imagens
