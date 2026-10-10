# Stripe Checkout da Omega

## Como o fluxo funciona

1. A pessoa escolhe um plano e entra na conta Omega.
2. O servidor confirma a identidade no Supabase, determina a oferta pela região e cria um pedido pendente.
3. O servidor cria uma sessão hospedada do Stripe Checkout. O navegador nunca envia o preço como fonte de verdade.
4. O webhook valida a assinatura do Stripe e confirma o pedido uma única vez. Só então o Supabase libera o acesso e atribui Founder para os primeiros 25 compradores distintos.

O acesso não é concedido pela página de sucesso: a confirmação vem do webhook. Checkout é pagamento único, não renovação automática.

## Configuração para testar

O Stripe conectado à tarefa está em modo de teste. Não é preciso enviar documentos para testar compras com cartões de teste.

Adicione estas variáveis localmente em `.env.local` e no ambiente Preview da hospedagem:

```dotenv
STRIPE_SECRET_KEY=rk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
SITE_URL=https://<preview-domain>
OMEGA_DEV_COUNTRY=BR
```

`OMEGA_DEV_COUNTRY` is only used for local development when no Vercel country header is present. Set it to `BR`, `US`, or `ES` to preview the corresponding regional offer.

O repositório já usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no navegador. A chave de serviço Supabase e as chaves Stripe são somente de servidor: nunca use o prefixo `VITE_`, não as envie por chat e não as versione no Git.

Crie um endpoint de webhook Stripe para:

```text
https://<domain-do-site>/api/stripe/webhook
```

Inscreva-o nos eventos `checkout.session.completed` e `checkout.session.async_payment_succeeded`. Copie o segredo de assinatura `whsec_...` para `STRIPE_WEBHOOK_SECRET`. O segredo de webhook é diferente da API key.

Para um teste aprovado, use o cartão Stripe `4242 4242 4242 4242`, uma validade futura e qualquer CVC. Conclua o checkout e confirme no Supabase que o pedido ficou `confirmed`, o acesso foi criado e, se a conta estiver entre as primeiras 25, o perfil tem `is_founder = true` e `founder_number`.

## Antes de aceitar dinheiro real

Quando os testes estiverem concluídos, faça o onboarding da conta Stripe para ativar o modo live. A Stripe solicita dados comerciais e do representante, informações fiscais e de pagamento e pode pedir documentos conforme o perfil e a análise da conta. No Brasil, os requisitos podem incluir CPF, identidade e dados bancários. A lista final aparece no Dashboard da própria conta. Depois, configure chaves e webhook live separadamente; nunca substitua as chaves de teste antes de concluir a validação.

Referências: [configuração da conta Stripe](https://docs.stripe.com/get-started/account/set-up), [documentos de verificação aceitos](https://docs.stripe.com/acceptable-verification-documents), [testes de pagamentos](https://docs.stripe.com/testing).
