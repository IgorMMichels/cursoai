// Uploads course audio and transcripts to the private `course-media` bucket.
// Object keys mirror the paths the app references, without the leading slash:
//   assets/course-audio-source/audio/...  ->  audio/...
// Run locally with the service role key in .env:
//   node --env-file=.env scripts/upload-course-media.mjs
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'course-media'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'assets/course-audio-source/audio')
const CONCURRENCY = 4

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim()
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
if (!url || !serviceKey) throw new Error('SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.')

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const { error: bucketError } = await admin.storage.createBucket(BUCKET, {
  public: false,
  fileSizeLimit: 52428800,
  allowedMimeTypes: ['audio/mpeg', 'application/json'],
})
if (bucketError && !/already exists/i.test(bucketError.message)) throw bucketError

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(full))
    else if (/\.(mp3|json)$/.test(entry.name)) files.push(full)
  }
  return files
}

const files = await walk(source)
const contentTypes = { '.mp3': 'audio/mpeg', '.json': 'application/json' }
let uploaded = 0
const failures = []

async function upload(file) {
  const key = path.relative(path.dirname(source), file).split(path.sep).join('/')
  const { size } = await stat(file)
  if (size > 52428800) throw new Error(`${key} exceeds the 50 MB bucket limit`)
  const body = await readFile(file)
  const { error } = await admin.storage.from(BUCKET).upload(key, body, {
    contentType: contentTypes[path.extname(file)],
    upsert: true,
    cacheControl: 'private, max-age=0',
  })
  if (error) failures.push(`${key}: ${error.message}`)
  else uploaded += 1
}

for (let index = 0; index < files.length; index += CONCURRENCY) {
  await Promise.all(files.slice(index, index + CONCURRENCY).map(upload))
  process.stdout.write(`\r${uploaded}/${files.length} enviados`)
}
process.stdout.write('\n')
if (failures.length) {
  console.error(`Falhas (${failures.length}):\n${failures.join('\n')}`)
  process.exitCode = 1
}
