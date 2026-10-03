# Central de ferramentas — plano de implementação

> Execução autorizada pelo usuário neste chat. Usar tarefas independentes com subagentes, revisar aderência ao escopo e qualidade, integrar e verificar no navegador externo. Não publicar nem alterar conteúdo preexistente do usuário.

**Objetivo:** disponibilizar risco/stop, long/short e recuperação de perdas publicamente e no curso, com artigos e três espaços de bots exclusivos ainda indisponíveis.

**Arquitetura:** catálogo, cálculos e experiência compartilhados; layouts público e do curso separados. Artigos próprios ligados às ferramentas; HTML dos artigos pré-renderizado no build para busca, com hidratação normal do app. Integrações operacionais de bots não fazem parte da entrega.

**Tecnologias:** React 19, TypeScript, React Router, Vite, GSAP/useGSAP e Node test runner, já disponíveis no projeto.

## Tarefas

- [x] Cálculos: `src/lib/tool-calculations.ts`, testes significativos em `src/lib/tool-calculations.test.ts`. Testar risco com taxas, direções, capital/margem, ausência de dupla alavancagem, recuperação 100% e entradas inválidas.
- [x] Editorial: `src/lib/tool-articles.ts`, cinco artigos originais com exemplos conferidos e fontes oficiais. Conferir aderência aos slugs e evitar autoria/revisão inventada.
- [x] Experiência: catálogo `src/lib/tools.ts`, componentes interativos em `src/components/tools/`, páginas em `src/pages/tools-page.tsx` e `src/pages/tool-articles-page.tsx`, CSS escopado em `src/styles/tools.css`.
- [x] Navegação: rotas lazy em `src/App.tsx`, links em header/footer/sidebar e barra de moedas. Rotas gratuitas do curso fora do guard de assinatura, preservando o guard de sessão atual.
- [x] Busca: metadados próprios, links públicos canônicos e HTML inicial dos artigos no build. Validar saída publicada sem depender da sessão. Sem migração de framework.
- [x] Revisão: teste dos cálculos, build, lint e navegação/interação desktop/mobile em navegador externo no localhost:5173. Revisar bots e estados sem login; registrar limitações de acesso autenticado se não houver sessão de teste.

## Direção visual

Seleção determinística Python seed 5173: Editorial Split, Cabinet Grotesk, Feedback Carousel / Inline Typography Images / Horizontal Accordions, GSAP pinned title / image scale. Manter Outfit nos campos e identidade do curso. Exemplos com feedback substituem depoimentos; não fabricar prova social. Aplicar movimento às páginas de apresentação, sem atrapalhar uso das calculadoras. Mobile e preferência de redução de movimento prevalecem.

## Validação prevista

`node --experimental-strip-types --test src/lib/tool-calculations.test.ts`

`npm run build`

`npm run lint`

Navegador externo: catálogo, três ferramentas, cinco artigos, header/menu/footer/ticker, entrada inválida, reset, refresh de URL profunda, largura 390px, ausência de overflow. Não criar assinatura fictícia para provar bots.

## Fontes de implementação

- https://gsap.com/resources/React/ — useGSAP e limpeza dos efeitos.
- https://react.dev/reference/react-dom/components/title — metadados no React atual.
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics — HTML, títulos e indexação.
- https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/understand_risks_of_virtual_currency.html — explicações de exposição e riscos.

Context7 não está disponível nas ferramentas desta sessão; usar documentação oficial como alternativa.

## Resultado da validação

Build concluído; 7 testes de cálculos passaram; lint sem erros (avisos preexistentes). Navegação e formulários verificados em navegador externo, desktop e largura de 390px. HTML inicial do artigo validado via HTTP sem JavaScript. Rotas públicas acessíveis sem sessão; rota interna redireciona visitantes ao login. A experiência com assinatura ativa não foi validada visualmente por falta de sessão de teste.

Para publicação, configurar VITE_SITE_URL com a origem pública do site; o build lê também os arquivos .env de produção. Os cards dos três bots permanecem Em breve, sem integração operacional.
