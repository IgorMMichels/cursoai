# Prévia do curso Omega

A rota pública `/explorar` e o bloqueio de curso sem plano ativo usam o mesmo componente `CoursePreview`.

## Origem do conteúdo

- Cripto do Zero: módulos e aulas de `src/lib/course.ts`, a mesma fonte do dashboard oficial.
- Memecoins, Futuros e Trading: `loadJourneys()`, o mesmo serviço da página oficial de jornadas. Consulta apenas metadados publicados de jornadas, módulos e aulas.
- Catálogo local: `src/lib/generated/journeys.json`, também usado pelo curso quando o catálogo remoto não está disponível. O aviso de modo catálogo acompanha a disponibilidade oficial.
- Capas: `moduleCovers` e `coverUrl` oficiais.
- Ferramentas e plataformas: nomes e descrições dos catálogos existentes no site.

Os totais são derivados dos itens publicados. A versão local contém quatro jornadas, vinte módulos e setenta aulas. A prévia não carrega corpos de aulas, narrações, exercícios respondidos ou progresso de contas.

## Navegação

`/explorar?area=jornadas&jornada=memecoins` abre a estrutura de uma jornada. As demais áreas são `visao-geral`, `trilha`, `plataformas`, `ferramentas`, `radar`, `audios`, `simulador`, `pagamento` e `seguranca`.

Módulos expandem para mostrar títulos e durações das aulas. Calculadoras, simulador e piloto do radar direcionam às áreas públicas. Aulas e recursos que exigem acesso mantêm o encaminhamento para planos. Nenhuma sessão ou progresso fictício aparece na prévia.

## Verificação

```powershell
node --experimental-strip-types --test src/lib/course-preview-catalog.test.ts
npm run lint
npm run build
```

Os testes verificam o catálogo oficial local, a exclusão de itens não publicados e a substituição por metadados remotos sem duplicar a trilha inicial. A navegação e os módulos foram conferidos no navegador em desktop e celular. O cenário autenticado sem plano compartilha o componente, mas não foi acessado com uma conta real durante esta atualização.
