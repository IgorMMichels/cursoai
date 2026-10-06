# Omega internacional — brainstorm

Data: 6 de outubro de 2026.
Status: proposta para implementação; não altera o site nem publica novos preços.
Plano técnico: [Implementação](2026-10-06-internacionalizacao-implementacao.md).

## Objetivo

A mesma Omega, com quatro idiomas, região sugerida automaticamente e preços próprios de cada mercado. Preservar o visual atual, a logo sem acento, o Bitcoin da landing e o progresso dos alunos. Não fazer outra repaginação visual como parte desta mudança.

Pedido confirmado: quatro idiomas, comportamento regional, referência de 97 para o mensal nos EUA, áudios em português agora e inglês depois. Interpretação para o rascunho: US$ 97 por 30 dias. Renovação automática ainda não foi definida.

Idiomas confirmados pelo usuário: português brasileiro, inglês, espanhol e francês. As variantes regionais de formatação são tratadas separadamente da tradução comum de cada idioma.

## O que já existe no projeto

| Área | Situação observada | Consequência |
| --- | --- | --- |
| Aplicação | React 19, Vite 8, TypeScript, React Router 7 com `BrowserRouter` | Internacionalizar a SPA existente, sem migrar framework |
| Textos | JSX, catálogos TypeScript/JSON, serviços, scripts e banco em português | Traduzir interface e conteúdo, não apenas menus |
| Oferta | `src/lib/offers.ts`: BRL e SOL como strings formatadas | Separar valor numérico, moeda, mercado e rótulos |
| Planos | 30 dias, 90 dias e vitalício | Preservar IDs e acesso de contas existentes |
| Checkout | `/planos` informa que não processa pagamentos | Preços regionais não significam checkout pronto |
| Banco | Pedidos, comissões e saques restringem moedas a BRL/SOL nas migrations atuais | USD e outras moedas exigem mudança coordenada de servidor e relatórios |
| Curso | Metadados locais/remotos e conteúdo protegido por aula | Traduções devem manter os IDs e os controles de acesso |
| Avaliação | Quizzes e exercícios verificados por RPC | Traduzir perguntas sem mudar identidade das respostas |
| Áudio | Catálogo por blocos, transcrições, legendas e associação aula→áudio | Preparar versões por idioma sem inventar narração inglesa |
| SEO | Pré-renderização de artigos/ferramentas em português | Gerar HTML e metadados das versões realmente traduzidas |
| Formatação | `pt-BR`, BRL e textos de USD fixos em vários componentes | Centralizar números/datas, preservando a moeda real de cada dado |

A inspeção é do código e das migrations locais; não comprova o estado do banco em produção.

## Quatro escolhas independentes

1. **Idioma da interface:** menus, mensagens, páginas, ajuda e acessibilidade.
2. **Idioma do conteúdo:** aulas, perguntas, artigos e transcrições traduzidas. Pode usar o mesmo padrão da interface, mas precisa comunicar indisponibilidade.
3. **Mercado comercial:** país/região que determina a oferta aprovada. Não é deduzido do idioma.
4. **Idioma do áudio:** inicialmente português; inglês passa a aparecer onde houver gravação publicada.

Exemplos: um brasileiro nos EUA pode ler em português e ver o plano americano. Um aluno no Brasil pode ler em inglês e continuar vendo o plano brasileiro. A moeda da operação no simulador continua sendo a moeda daquele instrumento.

## Como o visitante chega

Uma URL explícita como `/en/landing` mantém inglês. Um visitante sem idioma explícito recebe uma sugestão regional; suas escolhas ficam salvas. Nunca pedir GPS para isso.

O seletor terá dois campos, com nomes em texto:

- Idioma: Português, English, Español, Français.
- País/região: usado para sugerir oferta e moeda; outras regiões continuam acessando o site mesmo sem oferta comercial publicada.

Prioridade do idioma: URL válida → escolha explícita neste navegador → preferência da conta → idioma padrão do país sugerido → idioma suportado do navegador → inglês. A sugestão por país é somente para entrada sem preferência; se o usuário corrigir, a correção prevalece.

Prioridade do mercado: país comercial já confirmado no fluxo de pagamento → escolha explícita de país → preferência regional salva → sugestão de país pelo servidor → mercado ainda não definido. O idioma do navegador nunca serve como prova de país para cobrar.

Quando o servidor não conhecer o país, a página funciona pelo idioma do navegador e pede a escolha da região na área de planos. Quando houver VPN, viagem ou erro de detecção, a pessoa pode corrigir a sugestão.

## Mapa inicial de mercados

| País/grupo | Idioma sugerido sem preferência | Moeda comercial candidata | Observação |
| --- | --- | --- | --- |
| Brasil | Português | BRL | Preservar a oferta atual inicialmente |
| Estados Unidos | Inglês | USD | US$ 97 por 30 dias é a referência do pedido |
| Países hispanofalantes | Espanhol | Depende do país | México, Espanha e Argentina não são um único mercado monetário |
| França | Francês | EUR | Preço ainda não definido |
| Outros países francófonos | Francês quando aplicável | Depende do país | Canadá, Bélgica e Suíça exigem configurações próprias; países multilíngues também consideram o navegador |
| Demais países | Idioma suportado do navegador; inglês como reserva | Oferta internacional a definir | Não atribuir o preço americano automaticamente |

Manter uma configuração de países explícita. Não classificar continente inteiro como um idioma. Portugal pode usar português brasileiro como variante inicial informada. Na primeira edição, francês é uma tradução comum; datas, números e moeda podem usar o locale regional, como `fr-FR` ou `fr-CA`.

## Brainstorm de preços

Recomendação: preços fixos e versionados por mercado. O câmbio não redefine o preço comercial a cada atualização de tela. Conversão estimada pode ser um recurso separado, claramente rotulado, se houver necessidade.

| Mercado/plano | Valor de referência | Estado |
| --- | --- | --- |
| Brasil, 30 dias | R$ 299 | Oferta atual do código, manter no primeiro passo |
| Brasil, 90 dias | R$ 549 | Oferta atual do código |
| Brasil, vitalício | R$ 699 | Oferta atual do código |
| EUA, 30 dias | US$ 97 | Proposta do usuário, validar período e cobrança |
| EUA, 90 dias | A definir | Não multiplicar nem converter automaticamente |
| EUA, vitalício | A definir | Definir custo e compromisso de atualizações antes do valor |
| Outros países | A definir por país | Não publicar valores inventados |

Para discutir o trimestral americano, um desconto de 10%–20% sobre três períodos de US$ 97 produz **US$ 261,90–232,80**. É uma simulação aritmética interna, não pesquisa de mercado, recomendação definitiva ou tabela para publicar. O vitalício deve ser avaliado separadamente; preço baixo demais pode comprometer a manutenção futura.

Os preços atuais em SOL são fixos e a página já informa que não acompanham câmbio. Precisamos decidir se essa oferta continua fixa ou se uma futura cobrança calcula SOL a partir de uma cotação temporária. Não misturar os dois modelos silenciosamente.

Decidir outros preços a partir de capacidade de pagamento do público, conversão observada, custos de atendimento/tradução, taxas do provedor e margem. Não assumir que um valor em USD convertido para moeda local tem o mesmo posicionamento.

Mercado sem preço aprovado: o idioma pode estar disponível, mas a compra regional fica indisponível com explicação e opção de contato. Não mostrar preço zero nem transformar uma cotação estimada em cobrança.

## Formas possíveis de implementar

| Alternativa | Ganho | Limite | Decisão proposta |
| --- | --- | --- | --- |
| Trocar textos só pelo navegador | Primeiro passo simples | URLs e compartilhamento não expressam idioma | Não usar como arquitetura final |
| Prefixo de idioma e catálogos por área | Links estáveis, tradução por etapas, mesma aplicação | Requer revisar todos os links e redirecionamentos | Recomendada |
| Um domínio/aplicação por país | Separação comercial forte | Multiplica publicação, correções e manutenção | Adiar |
| Tradução automática ao abrir a página | Pouco trabalho editorial inicial | Conteúdo financeiro inconsistente, latência e revisões difíceis | Não usar em produção |

Proposta: `i18next` + `react-i18next`, catálogos por área carregados sob demanda, URLs `/pt-BR/…`, `/en/…`, `/es/…`, `/fr/…`, país escolhido à parte. Recursos de namespaces e carregamento reativo foram consultados via Context7 na [documentação do react-i18next](https://react.i18next.com/latest/usetranslation-hook).

URLs distintas e links para trocar idioma ajudam a descoberta das versões; não redirecionar uma versão explícita com base em IP. Referência: [Google Search Central](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites).

## Áudio: promessa honesta agora, expansão depois

No lançamento textual internacional: informar nas páginas de planos, preview e aulas que a narração está disponível em português. A interface e o texto podem estar em inglês sem sugerir áudio inglês.

Na aula em inglês: mostrar “Áudio: Português” e “Áudio em inglês ainda não disponível” quando for o caso. Não tocar português automaticamente se a pessoa pediu inglês; oferecer uma ação explícita para ouvir português. Se português já for a preferência de áudio da pessoa, manter essa escolha.

Preparar por gravação: idioma falado, versão do roteiro, blocos, voz, duração, transcrição e legendas. Tradução do texto da aula e transcrição literal da gravação são coisas diferentes. Uma legenda traduzida não herda os alinhamentos de palavras do áudio português.

Publicar inglês aula a aula, com revisão editorial e teste do player. Português continua disponível. Espanhol/francês não ganham promessas de áudio até existir produção aprovada.

## O que traduzir em todo o website

Landing, planos, preview, login/cadastro/recuperação, header/footer, área do aluno, quatro jornadas, aulas, quizzes, revisões, segurança, certificados, plataformas, ferramentas, simulador, radar, afiliados, administração, perfis e mensagens de erro. Incluir metadados SEO, textos alternativos, nomes acessíveis, gráficos, e-mails transacionais e comunicações próprias dos bots.

Notícias de terceiros e mensagens de comunidade não são traduções editoriais da Omega. Preservar a fonte e identificar o idioma original; caso um resumo traduzido seja adicionado, rotular e validar esse fluxo à parte.

Aulas com referências brasileiras, impostos ou regulação precisam de contexto explícito. Traduzir a frase não transforma uma regra brasileira em regra válida para outro país. Conteúdo regional só será publicado depois de revisão específica.

## Ordem recomendada

1. Fundação de idioma, rotas, preferências e inventário completo de textos.
2. Jornada pública em português e inglês, com preço americano apenas como oferta em preparação enquanto o checkout não existir.
3. Curso e avaliação traduzidos, preservando progresso e regras de acesso.
4. Espanhol e francês após revisão; SEO das versões publicadas.
5. Cobrança regional real após definição de preços, provedor e renovação.
6. Áudio inglês por aula, usando a estrutura multilíngue preparada anteriormente.

Construir suporte aos quatro idiomas desde o começo. Liberar um idioma ao público somente quando sua experiência anunciada estiver pronta; não chamar menus traduzidos com curso em português de curso totalmente traduzido.

## Decisões pendentes

- Definir países iniciais de venda; os quatro idiomas estão confirmados.
- Confirmar US$ 97 por 30 dias ou assinatura com renovação automática.
- Definir valores americanos de 90 dias/vitalício e ofertas dos demais países.
- Escolher provedor de pagamentos e validar países/moedas realmente suportados antes de habilitar compra.
- Definir o modelo de SOL e a disponibilidade do vitalício em novos mercados.
- Definir quem revisa traduções e quais aulas terão áudio inglês primeiro.

Essas decisões não impedem implementar a base técnica de idiomas. Elas impedem publicar preços indefinidos, cobrar ou anunciar conteúdo ainda não disponível.
