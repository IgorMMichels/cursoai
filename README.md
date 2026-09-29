# Cripto do Zero

Plataforma de educação sobre criptoativos: Bitcoin, Ethereum, carteiras, análise de projetos, DeFi, futuros e gestão de risco. Feita em React, TypeScript, Vite, Tailwind CSS v4, shadcn/ui e Framer Motion. Protótipo funcional: autenticação, progresso, pedidos, indicações e comissões usam dados locais no navegador.

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
- `/login` permite entrar como aluno, administrador ou afiliado sem senha.
- O aluno pode avançar pelas 27 aulas, ouvir as narrações, acompanhar a transcrição com destaque de palavras, responder atividades e quizzes, revisar conceitos e gerar certificado ao concluir.
- O administrador vê módulos, atividade, pedidos e atribuições de demonstração.
- A área de afiliado usa o código `MARINA20`. Link: `/landing?ref=MARINA20`.

Os botões de entrada direta na tela de login são as contas de teste. Todos os dados ficam neste navegador. Limpe os dados do site para recomeçar; não use informações pessoais reais no protótipo.

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
  lib/audio-tracks.ts  roteiros e descrições das narrações
  components/audio-narration.tsx  player, voz do navegador e transcrição destacada
  lib/offers.ts     Preços e comissão
  lib/storage.ts    Persistência local de sessão, progresso e eventos mockados
  pages/            Quiz, landing, login, curso, admin e afiliado
public/audio/       Áudios fornecidos para boas-vindas e módulos 1–5 e 7
docs/               Roteiros de narração para o módulo sem MP3
supabase/
  migrations/       Esquema inicial com RLS para futura integração
```

Imagens de capa usam URLs do Unsplash e precisam de conexão com a internet. Os áudios recebidos foram copiados para `public/audio`; módulos sem MP3 usam a voz portuguesa disponível no navegador. O player destaca palavras na narração gerada e acompanha aproximadamente a transcrição nos MP3s existentes. O módulo 6 está sem MP3; consulte [docs/audio-roteiro-modulo-06.md](docs/audio-roteiro-modulo-06.md).

## Conectar ao Supabase

O protótipo **ainda não chama o Supabase**. O login de demonstração não é autenticação e o `localStorage` não protege conteúdo. A migração em `supabase/migrations/20260928000000_initial_schema.sql` é um ponto de partida para o banco e suas políticas; valide-a em um projeto de desenvolvimento antes de aplicar em produção.

1. Crie um projeto Supabase e ative os provedores de autenticação desejados. A configuração oficial de React usa o URL do projeto e a chave publicável no app Vite: [Supabase Auth com React](https://supabase.com/docs/guides/auth/quickstarts/react).
2. Copie `.env.example` para `.env.local` e preencha apenas:

   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   `VITE_*` é enviado ao navegador. Nunca coloque uma `service_role` key, segredo de pagamento ou chave privada Solana nessas variáveis.

3. Instale o cliente:

   ```bash
   npm install @supabase/supabase-js
   ```

4. Aplique a migração pelo Supabase CLI ou SQL Editor. Ela cria perfis, papéis, catálogo, conteúdo, assinaturas, progresso, pedidos, afiliados e solicitações de saque. Use a documentação de [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) para revisar grants e políticas; RLS deve ficar ativa em todas as tabelas expostas.
5. Crie uma conta de administrador por um processo confiável no servidor/SQL Editor. Nunca permita que o navegador atribua a si mesmo o papel `admin`.
6. Adicione um cliente em `src/lib/supabase.ts` usando `createClient(url, publishableKey)` e troque a implementação de `SessionProvider` por Supabase Auth. Atribua permissões através da tabela protegida `app_roles`, não de metadados editáveis pelo usuário.
7. Substitua o conteúdo de `src/lib/course.ts` por consultas às tabelas `course_modules`, `lessons` e `lesson_content`. O conteúdo atual está no bundle público; mova aulas pagas para `lesson_content` antes de publicar o curso.
8. Substitua as funções de `src/lib/storage.ts` por persistência do Supabase para progresso, quizzes e indicações. Nunca confie em papel, preço, resultado do quiz, status de pedido ou comissão enviado pelo browser.
9. Crie Edge Functions para criar checkout, validar webhooks do provedor, ativar/expirar acesso, calcular comissão e registrar saques. Use idempotência e mantenha chaves privadas no servidor. Para pagamentos Solana, valide assinatura, rede, destino, valor e confirmações no backend; não libere acesso com base em uma mensagem do cliente.
10. Mova MP3s para um bucket privado do Supabase Storage e gere URLs assinadas após validar o acesso. Os arquivos em `public/audio` são públicos enquanto permanecerem ali.

No protótipo, acesso mensal expira em 30 dias e o trimestral em 90. Vitalício não recebe data de expiração. A migração representa esse modelo com `subscriptions.expires_at`; o servidor deve ser a fonte de verdade para ativação, renovação, estorno e expiração.

## Pesquisa usada no curso

As aulas alternam explicação curta, pergunta de recordação com feedback, exercício aplicado e cartões de revisão com intervalo sugerido. Estudos em ambientes online associam prática espaçada e quizzes com feedback a melhores resultados de aprendizagem; veja [espaçamento autorregulado em um MOOC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7076029/) e [prática de recuperação em cursos de fisiologia](https://pmc.ncbi.nlm.nih.gov/articles/PMC6842879/).

O conteúdo evita promessa de rendimento e alerta para riscos e fraude, seguindo materiais oficiais da [CVM sobre criptoativos e ofertas irregulares](https://www.gov.br/investidor/pt-br/investir/cuidados-ao-investir/evitando-problemas/principais-fraudes-e-esquemas-irregulares/criptoativos-e-icos). O módulo tributário não fixa limites ou alíquotas: consulte as [orientações atuais da Receita Federal sobre criptoativos](https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/declaracoes-e-demonstrativos/criptoativos/criptoativos) e um profissional para cada situação.

## Tecnologias de UI

O setup segue a instalação oficial de [shadcn/ui para Vite](https://ui.shadcn.com/docs/installation/vite), com tokens de tema escuro próprios, componentes locais e Tailwind CSS v4. O acesso de demonstração está preparado para ser trocado por Supabase Auth; pagamento, autorização de assinaturas e saques ainda precisam de serviços de backend.
