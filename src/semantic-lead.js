const REGEX_RANGE_EXPANSION_MAX = 128

const addLead = (leads, value) => {
  if (value) leads.add(value.toLowerCase())
}

const getLiteralLeadKeys = (raw) => {
  if (!raw) return null
  const value = String(raw).trim()
  if (!value) return null
  const leads = new Set()
  addLead(leads, value[0])
  return leads.size > 0 ? leads : null
}

// Computes a conservative FIRST set for the small regular-expression subset
// used by built-in aliases. Unsupported constructs fail closed so the caller
// keeps the semantic in the fallback bucket.
const parsePatternLeadKeys = (raw) => {
  if (!raw) return null
  const value = raw.trim()
  if (!value) return null
  let index = 0

  const parseCharacterClass = () => {
    index++
    if (value[index] === '^') return null
    const leads = new Set()
    let previous = ''
    let closed = false

    while (index < value.length) {
      let char = value[index++]
      if (char === ']') {
        closed = true
        break
      }
      if (char === '\\') {
        if (index >= value.length) return null
        char = value[index++]
        if (/^[A-Za-z0-9]$/.test(char)) return null
      }
      if (char === '-' && previous && value[index] && value[index] !== ']') {
        let rangeEnd = value[index++]
        if (rangeEnd === '\\') {
          if (index >= value.length) return null
          rangeEnd = value[index++]
        }
        const startCode = previous.codePointAt(0)
        const endCode = rangeEnd.codePointAt(0)
        if (endCode < startCode || endCode - startCode > REGEX_RANGE_EXPANSION_MAX) return null
        for (let code = startCode + 1; code <= endCode; code++) {
          addLead(leads, String.fromCodePoint(code))
        }
        previous = rangeEnd
        continue
      }
      addLead(leads, char)
      previous = char
    }

    return closed && leads.size > 0
      ? { leads, nullable: false }
      : null
  }

  const applyQuantifier = (atom) => {
    if (!atom || index >= value.length) return atom
    const quantifier = value[index]
    if (quantifier === '?' || quantifier === '*') {
      index++
      return { leads: atom.leads, nullable: true }
    }
    if (quantifier === '+') {
      index++
      return atom
    }
    if (quantifier !== '{') return atom

    const end = value.indexOf('}', index + 1)
    if (end === -1) return null
    const range = value.slice(index + 1, end)
    const comma = range.indexOf(',')
    const minimumText = comma === -1 ? range : range.slice(0, comma)
    if (!/^\d+$/.test(minimumText)) return null
    index = end + 1
    return Number(minimumText) === 0
      ? { leads: atom.leads, nullable: true }
      : atom
  }

  const parseAtom = () => {
    if (index >= value.length) return null
    const char = value[index]

    if (char === '(') {
      index++
      if (value[index] === '?' && value[index + 1] === ':') index += 2
      const group = parseExpression(')')
      if (!group || value[index] !== ')') return null
      index++
      return applyQuantifier(group)
    }
    if (char === '[') {
      return applyQuantifier(parseCharacterClass())
    }
    if (char === '\\') {
      index++
      if (index >= value.length) return null
      const escaped = value[index++]
      // Alphanumeric escapes can be classes, assertions, backreferences, or
      // encoded code points rather than a literal leading character.
      if (/^[A-Za-z0-9]$/.test(escaped)) return null
      const leads = new Set()
      addLead(leads, escaped)
      return applyQuantifier({ leads, nullable: false })
    }
    if (char === '^' || char === '$') {
      index++
      return { leads: new Set(), nullable: true }
    }
    if (char === '.' || char === '*' || char === '+' || char === '?' || char === '{' || char === '}') {
      return null
    }

    index++
    const leads = new Set()
    addLead(leads, char)
    return applyQuantifier({ leads, nullable: false })
  }

  const parseSequence = (stopChar) => {
    const leads = new Set()
    let nullable = true
    while (index < value.length && value[index] !== '|' && value[index] !== stopChar) {
      const atom = parseAtom()
      if (!atom) return null
      if (nullable) {
        for (const lead of atom.leads) leads.add(lead)
      }
      nullable = nullable && atom.nullable
    }
    return { leads, nullable }
  }

  function parseExpression(stopChar = '') {
    const leads = new Set()
    let nullable = false
    let hasAlternative = false
    while (true) {
      const sequence = parseSequence(stopChar)
      if (!sequence) return null
      hasAlternative = true
      for (const lead of sequence.leads) leads.add(lead)
      nullable = nullable || sequence.nullable
      if (value[index] !== '|') break
      index++
    }
    return hasAlternative ? { leads, nullable } : null
  }

  const result = parseExpression()
  if (!result || index !== value.length || result.nullable || result.leads.size === 0) return null
  return result.leads
}

const buildSemanticLeadCandidates = (semantics) => {
  const byLead = new Map()
  const fallback = []

  for (let sn = 0; sn < semantics.length; sn++) {
    const sem = semantics[sn]
    const keys = new Set()
    const semKeys = getLiteralLeadKeys(sem.name)
    if (semKeys) {
      for (const key of semKeys) keys.add(key)
    }

    let hasUnknown = false
    const aliases = Array.isArray(sem.aliases) ? sem.aliases : []
    for (let i = 0; i < aliases.length; i++) {
      const aliasKeys = parsePatternLeadKeys(aliases[i])
      if (!aliasKeys) {
        hasUnknown = true
        continue
      }
      for (const key of aliasKeys) keys.add(key)
    }

    const literalAliases = Array.isArray(sem.literalAliases) ? sem.literalAliases : []
    for (let i = 0; i < literalAliases.length; i++) {
      const aliasKeys = getLiteralLeadKeys(literalAliases[i])
      if (!aliasKeys) {
        hasUnknown = true
        continue
      }
      for (const key of aliasKeys) keys.add(key)
    }

    if (keys.size === 0 || hasUnknown) {
      fallback.push(sn)
    }

    for (const key of keys) {
      let list = byLead.get(key)
      if (!list) {
        list = []
        byLead.set(key, list)
      }
      list.push(sn)
    }
  }

  if (fallback.length === 0) {
    return { candidatesByLead: byLead, fallback }
  }

  const candidatesByLead = new Map()
  for (const [key, list] of byLead.entries()) {
    const seen = new Set(list)
    const merged = list.slice()
    for (let i = 0; i < fallback.length; i++) {
      const sn = fallback[i]
      if (seen.has(sn)) continue
      seen.add(sn)
      merged.push(sn)
    }
    candidatesByLead.set(key, merged)
  }

  return { candidatesByLead, fallback }
}

export { buildSemanticLeadCandidates }
