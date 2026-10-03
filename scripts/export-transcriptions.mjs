import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { modules } from '../src/lib/course.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'public/transcricoes')
const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), 'utf8'))
const journeys = await readJson('src/lib/generated/journeys.json')
const records = []
const slug = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function addRecord(record) {
  if (!record.transcript?.trim()) throw new Error(`Transcrição vazia: ${record.id}`)
  await readFile(path.join(root, 'public', record.audio))
  const content = `# ${record.course} — ${record.label}: ${record.title}\n\n` +
    `- Curso/jornada: ${record.course}\n- Módulo: ${record.module}\n- ID: \`${record.id}\`\n` +
    `- Áudio: [${record.audio}](${record.audio})\n` +
    `- Origem do texto: ${record.source}\n- Método: ${record.method}\n\n## Transcrição\n\n${record.transcript}\n`
  const target = path.join(output, record.file)
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, content, 'utf8')
  records.push({ ...record, content })
}

const metadata = new Map()
for (const name of await readdir(path.join(root, 'public/audio/narrated'))) {
  if (!name.endsWith('.json')) continue
  const file = `public/audio/narrated/${name}`
  const data = await readJson(file)
  if (data.track.transcript !== data.transcript) throw new Error(`Texto diverge do áudio: ${file}`)
  metadata.set(name.replace(/-[a-f0-9]+\.json$/, ''), { data, file })
}
const method = 'Texto original usado para gerar o áudio, preservado integralmente nos metadados de narração.'
const welcome = metadata.get('welcome')
await addRecord({ course: 'Cripto do Zero', module: 'Apresentação', id: 'welcome', label: 'Boas-vindas', title: 'Boas-vindas ao Cripto do Zero', file: 'cripto-do-zero/00-boas-vindas.md', audio: welcome.data.track.src, transcript: welcome.data.transcript, source: welcome.file, method })
for (const module of modules) {
  for (const [index, lesson] of module.lessons.entries()) {
    const saved = metadata.get(lesson.id)
    if (!saved) throw new Error(`Metadados ausentes: ${lesson.id}`)
    await addRecord({ course: 'Cripto do Zero', module: `${module.number} — ${module.title}`, id: lesson.id, label: `Aula ${index + 1} do módulo ${module.number}`, title: lesson.title, file: `cripto-do-zero/modulo-${module.number}/aula-${String(index + 1).padStart(2, '0')}-${slug(lesson.title)}.md`, audio: saved.data.track.src, transcript: saved.data.transcript, source: saved.file, method })
  }
}
for (const journey of journeys) {
  for (const module of journey.modules) {
    for (const [index, lesson] of module.lessons.entries()) {
      const source = `public/audio/journeys/${lesson.id}.json`
      const saved = await readJson(source)
      if (saved.track.transcript !== saved.transcript) throw new Error(`Texto diverge do áudio: ${source}`)
      await addRecord({ course: journey.title, module: `${module.number} — ${module.title}`, id: lesson.id, label: `Aula ${index + 1} do módulo ${module.number}`, title: lesson.title, file: `${journey.id}/modulo-${module.number}/aula-${String(index + 1).padStart(2, '0')}-${slug(lesson.title)}.md`, audio: saved.track.src, transcript: saved.transcript, source, method })
    }
  }
}
const legacyTitles = { boas_vindas: 'Boas-vindas (versão antiga)', m1_blockchain: 'Blockchain', m2_comprar_seguro: 'Comprar com segurança', m3_analise: 'Análise', m4_risco: 'Risco', m5_golpes: 'Golpes', m7_mentalidade: 'Mentalidade' }
for (const name of await readdir(path.join(root, 'public/audio'))) {
  if (!name.endsWith('.mp3')) continue
  const id = name.slice(0, -4)
  const source = `public/transcricoes/legado/${id}.json`
  const saved = await readJson(source)
  await addRecord({ course: 'Áudios legados', module: 'Nomenclatura original; sem associação confirmada com as aulas atuais', id, label: 'Gravação antiga', title: legacyTitles[id] ?? id, file: `legado/${id}.md`, audio: saved.audio, transcript: saved.transcript, source, method: saved.method })
}

async function audioFiles(dir) {
  const files = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await audioFiles(file))
    else if (/\.(mp3|wav|m4a|ogg|flac|aac|mp4)$/i.test(entry.name)) files.push('/' + path.relative(path.join(root, 'public'), file).replaceAll('\\', '/'))
  }
  return files
}
const audio = await audioFiles(path.join(root, 'public/audio'))
const covered = new Set(records.map(record => record.audio))
const missing = audio.filter(file => !covered.has(file))
if (missing.length) throw new Error(`Áudios sem exportação: ${missing.join(', ')}`)

let readme = '# Exportação das transcrições\n\n' +
  `Inventário local: ${records.length} transcrições, cobrindo todos os ${audio.length} áudios encontrados em \`public/audio\`. Inclui 70 aulas atuais, boas-vindas e 7 gravações antigas.\n\n` +
  '## Como usar\n\n- Cada aula tem um Markdown próprio, com curso, módulo, número da aula, título, ID, áudio de origem e transcrição integral.\n- [Todas as transcrições](TODAS-AS-TRANSCRICOES.md) reúne o conteúdo completo em ordem de curso, módulo e aula, para fornecer contexto de uma vez.\n- [Manifesto JSON](manifesto.json) relaciona arquivos, áudios, IDs e fontes.\n- A numeração dos módulos segue o catálogo atual; IDs internos podem ter outra ordem (por exemplo, `m8` é o módulo 03 do Cripto do Zero).\n\n' +
  '## Origem e limites\n\nOs áudios atuais foram gerados por síntese de voz. A exportação utiliza o texto original preservado nos JSON de legendas que acompanham cada MP3, sem resumir nem reescrever. As 7 gravações antigas não tinham esse texto: foram transcritas por reconhecimento automático de fala local (faster-whisper, modelo small, português), sem revisão humana; podem conter erros de nomes, pontuação ou palavras. Seus nomes de arquivo foram preservados, sem atribuir uma equivalência não confirmada às aulas atuais.\n\nEste inventário cobre arquivos do repositório local, não alterações exclusivas de um banco remoto. A pasta fica em `public`: quando o site for publicado, seu conteúdo será acessível por URL.\n\n' +
  '## Regenerar a exportação\n\nExecute `node --experimental-strip-types scripts/export-transcriptions.mjs` na raiz do projeto (Node.js 24). Para transcrever novamente os áudios legados que ainda não tenham JSON, execute antes `python scripts/transcribe-legacy-audio.py`; requer faster-whisper e o modelo small já disponível no cache local. O exportador verifica se todos os áudios locais têm transcrição e falha se faltar algum.\n\n' +
  '## Índice por curso\n'
for (const course of [...new Set(records.map(record => record.course))]) {
  const items = records.filter(record => record.course === course)
  readme += `\n### ${course} (${items.length} transcrições)\n\n| Módulo | Aula / gravação | ID | Arquivo |\n| --- | --- | --- | --- |\n`
  for (const item of items) readme += `| ${item.module} | ${item.label}: ${item.title} | \`${item.id}\` | [Transcrição](${item.file}) |\n`
}
await mkdir(output, { recursive: true })
await writeFile(path.join(output, 'README.md'), readme, 'utf8')
await writeFile(path.join(output, 'TODAS-AS-TRANSCRICOES.md'), '# Todas as transcrições\n\nConsulte [README.md](README.md) para contexto, fontes e limites.\n\n' + records.map(record => record.content).join('\n---\n\n'), 'utf8')
await writeFile(path.join(output, 'manifesto.json'), JSON.stringify(records.map(({ content, ...record }) => record), null, 2) + '\n', 'utf8')
console.log(`Exportadas ${records.length} transcrições; ${audio.length} áudios cobertos.`)
