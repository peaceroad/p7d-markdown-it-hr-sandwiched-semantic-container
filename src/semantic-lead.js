const getLiteralLeadKey = (raw) => {
  if (!raw) return null
  const value = raw.trim()
  if (!value) return null
  const first = value[0]
  if (!first) return null
  if (first === '\\') {
    return value[1] ? value[1].toLowerCase() : null
  }
  if (first === '(' || first === '[' || first === '{' || first === '|'
    || first === '^' || first === '$' || first === '*' || first === '+'
    || first === '?' || first === '.') {
    return null
  }
  return first.toLowerCase()
}

const buildSemanticLeadCandidates = (semantics) => {
  const byLead = new Map()
  const fallback = []

  for (let sn = 0; sn < semantics.length; sn++) {
    const sem = semantics[sn]
    const keys = new Set()
    const semKey = getLiteralLeadKey(sem.name)
    if (semKey) keys.add(semKey)

    let hasUnknown = false
    const aliases = Array.isArray(sem.aliases) ? sem.aliases : []
    for (let i = 0; i < aliases.length; i++) {
      const aliasKey = getLiteralLeadKey(aliases[i])
      if (!aliasKey) {
        hasUnknown = true
        continue
      }
      keys.add(aliasKey)
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
