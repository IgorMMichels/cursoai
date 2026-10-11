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

## O que falta para implementar

1. Você me passar o **endereço público** da carteira que recebe SOL (e confirmar que é uma carteira da Omega).
2. Escolher o RPC (Helius, QuickNode ou público para começar).
3. Autorizar a criação de um pedido em devnet para teste.

Depois disso o plano de implementação é:

- migração: coluna `reference`, `expires_at`, e índice único em `provider_reference`;
- `api/crypto/create-order.ts` e `api/crypto/confirm.ts`;
- `api/crypto/reconcile.ts` agendado;
- frontend: botão Phantom + QR code no checkout, com estados de espera, expirado e confirmado;
- testes com devnet.

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
