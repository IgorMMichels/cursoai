import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { translateString, uiTranslations } from './ui-translation.ts'

const sourceRoots = [
  fileURLToPath(new URL('../pages/', import.meta.url)),
  fileURLToPath(new URL('../components/', import.meta.url)),
]

// These are product names, symbols, units, or technical terms that are
// intentionally identical in Portuguese, English, and Spanish.
const untranslatedTechnicalTerms = new Set([
  'A/B', 'API', 'ASCII', 'BTC', 'CSV', 'DeFi', 'ETH', 'FOMO', 'HODL',
  'JSON', 'NFT', 'SOL', 'USDT', 'USD', 'URL', 'WebGL', 'WebSocket', 'min', 'ID', 'Erro', '/ USDT', 'Binance · funding', 'Discord', 'Telegram', 'Ω', '0x194', 'Choose', 'Elegir', 'Escolher', 'OMEGA',
])

async function collectTsxFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return collectTsxFiles(entryPath)
    return entry.name.endsWith('.tsx') ? [entryPath] : []
  }))
  return nested.flat()
}

function staticBranchStrings(node: ts.Expression): string[] {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text]
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node)) {
    return staticBranchStrings(node.expression)
  }
  if (ts.isConditionalExpression(node)) {
    return [...staticBranchStrings(node.whenTrue), ...staticBranchStrings(node.whenFalse)]
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = staticBranchStrings(node.left)
    const right = staticBranchStrings(node.right)
    if (left.length && right.length) return left.flatMap((part) => right.map((suffix) => part + suffix))
  }
  return []
}

function findJsxElements(root: ts.Node, tagName: string): ts.JsxElement[] {
  const found: ts.JsxElement[] = []
  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText() === tagName) found.push(node)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return found
}

function insideStyleElement(node: ts.Node) {
  let ancestor = node.parent
  while (ancestor) {
    if (ts.isJsxElement(ancestor) && ancestor.openingElement.tagName.getText() === 'style') return true
    ancestor = ancestor.parent
  }
  return false
}

function attribute(element: ts.JsxOpeningElement, name: string) {
  return element.attributes.properties.find((item): item is ts.JsxAttribute =>
    ts.isJsxAttribute(item) && item.name.getText() === name,
  )
}

test('catalogues every meaningful literal passed to translateUi in the app UI', async () => {
  const files = (await Promise.all(sourceRoots.map(collectTsxFiles))).flat()
  const missing = new Map<string, Set<string>>()

  for (const file of files) {
    const sourceText = await readFile(file, 'utf8')
    const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    assert.equal((source as ts.SourceFile & { parseDiagnostics: readonly unknown[] }).parseDiagnostics.length, 0, `${path.relative(process.cwd(), file)} must parse before localization coverage is checked`)

    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'translateUi' && !insideStyleElement(node)) {
        const argument = node.arguments[0]
        if (argument) {
          for (const literal of staticBranchStrings(argument)) {
            const key = literal.trim().replace(/\s+/g, ' ')
            if (!/\p{L}/u.test(key) || key.includes('@keyframes') || untranslatedTechnicalTerms.has(key) || uiTranslations[key]) continue
            const relative = path.relative(process.cwd(), file)
            const strings = missing.get(relative) ?? new Set<string>()
            strings.add(key)
            missing.set(relative, strings)
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }

  const details = [...missing.entries()]
    .flatMap(([file, strings]) => [...strings].map((value) => `${file}: ${JSON.stringify(value)}`))
  assert.deepEqual(details, [], `Add EN and ES catalogue entries for visible Portuguese source strings:\n${details.slice(0, 60).join('\n')}${details.length > 60 ? `\n…and ${details.length - 60} more` : ''}`)
})

test('translates display copy while preserving source edge whitespace and technical values', () => {
  const catalog = { 'Language': { en: 'Language', es: 'Idioma' } }
  assert.equal(translateString('  Language  ', 'es', catalog), '  Idioma  ')
  assert.equal(translateString('BTC', 'es', catalog), 'BTC')
  assert.equal(translateString('Language', 'pt-BR', catalog), 'Language')
})

test('localized selector labels do not replace selected locale or market option values', async () => {
  const file = fileURLToPath(new URL('../components/localization-selector.tsx', import.meta.url))
  const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  assert.equal((source as ts.SourceFile & { parseDiagnostics: readonly unknown[] }).parseDiagnostics.length, 0)

  const cases = [
    { marker: 'data-language-select', selectedValue: 'locale' },
    { marker: 'data-region-select', selectedValue: 'market' },
  ]
  const selects = findJsxElements(source, 'select')
  for (const { marker, selectedValue } of cases) {
    const select = selects.find((element) => attribute(element.openingElement, marker))
    assert.ok(select, `Expected a select marked ${marker}`)
    const selected = attribute(select.openingElement, 'value')?.initializer
    assert.ok(selected && ts.isJsxExpression(selected) && selected.expression)
    assert.equal(selected.expression.getText(source), selectedValue)

    const options = findJsxElements(select, 'option')
    assert.ok(options.length > 0, `Expected options under ${marker}`)
    for (const option of options) {
      const optionValue = attribute(option.openingElement, 'value')?.initializer
      assert.ok(optionValue && ts.isJsxExpression(optionValue) && optionValue.expression)
      assert.equal(optionValue.expression.getText(source), 'code')
      assert.doesNotMatch(optionValue.getText(source), /translateUi/)
    }
  }
})
