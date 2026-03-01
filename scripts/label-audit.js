import fs from 'fs'
import path from 'path'

const STRICT = process.argv.includes('--strict')
const ROOT = process.cwd()
const MIN_REPEAT_COUNT = 2
const RE_MEANINGFUL_LABEL = /[\p{L}\p{N}]/u

const isMarkdownFile = (filePath) => /\.md$/i.test(filePath)

const shouldSkipDir = (dirName) => (
  dirName === 'node_modules'
  || dirName === '.git'
  || dirName === '.next'
  || dirName === 'dist'
  || dirName === 'build'
  || dirName === 'coverage'
)

const walkMarkdownFiles = (rootDir) => {
  const results = []
  const stack = [rootDir]
  while (stack.length > 0) {
    const current = stack.pop()
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (entry.name.startsWith('.') && entry.name !== '.github') continue
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (shouldSkipDir(entry.name)) continue
        stack.push(fullPath)
        continue
      }
      if (!entry.isFile()) continue
      if (!isMarkdownFile(fullPath)) continue
      results.push(fullPath)
    }
  }
  return results
}

const unquote = (value) => {
  if (!value) return value
  const trimmed = value.trim()
  if (trimmed.length >= 2 && ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'")))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

const splitTopLevel = (value, separator) => {
  const parts = []
  let quote = ''
  let token = ''
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (quote) {
      token += ch
      if (ch === quote && value[i - 1] !== '\\') {
        quote = ''
      }
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      token += ch
      continue
    }
    if (ch === separator) {
      parts.push(token)
      token = ''
      continue
    }
    token += ch
  }
  parts.push(token)
  return parts
}

const parseInlineObject = (raw) => {
  const result = {}
  const entries = splitTopLevel(raw, ',')
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i].trim()
    if (!entry) continue
    const pair = splitTopLevel(entry, ':')
    if (pair.length < 2) continue
    const key = pair[0].trim()
    if (!key) continue
    const value = pair.slice(1).join(':').trim()
    result[key] = value === '' ? null : unquote(value)
  }
  return result
}

const parseInlineArray = (raw) => {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null
  const body = trimmed.slice(1, -1).trim()
  if (!body) return []
  const entries = splitTopLevel(body, ',')
  const values = []
  for (let i = 0; i < entries.length; i++) {
    const value = unquote(entries[i])
    if (!value) continue
    values.push(value)
  }
  return values
}

const extractFrontmatter = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  return match ? match[1] : null
}

const parseScFromFrontmatter = (frontmatter) => {
  if (!frontmatter) return null

  const inlineMatch = frontmatter.match(/(^|\n)\s*sc\s*:\s*\{([\s\S]*?)\}\s*(?=\n|$)/m)
  if (inlineMatch) {
    return parseInlineObject(inlineMatch[2])
  }

  const lines = frontmatter.split(/\r?\n/)
  let startIndex = -1
  let baseIndent = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const matched = line.match(/^(\s*)sc\s*:\s*$/)
    if (!matched) continue
    startIndex = i + 1
    baseIndent = matched[1].length
    break
  }
  if (startIndex === -1) return null

  const sc = {}
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const indent = (line.match(/^(\s*)/)?.[1] || '').length
    if (indent <= baseIndent) break
    const trimmed = line.trim()
    const matched = trimmed.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/)
    if (!matched) continue
    const key = matched[1]
    const valueRaw = matched[2].trim()
    if (!valueRaw) {
      sc[key] = null
      continue
    }
    const arrayValue = parseInlineArray(valueRaw)
    if (arrayValue) {
      sc[key] = arrayValue
      continue
    }
    sc[key] = unquote(valueRaw)
  }

  return Object.keys(sc).length ? sc : null
}

const toAliasCandidates = (value) => {
  if (value === null || value === undefined) return []
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? [trimmed] : []
  }
  if (!Array.isArray(value)) return []
  const aliases = []
  for (let i = 0; i < value.length; i++) {
    const alias = String(value[i] ?? '').trim()
    if (!alias) continue
    aliases.push(alias)
  }
  return aliases
}

const loadSemantics = () => {
  const enPath = path.join(ROOT, 'semantics', 'en.json')
  const jaPath = path.join(ROOT, 'semantics', 'ja.json')
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
  const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'))

  const knownSemantics = new Set()
  const aliasOwner = new Map()
  const addAlias = (alias, owner) => {
    const token = String(alias || '').trim().toLowerCase()
    if (!token) return
    if (!aliasOwner.has(token)) aliasOwner.set(token, owner)
  }

  for (let i = 0; i < en.length; i++) {
    const sem = en[i]
    knownSemantics.add(sem.name)
    addAlias(sem.name, sem.name)
    if (Array.isArray(sem.aliases)) {
      for (let ai = 0; ai < sem.aliases.length; ai++) {
        addAlias(sem.aliases[ai], sem.name)
      }
    }
  }

  const jaKeys = Object.keys(ja)
  for (let i = 0; i < jaKeys.length; i++) {
    const semName = jaKeys[i]
    const aliases = Array.isArray(ja[semName]) ? ja[semName] : []
    for (let ai = 0; ai < aliases.length; ai++) {
      addAlias(aliases[ai], semName)
    }
  }

  return { knownSemantics, aliasOwner }
}

const collectLabelCounts = (content, filePath, labelCountMap) => {
  const reg = /\{[^}\n]*\blabel\s*=\s*"([^"]*)"[^}\n]*\}/g
  let m
  while ((m = reg.exec(content)) !== null) {
    const label = (m[1] || '').trim()
    if (!label) continue
    if (!RE_MEANINGFUL_LABEL.test(label)) continue
    let entry = labelCountMap.get(label)
    if (!entry) {
      entry = { count: 0, files: new Set() }
      labelCountMap.set(label, entry)
    }
    entry.count++
    entry.files.add(filePath)
  }
}

const collectScCollisions = (sc, filePath, knownSemantics, aliasOwner, issues) => {
  if (!sc || typeof sc !== 'object') return

  const localAliasOwner = new Map()
  const keys = Object.keys(sc)
  for (let i = 0; i < keys.length; i++) {
    const rawKey = keys[i]
    const semName = rawKey.trim().toLowerCase()
    if (!knownSemantics.has(semName)) {
      issues.push(filePath + ': sc key "' + rawKey + '" is unknown')
      continue
    }
    const aliases = toAliasCandidates(sc[rawKey])
    for (let ai = 0; ai < aliases.length; ai++) {
      const alias = aliases[ai]
      const token = alias.toLowerCase()
      const baseOwner = aliasOwner.get(token)
      if (baseOwner && baseOwner !== semName) {
        issues.push(filePath + ': sc alias "' + alias + '" for "' + semName + '" conflicts with existing "' + baseOwner + '"')
        continue
      }
      const localOwner = localAliasOwner.get(token)
      if (localOwner && localOwner !== semName) {
        issues.push(filePath + ': sc alias "' + alias + '" conflicts between "' + localOwner + '" and "' + semName + '"')
        continue
      }
      localAliasOwner.set(token, semName)
    }
  }
}

const printReport = (labelCountMap, scIssues) => {
  console.log('=== labels:audit ===')
  let hasFindings = false

  const repeatedLabels = []
  for (const [label, info] of labelCountMap.entries()) {
    if (info.count < MIN_REPEAT_COUNT) continue
    repeatedLabels.push({ label, count: info.count, files: Array.from(info.files).sort() })
  }
  repeatedLabels.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))

  if (repeatedLabels.length > 0) {
    hasFindings = true
    console.log('\nRepeated inline labels (consider frontmatter/sc):')
    for (let i = 0; i < repeatedLabels.length; i++) {
      const item = repeatedLabels[i]
      console.log('- "' + item.label + '": ' + item.count + ' times in ' + item.files.length + ' file(s)')
      for (let fi = 0; fi < item.files.length; fi++) {
        console.log('  - ' + path.relative(ROOT, item.files[fi]))
      }
    }
  } else {
    console.log('\nNo repeated inline labels found.')
  }

  if (scIssues.length > 0) {
    hasFindings = true
    console.log('\nsc alias issues:')
    for (let i = 0; i < scIssues.length; i++) {
      console.log('- ' + path.relative(ROOT, scIssues[i].split(':')[0]) + ':' + scIssues[i].slice(scIssues[i].indexOf(':') + 1))
    }
  } else {
    console.log('\nNo sc alias issues found.')
  }

  return hasFindings
}

const main = () => {
  const files = walkMarkdownFiles(ROOT)
  const { knownSemantics, aliasOwner } = loadSemantics()
  const labelCountMap = new Map()
  const scIssues = []

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i]
    const content = fs.readFileSync(filePath, 'utf8')
    collectLabelCounts(content, filePath, labelCountMap)
    const frontmatter = extractFrontmatter(content)
    const sc = parseScFromFrontmatter(frontmatter)
    collectScCollisions(sc, filePath, knownSemantics, aliasOwner, scIssues)
  }

  const hasFindings = printReport(labelCountMap, scIssues)
  if (STRICT && hasFindings) {
    process.exitCode = 1
  }
}

main()
