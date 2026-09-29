# Cripto do Zero

Plataforma de educação sobre criptoativos: Bitcoin, Ethereum, carteiras, análise de projetos, DeFi, futuros e gestão de risco. Feita em React, TypeScript, Vite, Tailwind CSS v4, shadcn/ui e Framer Motion. Progresso, pedidos e comissões ainda usam dados locais. Login real opcional usa Supabase Auth com e-mail e senha; Google não é usado.

## Rodar localmente

Requer Node.js 20.19+.

```bash
cd cripto-mentoria
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
- Escolha um plano e uma moeda para criar um pedido de demonstração; a tela de acesso deixa claro que não há cobrança.
- `/login` oferece cadastro, login e recuperação por e-mail quando Supabase está configurado. Sem configuração, permite somente demonstração local como aluno.
- O aluno pode avançar pelas 27 aulas, ouvir as narrações, acompanhar a transcrição com destaque de palavras, responder atividades e quizzes, revisar conceitos e gerar certificado ao concluir.
- Áreas de administrador e afiliado exigem papel provisionado no banco por processo confiável. Login público nunca escolhe esses papéis.
- A demonstração de afiliado usa o código `MARINA20`. Link: `/landing?ref=MARINA20`. O navegador guarda a indicação durante o percurso; com Supabase, cadastro recebe código validado pelo banco.

Sem Supabase, a demonstração não autentica usuários nem protege conteúdo. Dados de demonstração ficam neste navegador. Limpe os dados do site para recomeçar; não use informações pessoais reais nesse modo.

### Planos e comissões de demonstração

| Acesso | Solana | Reais |
|---|---:|---:|
| 1 mês | 0,4 SOL | R$ 299 |
| 3 meses | 0,7 SOL | R$ 549 |
| Vitalício | 0,9 SOL | R$ 699 |

Os valores em SOL foram definidos como preço próprio e não são convertidos em tempo real. O afiliado recebe 20% do valor bruto na mesma moeda do pedido. BRL e SOL são mantidos separados. A confirmação do protótipo apenas grava uma venda fictícia no `localStorage`.

## Estrutura

```text
src/
  components/       Layouts, identidade visual, controles e componentes shadcn/ui
  contexts/         Sessão e acesso de demonstração
  lib/course.ts     9 módulos, 27 aulas, atividades e quizzes tipados
  lib/audio-tracks.ts  faixas de áudio válidas para os roteiros atuais
  lib/narration-script.ts  textos e tipos compartilhados entre curso e áudio
  lib/narration-timing.ts  validação e sincronização de palavras
  lib/generated/narrations.ts  catálogo gerado de 28 narrações
  styles/bento.css  grids responsivos por prioridade de conteúdo
  components/audio-narration.tsx  player MP3 e transcrição sincronizada
  lib/offers.ts     Preços e comissão
  lib/storage.ts    Persistência local de sessão, progresso e eventos mockados
  pages/            Quiz, landing, login, curso, admin e afiliado
public/audio/narrated/ MP3s e marcações de tempo gerados por aula
scripts/            Geração e atualização das narrações
docs/               Documentação e material de apoio
supabase/
  migrations/       Esquema inicial com RLS para futura integração
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

O cliente `@supabase/supabase-js` já conecta login por e-mail e senha, perfil, foto e leitura de papel/assinatura. Sem credenciais, a plataforma continua em modo de demonstração com dados locais. Progresso, avaliações, pedidos e comissões ainda não sincronizam com o banco.

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

   Revise a lista do `--dry-run` antes de aplicar. O CLI exige sessão autenticada e senha do banco na primeira vinculação. Também é possível aplicar os três arquivos em `supabase/migrations/`, em ordem, pelo SQL Editor.

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

   Revise em projeto de desenvolvimento antes de aplicar em produção. A migração de perfil restringe leitura/edição da linha ao usuário autenticado e upload/remoção de imagens à pasta do próprio ID.

6. Configure Authentication → URL Configuration para permitir o domínio local e publicado, com `/login` e `/login?recovery=1`. O app requer senha de pelo menos 12 caracteres. Configure SMTP próprio antes de produção; envio padrão tem limites baixos.
7. O botão do perfil no rodapé da sidebar abre edição de nome, foto, apresentação e cidade/região. Avatar é recortado em WebP até 512 px e enviado ao bucket público `profile-avatars`; as URLs das fotos são públicas. Não envie documento ou imagem sensível.
8. Crie usuários admin/afiliado por processo confiável no servidor ou SQL Editor. Não permita que navegador atribua papéis. O front lê `app_roles`; metadados editáveis não autorizam acesso. A rota `/curso` exige assinatura ativa, ainda que links locais ou dados pendentes sejam alterados. Veja as regras de [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) e do [Supabase Storage](https://supabase.com/docs/guides/storage/security/access-control).
9. Sessão/auth e perfil usam Supabase quando configurado. Se falha sincronização do perfil, mudanças continuam no armazenamento local do navegador; a interface mostra quando houve essa condição.
10. Progresso, quizzes, avaliações, pedidos e indicações ainda usam `src/lib/storage.ts`. Antes de produção, migre esses fluxos para consultas às tabelas e serviços confiáveis. O conteúdo atual das aulas segue público no bundle; mova aulas pagas para `lesson_content` e áudio para bucket privado com URLs assinadas.
11. Crie funções server-side para checkout, validação de webhooks, ativação/expiração de acesso, cálculo de comissão e saques. Use idempotência e mantenha segredos no servidor. Para Solana, valide assinatura, rede, destino, valor e confirmações no backend.

No protótipo, acesso mensal expira em 30 dias e o trimestral em 90. Vitalício não recebe data de expiração. A migração representa esse modelo com `subscriptions.expires_at`; o servidor deve ser a fonte de verdade para ativação, renovação, estorno e expiração.

## Pesquisa usada no curso

As aulas alternam explicação curta, pergunta de recordação com feedback, exercício aplicado e cartões de revisão com intervalo sugerido. Estudos em ambientes online associam prática espaçada e quizzes com feedback a melhores resultados de aprendizagem; veja [espaçamento autorregulado em um MOOC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7076029/) e [prática de recuperação em cursos de fisiologia](https://pmc.ncbi.nlm.nih.gov/articles/PMC6842879/).

O conteúdo evita promessa de rendimento e alerta para riscos e fraude, seguindo materiais oficiais da [CVM sobre criptoativos e ofertas irregulares](https://www.gov.br/investidor/pt-br/investir/cuidados-ao-investir/evitando-problemas/principais-fraudes-e-esquemas-irregulares/criptoativos-e-icos). O módulo tributário não fixa limites ou alíquotas: consulte as [orientações atuais da Receita Federal sobre criptoativos](https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/declaracoes-e-demonstrativos/criptoativos/criptoativos) e um profissional para cada situação.

## Tecnologias de UI

O setup segue a instalação oficial de [shadcn/ui para Vite](https://ui.shadcn.com/docs/installation/vite), com tokens de tema escuro próprios, componentes locais e Tailwind CSS v4. Login e perfil já usam Supabase quando configurados; pagamentos, autorização de assinaturas e saques ainda precisam de serviços de backend.
