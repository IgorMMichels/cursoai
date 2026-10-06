# Internacionalização completa da Omega — plano de implementação

Data: 6 de outubro de 2026.
Status: plano executável, ainda não implementado.
Escopo e decisões comerciais: [Brainstorm](2026-10-06-internacionalizacao-brainstorm.md).

## Resultado esperado

Quatro idiomas suportados em toda a experiência, preferência persistente, região comercial independente, ofertas regionais numéricas e áudios versionados por língua. Preservar a aplicação React/Vite, a identidade Omega, autenticação, permissões, IDs de conteúdo e progresso. Não alterar layout como consequência da extração de textos.

Trabalhar sobre o estado atual do repositório. Há alterações locais de áudio, bots, radar e outros componentes; inventariar a versão vigente antes de editar. Não sobrescrever nem incluir trabalho alheio em commits da internacionalização.

## 1. Contratos que devem ser definidos primeiro

Tipos propostos, não código instalado:

```ts
type UiLocale = 'pt-BR' | 'en' | 'es' | 'fr'
type AudioLocale = 'pt-BR' | 'en'
type CountryCode = string // validado contra a lista de países configurada
type FiatCurrency = 'BRL' | 'USD' | 'EUR' | 'MXN' | 'CAD'
type SettlementAsset = FiatCurrency | 'SOL'
type PreferenceSource = 'explicit' | 'account' | 'country' | 'browser' | 'default'

type LocalizationPreferences = {
  version: 1
  uiLocale: UiLocale
  countryCode?: CountryCode
  preferredAudioLocale: AudioLocale
}

type RegionalOffer = {
  id: string
  marketId: string
  planId: 'month' | 'quarter' | 'lifetime'
  currency: FiatCurrency
  amountMinor: number
  billingMode: 'one_time' | 'recurring'
  accessDays: 30 | 90 | null
  version: number
  status: 'draft' | 'published' | 'retired'
}
```

A lista de moedas é capacidade candidata, não habilitação comercial. Novas moedas exigem revisão de precisão e provedor. `SOL` não usa centavos: usar quantidade decimal validada ou lamports inteiros, em contrato próprio. Não reutilizar `amountMinor` fiat para cripto.

US$ 97 fica como `amountMinor: 9700`, moeda USD, oferta americana em `draft`, `accessDays: 30`, `billingMode: one_time` enquanto não houver decisão de recorrência. A configuração de produção não publica esse rascunho automaticamente.

## 2. Inventário obrigatório por superfície

| Superfície | Arquivos/pontos reais | Entrega |
| --- | --- | --- |
| Inicialização e rotas | `src/App.tsx`, entrada React, `app-utilities`, contexto da animação de entrada | Resolver idioma antes de pintar textos; rotas antigas compatíveis |
| Marca e navegação | `brand`, `site-header`, `course-layout`, `omega-copy` | Marca Omega imutável; menus e tagline traduzidos |
| Marketing e acesso | `landing-page`, `plans-page`, `preview-page`, `course-preview`, `wallet-guides` | Conteúdo e ofertas coerentes entre páginas |
| Autenticação/perfil | `login-page`, `session-context`, `profile-settings`, `profile-service`, `email-preferences` | Formulários, estados e e-mails no idioma escolhido |
| Curso | `course.ts`, `journeys.ts`, `course-dashboard`, `journeys-page`, `lesson-page`, `learning-service` | Títulos, textos, atividades e revisões por locale |
| Avaliações | `module-quiz-page`, RPCs de quiz/exercício, dados de perguntas | Perguntas traduzidas com ordem/identidade de opções estável |
| Recursos | `security-page`, `certificate-page`, `platforms-page`, `platform-guides` | Orientações, checklist, certificado e guias traduzidos |
| Ferramentas/editorial | `tools.ts`, `tool-articles.ts`, calculadoras, `tools-page`, `tool-articles-page` | Textos, resultados e artigos em cada idioma |
| Simulador/mercado | `simulator-page`, `market-prices`, `price-ticker`, `price-ticker-chart`, radar | Interface localizada; unidades financeiras corretas |
| Afiliados/admin | páginas e serviços de afiliados/admin, enrollment | Idioma + relatórios separados por moeda |
| Áudios | `extra-audio`, `lesson-audio`, `audio-tracks`, players, scripts e catálogos gerados | Contrato multilíngue e disponibilidade real por gravação |
| Publicação/SEO | `PageMeta`, `index.html`, `prerender-learning.mjs`, host/CDN | HTML, links alternativos e metadados por idioma |
| Bots/e-mails | integração atual e templates realmente usados | Mensagens próprias localizadas; fonte externa identificada |

Incluir `aria-label`, `title`, `alt`, placeholders, toasts, estados vazios, mensagens de carregamento, erros, datas, durações e textos dentro de gráficos. Dados pessoais e códigos não são traduzidos.

## 3. Idiomas e carregamento

Criar `src/i18n/config.ts`, `locales.ts`, `preferences.ts`, `formatters.ts` e `src/contexts/localization-context.tsx`. Adicionar `i18next` e `react-i18next` com versões verificadas no momento da implementação e lockfile atualizado.

Catálogos em `src/locales/{locale}/{namespace}.json`. Namespaces sugeridos: `common`, `marketing`, `auth`, `pricing`, `course`, `tools`, `simulator`, `platforms`, `affiliate`, `admin`, `errors`. Conteúdo longo do curso não deve entrar no namespace global.

Carregar `common` e a página necessária com imports dinâmicos explícitos/manifesto validado; carregar outras áreas sob demanda. Usar `useTranslation(namespace)` e `changeLanguage()` para atualizar a interface. O carregamento com Suspense está previsto pela [documentação consultada via Context7](https://react.i18next.com/latest/usetranslation-hook).

Configurar exatamente os quatro códigos suportados e normalizar variantes antes de inicializar. `en-US`/`en-GB` → `en`; variantes de espanhol → `es`; `fr-FR`/`fr-CA` → `fr`; `pt`/`pt-BR` → `pt-BR`. Português de Portugal pode usar a edição brasileira identificada. Não usar `languageOnly` globalmente: isso descartaria `BR` do código escolhido. Usar recursos canônicos e resolução explícita. Manter `formatLocale` separado quando houver variante regional, sem alterar o idioma editorial ou deduzir país de cobrança a partir dele.

Resolução técnica de chaves: locale solicitado → português brasileiro de origem; em produção o CI deve impedir chaves obrigatórias faltantes em um idioma liberado. Conteúdo longo ausente deve ter aviso de idioma de origem, e não uma página aparentemente toda traduzida. Inglês como padrão de entrada sem sinais é uma decisão distinta de fallback de chave.

Usar chaves semânticas e parâmetros, nunca concatenar frases traduzidas. Implementar plurais com `count`; conferir [configuração e fallback do i18next](https://www.i18next.com/overview/configuration-options) e [plurais](https://www.i18next.com/translation-function/plurals). Em React, preservar escaping do renderizador; não inserir traduções ou HTML remoto sem sanitização.

## 4. Rotas, detecção e preferência reativa

Prefixos canônicos: `/pt-BR`, `/en`, `/es`, `/fr`. Nesta primeira versão preservar os segmentos existentes: `/en/planos`, `/es/explorar`, `/en/curso/aula/m1/m1l1`. Traduzir slugs públicos pode ser uma etapa futura com mapa de aliases; não renomear IDs do curso.

Usar o modo declarativo atual de React Router, com layout de locale, validação do parâmetro e `Outlet`. Não copiar exemplos do modo Framework que exigiriam migrar a aplicação. Referência via Context7: [roteamento declarativo](https://reactrouter.com/start/declarative/routing).

Centralizar `localizedPath`, `LocalizedLink` e navegação por identidade de rota. Revisar links absolutos, breadcrumbs, `NavLink`, imagens locais, `Navigate`, destino de login, recuperação de senha, certificado, URLs de afiliado e `location.pathname.startsWith(...)`. Calcular a rota sem prefixo para ticker, sidebar e animação; não duplicar Bitcoin/Omega/animações por idioma.

Reservar os quatro prefixos antes de `/:affiliateId`. Manter `/usuario?ref=...` e IDs de afiliado legados. Preservar `ref`, `plano`, `moeda`, filtros, `state.from` e hash ao mudar idioma. Callbacks de autenticação e URLs absolutas devem continuar em origens permitidas e destinos internos validados.

Comportamento de entrada:

1. URL com idioma suportado: renderizar esse idioma, sem redirecionamento regional.
2. URL antiga sem idioma: aplicar a prioridade definida no brainstorm. Criar ponte para a rota localizada conservando query/hash; não tratar prefixo inválido como idioma aceito.
3. Visitante novo: receber país sugerido, quando houver endpoint confiável, ou usar idioma do navegador. Mostrar seletores para correção.
4. Mudança explícita: guardar preferência imediatamente no navegador e atualizar URL/interface; sincronizar conta após login quando possível.
5. Se URL compartilhada divergir da conta, a URL vence naquela visita. Não gravar a preferência da conta apenas porque a pessoa abriu um link.

Chave de armazenamento versionada `omega:localization:v1`, usando os helpers de storage existentes para lidar com armazenamento bloqueado. Uma escolha explícita recém-feita localmente não pode ser sobrescrita pela resposta tardia do perfil. Entre dispositivos, preferência da conta é o padrão quando não houver URL/escolha local explícita.

Sinal de país: endpoint de primeira parte ou função no servidor que leia somente o header de país fornecido e sobrescrito pelo host/CDN. Host ainda não identificado: adapter configurável, sem presumir Vercel/Cloudflare. Headers de origem enviados pelo cliente não são confiáveis. Retornar país aproximado e origem do sinal, sem expor/reter IP no frontend. Cache curto de sugestão, sem cache compartilhado de respostas personalizadas. Não solicitar geolocalização precisa.

País sugerido não confirma elegibilidade comercial. Confirmar o país no futuro checkout; corrigir preço antes da autorização, com consentimento para o total revisto.

## 5. Preços, servidor e moedas

Refatorar `offers.ts`: IDs/benefícios e durações separados de traduções; valores numéricos por oferta versionada. Manter adaptação para os IDs `month`, `quarter`, `lifetime` de contas antigas. Validar seleções de query em vez de fazer cast de qualquer moeda enviada.

Separar `uiLocale`, `displayCurrency`, `offerCurrency` e `settlementAsset`. Trocar idioma reformata os mesmos números. Trocar país recalcula a oferta disponível e informa a mudança. Trocar moeda de visualização nunca altera o valor devido ou o país comercial confirmado.

Usar `Intl.NumberFormat(locale, { style: 'currency', currency })` com dígitos definidos pela moeda. Formatação não faz conversão cambial ([referência](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)). Não parsear strings como `R$ 299` para criar pedidos.

Dados comerciais propostos:

- `regional_prices`: mercado, plano, moeda, valor exato, versão, estado, vigência, modalidade de cobrança e preço/ID do provedor quando existir.
- `orders`: país confirmado, oferta e versão, moeda cobrada, valor exato congelado, tributos/taxas aplicáveis quando configurados, estado e referência do provedor.
- Preferências: tabela própria vinculada ao usuário, com locale/country/audio e data da escolha explícita. Não reutilizar `profiles.location` (texto livre pessoal) como país de cobrança.

Estas são propostas de schema. Antes de criar migrations, inspecionar banco real e migrar dados existentes sem reinterpretar valores antigos. Expandir constraints de `orders`, `commission_entries`, `payout_requests` e validações de `request_affiliate_payout`; atualizar os tipos usados por admin/afiliados. Não basta acrescentar USD ao frontend.

Admin/afiliados devem apresentar saldos por moeda. Nunca somar BRL, USD e SOL num total sem metodologia explícita de conversão. Comissões usam o valor/moeda congelados do pedido e uma regra de elegibilidade definida; não recalcular comissão antiga usando preço novo.

Leitura pública apenas das ofertas publicadas; escrita de preços apenas pelo caminho administrativo autorizado. Preferências por proprietário; detalhes de pedidos por proprietário/roles existentes. Manter proteção de conteúdo e impedir leitura de respostas corretas. Aplicar [RLS do Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security); preferências de idioma/região nunca concedem acesso.

Enquanto o checkout não existe, preservar o aviso de que pagamentos não serão processados. Implementar consulta regional é uma fase independente da cobrança.

Futuro checkout: o cliente envia `offerId` e método, não um valor confiável. O servidor valida versão, disponibilidade, país e preço; cria pedido idempotente e congela valores. Evento verificado do provedor confirma pagamento antes de liberar acesso. Repetição de evento não duplica pedidos/acesso/comissões. Preço expirado ou país corrigido exige nova confirmação; nenhuma cobrança muda silenciosamente. Não implementar assinatura recorrente sem regra de renovação, cancelamento e falha de cobrança definida.

SOL: escolher entre oferta fixa própria e cotação temporária de uma oferta fiat. Se cotação temporária: guardar valor fiat, quantidade SOL, fonte, horário, validade e tolerância; cancelar/reemitir cotação expirada. Sem cotação ao vivo fictícia ou acesso liberado por clicar em um botão.

## 6. Conteúdo, progresso e avaliações

Interface estática: JSON por namespace. Conteúdo editorial longo: arquivos versionados por idioma e manifesto de publicação. Conteúdo protegido: traduções servidas sob as permissões já existentes.

Proposta de armazenamento: traduções de jornada/módulo/aula por `(entity_id, locale)`, com estado `draft/reviewed/published`, revisão da fonte e revisão da tradução. `lesson_content_translations` mantém textos, takeaway, exercícios e fontes; sua leitura exige o mesmo acesso ativo do conteúdo original. Metadados publicados continuam consultáveis pelo preview conforme a política atual.

Alterar `loadJourneys` e `loadLessonContent` para receber locale; chavear caches por locale + versão + usuário quando necessário. Traduzir `course.ts`, capas/legendas, `course-preview-catalog`, guias, artigos e revisões por IDs. Não gerar quatro cópias de IDs de aulas.

Progressos, tentativas, agendamento e certificado continuam ligados ao mesmo aluno e às mesmas entidades. Trocar idioma não apaga progresso nem concede nova conclusão. Salvar o locale usado na tentativa apenas como contexto, quando necessário.

RPCs de exercícios/quizzes: aceitar locale validado, devolver somente enunciado/opções traduzidos, verificar a mesma opção canônica no servidor. Preservar ordem de opções nesta migração; se passar a embaralhar, introduzir IDs estáveis de opção com contrato explícito. Falha de tradução informa a língua disponível. Não publicar gabarito em JSON público nem duplicar questões de modo a divergir do gabarito original.

Não trocar exercício no meio de uma submissão. Conservar respostas ao trocar só o texto/locale; se a revisão canônica tiver mudado, avisar e reiniciar de forma controlada. O idioma de feedback é o da requisição, não uma inferência regional.

## 7. Áudio português agora; inglês preparado

Adicionar locale e revisão da fonte aos contratos de `NarrationTrack`, catálogos de blocos e associação de aula. Transformar `findLessonAudio(lessonId)` em resolução por aula + locale desejado, com retorno explícito de disponibilidade. Preservar as associações editoriais atuais, inclusive quando várias aulas usam um roteiro agrupado.

Contrato sugerido: `AudioVariant { sourceLessonId, locale, scriptRevision, status, voice, blocks, captionsSrc }`. Diretórios ou storage organizados por idioma/versão. Na fase inicial, migrar os arquivos existentes como `pt-BR`; não renomear ou duplicar grandes áudios sem necessidade.

`preferredAudioLocale` é independente da interface. Mostrar idiomas realmente publicados por aula. Quando inglês solicitado não existe: mostrar estado indisponível e botão explícito para ouvir português. Se nenhum áudio existir, manter leitura/atividade funcionando. Nunca carregar outro idioma sem informar.

Legendas e alinhamentos de palavras pertencem à gravação e ao idioma falado. Traduzir transcrição não produz alinhamento inglês. Uma legenda traduzida opcional tem `locale` e `audioLocale` distintos e exige validação de tempo. Não usar os índices de caracteres portugueses sobre texto inglês.

Ao trocar variante durante reprodução: pausar, cancelar carregamento antigo, revogar URLs temporárias quando existirem e começar no início do novo áudio. Posições por variante, identificadas por source/locale/revisão; não copiar segundos de português para inglês. Velocidade pode continuar como preferência do usuário. Respeitar ausência de autoplay.

Revisar `build-extra-audio-catalog.py`, `validate-extra-audio-catalog.py`, geradores de narração e exportação para aceitar locale/versão sem presumir português. Validar arquivos, blocos, transcrição, legenda, duração e ligação aula→fonte. Publicar inglês somente após revisão textual, gravação e teste do player.

Nos planos, substituir a promessa genérica “70 aulas narradas” por disponibilidade verdadeira: curso/textos nos idiomas publicados e narração portuguesa disponível; inglês apenas onde publicado.

## 8. Números, mercado, mensagens e SEO

`formatters.ts`: número, dinheiro, percentual, data, hora, duração. Datas armazenadas em UTC e exibidas no fuso escolhido/navegador; país não determina fuso único. Instâncias memoizadas por locale/moeda/fuso. Formulários aceitam separadores previstos no locale sem transformar `1,5` em `15`; valores internos continuam numéricos.

Ticker/gráficos: USD, USDT, SOL e BRL permanecem unidades reais das séries. Não trocar o símbolo para EUR sem obter/converter dados e rotular fonte/horário. USDT/BRL continua esse par em qualquer idioma. Uma conversão opcional é separada do preço comercial. Simulador preserva dados/carteira ao trocar idioma; rótulos mudam, cálculo e instrumento não.

Mapear erros técnicos para códigos de tradução estáveis; manter detalhes de diagnóstico fora da mensagem ao usuário. Localizar e-mails de confirmação/recuperação no fluxo suportado pelo serviço atual, links e preferência de comunicação. Mensagens próprias de bots usam locale da configuração; posts externos conservam idioma/fonte e podem ter resumo rotulado em projeto separado.

SEO: `html[lang]`, títulos, description, Open Graph e canonical por variante; `hreflang` recíproco somente entre versões publicadas, com `x-default` na entrada neutra. Não canonizar inglês/espanhol para português. Áreas privadas continuam `noindex`. Seguir [Google Search Central](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites).

Atualizar `prerender-learning.mjs` para gerar artigos/ferramentas traduzidos e navegação localizada. O HTML inicial e a aplicação React precisam apresentar a mesma versão textual. Páginas sem tradução editorial não entram como variantes completas em sitemap/hreflang. Testar rewrites e refresh de URLs profundas no host; assets continuam em seus caminhos reais.

## 9. Fases com critérios de saída

| Fase | Trabalho | Critério de saída |
| --- | --- | --- |
| 0 — Inventário | Registrar PT/EN/ES/FR confirmados, mapear superfícies/preços/links, versionar catálogo fonte | Lista completa, preços desconhecidos explicitamente draft, nenhum trabalho existente perdido |
| 1 — Fundação | Providers, resolver, storage, namespaces, formatters e adaptadores de região | Testes de prioridade passam; PT mantém comportamento; troca sem recarregar ou perder estado |
| 2 — Rotas/público | Links localizados, landing/planos/preview/auth e SEO inicial PT/EN | Deep links, afiliados, callbacks e recuperação funcionam; nenhuma versão explícita é sobrescrita pelo país |
| 3 — Curso/áudio | Conteúdo protegido, quiz/revisões, catálogo de áudio por idioma | Acesso e progresso preservados; áudio português identificado; ausência de inglês tratada |
| 4 — Website completo | Ferramentas, radar, plataformas, segurança, certificados, afiliados, admin, e-mails/bots | Inventário fechado; números corretos; relatórios por moeda; sem interface portuguesa escondida em EN |
| 5 — Quatro idiomas | Revisão editorial ES/FR e pré-renderização | Todos os fluxos anunciados traduzidos; acentos, plurais e expansão de texto corretos; publicação controlada por locale |
| 6 — Ofertas/cobrança | Schema regional, preços aprovados e provedor quando escolhido | Servidor fixa preço/moeda/país; webhook validado; reconciliação e regressão financeira passam |
| 7 — Áudio inglês | Produção e publicação gradual | Cada variante publicada tem roteiro, áudio, transcrição e legendas validados |

Fases 5 e 6 podem avançar independentemente após contratos estáveis. Idiomas não dependem de checkout internacional. Produção de áudio inglês não impede interface e curso textual internacional.

## 10. Verificação obrigatória

**Unidade:** normalização de locale, prioridades, storage indisponível, timeout de região, formato de números, plurais, oferta ausente e versão de preço. Testar USD 9700→97 sem conversão; assegurar que troca de idioma preserva valor/moeda. Testar precisão de fiat e SOL separadamente.

**Integração:** perfil com escolha conflitante, RLS de conteúdo traduzido, conta sem plano, locale inválido em RPC, opção correta canônica, tradução não publicada, moeda nova em relatórios e saques. Executar em ambiente de teste com contas de perfis distintos; teste apenas de frontend não comprova RLS.

**Navegador:** quatro locales × desktop/mobile nos principais fluxos. Português nos EUA, inglês no Brasil, Espanha/México, idioma não suportado, país ausente e VPN simulada. Trocar locale numa aula/quiz/calculadora/simulador sem perder progresso, respostas ou valores. Confirmar hash, query, referral e retorno após login. Conta sem plano continua bloqueada.

**Áudio:** EN inexistente com PT disponível; preferência PT explícita em UI EN; variante EN publicada; arquivo faltante; troca enquanto toca; transcrição/legenda corretas; aula sem áudio. Não realizar geração de novas vozes como parte dos testes.

**SEO/publicação:** abrir URLs profundas por requisição direta; conferir HTML pré-renderizado e pós-render, canonical, alternativas recíprocas, idioma e ausência de conteúdos privados. Snapshot visual para preservar layout e detectar cortes de espanhol/francês.

**Preço/checkout, quando implementado:** cliente altera valor/país/offerId, preço vence, webhook repete/falha, valor/moeda diverge, estorno e pagamento recusado. Nenhum acesso/comissão indevido; totais de moedas diferentes separados.

Comandos existentes: `npm run lint`, `npm run build`, `npm run test:tools`, teste do catálogo de preview. Adicionar comandos específicos de i18n, cobertura de traduções e integração na implementação; não fingir que já existem.

## 11. Publicação, manutenção e rollback

Manter flags de locale publicado, sugestão de região, ofertas publicadas e variantes de áudio. Traduções versionadas têm revisão da fonte e ficam pendentes quando a fonte muda. CI verifica chaves obrigatórias, placeholders, plurais e manifesto editorial antes de publicar. Automatizar rascunhos de tradução é possível; revisão humana e consistência de termos continuam critérios de publicação.

Deploy progressivo: compatibilidade PT → EN revisado → ES/FR → mercados com oferta aprovada → áudio EN por aula. Manter dicionário de termos cripto e etiquetas reais de plataformas; não inventar nomes de botões externos traduzidos quando a plataforma os mostra em inglês.

Medir seleção manual após sugestão, chaves faltantes, conteúdo sem tradução, pedidos por oferta/país/moeda, divergências de preço e falhas por variante de áudio. Sem enviar texto privado, respostas de alunos ou IP bruto para analytics de idioma.

Rollback: despublicar locale/áudio/oferta por flag, conservar preferências e registros financeiros, manter IDs e rotas antigas funcionais. Acesso já concedido e pedidos pagos não podem ser revertidos porque um idioma foi desativado. Fazer migrations aditivas, backfill verificado e retirada de colunas antigas só em outra entrega.

## 12. Decisões que liberam implementação comercial

- Países de venda iniciais; PT/EN/ES/FR já confirmados.
- Recorrência vs. 30 dias pagos uma vez para US$ 97.
- Tabela americana trimestral/vitalício e demais países.
- Provedor, moedas/métodos suportados e regras de SOL.
- Revisores do curso e política de contexto regional.
- Ordem de gravação das aulas inglesas.

Sem essas respostas, executar fundação e tradução revisada; manter as ofertas novas como rascunho. Não bloquear o trabalho técnico aguardando decisões que não são dependências dele.

## Referências consultadas

Context7: bibliotecas `/websites/react_i18next`, `/websites/i18next`, `/websites/reactrouter`, consultadas nesta preparação. Os exemplos de Framework do React Router não devem ser usados no projeto declarativo sem uma decisão explícita de migração.

- [react-i18next: namespaces, carregamento e troca de idioma](https://react.i18next.com/latest/usetranslation-hook)
- [i18next: configuração de locales e fallback](https://www.i18next.com/overview/configuration-options)
- [React Router: rotas declarativas](https://reactrouter.com/start/declarative/routing)
- [Google: sites multilíngues e multirregionais](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- [MDN: Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

Revalidar versões/documentação antes de instalar bibliotecas ou executar migrations. Esta entrega cria somente documentos; não instala dependências, altera preços ou executa SQL.
