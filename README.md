# Cripto do Zero

Plataforma de educação sobre criptoativos: Bitcoin, Ethereum, carteiras, análise de projetos, DeFi, futuros e gestão de risco. Feita em React, TypeScript, Vite, Tailwind CSS v4, shadcn/ui e Framer Motion. Autenticação, perfil, progresso, quizzes, avaliações, certificados e operações de afiliados usam Supabase. Pagamentos e ativação de assinaturas ainda dependem de backend seguro.

## Rodar localmente

Requer Node.js 20.19+.

```bash
npm install
npm run dev
```

O Vite informa o endereço local. Para gerar a versão de publicação:

```bash
npm run build
npm run preview
```

Como a aplicação usa React Router, configure a hospedagem para redirecionar rotas desconhecidas para `index.html`.

## Percurso de demonstração

- `/` abre `/landing`. O quiz está desativado; `/quiz` redireciona para a apresentação.
- `/landing` apresenta a trilha e os três planos.
- A seleção de plano é informativa. Checkout, cobrança e ativação de acesso ainda não estão conectados.
- `/login` oferece cadastro, login e recuperação por e-mail quando Supabase está configurado. Sem credenciais, somente áreas públicas funcionam.
- O aluno pode avançar pelas 27 aulas, ouvir as narrações, acompanhar a transcrição com destaque de palavras, responder atividades e quizzes, revisar conceitos e gerar certificado ao concluir.
- A área de administrador exige papel provisionado por processo confiável. Alunos autenticados podem aderir ao programa de afiliados em `/afiliar`; login público não escolhe papéis.
- Links `?ref=<código>` registram cliques no Supabase; o cadastro recebe código de indicação validado pelo banco.

Sem Supabase, o app não oferece login demo nem persistência local para substituir a conta.

### Planos e comissões de demonstração

| Plano de referência | Solana | Reais |
|---|---:|---:|
| 1 mês | 0,4 SOL | R$ 299 |
| 3 meses | 0,7 SOL | R$ 549 |
| Vitalício | 0,9 SOL | R$ 699 |

SOL não é convertido em tempo real. Comissão prevista é de 20% na mesma moeda, com BRL e SOL separados. O site ainda não cobra, confirma pedidos nem paga comissões automaticamente.

## Estrutura

### Radar e bots locais

O piloto em `/radar` e `/curso/radar` reúne Market Pulse (RSS real), Funding Monitor (BTC/ETH/SOL) e um resumo. O serviço em `bots/` é independente e pode ser levado para outra pasta ou VM.

```bash
npm run bots:install
npm run bots:start
```

Em outro terminal, rode `npm run dev`. As fontes são coletadas a cada 60 segundos; a página recebe SSE e consulta a API a cada 15 segundos. Discord e Telegram são opcionais, configurados somente em `bots/.env.local`.

Veja [instalação, canais e VM](bots/README.md) e [avaliação de todos os bots do pacote](docs/bots-avaliacao.md). `npm run bots:export` cria um ZIP portátil sem segredos. Para o site publicado, configure `VITE_BOTS_API_URL` com a URL HTTPS do serviço remoto e publique um novo build.

```text
src/
  components/       Layouts, identidade visual, controles e componentes shadcn/ui
  contexts/         Sessão autenticada e autorização de acesso
  lib/course.ts     Conteúdo e atividades das aulas
  lib/audio-tracks.ts  faixas de áudio válidas para os roteiros atuais
  lib/narration-script.ts  textos e tipos compartilhados entre curso e áudio
  lib/narration-timing.ts  validação e sincronização de palavras
  lib/generated/narrations.ts  catálogo gerado de 28 narrações
  styles/bento.css  grids responsivos por prioridade de conteúdo
  components/audio-narration.tsx  player MP3 e transcrição sincronizada
  lib/offers.ts     Preços e comissão
  lib/storage.ts    Dados auxiliares do navegador e código de indicação
  pages/            Quiz, landing, login, curso, admin e afiliado
public/audio/narrated/ MP3s e marcações de tempo gerados por aula
scripts/            Geração e atualização das narrações
docs/               Documentação e material de apoio
supabase/
  migrations/       Esquema, RLS e funções do Supabase
```

Imagens de capa usam URLs do Unsplash e precisam de conexão com a internet. Cada uma das 27 aulas e a abertura tem uma narração em português, produzida a partir do texto publicado na própria aula. Transcrições usam marcações reais de palavras da geração de voz; o player verifica que texto, duração e marcações correspondem antes de exibir acompanhamento. Se aula mudar, faixa antiga deixa de aparecer até regeneração.

### Regenerar narrações

Use Python 3.10+, Node.js e FFmpeg (`ffprobe` no PATH). Geração usa Edge TTS e voz `pt-BR-AntonioNeural`:

```bash
python -m pip install -r scripts/audio-requirements.txt
python scripts/generate-narrations.py
```

O script exporta o conteúdo atual do curso, cria MP3s e marcações de palavra em `public/audio/narrated/` e atualiza `src/lib/generated/narrations.ts`. Revise texto da aula antes de publicar; transcrição gerada sempre espelha roteiro e áudio.

## Supabase: autenticação e perfil

O cliente `@supabase/supabase-js` conecta login por e-mail e senha, perfil, foto, papéis, assinaturas, progresso, quizzes, avaliações, certificados e afiliados. Sem credenciais, somente áreas públicas funcionam. Pedidos, confirmação de pagamento e criação de comissões exigem funções confiáveis no servidor.

1. Crie um projeto Supabase. Ative autenticação por e-mail e senha. O app usa URL e chave publicável no cliente, como na [configuração oficial de React](https://supabase.com/docs/guides/auth/quickstarts/react).
2. Copie `.env.example` para `.env.local` e preencha:

   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   Essas variáveis são enviadas ao navegador. Nunca coloque `service_role`, segredo de pagamento ou chave privada Solana nelas.

3. Vincule o CLI ao projeto e aplique as migrações. O `project-ref` aparece na URL do dashboard (`/project/<project-ref>`):

   ```bash
   supabase login
   supabase link --project-ref <project-ref>
   supabase db push --dry-run
   supabase db push
   ```

   Revise a lista do `--dry-run` antes de aplicar. O CLI exige sessão autenticada e senha do banco na primeira vinculação. Também é possível aplicar os nove arquivos em `supabase/migrations/`, em ordem, pelo SQL Editor.

4. Instale dependências e reinicie o Vite após alterar `.env.local`:

   ```bash
   npm install
   npm run dev
   ```

5. As migrações usadas pelo app são:

   - `20260928000000_initial_schema.sql`: tabelas, papéis, assinaturas e políticas RLS iniciais.
   - `20260929221938_harden_email_auth_and_referrals.sql`: papel inicial de aluno e atribuição segura de indicação.
   - `20260929222338_profile_details_and_avatar_storage.sql`: bio, região, caminho da foto e bucket `profile-avatars`.
   - `20260929230130_use_invoker_rls_helpers.sql`: leitura pública sem RPC privilegiada; helpers RLS executam como invocador.
   - `20260929233000_check_subscription_window.sql`: assinatura só libera acesso dentro do período ativo.
   - `20260930000000_seed_course_catalog.sql`: catálogo público de 9 módulos e 27 aulas.
   - `20260930000100_connect_learning_community_and_affiliates.sql`: dados de aprendizagem, avaliações, certificados, cliques e solicitações de saque.
   - `20260930000200_secure_module_quizzes.sql`: perguntas e correção de quizzes no banco, sem expor respostas antes da tentativa.
   - `20260930000300_self_service_affiliate_enrollment.sql`: adesão autenticada ao programa, com comissão definida pelo banco em 20%.

   Revise em projeto de desenvolvimento antes de aplicar em produção. A migração de perfil restringe leitura/edição da linha ao usuário autenticado e upload/remoção de imagens à pasta do próprio ID.

6. Configure Authentication → URL Configuration para permitir o domínio local e publicado, com `/login` e `/login?recovery=1`. O app requer senha de pelo menos 12 caracteres. Configure SMTP próprio antes de produção; envio padrão tem limites baixos.
7. O botão do perfil no rodapé da sidebar abre edição de nome, foto, apresentação e cidade/região. Avatar é recortado em WebP até 512 px e enviado ao bucket público `profile-avatars`; as URLs das fotos são públicas. Não envie documento ou imagem sensível.
8. Crie usuários admin por processo confiável no servidor ou SQL Editor. Alunos podem entrar em `/afiliar`; a função `join_affiliate_program` valida a sessão e cria código/ comissão no banco. Não permita que navegador atribua papel admin. O front lê `app_roles`; metadados editáveis não autorizam acesso. A rota `/curso` exige assinatura ativa, ainda que links locais ou dados pendentes sejam alterados. Veja as regras de [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) e do [Supabase Storage](https://supabase.com/docs/guides/storage/security/access-control).
9. Login, perfis e assinaturas ativas leem o Supabase. Avatar é recortado em WebP até 512 px e enviado ao bucket público `profile-avatars`; não envie documento ou imagem sensível.
10. Progresso, checklist de segurança, perfil de aprendizagem, quizzes, avaliações e certificados são persistidos no Supabase. Avaliações novas ficam pendentes até moderação administrativa.
11. Cliques de indicação e solicitações de saque são registrados no banco. O painel pode moderar avaliações e processar solicitações; marcar saque como pago apenas muda status, não transfere dinheiro.
12. Pedidos, confirmação de pagamento, ativação de assinatura, criação/estorno de comissão e transferências de saque precisam de funções server-side. Use idempotência e mantenha segredos no servidor. Para Solana, valide assinatura, rede, destino, valor e confirmações no backend.
13. O banco tem metadados dos módulos e aulas, mas textos e áudios completos ainda ficam no bundle público do front-end. A proteção de rota não torna esse conteúdo privado. Antes de vender acesso, mova as aulas para `lesson_content` e os áudios para bucket privado com URLs assinadas.

No protótipo, acesso mensal expira em 30 dias e o trimestral em 90. Vitalício não recebe data de expiração. A migração representa esse modelo com `subscriptions.expires_at`; o servidor deve ser a fonte de verdade para ativação, renovação, estorno e expiração.

## Pesquisa usada no curso

As aulas alternam explicação curta, pergunta de recordação com feedback, exercício aplicado e cartões de revisão com intervalo sugerido. Estudos em ambientes online associam prática espaçada e quizzes com feedback a melhores resultados de aprendizagem; veja [espaçamento autorregulado em um MOOC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7076029/) e [prática de recuperação em cursos de fisiologia](https://pmc.ncbi.nlm.nih.gov/articles/PMC6842879/).

O conteúdo evita promessa de rendimento e alerta para riscos e fraude, seguindo materiais oficiais da [CVM sobre criptoativos e ofertas irregulares](https://www.gov.br/investidor/pt-br/investir/cuidados-ao-investir/evitando-problemas/principais-fraudes-e-esquemas-irregulares/criptoativos-e-icos). O módulo tributário não fixa limites ou alíquotas: consulte as [orientações atuais da Receita Federal sobre criptoativos](https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/declaracoes-e-demonstrativos/criptoativos/criptoativos) e um profissional para cada situação.

## Tecnologias de UI

O setup segue a instalação oficial de [shadcn/ui para Vite](https://ui.shadcn.com/docs/installation/vite), com tokens de tema escuro próprios, componentes locais e Tailwind CSS v4. Login e perfil usam Supabase quando configurado; pagamentos, autorização de assinaturas e transferências de saque ainda precisam de serviços de backend.

## Loading Omega 3D

A entrada usa a logo ASCII em GLB, com Three.js e transições GSAP. Para rever localmente, execute `npm run dev` e abra `/loading-preview` (somente em desenvolvimento). Preparação do modelo, fontes técnicas e verificações em [docs/omega-loading-glb.md](docs/omega-loading-glb.md).
