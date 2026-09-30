create table public.module_quiz_questions (
  module_id text primary key references public.course_modules (id) on delete cascade,
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) > 0),
  updated_at timestamptz not null default now()
);
alter table public.module_quiz_questions enable row level security;
grant insert, update, delete on public.module_quiz_questions to authenticated;
create policy "quiz questions: admin writes" on public.module_quiz_questions for all to authenticated
  using ((select public.has_role('admin')))
  with check ((select public.has_role('admin')));

insert into public.module_quiz_questions (module_id, questions) values
  ('m1', '[{"question":"O que descreve melhor uma blockchain pública?","options":["Um cadastro compartilhado validado por regras da rede","Um aplicativo que guarda moedas no celular","Uma promessa de rentabilidade automática"],"answer":0,"explanation":"A blockchain registra operações de acordo com regras verificadas pela rede."},{"question":"O que uma carteira digital controla?","options":["O preço de mercado","As chaves usadas para autorizar transações","A emissão de todos os tokens"],"answer":1,"explanation":"A carteira gerencia chaves. Os ativos são registrados na rede."},{"question":"Qual é a prática segura com a frase de recuperação?","options":["Não compartilhá-la e mantê-la protegida offline","Enviar ao suporte quando pedirem","Salvar uma captura de tela no e-mail"],"answer":0,"explanation":"Quem conhece a frase pode recuperar e controlar a carteira."}]'::jsonb),
  ('m2', '[{"question":"Uma ordem limitada pode não executar porque:","options":["O preço não atingiu seu limite ou não havia liquidez suficiente","Ela sempre aguarda aprovação do Banco Central","Toda ordem limitada expira imediatamente"],"answer":0,"explanation":"O preço pode nunca atingir seu limite; execução depende do mercado e das regras da plataforma."},{"question":"Antes de enviar cripto para uma carteira, confira:","options":["Endereço, rede e eventuais tags/memos","Apenas o nome da moeda","Somente o valor da taxa"],"answer":0,"explanation":"Todos esses campos precisam corresponder ao destino."},{"question":"O que uma ordem stop garante?","options":["Preço de saída exato em qualquer condição","Que outra ordem seja disparada ao nível configurado, segundo as regras da plataforma","Que a posição não tenha prejuízo"],"answer":1,"explanation":"Uma ordem stop pode sofrer slippage e não limita perdas a um valor exato."}]'::jsonb),
  ('m8', '[{"question":"O que diferencia uma compra à vista de uma cota de ETF de Bitcoin?","options":["A cota é um valor mobiliário com regras próprias; compra à vista envolve o ativo e sua custódia","Ambas sempre entregam as mesmas chaves privadas","Nenhuma tem taxas ou riscos de intermediário"],"answer":0,"explanation":"Estruturas, direitos, custos, negociação e custódia variam; leia documentos do produto."},{"question":"Antes de enviar BTC para uma carteira, o que conferir?","options":["Endereço, rede e compatibilidade; testar com valor pequeno","Somente a cotação do dia","Apenas o nome exibido no aplicativo"],"answer":0,"explanation":"Endereço ou rede incorretos podem causar perda irreversível."},{"question":"Aportes periódicos garantem um preço médio melhor?","options":["Sim, em qualquer cenário","Não; organizam datas, mas não garantem lucro ou menor perda","Sim, desde que feitos por cartão"],"answer":1,"explanation":"O resultado depende do mercado, custos, período e decisões. Não há garantia."}]'::jsonb),
  ('m3', '[{"question":"Uma análise de projeto fica mais forte quando:","options":["Anota evidências e também o que refutaria a tese","Ignora informações que contradizem a expectativa","Repete a opinião de influenciadores"],"answer":0,"explanation":"Critérios de revisão reduzem viés de confirmação."},{"question":"“Oferta máxima” responde sozinha à pergunta sobre diluição?","options":["Sim; tokens ainda bloqueados não afetam o futuro","Não; cronograma e distribuição também importam","Sim; basta dividir o preço por dois"],"answer":1,"explanation":"Emissões futuras, desbloqueios e concentração alteram incentivos e oferta disponível."},{"question":"Um dashboard mostra endereços ativos. Isso prova quantas pessoas usam o produto?","options":["Sim, cada endereço pertence a uma pessoa","Não; endereços e pessoas são unidades diferentes","Sim, se o gráfico for colorido"],"answer":1,"explanation":"Uma pessoa pode ter vários endereços, e um endereço pode representar automação ou contrato."}]'::jsonb),
  ('m4', '[{"question":"Capacidade de risco se refere principalmente a:","options":["Quanto a vida financeira consegue suportar perder ou deixar oscilando","Quanto você gostaria de ganhar","Quantos gráficos você sabe ler"],"answer":0,"explanation":"Capacidade considera obrigações, horizonte e impacto concreto de perdas."},{"question":"A simulação de queda exibida no curso:","options":["Prevê o próximo preço","Mostra um cenário hipotético para visualizar impacto","Indica quanto investir"],"answer":1,"explanation":"É uma ferramenta educativa, sem previsão ou recomendação individual."},{"question":"A estratégia DCA:","options":["Elimina volatilidade","Pode organizar aportes, mas não garante retorno","Impede perdas se o preço cair"],"answer":1,"explanation":"Aportes periódicos não removem riscos do ativo nem garantem resultado."}]'::jsonb),
  ('m5', '[{"question":"Um sinal comum de fraude é:","options":["Promessa de alto retorno garantido com urgência para pagar","Documentação pública com riscos explicados","Possibilidade clara de recusar uma oferta"],"answer":0,"explanation":"Urgência e promessa de retorno extraordinário merecem desconfiança."},{"question":"Uma permissão de contrato inteligente pode:","options":["Autorizar operações conforme o escopo aprovado","Garantir que o token nunca caia","Reverter qualquer fraude"],"answer":0,"explanation":"Entenda o escopo da autorização e revogue o que não usa."},{"question":"Se um suporte pedir sua frase de recuperação:","options":["Compartilhe se o perfil for verificado","Não compartilhe; acesse o serviço por um canal confirmado por você","Envie em uma mensagem temporária"],"answer":1,"explanation":"A frase é um segredo de acesso. Não a envie a terceiros."}]'::jsonb),
  ('m6', '[{"question":"Uma auditoria de contrato inteligente:","options":["Ajuda a identificar problemas, mas não elimina todos os riscos","Garante que não haverá perdas","Substitui a pesquisa sobre liquidez e custódia"],"answer":0,"explanation":"Auditorias têm escopo e data; novas versões e outros componentes também importam."},{"question":"Uma recompensa de staking ou DeFi deve ser avaliada junto com:","options":["Origem, custos, bloqueios, riscos técnicos e liquidez","Somente o percentual anunciado","O número de emojis no aplicativo"],"answer":0,"explanation":"Retorno isolado não mostra perdas possíveis nem sustentabilidade."},{"question":"Para impostos sobre criptoativos no Brasil, o curso recomenda:","options":["Usar sempre uma regra antiga da internet","Consultar a orientação oficial vigente e um profissional para seu caso","Não guardar comprovantes"],"answer":1,"explanation":"Normas podem mudar e o tratamento depende dos fatos e das regras em vigor."}]'::jsonb),
  ('m9', '[{"question":"Uma posição long em futuro normalmente se beneficia quando:","options":["O preço do contrato sobe, antes de custos e regras específicas","O preço do contrato cai","A margem inicial desaparece"],"answer":0,"explanation":"Long é a direção comprada. O resultado final ainda depende do contrato, tamanho e custos."},{"question":"Um nível de suporte no gráfico:","options":["É uma zona observada no passado, não uma garantia futura","Impede o preço de cair","É sempre o preço justo do ativo"],"answer":0,"explanation":"Níveis técnicos são interpretações históricas e podem falhar."},{"question":"O que a margem de um futuro representa?","options":["Garantia vinculada à exposição; não é o custo total nem a perda máxima","O preço integral do Bitcoin","Uma proteção que impede liquidação"],"answer":0,"explanation":"Exigências de margem e liquidação dependem das regras do produto; perdas podem exceder o valor inicialmente depositado."}]'::jsonb),
  ('m7', '[{"question":"Um diário de decisões ajuda a:","options":["Separar processo, evidências e resultado","Garantir que todas as escolhas serão lucrativas","Descobrir sinais secretos no gráfico"],"answer":0,"explanation":"O diário melhora a revisão e ajuda a perceber vieses."},{"question":"Um bom plano pessoal começa por:","options":["Limites, horizonte e critérios de revisão","Uma lista de tokens populares","Uma meta fixa de lucro mensal"],"answer":0,"explanation":"Objetivos e limites dão contexto para qualquer escolha posterior."},{"question":"O certificado do curso:","options":["Comprova lucro futuro","Registra conclusão das aulas, sem garantir resultado financeiro","Substitui formação profissional"],"answer":1,"explanation":"É um registro de participação e conclusão educativa."}]'::jsonb)

on conflict (module_id) do update set questions = excluded.questions, updated_at = now();

create or replace function public.get_module_quiz(p_module_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  question_set jsonb;
begin
  if (select auth.uid()) is null or not (select public.has_active_course_access()) then
    raise exception 'Active course access required.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.course_modules where id = p_module_id and published) then
    raise exception 'Published module not found.' using errcode = '22023';
  end if;
  select questions into question_set from public.module_quiz_questions where module_id = p_module_id;
  if question_set is null then raise exception 'Quiz unavailable.' using errcode = '55000'; end if;
  return (select jsonb_agg(jsonb_build_object('question', question -> 'question', 'options', question -> 'options') order by ordinal)
    from jsonb_array_elements(question_set) with ordinality as quiz(question, ordinal));
end;
$$;
revoke all on function public.get_module_quiz(text) from public, anon;
grant execute on function public.get_module_quiz(text) to authenticated;

create or replace function public.submit_module_quiz(p_module_id text, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  question_set jsonb;
  answer_count integer;
  question_rec record;
  submitted_answer integer;
  expected_answer integer;
  earned integer := 0;
  feedback jsonb := '[]'::jsonb;
  did_pass boolean;
begin
  if current_user_id is null or not (select public.has_active_course_access()) then
    raise exception 'Active course access required.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Answers must be an array.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.course_modules where id = p_module_id and published) then
    raise exception 'Published module not found.' using errcode = '22023';
  end if;
  select questions into question_set from public.module_quiz_questions where module_id = p_module_id;
  if question_set is null then raise exception 'Quiz unavailable.' using errcode = '55000'; end if;
  answer_count := jsonb_array_length(question_set);
  if jsonb_array_length(p_answers) <> answer_count then
    raise exception 'Answer count does not match quiz.' using errcode = '22023';
  end if;

  for question_rec in
    select question, ordinal from jsonb_array_elements(question_set) with ordinality as quiz(question, ordinal)
  loop
    if jsonb_typeof(p_answers -> (question_rec.ordinal - 1)) <> 'number' then
      raise exception 'Each answer must be a numeric option index.' using errcode = '22023';
    end if;
    submitted_answer := (p_answers ->> (question_rec.ordinal - 1))::integer;
    expected_answer := (question_rec.question ->> 'answer')::integer;
    if submitted_answer < 0 or submitted_answer >= jsonb_array_length(question_rec.question -> 'options') then
      raise exception 'Answer option index is out of range.' using errcode = '22023';
    end if;
    if submitted_answer = expected_answer then earned := earned + 1; end if;
    feedback := feedback || jsonb_build_array(jsonb_build_object(
      'selected', submitted_answer,
      'correct', submitted_answer = expected_answer,
      'correct_option', expected_answer,
      'explanation', question_rec.question -> 'explanation'
    ));
  end loop;

  did_pass := earned * 3 >= answer_count * 2;
  insert into public.quiz_attempts (user_id, module_id, score, total, passed)
    values (current_user_id, p_module_id, earned, answer_count, did_pass);
  return jsonb_build_object('score', earned, 'total', answer_count, 'passed', did_pass, 'feedback', feedback);
end;
$$;
revoke all on function public.submit_module_quiz(text, jsonb) from public, anon;
grant execute on function public.submit_module_quiz(text, jsonb) to authenticated;
