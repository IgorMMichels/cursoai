# Ômega: identidade Trajetória

A marca usa um Ω com corte ascendente. Os dois contornos em `src/lib/omega-brand.ts` alimentam o componente SVG e a extrusão do ASCII 3D. Altere essa matriz para evoluir a geometria, evitando desenhar versões divergentes.

## Aplicações

- Cabeçalho e navegação: componente `Brand`, assinatura horizontal.
- Espaço reduzido: `Brand compact` ou `symbol-small.svg`.
- Fundo escuro: símbolo lilás ou assinatura branca.
- Fundo claro: assinatura escura; a interface usa um lilás mais escuro para contraste.
- Destaque: símbolo grande sólido ou `symbol-gradient.svg`. O gradiente não se aplica aos títulos da interface.
- Ícone: `favicon.svg`, `favicon-32.png`, `app-icon-192.png` e `app-icon-512.png`.

Os assets estão em `public/brand/omega/`. Abra `preview.html` pelo servidor do site para ver as aplicações e os tamanhos de 16, 24, 32 e 48 px. As assinaturas SVG incorporam a fonte Outfit; o componente usa a versão variável já instalada no projeto. Os símbolos PNG mantêm fundo transparente.

Para regenerar os SVGs e a prévia, execute `node scripts/build-omega-brand.mjs`. Essa operação requer `public/fonts/outfit-latin.woff2`, copiada da dependência Outfit existente. Os PNGs foram exportados da matriz SVG pelo canvas do navegador.

Mantenha um respiro mínimo equivalente a um quarto da altura do símbolo. Não estique a marca, mude a direção do corte ou acrescente borda luminosa. A adaptação pequena abre ligeiramente o corte para preservar a leitura.

## Interface

Tokens em `src/styles/omega.css`: carvão, superfícies discretas, lilás e texto de alto contraste. A landing e os planos têm tema claro, escuro e sistema, com preferência local persistente. O login acompanha a mesma preferência. As telas operacionais existentes mantêm sua estrutura funcional e recebem a assinatura compartilhada; suas cores específicas de dados e estados não foram substituídas indiscriminadamente.

As oito seções da landing são apresentação, método, jornadas e aulas, prática, carteiras e exchanges, avaliações, planos e dúvidas. Preços, períodos de acesso, avaliações e catálogo usam as fontes reais do projeto. O título do curso **Cripto do Zero** foi preservado no catálogo, progresso, narrativas e certificado. A plataforma e o emissor passam a ser **Ômega**.

O botão de cadastro abre `/login?mode=signup`. A rota `/planos` mantém os parâmetros `plano` e `moeda` no caminho para a conta. Não há checkout conectado, e a interface continua informando essa limitação.

## Movimento

O símbolo estático aparece primeiro. “Explorar em ASCII” carrega o renderer 3D sob demanda; “Pausar” interrompe as atualizações. A oscilação é pequena e mantém a face legível. A cena usa uma única cor e não divide recursos com shaders decorativos.

O renderer limita as atualizações a 24 fps, pausa fora da tela ou com a aba oculta e descarta geometrias ao desmontar. Em movimento reduzido, hardware restrito ou falha de WebGL, permanece o símbolo estático. O loader de rota é indeterminado, só aparece após 200 ms de espera real e sai quando o conteúdo está disponível. Não existe duração mínima artificial.

## Referências geradas

As imagens de `referencias/` foram geradas com a ferramenta imagegen nativa, seguindo a skill imagegen-frontend-web. São referências de composição; textos, números e elementos que não correspondem ao produto não foram usados como evidência ou conteúdo publicado.

| Imagem | Direção do prompt |
| --- | --- |
| `secao-1.png` | Hero horizontal, mensagem curta e símbolo Trajetória, composição assimétrica. |
| `secao-2.png` | Método editorial com tese, risco, limite e sequência de aprendizado. |
| `secao-3.png` | Biblioteca de jornadas, imagens amplas e módulos expansíveis. |
| `secao-4.png` | Atividade em destaque e duas atividades de apoio. |
| `secao-5.png` | Guias de carteiras, leitura clara e ações instrutivas. |
| `secao-6.png` | Avaliações com estado vazio honesto e convite para participar. |
| `secao-7.png` | Planos com preços existentes, moeda e aviso de checkout indisponível. |
| `secao-8.png` | Dúvidas em acordeões, com espaço e respostas diretas. |

Todos os prompts pediram uma única seção horizontal, paleta carvão/lilás, sans semelhante a Outfit, espaçamento generoso, hierarquia implementável e ausência de efeitos genéricos ou evidências inventadas.
