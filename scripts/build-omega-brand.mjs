import { mkdir, readFile, writeFile } from 'node:fs/promises'
const source = await readFile('src/lib/omega-brand.ts', 'utf8')
const paths = [...source.matchAll(/'(M[^']+)'/g)].map((m) => m[1])
if (paths.length !== 2) throw new Error('Expected two approved logo contours')
const out = 'public/brand/omega'
await mkdir(out, { recursive: true })
const fontData = (await readFile('public/fonts/outfit-latin.woff2')).toString('base64')
const mark = (fill, small = false) => paths.map((d, i) => `<path fill="${fill}" d="${small && i === 1 ? 'M16 160L151 82C112 115 91 140 78 161V204H16Z' : d}"/>`).join('')
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body.includes('<text') ? `<style>@font-face{font-family:Outfit;src:url(data:font/woff2;base64,${fontData});font-weight:100 900}</style>` : ''}${body}</svg>`
for (const [name, color] of [['accent','#A58BF4'],['white','#F5F3FA'],['dark','#191922']]) {
  await writeFile(`${out}/symbol-${name}.svg`, svg(240,220,mark(color)))
  await writeFile(`${out}/horizontal-${name}.svg`, svg(620,220,`${mark(color)}<text x="257" y="157" fill="${color}" font-family="Outfit,Arial,sans-serif" font-size="100" font-weight="600" letter-spacing="-4">Ômega</text>`))
  await writeFile(`${out}/vertical-${name}.svg`, svg(360,330,`<g transform="translate(60 0)">${mark(color)}</g><text x="180" y="302" text-anchor="middle" fill="${color}" font-family="Outfit,Arial,sans-serif" font-size="84" font-weight="600" letter-spacing="-3">Ômega</text>`))
}
await writeFile(`${out}/symbol-gradient.svg`,svg(240,220,`<defs><linearGradient id="lilac" x2="0" y2="1"><stop stop-color="#DCD5F8"/><stop offset="1" stop-color="#A58BF4"/></linearGradient></defs>${mark('url(#lilac)')}`))
await writeFile(`${out}/symbol-small.svg`, svg(240,220,mark('#A58BF4',true)))
await writeFile(`${out}/favicon.svg`,svg(240,240,`<rect width="240" height="240" rx="48" fill="#101016"/><g transform="translate(20 28) scale(.84)">${mark('#C5B1FC',true)}</g>`))
await writeFile(`${out}/app-icon.svg`,svg(512,512,`<rect width="512" height="512" rx="112" fill="#191922"/><g transform="translate(66 83) scale(1.58)">${mark('#C5B1FC')}</g>`))
const previews = ['symbol-accent','horizontal-accent','vertical-accent','symbol-white','symbol-dark','symbol-gradient','symbol-small','favicon','app-icon']
await writeFile(`${out}/preview.html`, `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ômega | Aplicações da marca</title><style>@font-face{font-family:Outfit;src:url('/fonts/outfit-latin.woff2')}*{box-sizing:border-box}body{margin:0;background:#101016;color:#f5f3fa;font-family:Outfit,Arial,sans-serif;padding:40px}h1{font-weight:500}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}article{padding:24px;border:1px solid #393244;border-radius:16px;background:#191922}article.light{background:#f7f7fb;color:#191922}img{width:100%;height:180px;object-fit:contain}p{color:inherit}a{color:inherit}.sizes{display:flex;align-items:center;gap:20px}.sizes img{height:auto;width:auto}</style><h1>Ômega. Identidade Trajetória.</h1><p>Uma geometria, diferentes aplicações.</p><main>${previews.map((n)=>`<article class="${n.includes('dark')?'light':''}"><img src="${n}.svg" alt="${n}"><p><a href="${n}.svg">${n}.svg</a></p></article>`).join('')}<article><p>Leitura em tamanhos pequenos</p><div class="sizes">${[16,24,32,48].map(s=>`<img src="symbol-small.svg" width="${s}" height="${s}" style="width:${s}px" alt="${s} px">`).join('')}</div></article></main></html>`)
console.log('Ômega: 14 SVG variants and preview generated.')
