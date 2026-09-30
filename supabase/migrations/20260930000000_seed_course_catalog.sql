-- Public course metadata only; paid lesson bodies remain separately protected by lesson_content RLS.
insert into public.course_modules (id, ordinal, title, subtitle, published) values
('m1', 1, 'Entenda o terreno', 'Blockchain, Bitcoin e o que uma carteira realmente guarda.', true),
('m2', 2, 'Faça o básico bem feito', 'Exchanges, ordens e transferências sem pressa.', true),
('m8', 3, 'Compre Bitcoin com clareza', 'Compare caminhos de compra, custos e custódia.', true),
('m3', 4, 'Leia além do ticker', 'Uma rotina de pesquisa antes de formar opinião.', true),
('m4', 5, 'Defina o risco antes da entrada', 'Orçamento, cenários e uma estratégia que caiba na sua vida.', true),
('m5', 6, 'Proteja o acesso', 'Engenharia social, permissões e resposta a incidentes.', true),
('m6', 7, 'Explore sem confundir rendimento e segurança', 'DeFi, staking, liquidez e o contexto tributário brasileiro.', true),
('m9', 8, 'Futuros: long, short e padrões', 'Derivativos, margem e leitura de mercado — nível avançado.', true),
('m7', 9, 'Transforme estudo em processo', 'Psicologia, política pessoal e próximos 30 dias.', true)
on conflict (id) do update set ordinal = excluded.ordinal, title = excluded.title, subtitle = excluded.subtitle, published = excluded.published;

insert into public.lessons (id, module_id, ordinal, title, duration_minutes, published) values
('m1l1', 'm1', 1, 'Uma rede que mantém o próprio livro-caixa', 7, true),
('m1l2', 'm1', 2, 'Bitcoin, ether e tokens: ativos diferentes', 8, true),
('m1l3', 'm1', 3, 'Carteiras, chaves e custódia', 9, true),
('m2l1', 'm2', 1, 'Como avaliar uma exchange', 7, true),
('m2l2', 'm2', 2, 'Ordens a mercado, limitadas e stop', 6, true),
('m2l3', 'm2', 3, 'A primeira transferência sem improviso', 7, true),
('m8l1', 'm8', 1, 'Bitcoin à vista, ETF ou P2P?', 8, true),
('m8l2', 'm8', 2, 'Uma compra simulada do começo ao fim', 7, true),
('m8l3', 'm8', 3, 'Depois da compra: registro e custódia', 7, true),
('m3l1', 'm3', 1, 'Comece pelo problema, não pelo preço', 8, true),
('m3l2', 'm3', 2, 'Oferta, desbloqueios e liquidez', 8, true),
('m3l3', 'm3', 3, 'Dados, fontes e sinais de alerta', 7, true),
('m4l1', 'm4', 1, 'Capacidade de risco e dinheiro necessário', 7, true),
('m4l2', 'm4', 2, 'Dimensione pelo prejuízo que tolera', 8, true),
('m4l3', 'm4', 3, 'Aportes periódicos, diversificação e revisão', 7, true),
('m5l1', 'm5', 1, 'Golpes que começam com pressa', 7, true),
('m5l2', 'm5', 2, 'Assinaturas, permissões e links', 7, true),
('m5l3', 'm5', 3, 'Sua rotina de segurança e plano de resposta', 7, true),
('m6l1', 'm6', 1, 'DeFi: contratos, protocolos e dependências', 8, true),
('m6l2', 'm6', 2, 'Staking, empréstimos e provisão de liquidez', 8, true),
('m6l3', 'm6', 3, 'Registros e impostos no Brasil', 9, true),
('m9l1', 'm9', 1, 'Spot, futuro e posição comprada ou vendida', 9, true),
('m9l2', 'm9', 2, 'Tendência, suporte, resistência e rompimentos', 8, true),
('m9l3', 'm9', 3, 'Simulador de exposição e liquidação', 9, true),
('m7l1', 'm7', 1, 'Decida fora do ruído', 6, true),
('m7l2', 'm7', 2, 'Escreva sua política pessoal', 6, true),
('m7l3', 'm7', 3, 'Seu roteiro de 30 dias', 6, true)
on conflict (id) do update set module_id = excluded.module_id, ordinal = excluded.ordinal, title = excluded.title, duration_minutes = excluded.duration_minutes, published = excluded.published;
