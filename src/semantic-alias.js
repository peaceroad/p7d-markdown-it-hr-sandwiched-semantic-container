const REGEX_META_REG = /[|\\{}()[\]^$+*?.]/g
const SEMANTIC_LABEL_NUMBER_SUFFIX_PATTERN = '(?:[ 　](?:[0-9]{1,6}|[A-Z]{1,2})(?:[.-](?:[0-9]{1,6}|[A-Z]{1,2})){0,6})?'

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

const buildSemanticAliasPatternLists = (semantics) => semantics.map(buildSemanticAliasPatterns)

const buildExactSemanticLabelRegexes = (
  semantics,
  semanticAliasPatternLists = buildSemanticAliasPatternLists(semantics)
) => semantics.map((sem, sn) => {
  const aliasPatterns = semanticAliasPatternLists[sn]
  const aliasStr = aliasPatterns.length
    ? '|' + aliasPatterns.join('|')
    : ''
  return new RegExp(
    '^((?:' + sem.name + aliasStr + ')' + SEMANTIC_LABEL_NUMBER_SUFFIX_PATTERN + ')$',
    'i'
  )
})

export {
  SEMANTIC_LABEL_NUMBER_SUFFIX_PATTERN,
  buildSemanticAliasPatterns,
  buildSemanticAliasPatternLists,
  buildExactSemanticLabelRegexes,
}
