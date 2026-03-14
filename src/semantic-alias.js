const REGEX_META_REG = /[|\\{}()[\]^$+*?.]/g

const escapeRegExp = (value) => String(value).replace(REGEX_META_REG, '\\$&')

const normalizePatternAlias = (value) => {
  const alias = String(value).trim()
  if (!alias) return ''
  return alias.replace(/\(/g, '(?:')
}

const buildSemanticAliasPatterns = (sem) => {
  const patterns = []
  const patternAliases = Array.isArray(sem?.aliases) ? sem.aliases : []
  for (let i = 0; i < patternAliases.length; i++) {
    const alias = normalizePatternAlias(patternAliases[i])
    if (alias) patterns.push(alias)
  }

  const literalAliases = Array.isArray(sem?.literalAliases) ? sem.literalAliases : []
  for (let i = 0; i < literalAliases.length; i++) {
    const alias = String(literalAliases[i]).trim()
    if (!alias) continue
    patterns.push(escapeRegExp(alias))
  }

  return patterns
}

export { buildSemanticAliasPatterns }
