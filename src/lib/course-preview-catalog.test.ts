import assert from 'node:assert/strict'
import test from 'node:test'
import { previewCatalog, previewTotals } from './course-preview-catalog.ts'

test('preview includes the official foundation and all three generated journeys', () => {
  const catalog = previewCatalog()
  assert.deepEqual(catalog.map((journey) => journey.id), ['cripto-do-zero', 'memecoins', 'futuros', 'trading'])
  assert.equal(previewTotals(catalog).modules, 20)
  assert.equal(previewTotals(catalog).lessons, 70)
  assert.ok(previewTotals(catalog).minutes > 0)
  assert.ok(catalog.slice(1).every((journey) => journey.catalogOnly))
})

test('unpublished journeys, modules and lessons never enter the preview or its totals', () => {
  const sample = structuredClone(previewCatalog()[1])
  const original = structuredClone(sample)
  sample.modules[0].published = false
  sample.modules[1].lessons[0].published = false
  const hidden = { ...sample, id: 'hidden', published: false }
  const catalog = previewCatalog([sample, hidden])
  const published = catalog[1]
  assert.equal(catalog.length, 2)
  assert.equal(published.modules.length, original.modules.length - 1)
  assert.equal(published.modules[0].lessons.length, original.modules[1].lessons.length - 1)
  assert.equal(published.modules[0].duration, `${published.modules[0].lessons.reduce((sum, lesson) => sum + parseFloat(lesson.duration), 0)} min`)
  assert.equal(previewTotals(catalog).lessons, catalog.flatMap((journey) => journey.modules.flatMap((module) => module.lessons)).length)
  assert.equal(sample.modules[1].lessons.length, original.modules[1].lessons.length)
})

test('a remote catalogue replaces the local journeys without duplicating the foundation', () => {
  const foundation = previewCatalog()[0]
  const remote = { ...previewCatalog()[2], title: 'Título publicado atualizado', catalogOnly: false }
  const catalog = previewCatalog([remote, foundation])
  assert.deepEqual(catalog.map((journey) => journey.id), ['cripto-do-zero', 'futuros'])
  assert.equal(catalog[1].title, remote.title)
  assert.equal(catalog[1].catalogOnly, false)
})
