import { readFile, writeFile, readdir } from 'node:fs/promises'
import ts from 'typescript'

// One-time source migration: keep the original PT wording as catalogue keys.
// Restrict edits to rendered text and accessible labels, never event handlers,
// class names, URLs, data IDs, user input or protected lesson payloads.
const visibleAttributes = new Set(['title', 'description', 'alt', 'placeholder', 'aria-label', 'label', 'emptyMessage'])
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? files(`${directory}/${entry.name}`) : entry.name.endsWith('.tsx') ? [`${directory}/${entry.name}`] : []))).flat()
}

function jsxText(text) {
  const lines = text.replace(/\r/g, '').split('\n')
  return lines.map((line, index) => {
    let result = line.replace(/\t/g, ' ')
    if (index > 0) result = result.trimStart()
    if (index < lines.length - 1) result = result.trimEnd()
    return result
  }).filter(Boolean).join(' ')
}

function containsJsx(node) {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) return true
  return Boolean(ts.forEachChild(node, containsJsx))
}

let changed = 0
for (const path of [...await files('src/pages'), ...await files('src/components')]) {
  if (path.endsWith('localization-selector.tsx') || path.endsWith('source-language-notice.tsx') || (path.includes('/ui/') && !path.endsWith('reviews-section.tsx'))) continue
  const source = await readFile(path, 'utf8')
  if (source.includes("from '@/lib/ui-translation'")) continue
  const tree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits = []
  function visit(node) {
    if (ts.isJsxText(node)) {
      const text = jsxText(node.text)
      if (/\p{L}/u.test(text)) edits.push({ start: node.getStart(tree), end: node.end, text: `{translateUi(${JSON.stringify(text)})}` })
      return
    }
    if (ts.isJsxAttribute(node) && visibleAttributes.has(node.name.getText(tree)) && node.initializer) {
      if (ts.isStringLiteral(node.initializer)) edits.push({ start: node.initializer.getStart(tree), end: node.initializer.end, text: `{translateUi(${JSON.stringify(node.initializer.text)})}` })
      else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
        const expression = node.initializer.expression
        edits.push({ start: expression.getStart(tree), end: expression.end, text: `translateUi(${expression.getText(tree)})` })
      }
      return
    }
    if (ts.isJsxExpression(node) && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      const expression = node.expression
      // Literal/derived text fields need lookup at render time. JSX and map
      // results already have their own translated descendants.
      if (!containsJsx(expression) && !ts.isArrowFunction(expression)
        && !(ts.isCallExpression(expression) && ts.isPropertyAccessExpression(expression.expression) && expression.expression.name.text === 'map')) {
        edits.push({ start: expression.getStart(tree), end: expression.end, text: `translateUi(${expression.getText(tree)})` })
        return
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  if (!edits.length) continue
  // Every top-level component subscribes to i18next, preserving local state
  // while updating text and accessible attributes on languageChanged.
  for (const statement of tree.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && /^[A-Z]/.test(statement.name.text) && statement.body) {
      edits.push({ start: statement.body.getStart(tree) + 1, end: statement.body.getStart(tree) + 1, text: '\n  useUiTranslation();\n' })
    }
  }
  let output = source
  for (const edit of edits.sort((a, b) => b.start - a.start)) output = output.slice(0, edit.start) + edit.text + output.slice(edit.end)
  const subscribed = edits.some((edit) => edit.text.includes('useUiTranslation()'))
  output = `import { translateUi } from '@/lib/ui-translation'\n${subscribed ? "import { useTranslation as useUiTranslation } from 'react-i18next'\n" : ''}${output}`
  await writeFile(path, output, 'utf8')
  changed++
}
console.log(`Updated ${changed} UI source files; rerunning skips migrated files.`)
