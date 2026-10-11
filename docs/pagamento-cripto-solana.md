# Pagamento em cripto (SOL) na Omega

Pesquisa para implementar o pagamento em SOL, com a Phantom (extensão ou app) como caminho principal. Data: 2026-10-11.

## Resumo da recomendação

Use **Solana Pay para validar** e o **wallet adapter para abrir a carteira** do próprio usuário:

1. **Carteira no navegador (Phantom extensão):** o botão "Pagar com Phantom" chama `sendTransaction` com uma transferência de SOL. A carteira abre sozinha mostrando o valor e o destinatário, e a pessoa só confirma.
2. **Celular ou sem extensão:** mostrar um QR code / link `solana:` (Solana Pay transfer request). Qualquer carteira Solana lê.
3. **Confirmação sempre no servidor:** o site não confia no navegador. O servidor procura a transação pela referência do pedido e valida destinatário e valor na blockchain. Só então libera o acesso.

Isso mantém taxa zero de intermediário e cabe na arquitetura que já temos (`orders` com moeda `SOL`, função de liberação, endpoint de webhook).

## Opções comparadas

| Opção | Como funciona | Prós | Contras | Veredito |
| --- | --- | --- | --- | --- |
| **Wallet adapter + transferência direta** (`@solana/wallet-adapter-react`) | `sendTransaction` com `SystemProgram.transfer`; a Phantom abre o pop-up | Experiência "um clique", a pessoa vê o valor na própria carteira | Só navegador com extensão ou carteira compatível; precisa de RPC | **Usar** para o desktop |
| **Solana Pay transfer request** (`@solana/pay`) | Link/QR `solana:` com valor, destinatário e `reference` | Funciona em qualquer carteira, inclusive no celular; padrão aberto | Pessoa precisa escanear/colar o link | **Usar** para celular |
| **Solana Pay transaction request** | A carteira chama um endpoint seu e recebe a transação pronta | Lógica customizada (desconto, quem paga a taxa) | Mais complexo; especificação antiga | Só se precisar de regra especial |
| **Gateway gerenciado** (NOWPayments e similares) | Você cria uma fatura, eles cuidam de conversão e confirmação | Muitas moedas, plugins prontos | Taxa de 0,4% a 1,5%, custódia/KYC em alguns, mais uma dependência | Não recomendado só para SOL |
| **BTCPay Server** | Servidor próprio, sem taxa percentual | Sem taxa de plataforma | Você opera hospedagem, backup e liquidez; SOL depende de plugin | Só se houver equipe técnica para manter |

Fontes das comparações de gateway são blogs de fornecedores; trate as taxas como aproximadas e confira antes de decidir.

## Como fica no fluxo do checkout

1. Pessoa escolhe **Cripto** no checkout. O preço mostrado é o da oferta `SOL` (ex.: 0,7 SOL para 3 meses), já vindo do catálogo `regional-offers.ts` em lamports.
2. Servidor cria um pedido `pending` com:
   - `currency = 'SOL'` e `amount` em SOL;
   - uma **referência** nova (chave pública aleatória, uma por pedido);
   - `expires_at` (ex.: 30 minutos), porque a cobrança é fixa e a pessoa pode demorar.
3. Frontend mostra o botão "Pagar com Phantom" e o QR code com o mesmo pedido.
4. Pessoa confirma na carteira. A transação leva a referência como conta extra (`SystemProgram.transfer` com a referência incluída nas chaves da instrução), o que permite achá-la depois.
5. Frontend chama `POST /api/crypto/confirm` com a assinatura (signature).
6. Servidor valida na chain: `findReference` + `validateTransfer` (destinatário = carteira da Omega, valor exato em lamports, status confirmado). Marca o pedido `confirmed` e chama a mesma função de liberação do Stripe.
7. Um job de conciliação (cron da Vercel, já existe `api/email/cron.ts` como exemplo) procura pedidos `pending` com `reference` que ainda não foram confirmados pelo frontend, porque a pessoa pode fechar a aba depois de pagar.

## Pontos de atenção técnicos

- **Valor exato.** `validateTransfer` compara o valor. Pagamento com a menor diferença de lamports é recusado. Por isso o valor exibido deve ser exatamente o da oferta, sem arredondamento no cliente.
- **Idempotência.** A assinatura de transação só pode liberar um pedido uma vez. Guardar `provider_reference = signature` com restrição `unique`, igual ao que já fazemos com `stripe_webhook_events`.
- **RPC confiável.** O RPC público da Solana tem limite de requisições e às vezes atrasa. Para produção, usar um provedor de RPC com chave (Helius, QuickNode ou similar) guardada no servidor.
- **Confirmação.** Esperar `confirmed` ou `finalized` antes de liberar acesso. Não liberar com `processed`.
- **Carteira da Omega.** Precisamos do **endereço público** da carteira que recebe SOL. Nunca pedir ou guardar seed phrase/chave privada. Essa carteira deve ser separada da pessoal.
- **Preço fixo em SOL.** A oferta é em SOL, então a cotação não muda o valor cobrado. Só muda o equivalente em reais exibido. Se quisermos mostrar reais "equivalentes", usar a cotação apenas como informação e avisar que pode variar.
- **Teste.** Primeiro em **devnet** (SOL de teste gratuito) e depois mainnet com um valor pequeno.

## Segurança: sites falsos da Phantom

Uma busca retornou um site que se passava pela documentação de integração da Phantom e foi sinalizado como **drainer malicioso**. Use apenas fontes oficiais:

- https://docs.phantom.com
- https://solana.com/docs
- https://github.com/anza-xyz/wallet-adapter
- https://github.com/solana-foundation/pay

Nunca copiar código de um link que pede a seed phrase ou pede para "conectar e assinar" algo fora do fluxo de pagamento.

## Implementação (fase 1: Solana) — feita em 2026-10-11

Status: código e testes prontos, **ainda não aplicados em nenhum ambiente**. Falta aplicar a migração, definir as variáveis e testar em devnet.

### O que existe

| Peça | Arquivo |
| --- | --- |
| Migração (colunas `reference`, `amount_lamports`, `expires_at`, status `expired`, índice único de `reference`, funções `release_order_access` e `fulfill_crypto_order`) | `supabase/migrations/20261011200000_solana_crypto_checkout.sql` |
| Cria o pedido (30 min, referência única, valor em lamports vindo do catálogo) | `api/crypto/create-order.ts` |
| Confirma: `findReference` + `validateTransfer` + valor exato, depois libera o acesso | `api/crypto/confirm.ts` |
| Conciliação por cron (a cada 10 min) | `api/crypto/reconcile.ts` + `vercel.json` |
| Proxy de RPC com lista de métodos permitidos (a chave do provedor nunca vai ao navegador) | `api/crypto/rpc.ts` |
| Lógica de verificação (testável, sem rede) | `server/crypto/payment.ts`, `server/crypto/config.ts` |
| Botão “Pagar com carteira”, QR code, estados | `src/components/solana-checkout.tsx` (carregado sob demanda) |
| Montagem da transação e do link `solana:` | `src/lib/solana-checkout.ts` |

A liberação de acesso não foi duplicada: a migração extrai a lógica de `fulfill_stripe_checkout` para `release_order_access`, e Stripe e Solana chamam a mesma função. O comportamento do Stripe não muda.

### Decisões

- **`@solana/pay@0.2.6` fixa, com `@solana/web3.js` v1.** A série 1.x do `@solana/pay` foi reescrita sobre `@solana/kit`, que não combina com o `wallet-adapter` (web3.js v1). A 0.2.6 mantém `findReference` e `validateTransfer` como na documentação oficial.
- **Valor exato, não “pelo menos”.** `validateTransfer` aceita pagamento maior que o pedido. Além dele, o servidor confere que o saldo do destinatário subiu exatamente o valor em lamports. Pagar a mais ou a menos não libera o acesso e fica como `invalid` para revisão manual.
- **Prazo.** O que vale é o horário do bloco: pagamento incluído até 1 minuto depois de `expires_at` é aceito mesmo que a confirmação chegue depois (cron); depois disso é recusado. O pedido só é marcado `expired` 3 minutos após o prazo.
- **A assinatura vinda do navegador é só uma dica.** O servidor valida a dica e também a que `findReference` encontra; qualquer uma só vale se passar em `validateTransfer`.
- **Idempotência.** `orders.provider_reference` já tem restrição `unique` (da migração inicial), então não foi criado outro índice. Uma assinatura só libera um pedido (erro `23505` vira `signature_used`). `orders.reference` ganhou índice único.
- **Só transações legadas.** Transações versionadas (v0) não passam em `validateTransfer` na 0.2.6. A transação do botão é legada; carteiras que leem o QR normalmente também geram transações legadas para transferências simples.
- Nada de seed phrase ou chave privada em lugar nenhum. A `reference` é um endereço aleatório cuja chave privada é descartada na hora.

### Variáveis de ambiente (somente servidor)

| Variável | Para quê |
| --- | --- |
| `SOLANA_MERCHANT_ADDRESS` | Endereço **público** que recebe os SOL |
| `SOLANA_RPC_URL` | `devnet`, `mainnet-beta` ou a URL completa do provedor (pode conter chave) |
| `SOLANA_CLUSTER` | Opcional. Rótulo da rede quando a URL do RPC não diz qual é |
| `CRON_SECRET` | Já usada pelo cron de e-mail; protege `/api/crypto/reconcile` |

Sem `SOLANA_MERCHANT_ADDRESS` ou `SOLANA_RPC_URL`, as rotas respondem `not_configured` e o checkout mostra que o pagamento ainda não foi configurado. Nada é cobrado.

### Como testar em devnet

1. Aplicar a migração no Supabase (por exemplo com `supabase db push`, ou revisando o SQL no painel).
2. Na Phantom: Configurações → Developer Settings → Testnet Mode → Solana Devnet. Pegar SOL grátis em https://faucet.solana.com.
3. Criar uma carteira **só de teste** para receber (pode ser outra conta da Phantom) e copiar o endereço público.
4. Definir `SOLANA_MERCHANT_ADDRESS=<endereço de teste>` e `SOLANA_RPC_URL=devnet` (mais as chaves do Supabase e `SITE_URL`) e rodar com `vercel dev`. O `npm run dev` do Vite não serve `/api`.
5. Em `/pt-BR/checkout?plan=month&payment=crypto`, entrar na conta e clicar em “Pagar com carteira”. A carteira abre mostrando 0,4 SOL e o destino. Confirmar.
6. Esperado: “Aguardando a confirmação na rede” e, em alguns segundos, “Pagamento confirmado”, com assinatura criada e pedido `confirmed`.
7. Testar o caminho do celular: “Pagar pelo celular (QR code)”, escanear com uma carteira em devnet.
8. Testar a conciliação: pagar e fechar a aba antes da confirmação; depois chamar
   `curl -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/crypto/reconcile`.
9. Testar recusas: pagar um valor diferente pelo link (editando `amount`), deixar o pedido expirar, repetir a mesma assinatura em outro pedido.

Testes automatizados (sem rede, com transações reais montadas em memória): `npm run test:crypto` cobre valor menor e maior por 1 lamport, destinatário errado, referência errada, transação que falhou, pedido expirado, pagamento no prazo confirmado depois, pagamento depois do prazo, assinatura reutilizada, pedido já pago, estados que não podem ser pagos, queda do RPC e o link `solana:` contra o codificador oficial.

### Antes da mainnet

- Receber em uma carteira da Omega separada da pessoal (idealmente hardware wallet), e conferir o endereço duas vezes antes de colocá-lo em `SOLANA_MERCHANT_ADDRESS`.
- Usar um RPC de provedor com chave (Helius, QuickNode ou similar) em `SOLANA_RPC_URL`.
- Fazer uma compra real de valor pequeno e conferir o pedido, a assinatura e o acesso liberado.
- **Cron.** `vercel.json` agenda `/api/crypto/reconcile` a cada 10 minutos. No plano Hobby da Vercel só são aceitos crons diários, e uma expressão mais frequente faz o deploy falhar. Se a conta for Hobby, troque a expressão para `0 12 * * *`. A janela de conciliação é de 48 h, então nenhum pagamento feito no prazo se perde; só demora mais para liberar quando a aba foi fechada.
- Limite de uso do RPC: o navegador consulta `/api/crypto/confirm` a cada ~3,5 s enquanto aguarda. Para tráfego alto, considerar limitar por usuário.
- O proxy `/api/crypto/rpc` exige login e só repassa `getLatestBlockhash`, `getBlockHeight`, `isBlockhashValid`, `getFeeForMessage`, `simulateTransaction`, `sendTransaction` e `getSignatureStatuses`.

### Fora desta fase

Carteiras EVM (MetaMask etc.), ofertas em ETH/USDC e verificação com viem ficam para a fase 2, depois da fase 1 validada. Pix segue “em breve”.

## Fontes

- [Solana Pay](https://solana.com/docs/tools/solana-pay)
- [Solana Pay Specification](https://docs.solanapay.com/spec)
- [Phantom: Request payment](https://docs.phantom.com/recipes/payments/request-payment)
- [Phantom: Send SOL](https://docs.phantom.com/recipes/payments/send-sol)
- [QuickNode: Solana Pay web app](https://www.quicknode.com/guides/solana-development/payments/add-solana-pay-to-your-web-app)
- [Solana: Transaction requests](https://solana.com/news/solana-pay-transaction-requests-bring-on-chain-interactivity-to-the-off-chain-world)
- [Anza: Wallet Adapter (APP.md)](https://github.com/anza-xyz/wallet-adapter/blob/master/APP.md)
- [Solana Pay: merchant integration (GitHub)](https://github.com/solana-foundation/pay/blob/main/typescript/packages/solana-pay/docs/src/core/transfer-request/MERCHANT_INTEGRATION.md)
- [NOWPayments: Best alternatives 2026](https://nowpayments.io/blog/best-coinspaid-alternatives)
- [Plisio: Solana payment gateways 2026](https://plisio.net/crypto/solana-payment-gateway)
