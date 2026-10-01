# PROMPT PARA IA — Inserção das 15 fotos nos guias de WALLETS

> Copie e cole o prompt abaixo na IA que vai mexer no código (Cursor, Copilot etc.), com esta pasta disponível no projeto.

---

Você é um desenvolvedor front-end sênior trabalhando no projeto "Cripto do Zero" (React + TypeScript + Tailwind). Sua tarefa é inserir as 15 capturas de tela desta pasta nos guias de carteiras (Phantom, Solflare, Backpack, Rabby), **exatamente** nos passos indicados na tabela abaixo, na ordem dos prefixos numéricos (01 → 15).

## Regras obrigatórias

1. **Arquivos canônicos:** as mesmas imagens já existem SEM o prefixo numérico em `public/platform-tutorials/` — o código deve referenciar `/platform-tutorials/<nome>.webp` (sem o número). Os prefixos desta pasta servem apenas para indicar a ordem de inserção.
2. **Destaque NUNCA gravado na imagem.** O círculo de destaque é um overlay CSS sobre a imagem:
   - círculo vazado `border: 4px solid #FF4444`, diâmetro `60px`;
   - animação `pulse 1.5s infinite` (scale 1 → 1.15 + leve fade);
   - posicionado por `left/top` em `%` relativos ao contêiner — calibre visualmente sobre o elemento da coluna "Destacar".
3. **Legenda** logo abaixo de cada imagem: texto da coluna "Legenda", cor `#FF4444`, `14px`, prefixo `▲ `.
4. Imagens em dark mode (exceto capturas reais que o app exibe em claro), WebP < 200KB — não recomprimir nem converter.
5. A interface das capturas está em inglês (telas reais); a legenda em PT-BR abaixo da imagem é obrigatória.
6. Não crie páginas/seções novas: as imagens entram DENTRO dos passos já existentes dos guias.
7. Nunca exiba dados reais: endereços já foram pixelados — mantenha assim.

## Tabela de inserção (ordem exata)

| # | Arquivo (canônico) | Guia | Entra no passo | Destacar (círculo pulse) | Legenda |
|---|---|---|---|---|---|
| 01 | `phantom-passo1-site` | phantom | Passo 1 · Baixe no site oficial | botão "Download" | ▲ Baixe APENAS em phantom.com — desconfie de clones |
| 02 | `phantom-passo2-frase` | phantom | Passo 2 · Guarde as 12 palavras | checkbox "I saved my Secret Recovery Phrase" | ▲ Anote as 12 palavras no PAPEL — nunca tire print nem envie a ninguém |
| 03 | `phantom-passo3-conexao` | phantom | Passo 3 · Conexão com sites | aba "Sites" | ▲ Antes de conectar, confira a URL do site — golpistas clonam dApps |
| 04 | `phantom-passo4-desconectar` | phantom | Passo 4 · Sites conectados | botão "Disconnect" | ▲ Revise os apps conectados e desconecte o que não usa |
| 05 | `solflare-passo1-site` | solflare | Passo 1 · Acesse o site oficial | barra de URL "solflare.com" | ▲ Confira o endereço: solflare.com — salve nos favoritos |
| 06 | `solflare-passo2-frase` | solflare | Passo 2 · Frase de recuperação | aviso "Never share your recovery phrase" | ▲ Confirme a frase e NUNCA a compartilhe com ninguém |
| 07 | `solflare-passo3-cofre` | solflare | Passo 3 · Cofre (Ledger) vs execução | botão "Stake"/painel da carteira | ▲ Grandes valores no Ledger (cofre) · só o valor de uso na hot wallet |
| 08 | `solflare-passo4-assinaturas` | solflare | Passo 4 · Assinaturas | mensagem de erro da transação | ▲ Leia TUDO antes de assinar — se algo falhar ou parecer estranho, pare |
| 09 | `backpack-passo1-app` | backpack | Passo 1 · Baixe no site oficial | seletor "Imported Wallet" | ▲ Baixe apenas em backpack.app — app e extensão oficiais |
| 10 | `backpack-passo3-saldo` | backpack | Passo 3 · Wallet vs Exchange | saldo total da Wallet | ▲ Saldo da WALLET (autocustódia) ≠ saldo da EXCHANGE (custodiado) |
| 11 | `backpack-passo4-withdraw` | backpack | Passo 4 · Conectar + sacar | painel Send/Swap | ▲ Para sacar da exchange: Withdraw → confira a rede → envie à wallet |
| 12 | `rabby-passo1-site` | rabby | Passo 1 · Instale pelo rabby.io | card "Extension" | ▲ Instale APENAS por rabby.io — extensão, mobile ou desktop |
| 13 | `rabby-passo2-evm` | rabby | Passo 2 · Criação + redes EVM | lista de redes (Ethereum, Base…) | ▲ Uma carteira, todas as redes EVM — selecione a rede certa antes de enviar |
| 14 | `rabby-passo3-simulacao` | rabby | Passo 3 · Simulação de transação | alerta "Never transacted before" | ▲ O Rabby SIMULA a transação — leia os alertas antes de assinar |
| 15 | `rabby-passo4-revogar` | rabby | Passo 4 · Revogar permissões | aba "Approvals" | ▲ Revise e revogue aprovações antigas (Approvals/Revoke.cash) |

## Pendências conhecidas

- **Backpack Passo 2 (frase + PIN):** não existe captura real pública dessa tela de onboarding. Capturar manualmente no app com carteira de teste, pixelar as palavras e salvar como `backpack-passo2-frase.webp` — entraria entre os itens 09 e 10 desta ordem.
- Item 08 usa uma captura real de erro de transação do Solflare como contexto de assinatura; se preferir, substituir por print próprio do popup de aprovação.
- Item 15 mostra o fluxo real no Revoke.cash (padrão do mercado); o Rabby também tem painel próprio de Approvals.

## Capas
Subpasta `capas/` contém os cards 800x450 (PNG, fundo #0D1117, logo oficial real). Usar como imagem de capa/hero do guia de cada plataforma deste bloco.

## Logos (avatars dos cards)
Subpasta `logos/` contém os ícones oficiais 128x128 PNG (1-11KB). No repositório ficam em `public/platform-logos/<slug>.png` — usar como foto de perfil/avatar dos cards de plataforma: `<img src="/platform-logos/<slug>.png" />`.
