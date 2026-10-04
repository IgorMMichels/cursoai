# Omega: login com ASCII 3D e ajustes de marca

## Pedido

Implemente este briefing no projeto existente. A marca passa a se chamar **Omega**, sem acento. A tela de login recebe o símbolo Trajetória em ASCII 3D. Retire a moldura da logo em todas as aplicações e substitua a seção de comparação genérica por diferenciais verificáveis do produto.

O redesign anterior foi rejeitado e revertido. Preserve o layout atual do restante do site. Não recrie a landing, não adicione temas e não troque o ASCII 3D do Bitcoin usado na entrada da plataforma. O ASCII de Omega é uma experiência própria da página de acesso.

Este arquivo é um briefing para implementação posterior. Sua criação não autoriza interpretar recursos planejados como recursos disponíveis.

## Direção visual

Leia como um refinamento da interface existente: fundo escuro, tipografia Outfit, lilás da marca, formulário direto e símbolo em movimento. A identidade vem da geometria de Omega, não de efeitos de fundo.

Use a skill `design-taste-frontend` no modo de preservação. Mantenha a stack instalada: React, TypeScript, Vite, Tailwind e Lucide. Não introduza uma nova biblioteca de interface. Para o ASCII, reutilize as dependências Three, React Three Fiber e `three-stdlib` existentes.

Não use foguetes, fogo, moedas flutuantes, telas fictícias de operações, cartões translúcidos em cascata, brilho intenso nem depoimentos inventados. Não transforme o formulário em uma peça de marketing.

## Escopo fechado

1. Marca compartilhada: nome Omega e logo sem moldura, incluindo header, footer, login e loader existente.
2. Login: preservar o formulário funcional e substituir o painel decorativo por ASCII 3D de Omega.
3. Landing: revisar apenas a seção `comparison-section` e as mensagens de marca diretamente afetadas.
4. Preparação dos textos alterados para tradução futura, sem implementar idiomas nesta etapa.

Preserve catálogo, preços, planos, ferramentas, telas de aulas, certificados, áudio e contratos de autenticação. Não altere rotas ou dados para viabilizar a composição visual.

## Marca sem acento e sem moldura

A base aprovada é o símbolo Trajetória em `public/brand/omega/symbol-accent.svg`: Ω robusto com corte diagonal ascendente. Não substitua por um Ω de fonte ou por uma seta desenhada sobre um círculo.

Em `src/components/brand.tsx`, mantenha o tamanho ocupado pelo componente e seus alinhamentos. No invólucro `.brand-mark`, remova exclusivamente os efeitos que emolduram a marca:

- `border`, fundo de placa, `box-shadow` e `border-radius`;
- padding decorativo ou recorte que faça o símbolo parecer dentro de um quadrado de cerca de 10 px de arredondamento;
- pseudo-elementos que acrescentem borda, halo ou segunda moldura.

O símbolo deve flutuar diretamente sobre o fundo do header, footer e demais locais. Preserve sua proporção e o respiro entre símbolo e nome. Não aplique `border: 0` globalmente: inputs, separadores funcionais e indicadores de foco continuam legíveis.

Use **Omega** na assinatura, rótulos acessíveis, aplicações do nome da plataforma e metadados correspondentes. Preserve **Cripto do Zero** quando for o título real do curso. Confira cada ocorrência em contexto; não faça substituição indiscriminada em aulas, transcrições ou histórico.

As assinaturas SVG horizontais e verticais atuais contêm “Ômega”. Atualize também o texto interno desses assets para “Omega”, sem alterar o desenho do símbolo. Não basta mudar `alt` ou nome do arquivo. Favicon e ícones de aplicativo continuam usando apenas o símbolo.

## Login

### Composição

Em desktop, mantenha duas áreas: formulário à esquerda e símbolo ASCII à direita, sem caixa ao redor da animação. Preserve largura confortável dos campos, espaçamento e posição das ações. Use `min-height: 100dvh` e permita rolagem quando o conteúdo ou teclado exigir.

O painel direito deve conter o símbolo com bom tamanho e, se necessário, uma única frase factual: **“Cripto, memecoins, futuros e trading.”** Remova círculos decorativos, grades e textos que apenas repetem a proposta da plataforma. O formulário continua sendo a ação principal.

Em mobile, priorize os campos e o botão de acesso. Mostre a marca estática acima do formulário e dispense o canvas se a animação comprometer espaço, desempenho ou teclado. Não obrigue o usuário a rolar por uma animação antes de entrar.

### Texto do formulário

| Estado | Título | Ação principal |
| --- | --- | --- |
| Entrar | Entre na sua conta | Entrar |
| Cadastro | Crie sua conta | Criar conta |
| Redefinição | Redefina sua senha | Enviar link |
| Recuperação | Escolha uma nova senha | Salvar senha |

Preserve instruções e mensagens necessárias ao funcionamento, especialmente erros, disponibilidade do ID, requisitos da senha e sucesso da recuperação. Não substitua feedback real por mensagens publicitárias.

### Contratos que devem continuar funcionando

Preserve `useSession`, validações, mostrar/ocultar senha, recuperação, tratamento de erro, redirecionamento seguro, `plano`, `moeda`, `ref` e retorno ao destino autorizado. Verifique os modos efetivamente existentes no arquivo antes de editar. Não simule sucesso de autenticação nem altere regras do backend.

## ASCII 3D real de Omega

Crie um componente independente, por exemplo `src/components/ui/omega-login-ascii.tsx`, carregado sob demanda pela página de login. Não substitua nem altere a geometria de `src/components/ui/3d-ascii-model-viewer.tsx`, que deve continuar exibindo Bitcoin na experiência existente.

Use uma cena renderizada, convertida em caracteres por `AsciiEffect`. Uma imagem rasterizada, um vídeo ou um `<pre>` estático não atendem ao requisito de animação 3D; a versão estática serve apenas como fallback.

### Geometria e movimento

1. Leia os paths do SVG Trajetória aprovado, com `SVGLoader` ou matriz compartilhada de contornos.
2. Gere as formas preservando o vazio interno e o corte diagonal. Extrude com profundidade discreta; não modele uma moeda de Bitcoin com Ω colado na frente.
3. Centralize a geometria pelo bounding box. Ajuste câmera e escala ao contêiner sem cortar base, topo ou trajetória.
4. Use uma única cor lilás em caracteres monoespaçados, com fundo transparente e contraste suficiente. Ajuste luz, resolução e caracteres para manter a silhueta reconhecível.
5. Faça uma oscilação lenta de aproximadamente ±12° no eixo vertical, com pequena inclinação opcional. Evite giro completo constante que deixe o símbolo irreconhecível de perfil.
6. Adicione controle discreto de pausar/retomar, acessível por teclado. A animação não captura cliques, foco ou rolagem do formulário.

### Desempenho e acessibilidade

- Renderize o SVG estático primeiro e faça o carregamento do renderer sem bloquear os campos.
- Mantenha um canvas e limite a atualização a 24 fps; pause com aba oculta ou cena fora da tela.
- Com `prefers-reduced-motion`, hardware limitado ou WebGL indisponível, permaneça no SVG estático sem erro visível ao usuário.
- Evite progresso fictício e espera mínima artificial no login. Preserve o loader de Bitcoin atual fora desse escopo.
- Descarte geometrias, materiais, listeners e elementos auxiliares do efeito ao desmontar.
- Trate a cena como decorativa com `aria-hidden`; a assinatura textual informa a marca ao leitor de tela.

## Diferenciais concretos na landing

Referência enviada pelo usuário: `referencia-diferenciais.png`, ao lado deste arquivo. Use a imagem como lista de ideias, não como prova de exclusividade ou disponibilidade.

Em `src/pages/landing-page.tsx`, retire a comparação “o caminho comum” versus “no cripto do zero”, o título **“Aprenda com critério. Decida no seu tempo.”** e os elementos decorativos dessa seção que sugerem recursos inexistentes.

Preserve a posição e o espaço geral da seção. Troque seu conteúdo por **“O que você encontra na Omega”**, com quatro itens curtos e concretos. Não adicione uma seção nova em paralelo.

| Diferencial | Texto sugerido | Fonte para conferir |
| --- | --- | --- |
| Quatro áreas de estudo | Cripto, memecoins, futuros e trading em jornadas organizadas. | `src/lib/course.ts`, `src/lib/journeys.ts` e catálogo exibido |
| Memecoins com jornada própria | Aulas e módulos dedicados à análise de memecoins. | Jornada correspondente em `src/lib/journeys.ts` |
| Guias de plataformas | Passos para conhecer ferramentas como Axiom, GMGN, Trojan e Phantom. | `src/lib/platform-guides.ts`, `src/lib/platform-guide-media.ts` e rota funcional de guias |
| Estudo acompanhado | Aulas narradas, quizzes e acompanhamento de progresso. | Dashboard, página de aula, quizzes e serviços de progresso |

Cada item deve apontar para uma página ou ação real, se houver destino apropriado. Não use botões sem destino. Mostre somente os recursos confirmados no estado atual do projeto, com linguagem educacional; um tutorial de um bot externo não equivale a um bot próprio integrado à Omega.

A imagem também menciona checklist de segurança, streaks, badges, módulos desbloqueáveis, bots próprios, comunidade, horas de conteúdo e tradução em EN/ES/ZH. Trate esses itens assim:

- Segurança: inclua como detalhe se o checklist estiver acessível e funcional; não diga que nenhum concorrente oferece.
- Progresso: pode ser citado quando ligado aos dados reais do aluno. Não extrapole para streaks, badges ou desbloqueios sem implementação confirmada.
- Comunidade: um serviço de avaliações não comprova Discord ativo ou comunidade integrada. Verifique produto e configuração antes de publicar essa promessa.
- Bots próprios e tradução completa: ficaram sem confirmação na leitura inicial do código; não anunciar nesta etapa.
- Duração: calcule pelas aulas reais, sem copiar “5h+” ou “1h+” da referência.
- Alegações como “ninguém no mundo tem”, “zero cursos fazem isso” e comparações com Udemy/Coursera: não publicar sem pesquisa e evidência adequadas. Não são necessárias para descrever o produto.

## Preparação para idiomas

Centralize os textos novos em uma estrutura pequena com chaves semânticas de login, marca e diferenciais. Reutilize o mecanismo de tradução do projeto se existir; caso contrário, não introduza um framework completo de i18n apenas para esta entrega.

Mantenha português como idioma ativo, nome Omega invariável e layouts que suportem textos cerca de 30% mais longos. Não concatene partes de frases para tradução. Não adicione seletor de idiomas sem traduções funcionais.

## Verificação e entrega

1. Confira login/cadastro/recuperação, validações, parâmetros de URL e navegação por teclado. Use credenciais autorizadas para testes autenticados; não declare fluxos remotos aprovados sem executá-los.
2. Confira a marca sem placa, borda, sombra ou recorte no header, footer, login e loader. Campos e foco continuam identificáveis.
3. Confira Omega sem acento em texto e nos assets de assinatura.
4. Confira ASCII de Omega no login, pausa e fallback estático; confirme que o ASCII de Bitcoin continua inalterado na entrada existente.
5. Teste 360, 390, 768 e 1440 px, zoom de 200% e movimento reduzido. Não deve haver rolagem horizontal nem ação essencial encoberta.
6. Execute build e lint. Separe avisos preexistentes de problemas introduzidos.
7. Capture antes/depois do login e da seção de diferenciais. Revise o diff: nenhuma mudança geral de tema, layout ou catálogo deve entrar nesta entrega.
8. Preserve alterações de áudio e outras mudanças já presentes no workspace. Ao commitar, inclua somente arquivos pertencentes a este escopo.

Entregue código funcional, assets corrigidos e um relato curto das verificações. Não substitua a implementação por um mockup e não refaça o site inteiro.
