# Bots do Cripto do Zero — produto, prompts e guia de implementação

Documento de contexto para planejar e construir os três bots destacados no site, conectados ao curso e disponíveis por Telegram e Discord. Deve ser lido junto com o código atual do projeto antes de qualquer implementação. O código e o banco são a fonte de verdade; este documento organiza a proposta, mas não afirma que os bots já existem.

## O produto que os bots precisam reforçar

O Cripto do Zero quer integrar quatro jornadas de aprendizagem — fundamentos de cripto, memecoins, trading e futuros — em vez de deixar o aluno sozinho com uma lista de vídeos. A proposta também inclui guias passo a passo para carteiras e plataformas, checklist de segurança, progresso e gamificação, comunidade e conteúdo em mais de um idioma.

Os números de duração e comparações da imagem de referência são hipóteses fornecidas pela equipe. Antes de usá-los em anúncios, páginas públicas ou respostas dos bots, conferir a duração real do catálogo e substituir afirmações absolutas como “ninguém faz isso” por descrições que o produto consiga comprovar.

O papel dos bots é reduzir a distância entre aprender e praticar com segurança: recomendar a próxima aula permitida, transformar conceitos em pequenos exercícios, lembrar uma revisão escolhida pelo aluno e levar a ferramentas ou guias existentes no site. Eles não devem operar ativos, guardar chaves de carteira, prometer retorno nem publicar sinais de compra e venda.

## Os três bots propostos

Os nomes são nomes de trabalho para substituir os três cards “Em breve”. Cada bot deve funcionar nos dois canais, compartilhando regras e dados autorizados. Discord pode concentrar a comunidade e os comandos no servidor; Telegram pode oferecer uma conversa privada mais direta e notificações que o usuário ativou.

| Card | Proposta | Experiência principal | Ligação com o diferencial |
|---|---|---|---|
| 01 | **Guia da Trilha** | Mostra onde a pessoa parou, sugere a próxima aula liberada, inicia uma revisão curta e acompanha sequência de estudo. | Quatro jornadas com progressão, quiz, streak e marcos de conclusão. |
| 02 | **Checklist de Segurança** | Faz uma lista guiada antes de conectar uma carteira, assinar uma transação ou explorar uma memecoin; abre os guias de Phantom, Axiom, GMGN ou Trojan. | Checklist antes de operar e tutoriais de plataforma passo a passo. |
| 03 | **Radar Configurável** | Entrega lembretes e alertas que o usuário configurou, junto com contexto educativo e um link para continuar no site. | Acompanhamento fora da aula e integração com comunidade sem depender de “call” ou sinal. |

### 01 · Guia da Trilha

**No Telegram:** `/start`, `/continuar`, `/revisar`, `/progresso`, `/preferencias` e `/parar`. Uma mensagem de revisão tem uma pergunta, opções de resposta e explicação curta. Ao terminar, oferece um botão para abrir a aula, quiz ou calculadora pertinente no Cripto do Zero.

**No Discord:** comandos `/continuar`, `/revisar`, `/progresso` e botões para abrir a próxima aula. Resultados do aluno são respostas privadas/efêmeras. Canais de comunidade recebem apenas atividades coletivas opt-in, sem publicar progresso individual por padrão.

**Regras de conteúdo:** usar aulas, transcrições e quizzes efetivamente disponíveis e autorizados para aquela conta. Conteúdo gratuito pode ser usado sem login. Conteúdo de assinante só é acessado depois de consultar a assinatura no servidor. Se não houver integração de busca aprovada, limitar-se a links e resumos editoriais revisados; não inventar citações nem fingir que leu uma aula.

### 02 · Checklist de Segurança

**Fluxo sugerido:** selecionar situação (carteira, aprovação, swap, lançamento de token); passar por perguntas com “verificado”, “não verificado” e “não entendi”; explicar cada sinal; encerrar com uma lista do que revisar e links para o guia correspondente. O usuário pode abandonar ou voltar sem perder o lugar.

**Plataformas:** os passos de Phantom, Axiom, GMGN e Trojan devem ser separados por produto, rede e versão da interface. Confirmar telas e nomes de botões em documentação e capturas atuais da equipe antes de publicar. Marcar a data da revisão no guia. O bot não deve pedir para conectar carteira, enviar fundos, assinar mensagem ou enviar transação.

**Limite de segurança:** o checklist educa; não é auditoria, verificação de contrato, aconselhamento jurídico ou garantia de que um token, link, carteira ou transação é seguro. Nunca solicitar seed phrase, chave privada, código 2FA ou assinatura. Não classificar como “seguro” só porque a lista terminou sem alertas.

### 03 · Radar Configurável

**MVP recomendado:** lembretes de estudo configurados pelo usuário, resumo semanal da jornada, avisos de nova aula ou evento da comunidade e alertas de preço apenas quando uma fonte de cotação, frequência e limites estiverem definidos. Em qualquer caso, mensagem desligada por padrão até o usuário escolher receber.

**Alertas de preço:** o usuário escolhe ativo, condição e frequência. A mensagem informa fonte, unidade, horário da última atualização e link para contexto. Não deve dizer “compre”, “venda”, “entrada”, “alvo” ou “oportunidade”. Alertas podem atrasar; mostrar a última cotação e nunca sugerir que são em tempo real sem garantia técnica.

**Comunidade no Discord:** comandos podem apontar para canais de boas-vindas, dúvidas, desafios e avisos. Papéis de aluno servem para organizar acesso ao servidor, mas não substituem a checagem de autorização no backend do curso. Sincronizar/remover papéis a partir do estado canônico da assinatura e prever reconciliação de falhas.

## Arquitetura recomendada para este repositório

O projeto é React/TypeScript/Vite e já usa Supabase Auth e Postgres. A implementação deve confirmar o schema e as funções de assinatura existentes antes de criar tabelas ou políticas. Não presumir que um claim, `user_metadata`, `app_metadata` fornecido pelo cliente, nome no Discord ou ID do Telegram comprova pagamento. Consultar a fonte canônica da assinatura no servidor.

```text
Telegram webhook ─┐
                  ├─ Supabase Edge Functions ─ regras comuns ─ Supabase Auth/Postgres
Discord endpoint ─┘                                      ├─ curso, progresso e acesso
                                                         ├─ preferências e vínculos
                                                         └─ fila de notificações
```

- Um adaptador recebe eventos de cada plataforma; um serviço comum decide intenção, checa acesso e prepara a resposta. Não manter três implementações separadas da mesma regra de produto.
- Usar Edge Functions para receber webhooks rápidos e executar ações curtas. Responder/confirmar no prazo exigido pelo provedor. Para digest, streak e alertas agendados, persistir a tarefa no banco e usar `pg_cron`/`pg_net` ou uma fila compatível; não contar com memória local ou cron dentro de uma Function efêmera.
- Guardar tokens de bots, chaves de assinatura e segredos somente nos secrets do Supabase/ambiente do servidor. Nunca usar variáveis `VITE_*` para segredos nem incluí-los em logs, respostas, screenshots, repositório ou mensagens de erro.
- Endpoints de webhook são públicos por natureza. Se desativar a validação automática de JWT do Supabase para receber requisições externas, validar antes o segredo/assinatura específica da plataforma, limitar payload e tamanho, rejeitar eventos inválidos e aplicar rate limit. A chave service role fica exclusivamente no servidor.
- Deduplicar entregas por ID de evento/update. Telegram repete webhooks quando não recebe sucesso; Discord pode reenviar requisições. A mesma entrada não pode gerar streak duplicado, vários alertas ou várias atualizações de estado.
- Separar IDs de usuário do provedor de `auth.users.id`. Tabela de vínculo precisa de unicidade para `(provider, provider_user_id)` e para cada conexão admitida; armazenar o mínimo necessário.
- Conta vinculada por código opaco de alta entropia, com validade curta, uso único e consumo atômico. O aluno inicia ou confirma o vínculo no site autenticado; o bot aceita o código sem jamais pedir senha. Oferecer desconectar/revogar. Impedir que um ID externo já vinculado a outra conta troque de dono silenciosamente.
- Em tabelas expostas pelo Data API, habilitar RLS e definir políticas por propriedade. Dados internos de integração devem ficar num schema/tabela sem acesso público, ou com grants/policies deliberados. Operações administrativas do servidor precisam ser estreitas, auditáveis e não aceitar `user_id` arbitrário sem derivá-lo do vínculo validado.
- Armazenar preferências e estado mínimo: canal, idioma, fuso, horário, temas opt-in, status do vínculo e estado de entrega. Evitar copiar histórico completo de mensagens ou valores digitados em calculadoras.
- Começar sem LLM: comandos, quizzes e checklists têm conteúdo determinístico revisado. Se um tutor com IA vier depois, limitar respostas a material aprovado, citar aula e seção, indicar incerteza e escalar perguntas financeiras para explicações educativas; nunca deixar a IA tomar decisões de autorização ou fazer a conta quando já há função determinística.

### Modelo de dados a avaliar (não executar sem comparar com o schema real)

Planejar migrations somente depois de conferir migrations existentes, nomes de tabelas e RLS no repositório e no projeto Supabase correto.

| Entidade conceitual | Campos mínimos possíveis |
|---|---|
| `bot_identities` | `user_id`, `provider`, `provider_user_id`, `linked_at`, `revoked_at`; índices/unique por provedor. |
| `bot_link_codes` | hash do código, `user_id`, `provider`, `expires_at`, `consumed_at`; nunca persistir o código em claro. |
| `bot_preferences` | `user_id`, `provider`, locale, timezone, opted-in topics, quiet hours, notification status. |
| `bot_inbox_events` | `provider`, provider event ID, received time, status, safe error code; unique para idempotência e retenção limitada. |
| `notification_jobs` | `user_id`, `provider`, tipo, payload mínimo, `run_at`, `attempts`, `delivered_at`, idempotency key. |

Essas são entidades conceituais, não uma ordem para criar cinco tabelas. O MVP pode precisar de menos, e o projeto pode já conter dados que devam ser reutilizados.

## Passo a passo: Telegram

1. No Telegram, conversar com **@BotFather**, enviar `/newbot`, escolher nome e username disponíveis. Guardar o token fora do chat e do Git; se vazar, revogar/gerar outro no BotFather.
2. Configurar texto de apresentação, comandos como `/start`, `/ajuda`, `/continuar`, `/revisar`, `/checklist`, `/preferencias` e `/parar`. Iniciar com mensagens privadas e botões simples; manter uma página do site para a experiência longa.
3. Criar uma Edge Function de entrada, por exemplo `telegram-webhook`. Configurar URL HTTPS com `setWebhook`, `secret_token` e somente `allowed_updates` necessários (por exemplo, mensagens e callback queries). Comparar o header `X-Telegram-Bot-Api-Secret-Token` em tempo constante antes de tratar o corpo.
4. Criar o menu no BotFather ou via Bot API. Opcionalmente usar uma biblioteca como grammY dentro da Edge Function, conferindo compatibilidade atual com Deno e fixando a versão.
5. Implementar `/start`, validar update, deduplicar `update_id`, responder rápido e registrar apenas os dados mínimos. Se o evento for callback, validar que o botão e o usuário correspondem ao estado salvo no servidor.
6. Para vincular com o curso, fazer o site autenticado emitir um código de uso único e validade curta; usuário inicia conversa com o bot e envia `/vincular CODIGO`. O backend consome o código atomicamente, confere conflitos e guarda apenas o `telegram_user_id` necessário.
7. Só enviar DM depois que o usuário iniciou o bot e aderiu à categoria de notificação. Implementar `/parar` e uma opção no site para revogar vínculo e preferências.
8. Testar com um bot separado de desenvolvimento e Function local/túnel HTTPS. Nunca usar token de produção em print, log ou arquivo compartilhado.
9. Mini App é uma segunda fase: reusar o frontend mobile das ferramentas. Validar `Telegram.WebApp.initData` no backend e conferir `auth_date`; nunca confiar no `initDataUnsafe` recebido pelo navegador.

## Passo a passo: Discord

1. Criar uma Application no **Discord Developer Portal**. Para comandos, registrar application commands/slash commands. Configurar nome, descrições e versão de desenvolvimento.
2. Começar com comandos como `/trilha`, `/revisar`, `/checklist`, `/preferencias` e `/ajuda`. Registrar globalmente quando estiver pronto; durante desenvolvimento, preferir comandos de guild de teste.
3. Escolher um modo de interação: endpoint HTTP de Interactions é adequado para slash commands e evita manter um processo Gateway ligado. Se o produto precisar observar eventos de membros ou gerenciar papéis, adicionar um bot user e permissões estritamente necessárias. Não habilitar Message Content/Guild Members intents sem necessidade clara.
4. Criar Edge Function pública `discord-interactions`, guardar `DISCORD_PUBLIC_KEY` como secret e validar a assinatura Ed25519 sobre timestamp + corpo bruto antes de parsear JSON. Responder ao PING de verificação. A validação não pode depender de Supabase JWT.
5. Responder a slash command ou interaction inicial dentro do prazo do Discord (3 segundos). Se a operação demorar, enviar defer/ack válido e terminar com follow-up usando o token da interação dentro da janela permitida. Conteúdo de progresso e assinaturas deve ser ephemeral.
6. Instalar no servidor próprio de teste com `applications.commands`. Adicionar o escopo `bot` só se forem realmente necessários eventos, mensagens ou papéis. Calcular permissões mínimas; se for atribuir/remover papéis, o bot precisa da permissão adequada e o papel dele precisa estar acima dos papéis que gerencia.
7. Vincular conta usando o mesmo código de uso único do site com comando privado `/vincular`. Validar `discord_user_id` no backend; não usar nickname, nome de usuário ou mensagem pública como prova.
8. Se um papel de Discord representar matrícula, sincronizar com jobs idempotentes e rechecagem. Ainda assim, comandos que devolvem conteúdo de curso consultam assinatura no banco do curso.
9. Testar PING, assinatura inválida, evento duplicado, resposta efêmera, usuário sem vínculo, plano inativo, falha ao buscar assinatura e permissões insuficientes do bot.

## Prompts prontos para a IA de implementação

Use os prompts abaixo um por vez. O prompt-base define as regras comuns; o prompt de cada bot delimita a tarefa daquela fase. A IA deve inspecionar o estado real do código e propor migrations antes de executá-las.

### Prompt-base — implementar um bot do curso

```text
Leia docs/bots-do-curso.md por completo, além do AGENTS.md e das instruções locais do repositório. Entenda o app atual antes de editar: React/TypeScript/Vite, Supabase Auth/Postgres, sessão, assinatura, progresso/aulas, migrations/RLS, central de ferramentas e fluxos de curso.

Implemente somente o bot e a fase descritos no prompt específico abaixo. Não implemente os outros bots, não publique, não cadastre credenciais reais e não altere a aplicação externa. Preserve alterações existentes do usuário.

Arquitetura: adaptadores de Telegram e Discord separados de regras comuns; Supabase Edge Functions curtas para webhooks; Postgres como estado durável; eventos idempotentes; fila persistente para envios agendados. Inspecione a versão/configuração e a documentação Supabase atual antes de usar APIs. Não invente nomes de tabelas de assinatura: localize o estado canônico e consulte-o no servidor.

Segurança obrigatória: segredos apenas no servidor; Telegram webhook verifica secret_token; Discord verifica Ed25519 sobre corpo bruto e timestamp; endpoints externos aceitam apenas tráfego autenticado pela assinatura correspondente; RLS/ownership com privilégio mínimo; vínculo usa código aleatório hashado, expirável e consumido uma vez; autorização deriva de auth.uid e fonte canônica de assinatura; não confie em user_metadata, nickname, Telegram initDataUnsafe ou IDs fornecidos pelo navegador. Não colete senha, seed phrase, chave privada, token 2FA nem envie transações.

Antes de criar migration, apresente quais tabelas e policies já existem e uma proposta compatível. Não altere o schema remoto. Implemente migrações locais usando a ferramenta/procedimento exigido pelo projeto. Não exponha service_role. DMs e alertas começam desligados até opt-in explícito; implementar opt-out.

Conclua o fluxo completo da fase, verifique erros e documente setup sem revelar segredos. Inclua validação significativa para assinatura/duplicação/autorização e demonstre no ambiente local; não use contas, pagamento, papel ou acesso fictícios no ambiente de produção. Na resposta, informe arquivos mudados, como configurar cada plataforma e o que ainda depende de IDs/secrets que o proprietário terá de criar.
```

### Prompt 01 — Guia da Trilha

```text
Implemente a fase MVP do bot “Guia da Trilha” conforme docs/bots-do-curso.md e o prompt-base.

Escopo: /start e /ajuda públicos; /continuar, /revisar e /progresso. O usuário pode vincular Telegram ou Discord com código de uso único gerado no site autenticado. Para conta vinculada, ler o progresso permitido no schema atual e apontar a próxima aula realmente liberada. Sem vínculo, mostrar apenas conteúdo público e link de entrar/criar conta.

Criar uma revisão curta usando somente quiz ou conteúdo aprovado já existente. Não criar fatos ou aulas; cada resposta deve incluir explicação breve e link estável do site. Registrar pontuação mínima necessária para sequência de estudo sem criar leaderboard financeiro. Progresso individual só é mostrado em DM/ephemeral.

Critérios: ambos os provedores compartilham regra de autorização; acesso negado é seguro e compreensível; duplicar o mesmo evento não duplica pontos/streak; desligar mensagens interrompe lembretes; prova local cobre conta pública, vinculada, conteúdo bloqueado, assinatura inativa, código expirado e duplicata. Não criar tutor LLM nesta fase.
```

### Prompt 02 — Checklist de Segurança

```text
Implemente a fase MVP do bot “Checklist de Segurança” conforme docs/bots-do-curso.md e o prompt-base.

Escopo: fluxos interativos versionados de autochecklist antes de conectar uma carteira, assinar uma mensagem ou explorar uma memecoin; seleção do guia oficial interno de Phantom, Axiom, GMGN ou Trojan; retornar ao passo salvo, marcar “não sei” e encerrar com próximos materiais educativos. Manter os mesmos itens/validações em Telegram e Discord e oferecer uma rota pública do site com conteúdo equivalente.

Use conteúdo local previamente aprovado. Se não existir guia confirmado para a versão atual da plataforma, mostrar “passo em revisão” e não inventar nomes de botões. Mostrar data de revisão. A conclusão precisa dizer claramente que checklist não audita nem garante segurança do ativo/transação. Bloquear perguntas por seed phrase/chave privada: instruir o aluno a nunca fornecê-las e não persistir a mensagem.

Não conectar carteira, analisar contrato automaticamente, criar alerta de token “seguro”, recomendar compra/venda, pedir assinatura ou acionar transação. Não registrar endereço de carteira por padrão. Critérios: progresso retomável, opt-out/limpeza, conteúdo versionado, acessível por teclado/botões, teste de permissão e saída segura para texto fora do escopo.
```

### Prompt 03 — Radar Configurável

```text
Implemente a fase inicial do bot “Radar Configurável” conforme docs/bots-do-curso.md e o prompt-base.

Primeira fase: preferências opt-in para resumo semanal do curso, lembrete de estudo no horário/fuso escolhido e aviso de aula/evento realmente publicado. Criar notificações duráveis com idempotency key, janela silenciosa, tentativas limitadas, status de entrega e /parar. Entrega nos canais Telegram/Discord apenas depois do vínculo e consentimento apropriados. Mensagem concisa, identifica que é educativa e aponta para a fonte no site.

Deixar alertas de preço desativados/não implementados até confirmar API de preço, unidade, limites, periodicidade, latência, uso de dados e fornecedor. Quando aprovados numa fase posterior, permitir que usuário escolha ativo e condição; mostrar fonte e horário da cotação; aplicar limites; nenhum alerta compra/vende ou estima oportunidade. Não monitorar toda conversa do servidor. Conteúdo da comunidade fica nos canais do Discord; o bot só usa comandos e avisos autorizados.

Critérios: preferências desligadas por padrão; pausa e cancelamento funcionam em cada canal; horário local/DST tratados explicitamente; jobs duplicados não enviam duas mensagens; falha do provedor entra em retry limitado sem flood; não enviar DM para quem ainda não iniciou o bot no Telegram. Criar operação manual ou job local de teste sem enviar mensagens para alunos reais.
```

## Ordem recomendada de entrega

1. **Fundação:** confirmar as políticas do curso, fonte de acesso ativo e schema; registrar decisões; criar aplicação de teste vazia para cada canal, sem expor tokens; validar endpoints e vínculo de conta.
2. **Guia da Trilha mínimo:** comandos de ajuda, próxima aula e links; depois quiz/revisão; testar autorização antes de mensagens agendadas.
3. **Checklist:** publicar primeiro os conteúdos revisados no site; reusar a mesma fonte no bot.
4. **Radar:** começa com revisão/resumo semanal opt-in; avaliar preço somente com fonte e limites definidos.
5. **Comunidade/gamificação:** desafios e papéis Discord após confirmação da assinatura; streaks contam estudo e quizzes, nunca lucro ou volume negociado.
6. **Lançamento:** piloto em servidor/bot de teste; checklist de suporte, privacidade, termos, retenção e moderação; liberar gradualmente depois de verificação manual.

Não prometer tradução completa até haver revisão humana das aulas, mensagens dos bots e canais de suporte em EN/ES/ZH. Começar PT-BR; manter strings centralizadas e locale do usuário para suportar novos idiomas.

## Métricas sem coletar dados desnecessários

Medir agregado: início do bot → vínculo concluído → primeira aula/checklist → revisão concluída → retorno em 7 dias → clique em ferramenta/aula. Não registrar texto livre, valores digitados na calculadora ou endereços de carteira para “analytics”. Definir retenção para eventos, explicar opt-in e oferecer exclusão do vínculo. Revisar LGPD/termos e políticas de cada plataforma antes do lançamento.

## Fontes oficiais consultadas

- [Telegram Bot API: webhooks, `secret_token`, mensagens e atualizações](https://core.telegram.org/bots/api#making-requests).
- [Telegram: validar `initData` de Mini Apps e conferir `auth_date`](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
- [Telegram: guia de comandos e `/start`](https://core.telegram.org/bots/features#commands).
- [Discord: receber e responder a interactions, endpoint, prazos e respostas](https://docs.discord.com/developers/interactions/receiving-and-responding).
- [Discord: application/slash commands e OAuth scopes](https://docs.discord.com/developers/interactions/application-commands).
- [Discord: OAuth2, permissões e instalação do bot](https://docs.discord.com/developers/topics/oauth2).
- [Supabase: Edge Functions para webhooks e bots](https://supabase.com/docs/guides/functions), [exemplo Telegram](https://supabase.com/docs/guides/functions/examples/telegram-bot), [exemplo Discord com verificação Ed25519](https://supabase.com/docs/guides/functions/examples/discord-bot), [secrets](https://supabase.com/docs/guides/functions/secrets) e [agendamento com pg_cron/pg_net](https://supabase.com/docs/guides/functions/schedule-functions).

> Esta pesquisa consultou documentação oficial em 03/10/2026. Conferir mudanças nos SDKs, permissões e limites quando a fase de implementação começar.
