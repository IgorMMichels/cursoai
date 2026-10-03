import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import ts from 'typescript'
import { loadEnv } from 'vite'

// Conteúdo editorial compartilhado com o aplicativo; nunca lê sessão ou segredos.
async function loadTypeScript(path) {
  const source = await readFile(path, 'utf8')
  const output = ts.transpileModule(source, { compilerOptions: { module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2023 } }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)
}
const [{toolArticles},{tools}] = await Promise.all([loadTypeScript('src/lib/tool-articles.ts'),loadTypeScript('src/lib/tools.ts')])
const template = await readFile('dist/index.html','utf8')
const assets = await readdir('dist/assets')
const toolsStyles = assets.filter((name) => name.endsWith('.css') && /tools|tool-articles/.test(name)).map((name) => `<link rel="stylesheet" href="/assets/${name}">`).join('')
const escape = (text) => String(text).replace(/[&<>"']/g,(char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))
const link = (path,title) => `<a href="${escape(path)}">${escape(title)}</a>`
const navigation = `<nav aria-label="Navegação principal">${link('/landing','Cripto do Zero')} · ${link('/ferramentas','Ferramentas')} · ${link('/artigos','Artigos')} · ${link('/planos','Planos')}</nav>`
const siteUrl = process.env.VITE_SITE_URL ?? loadEnv('production', process.cwd(), 'VITE_SITE_URL').VITE_SITE_URL
let canonicalOrigin
if (siteUrl) {
  const parsed = new URL(siteUrl)
  if (!['https:','http:'].includes(parsed.protocol)) throw new Error('VITE_SITE_URL precisa ser uma URL HTTP válida.')
  canonicalOrigin = parsed.origin
}
async function page(path,title,description,body) {
  const canonical = canonicalOrigin ? `<link rel="canonical" href="${escape(canonicalOrigin+path)}">` : ''
  const html = template.replace(/<title>.*?<\/title>/s,`<title>${escape(title)} | Cripto do Zero</title>`)
    .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(description)}">`)
    .replace('</head>',`${canonical}${toolsStyles}</head>`)
    .replace('<div id="root"></div>',`<div id="root"><div class="tools-root"><main class="tools-content tools-public-content">${navigation}${body}</main></div></div>`)
  const directory = resolve('dist',path.replace(/^\//,''))
  await mkdir(directory,{recursive:true})
  await writeFile(resolve(directory,'index.html'),html,'utf8')
}
await page('/artigos','Artigos cripto: conceitos com exemplos práticos','Entenda risco, stop, long e short, alavancagem e recuperação de perdas.',`<header class="articles-index-heading"><h1>Entenda o porquê. Teste o que muda.</h1><p>Explicações diretas, exemplos com números e ferramentas para aprender fazendo.</p></header><div class="articles-index-list">${toolArticles.map((article) => `<section><h2>${link(`/artigos/${article.slug}`,article.title)}</h2><p>${escape(article.description)}</p></section>`).join('')}</div>`)
for (const article of toolArticles) {
  const body = `<article class="tool-editorial"><header><h1>${escape(article.title)}</h1><p class="article-deck">${escape(article.description)}</p><p>${article.readingMinutes} min de leitura · Conteúdo educativo</p></header><div class="article-body">${article.sections.map((section,index) => `<section id="conceito-${index+1}"><h2>${escape(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${escape(paragraph)}</p>`).join('')}${section.example ? `<aside class="article-example"><span>Exemplo para acompanhar</span><p>${escape(section.example)}</p></aside>` : ''}</section>`).join('')}</div><aside class="article-experiment"><div><h2>Agora, mude os números.</h2>${link(`/ferramentas/${article.toolSlug}`,'Experimentar o simulador gratuito')}</div></aside><section class="article-sources"><h2>Fontes para aprofundar</h2><ul>${article.sources.map((source) => `<li>${link(source.url,source.label)}</li>`).join('')}</ul></section></article>`
  await page(`/artigos/${article.slug}`,article.title,article.description,body)
}
await page('/ferramentas','Ferramentas cripto gratuitas: simule e aprenda','Explore risco e stop, long e short e recuperação de perdas, sem login.',`<header class="articles-index-heading"><h1>Menos suposição. Mais compreensão.</h1><p>Mude uma variável. Veja o que acontece. Ferramentas gratuitas para experimentar conceitos do mercado.</p></header><div class="articles-index-list">${tools.map((tool) => `<section><h2>${link(`/ferramentas/${tool.slug}`,tool.title)}</h2><p>${escape(tool.description)}</p></section>`).join('')}</div><section><h2>Bots da plataforma</h2><p>Exclusivo para assinantes. Funcionalidades em definição.</p>${[1,2,3].map((id) => `<h3>Bot 0${id}</h3><p>Em breve</p>`).join('')}</section>`)
const explanations = {
  'risco-stop':'A quantidade considera o risco escolhido, a distância entre entrada e stop e as taxas informadas. Alterar o stop muda a quantidade para manter o mesmo orçamento de risco. O exemplo é fictício e a execução no stop não é garantida.',
  'long-short':'Com margem fixa, a alavancagem muda a exposição. Com quantidade fixa, ela muda a margem; o resultado em USDT para os mesmos preços e custos permanece igual. Simulação de contratos lineares, sem cálculo de liquidação.',
  'recuperacao-perdas':'A recuperação é calculada sobre o saldo que restou. Uma queda de 50% exige alta de 100%. Após perda total, não existe percentual finito de recuperação a partir de zero, sem novo aporte.',
}
for (const tool of tools) {
  await page(`/ferramentas/${tool.slug}`,`${tool.title}: simulador gratuito`,tool.description,`<header class="tool-detail-heading"><h1>${escape(tool.title)}</h1><p>${escape(tool.description)}</p></header><section class="tool-explanation"><h2>Entenda o cenário</h2><p>${escape(explanations[tool.slug])}</p><p>O simulador interativo usa JavaScript. Não exige login nem movimenta dinheiro real.</p></section><section class="tool-related"><h2>Entenda o que está por trás</h2>${toolArticles.filter((article) => article.toolSlug === tool.slug).map((article) => `<p>${link(`/artigos/${article.slug}`,article.title)}</p>`).join('')}</section>`)
}
console.log(`Pré-renderização: ${toolArticles.length} artigos, ${tools.length} ferramentas e 2 índices.`)
