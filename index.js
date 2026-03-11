import { buildSemantics } from './src/semantics.js'
import { createBracketFormat } from './src/bracket-format.js'
import { createGitHubTypeContainer } from './src/github-type-container.js'
import { buildSemanticLeadCandidates } from './src/semantic-lead.js'
import { createHrBlockCandidateCollector } from './src/semantic-hr-candidates.js'
import { createStandardContainerApplier } from './src/standard-applier.js'
import { resolveContainerRangeEnd } from './src/container-range.js'

const sNumber = '(?:[ 　](?:[0-9]{1,6}|[A-Z]{1,2})(?:[.-](?:[0-9]{1,6}|[A-Z]{1,2})){0,6})?'
const strongMark = '[*_]{2}'

const semanticsHalfJoint = '[:.]'
const semanticsFullJoint = '[　：。．]'
const STRONG_MARK_GLOBAL_REG = /[*_]{2}/g
const MATCH_CACHE_MAX = 256
const SC_ENGINE_CACHE_MAX = 32
const CACHE_MISS = 0
const CODE_STAR = 42
const CODE_UNDERSCORE = 95
const CODE_DOT = 46
const CODE_COLON = 58
const CODE_LEFT_BRACKET = 91
const CODE_LF = 10
const CODE_CR = 13
const CODE_FULLWIDTH_SPACE = 12288
const CODE_FULLWIDTH_LEFT_BRACKET = 65339
const CODE_FULLWIDTH_COLON = 65306
const CODE_IDEOGRAPHIC_FULL_STOP = 12290
const CODE_FULLWIDTH_DOT = 65294
const SEMANTIC_PREFIX_SCAN_MAX = 96
const HR_CANDIDATE_KEY_SEP = ':'
const EMPTY_RUNTIME_PLAN = Object.freeze({
  hrStartLineKeySet: null,
  hrCandidates: null,
  githubCandidateLineSet: null,
})

const isAsciiAlnum = (code) => (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
const isPotentialLabelLeadCode = (code) => code === CODE_STAR || code === CODE_UNDERSCORE || code >= 128 || isAsciiAlnum(code)
const hasOwn = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key)
const isStandardContainerLeadToken = (tokenType) => tokenType === 'paragraph_open' || tokenType === 'heading_open'
const isStandaloneWalkTargetToken = (tokenType, allowStandaloneParagraph, allowGitHubBlockquote) => (
  (allowStandaloneParagraph && tokenType === 'paragraph_open')
  || (allowGitHubBlockquote && tokenType === 'blockquote_open')
)
const isHrDelimitedWalkTargetToken = (tokenType, allowGitHubBlockquote) => (
  isStandardContainerLeadToken(tokenType)
  || (allowGitHubBlockquote && tokenType === 'blockquote_open')
)
const hasSemanticJointInPrefix = (content, startIndex) => {
  const end = Math.min(content.length, startIndex + SEMANTIC_PREFIX_SCAN_MAX)
  for (let i = startIndex; i < end; i++) {
    const code = content.charCodeAt(i)
    if (
      code === CODE_COLON
      || code === CODE_DOT
      || code === CODE_FULLWIDTH_SPACE
      || code === CODE_FULLWIDTH_COLON
      || code === CODE_IDEOGRAPHIC_FULL_STOP
      || code === CODE_FULLWIDTH_DOT
    ) {
      return true
    }
    if (code === CODE_LF || code === CODE_CR) break
  }
  return false
}

const normalizeAliasToken = (value) => {
  if (value === undefined || value === null) return ''
  const token = String(value).trim()
  return token ? token.toLowerCase() : ''
}

const buildSemanticNameMap = (semantics) => {
  const semanticNameByLower = new Map()
  for (let i = 0; i < semantics.length; i++) {
    const name = semantics[i]?.name
    if (!name) continue
    semanticNameByLower.set(name.toLowerCase(), name)
  }
  return semanticNameByLower
}

const buildBaseAliasOwnerMap = (semantics) => {
  const ownerMap = new Map()
  for (let i = 0; i < semantics.length; i++) {
    const sem = semantics[i]
    const semName = sem?.name
    if (!semName) continue
    const nameToken = normalizeAliasToken(semName)
    if (nameToken && !ownerMap.has(nameToken)) {
      ownerMap.set(nameToken, semName)
    }
    const aliases = Array.isArray(sem.aliases) ? sem.aliases : []
    for (let ai = 0; ai < aliases.length; ai++) {
      const aliasToken = normalizeAliasToken(aliases[ai])
      if (!aliasToken || ownerMap.has(aliasToken)) continue
      ownerMap.set(aliasToken, semName)
    }
  }
  return ownerMap
}

const parseScEntry = (rawValue, warnings, semanticName) => {
  if (rawValue === null || rawValue === undefined) {
    return { hide: true, aliases: [] }
  }
  if (typeof rawValue === 'string') {
    const alias = rawValue.trim()
    if (!alias) {
      return { hide: true, aliases: [] }
    }
    return { hide: false, aliases: [alias] }
  }
  if (Array.isArray(rawValue)) {
    const aliases = []
    for (let i = 0; i < rawValue.length; i++) {
      const item = rawValue[i]
      if (item === null || item === undefined) continue
      const alias = String(item).trim()
      if (!alias) continue
      aliases.push(alias)
    }
    return { hide: false, aliases }
  }
  warnings.push('semanticContainerSc: invalid value type for "' + semanticName + '" is ignored')
  return { hide: false, aliases: [] }
}

const resolveSemanticContainerSc = (rawSc, semanticNameByLower, baseAliasOwnerMap) => {
  if (!rawSc || typeof rawSc !== 'object' || Array.isArray(rawSc)) return null

  const warnings = []
  const hideSet = new Set()
  const aliasBySemantic = new Map()
  let aliasOwnerMap = null
  let scAliasOwner = null
  const keys = Object.keys(rawSc)

  for (let i = 0; i < keys.length; i++) {
    const rawKey = keys[i]
    const key = String(rawKey).trim().toLowerCase()
    if (!key) continue

    const semanticName = semanticNameByLower.get(key)
    if (!semanticName) {
      warnings.push('semanticContainerSc: unknown semantic "' + rawKey + '" is ignored')
      continue
    }

    const { hide, aliases } = parseScEntry(rawSc[rawKey], warnings, semanticName)
    if (hide) {
      hideSet.add(semanticName)
    }
    if (!aliases.length) continue
    if (!aliasOwnerMap) {
      aliasOwnerMap = new Map(baseAliasOwnerMap)
      scAliasOwner = new Map()
    }
    let semanticAliases = aliasBySemantic.get(semanticName)

    for (let ai = 0; ai < aliases.length; ai++) {
      const alias = aliases[ai]
      const aliasToken = normalizeAliasToken(alias)
      if (!aliasToken) continue

      const owner = aliasOwnerMap.get(aliasToken)
      if (owner && owner !== semanticName) {
        warnings.push('semanticContainerSc: alias "' + alias + '" conflicts with "' + owner + '" and is ignored for "' + semanticName + '"')
        continue
      }

      const scOwner = scAliasOwner.get(aliasToken)
      if (scOwner && scOwner !== semanticName) {
        warnings.push('semanticContainerSc: alias "' + alias + '" conflicts with another sc entry ("' + scOwner + '") and is ignored for "' + semanticName + '"')
        continue
      }

      if (!semanticAliases) {
        semanticAliases = new Set()
        aliasBySemantic.set(semanticName, semanticAliases)
      }
      aliasOwnerMap.set(aliasToken, semanticName)
      scAliasOwner.set(aliasToken, semanticName)
      semanticAliases.add(alias)
    }
  }

  if (aliasBySemantic.size === 0 && hideSet.size === 0 && warnings.length === 0) {
    return null
  }

  const semanticNames = Array.from(aliasBySemantic.keys()).sort()
  const keyParts = []
  for (let i = 0; i < semanticNames.length; i++) {
    const semanticName = semanticNames[i]
    const aliases = Array.from(aliasBySemantic.get(semanticName)).sort()
    keyParts.push(semanticName + '=' + aliases.join('\u0001'))
  }

  return {
    aliasBySemantic,
    aliasKey: keyParts.join('\u0002'),
    hideSet,
    warnings,
  }
}

const mergeSemanticsWithScAliases = (baseSemantics, aliasBySemantic) => {
  if (!aliasBySemantic || aliasBySemantic.size === 0) return baseSemantics

  const semantics = baseSemantics.slice()

  for (let i = 0; i < baseSemantics.length; i++) {
    const sem = baseSemantics[i]
    const additions = aliasBySemantic.get(sem.name)
    if (!additions || additions.size === 0) continue
    const aliases = sem.aliases.length ? sem.aliases.slice() : []
    const seen = new Set(aliases)
    let changed = false
    for (const alias of additions) {
      if (seen.has(alias)) continue
      seen.add(alias)
      aliases.push(alias)
      changed = true
    }
    if (changed) {
      semantics[i] = {
        ...sem,
        aliases,
      }
    }
  }

  return semantics
}

const pushScWarnings = (state, warnings) => {
  if (!warnings || warnings.length === 0) return
  const env = state.env || (state.env = {})
  const list = Array.isArray(env.semanticContainerWarnings)
    ? env.semanticContainerWarnings
    : (env.semanticContainerWarnings = [])
  for (let i = 0; i < warnings.length; i++) {
    list.push(warnings[i])
  }
}

const withScHideSet = (opt, hideSet) => {
  if (!hideSet || hideSet.size === 0) return opt
  const renderOpt = Object.create(opt)
  renderOpt.scHideSet = hideSet
  return renderOpt
}

const getHrTypeFromMarkup = (markup) => {
  if (!markup) return ''
  if (markup.includes('*')) return '*'
  if (markup.includes('-')) return '-'
  if (markup.includes('_')) return '_'
  return ''
}

const createHrCandidateKey = (line, hrType) => String(line) + HR_CANDIDATE_KEY_SEP + hrType

const toNonEmptySetOrNull = (value) => (
  value && typeof value.size === 'number' && value.size > 0
    ? value
    : null
)

const createRuntimePlan = (hrStartLineKeySet, hrCandidates, githubCandidateLineSet) => ({
  hrStartLineKeySet,
  hrCandidates,
  githubCandidateLineSet,
})

const buildRuntimePlan = (state) => {
  const candidates = Array.isArray(state?.env?.semanticContainerHrCandidates)
    ? state.env.semanticContainerHrCandidates
    : null
  const keySet = state?.env?.semanticContainerHrCandidateKeySet
  const activeGitHubCandidateLineSet = toNonEmptySetOrNull(state?.env?.semanticContainerGitHubCandidateLineSet)
  if (keySet && typeof keySet.size === 'number' && keySet.size > 0) {
    return createRuntimePlan(keySet, candidates, activeGitHubCandidateLineSet)
  }

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return activeGitHubCandidateLineSet
      ? createRuntimePlan(null, null, activeGitHubCandidateLineSet)
      : EMPTY_RUNTIME_PLAN
  }

  const hrStartLineKeySet = new Set()
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    const line = candidate?.startLine
    const hrType = candidate?.hrType
    if (!Number.isInteger(line)) continue
    if (hrType !== '*' && hrType !== '-' && hrType !== '_') continue
    hrStartLineKeySet.add(createHrCandidateKey(line, hrType))
  }
  if (hrStartLineKeySet.size === 0) {
    return activeGitHubCandidateLineSet
      ? createRuntimePlan(null, null, activeGitHubCandidateLineSet)
      : EMPTY_RUNTIME_PLAN
  }

  return createRuntimePlan(hrStartLineKeySet, candidates, activeGitHubCandidateLineSet)
}

const resolveRawScInput = (state, md, mdStateRef) => {
  const env = state?.env
  const mdMeta = md?.meta
  const mdFrontmatter = md?.frontmatter
  const metaChangedInThisRender = mdMeta !== mdStateRef.meta
  const frontmatterChangedInThisRender = mdFrontmatter !== mdStateRef.frontmatter
  mdStateRef.meta = mdMeta
  mdStateRef.frontmatter = mdFrontmatter

  if (hasOwn(env, 'semanticContainerSc')) {
    return env.semanticContainerSc
  }

  const envFrontmatter = env?.frontmatter
  if (hasOwn(envFrontmatter, 'sc')) {
    return envFrontmatter.sc
  }

  const envMeta = env?.meta
  if (hasOwn(envMeta, 'sc')) {
    return envMeta.sc
  }

  const firstTokenType = state?.tokens?.[0]?.type
  const hasFrontMatterToken = firstTokenType === 'front_matter'
  if (hasFrontMatterToken) {
    if (hasOwn(mdFrontmatter, 'sc')) return mdFrontmatter.sc
    if (hasOwn(mdMeta, 'sc')) return mdMeta.sc
  }

  if (frontmatterChangedInThisRender && hasOwn(mdFrontmatter, 'sc')) {
    return mdFrontmatter.sc
  }
  if (metaChangedInThisRender && hasOwn(mdMeta, 'sc')) {
    return mdMeta.sc
  }

  return null
}

const buildSemanticsReg = (semantics) => semantics.map((sem) => {
  const aliasStr = sem.aliases.length
    ? '|' + sem.aliases.map((x) => x.replace(/\(/g, '(?:').trim()).join('|')
    : ''
  const pattern =
    '^(' + strongMark + ')?((?:' + sem.name + aliasStr + ')' + sNumber + ')'
    + '(?:'
    + '(' + semanticsHalfJoint + ') *?\\1(?: |$)'
    + '| *?\\1 *?(' + semanticsHalfJoint + ') '
    + '|(' + semanticsFullJoint + ') *?\\1'
    + '| *?\\1 *?(' + semanticsFullJoint + ')'
    + ' *?)'
  return new RegExp(pattern, 'i')
})

const createLabelMatcher = (semantics, semanticsReg) => {
  const { candidatesByLead, fallback } = buildSemanticLeadCandidates(semantics)
  const parseMatchedSemantic = (sn, actualMatch) => {
    let actualNameJoint = ''
    let hasLastJoint = false
    let hasHalfJoint = false

    if (actualMatch[3]) {
      hasHalfJoint = true
      actualNameJoint = actualMatch[3]
    } else if (actualMatch[4]) {
      hasHalfJoint = true
      hasLastJoint = true
      actualNameJoint = actualMatch[4]
    } else if (actualMatch[5]) {
      actualNameJoint = actualMatch[5]
    } else if (actualMatch[6]) {
      hasLastJoint = true
      actualNameJoint = actualMatch[6]
    }

    return {
      sn,
      actualCont: actualMatch[0],
      actualContNoStrong: actualMatch[1] ? actualMatch[0].replace(STRONG_MARK_GLOBAL_REG, '') : actualMatch[0],
      actualName: actualMatch[2],
      actualNameJoint,
      hasLastJoint,
      hasHalfJoint,
    }
  }
  const matchCache = new Map()
  const cacheSet = (key, value) => {
    if (matchCache.size >= MATCH_CACHE_MAX) {
      const firstKey = matchCache.keys().next().value
      matchCache.delete(firstKey)
    }
    matchCache.set(key, value)
  }

  const findMatchedSemantic = (state, n) => {
    const tokens = state.tokens
    const nextToken = tokens[n+1]
    if (nextToken?.type !== 'inline') return null

    const content = nextToken?.content
    if (!content) return null
    let leadIndex = 0
    const firstCode = content.charCodeAt(0)
    const secondCode = content.charCodeAt(1)
    if ((firstCode === CODE_STAR && secondCode === CODE_STAR) || (firstCode === CODE_UNDERSCORE && secondCode === CODE_UNDERSCORE)) {
      leadIndex = 2
    }
    const leadCode = content.charCodeAt(leadIndex)
    if (!leadCode) return null
    if (leadCode === CODE_LEFT_BRACKET || leadCode === CODE_FULLWIDTH_LEFT_BRACKET) return null
    if (!isPotentialLabelLeadCode(leadCode)) {
      return null
    }
    if (!hasSemanticJointInPrefix(content, leadIndex)) {
      return null
    }

    let matchedSemantic = null
    const cached = matchCache.get(content)
    if (cached !== undefined) {
      if (cached === CACHE_MISS) return null
      matchedSemantic = cached
    } else {
      let sn = 0
      let actualName = null
      const leadKey = content[leadIndex].toLowerCase()
      let candidates = candidatesByLead.get(leadKey)
      if (!candidates) {
        if (fallback.length === 0) {
          cacheSet(content, CACHE_MISS)
          return null
        }
        candidates = fallback
      }
      for (let ci = 0; ci < candidates.length; ci++) {
        sn = candidates[ci]
        actualName = content.match(semanticsReg[sn])
        if(actualName) break
      }
      if(!actualName) {
        cacheSet(content, CACHE_MISS)
        return null
      }
      matchedSemantic = parseMatchedSemantic(sn, actualName)
      cacheSet(content, matchedSemantic)
    }
    return matchedSemantic
  }

  const checkStandardLabel = (state, n, hrType, sc, checked) => {
    const matchedSemantic = findMatchedSemantic(state, n)
    if (!matchedSemantic) return false

    const rangeEnd = resolveContainerRangeEnd(state.tokens, n, hrType)
    if (rangeEnd < 0) return false
    sc.push({
      range: [n, rangeEnd],
      continued: checked,
      sn: matchedSemantic.sn,
      hrType: hrType,
      actualCont: matchedSemantic.actualCont,
      actualContNoStrong: matchedSemantic.actualContNoStrong,
      actualName: matchedSemantic.actualName,
      actualNameJoint: matchedSemantic.actualNameJoint,
      hasLastJoint: matchedSemantic.hasLastJoint,
      hasHalfJoint: matchedSemantic.hasHalfJoint,
    })
    return true
  }

  return { checkStandardLabel, findMatchedSemantic }
}

const createHrCandidateSemanticFinder = (matchers) => {
  const activeMatchers = []
  for (let i = 0; i < matchers.length; i++) {
    if (typeof matchers[i] === 'function') activeMatchers.push(matchers[i])
  }
  return (state, n) => {
    for (let i = 0; i < activeMatchers.length; i++) {
      const matched = activeMatchers[i](state, n)
      if (matched) return matched
    }
    return null
  }
}

const isAppliedHrCandidateParagraph = (token, appliedHrCandidateStartLineSet) => (
  !!appliedHrCandidateStartLineSet
  && token?.type === 'paragraph_open'
  && token?.map
  && Number.isInteger(token.map[0])
  && appliedHrCandidateStartLineSet.has(token.map[0])
)

const isAppliedGitHubCandidateBlockquote = (token, appliedGitHubCandidateLineSet) => (
  !!appliedGitHubCandidateLineSet
  && token?.type === 'blockquote_open'
  && token?.map
  && Number.isInteger(token.map[0])
  && appliedGitHubCandidateLineSet.has(token.map[0])
)

const isNonGitHubCandidateBlockquote = (token, githubCandidateLineSet) => (
  !!githubCandidateLineSet
  && token?.type === 'blockquote_open'
  && token?.map
  && Number.isInteger(token.map[0])
  && !githubCandidateLineSet.has(token.map[0])
)

const tryApplyStandaloneContainer = (
  state,
  tokens,
  n,
  token,
  cn,
  optLocal,
  activeCheck,
  applyContainer,
  githubCandidateLineSet,
  appliedHrCandidateStartLineSet,
  appliedGitHubCandidateLineSet,
  checkParagraphGuards
) => {
  if (!optLocal.requireHrAtOneParagraph && token.type === 'paragraph_open') {
    if (isAppliedHrCandidateParagraph(token, appliedHrCandidateStartLineSet)) {
      return n + 1
    }
    if (checkParagraphGuards) {
      if (cn.has(n - 1)) return n + 1
      if (tokens[n - 1].type === 'list_item_open') return n + 1
    }
    const sc = []
    if (activeCheck(state, n, '', sc, false)) {
      const firstJump = applyContainer(state, n, '', sc[0], -1, optLocal)
      return n + (firstJump > 0 ? firstJump : 1)
    }
    return n + 1
  }

  if (optLocal.githubTypeContainer && token.type === 'blockquote_open') {
    if (isAppliedGitHubCandidateBlockquote(token, appliedGitHubCandidateLineSet)) {
      return n + 1
    }
    if (isNonGitHubCandidateBlockquote(token, githubCandidateLineSet)) {
      return n + 1
    }
    const sc = []
    if (activeCheck(state, n, '', sc, false)) {
      const firstJump = applyContainer(state, n, '', sc[0], -1, optLocal)
      return n + (firstJump > 0 ? firstJump : 1)
    }
    return n + 1
  }

  return null
}

const createActiveCheck = ({ githubCheck, bracketCheck, defaultCheck }) => {
  return (state, n, hrType, sc, checked) => {
    const token = state.tokens[n]
    const tokenType = token?.type
    // Priority contract: github > bracket > standard.
    // GitHub checks are exclusive on blockquote_open tokens.
    if (tokenType === 'blockquote_open') {
      if (!githubCheck) return false
      return githubCheck(state, n, hrType, sc, checked)
    }
    if (!isStandardContainerLeadToken(tokenType)) {
      return false
    }
    if (bracketCheck && bracketCheck(state, n, hrType, sc, checked)) {
      return true
    }
    return defaultCheck(state, n, hrType, sc, checked)
  }
}

const createContainerRangeChecker = (activeCheck) => (state, n, hrType, sc) => {
  if (!activeCheck(state, n, hrType, sc, false)) {
    return false
  }

  let cn = sc[sc.length - 1].range[1] + 1
  const tokensLength = state.tokens.length
  while (cn < tokensLength - 1) {
    if (!activeCheck(state, cn, hrType, sc, true)) {
      break
    }
    cn = sc[sc.length - 1].range[1] + 1
  }
  return true
}

const createContainerApplier = (semantics, featureHelpers) => {
  const applyStandardContainer = createStandardContainerApplier(semantics)
  return (state, n, hrType, sc, sci, optLocal) => {
    if (sc.isGitHubAlert && featureHelpers.github?.setGitHubAlertsSemanticContainer) {
      return featureHelpers.github.setGitHubAlertsSemanticContainer(state, n, hrType, sc, sci, optLocal)
    }
    if (sc.isBracketFormat && featureHelpers.bracket?.setBracketSemanticContainer) {
      return featureHelpers.bracket.setBracketSemanticContainer(state, n, hrType, sc, sci, optLocal)
    }
    return applyStandardContainer(state, hrType, sc, sci, optLocal)
  }
}

const createContainerWalker = (activeCheck, checkContainerRanges, applyContainer) => (
  state,
  n,
  cn,
  optLocal,
  runtimePlan,
  appliedHrCandidateStartLineSet,
  appliedGitHubCandidateLineSet
) => {
  const tokens = state.tokens
  const hrStartLineKeySet = runtimePlan?.hrStartLineKeySet
  const githubCandidateLineSet = runtimePlan?.githubCandidateLineSet
  const allowGitHubBlockquote = !!optLocal.githubTypeContainer
  const allowStandaloneParagraph = !optLocal.requireHrAtOneParagraph

  const prevToken = tokens[n-1]
  const token = tokens[n]
  const tokenType = token?.type
  if (n === 0 || prevToken.type !== 'hr') {
    if (!isStandaloneWalkTargetToken(tokenType, allowStandaloneParagraph, allowGitHubBlockquote)) {
      return n + 1
    }
    const nextIndex = tryApplyStandaloneContainer(
      state,
      tokens,
      n,
      token,
      cn,
      optLocal,
      activeCheck,
      applyContainer,
      githubCandidateLineSet,
      appliedHrCandidateStartLineSet,
      appliedGitHubCandidateLineSet,
      n > 0
    )
    if (nextIndex !== null) return nextIndex
    return n + 1
  }

  if (!isHrDelimitedWalkTargetToken(tokenType, allowGitHubBlockquote)) {
    return n + 1
  }

  const hrType = getHrTypeFromMarkup(prevToken.markup || '')

  if (hrStartLineKeySet && token?.map && Number.isInteger(token.map[0])) {
    const hrCandidateKey = createHrCandidateKey(token.map[0], hrType)
    if (!hrStartLineKeySet.has(hrCandidateKey)) {
      return n + 1
    }
  }

  const sc = []
  if (!checkContainerRanges(state, n, hrType, sc)) {
    return n + 1
  }

  let firstJump = 0
  for (let sci = 0; sci < sc.length; sci++) {
    const jump = applyContainer(state, n, hrType, sc[sci], sci, optLocal)
    if (sci === 0) firstJump = jump
    cn.add(sc[sci].range[1] + sci + 1)
  }
  return n + (firstJump > 0 ? firstJump : 1)
}

const buildHrCandidateTokenIndex = (tokens, startKeySet, endKeySet) => {
  const startIndexByKey = new Map()
  const endIndexByKey = new Map()
  const targetStartCount = startKeySet?.size || 0
  const targetEndCount = endKeySet?.size || 0

  if (targetStartCount === 0 && targetEndCount === 0) {
    return { startIndexByKey, endIndexByKey }
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (
      targetEndCount > endIndexByKey.size
      && token?.type === 'hr'
      && token?.map
      && Number.isInteger(token.map[0])
    ) {
      const hrType = getHrTypeFromMarkup(token.markup || '')
      if (hrType) {
        const key = createHrCandidateKey(token.map[0], hrType)
        if (endKeySet.has(key)) {
          endIndexByKey.set(key, i)
        }
      }
    }

    if (
      targetStartCount > startIndexByKey.size
      && i > 0
      && token?.map
      && Number.isInteger(token.map[0])
    ) {
      const prev = tokens[i - 1]
      if (prev?.type === 'hr') {
        const hrType = getHrTypeFromMarkup(prev.markup || '')
        if (hrType) {
          const key = createHrCandidateKey(token.map[0], hrType)
          if (startKeySet.has(key) && !startIndexByKey.has(key)) {
            startIndexByKey.set(key, i)
          }
        }
      }
    }

    if (
      endIndexByKey.size >= targetEndCount
      && startIndexByKey.size >= targetStartCount
    ) {
      break
    }
  }

  return { startIndexByKey, endIndexByKey }
}

const buildBlockquoteTokenIndexByLine = (tokens, candidateLineSet) => {
  const indexByLine = new Map()
  const targetLineCount = candidateLineSet?.size || 0
  if (targetLineCount === 0) return indexByLine

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token?.type !== 'blockquote_open') continue
    if (!token?.map || !Number.isInteger(token.map[0])) continue
    const line = token.map[0]
    if (candidateLineSet.has(line) && !indexByLine.has(line)) {
      indexByLine.set(line, i)
      if (indexByLine.size >= targetLineCount) {
        break
      }
    }
  }
  return indexByLine
}

const mergePlannedEditsDescending = (left, right) => {
  const leftLength = Array.isArray(left) ? left.length : 0
  const rightLength = Array.isArray(right) ? right.length : 0
  if (leftLength === 0) return rightLength ? right : null
  if (rightLength === 0) return left

  const merged = new Array(leftLength + rightLength)
  let li = 0
  let ri = 0
  let mi = 0
  while (li < leftLength && ri < rightLength) {
    if (left[li].groupTokenStart >= right[ri].groupTokenStart) {
      merged[mi++] = left[li++]
    } else {
      merged[mi++] = right[ri++]
    }
  }
  while (li < leftLength) merged[mi++] = left[li++]
  while (ri < rightLength) merged[mi++] = right[ri++]
  return merged
}

const applyPlannedEdits = (state, optLocal, applyContainer, plannedEdits) => {
  if (!Array.isArray(plannedEdits) || plannedEdits.length === 0) return

  for (let i = 0; i < plannedEdits.length; i++) {
    const edit = plannedEdits[i]
    applyContainer(state, edit.groupTokenStart, edit.hrType, edit.sc, edit.sci, optLocal)
  }
}

const createHrCandidatePlanner = (findHrCandidateSemantic) => (state, runtimePlan) => {
  const candidates = runtimePlan?.hrCandidates
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { handledAll: true, appliedStartLineSet: null, plannedEdits: null }
  }

  const candidateKeys = new Array(candidates.length)
  const startKeySet = new Set()
  const endKeySet = new Set()
  let validCandidateCount = 0
  let handledAll = true

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    const startLine = candidate?.startLine
    const endHrLine = candidate?.endHrLine
    const hrType = candidate?.hrType
    if (!Number.isInteger(startLine) || !Number.isInteger(endHrLine)) {
      handledAll = false
      continue
    }
    if (hrType !== '*' && hrType !== '-' && hrType !== '_') {
      handledAll = false
      continue
    }

    const startKey = createHrCandidateKey(startLine, hrType)
    const endKey = createHrCandidateKey(endHrLine, hrType)
    candidateKeys[i] = { startKey, endKey }
    startKeySet.add(startKey)
    endKeySet.add(endKey)
    validCandidateCount++
  }

  if (validCandidateCount === 0) {
    return { handledAll, appliedStartLineSet: null, plannedEdits: null }
  }

  const tokenIndex = buildHrCandidateTokenIndex(state.tokens, startKeySet, endKeySet)
  const matchedByCandidate = new Array(candidates.length)

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    const keys = candidateKeys[i]
    if (!keys) {
      continue
    }

    const startLine = candidate.startLine
    const hrType = candidate.hrType
    const n = tokenIndex.startIndexByKey.get(keys.startKey)
    if (n === undefined) {
      handledAll = false
      continue
    }

    const re = tokenIndex.endIndexByKey.get(keys.endKey)
    if (re === undefined || re < n) {
      handledAll = false
      continue
    }

    const matchedSemantic = findHrCandidateSemantic(state, n)
    if (!matchedSemantic) {
      continue
    }

    matchedByCandidate[i] = {
      groupTokenStart: n,
      startLine,
      sc: {
        ...matchedSemantic,
        range: [n, re],
        hrType,
      },
    }
  }

  const groups = []
  let runStart = -1
  for (let i = 0; i <= matchedByCandidate.length; i++) {
    const current = i < matchedByCandidate.length ? matchedByCandidate[i] : null
    if (current) {
      if (runStart === -1) {
        runStart = i
        continue
      }
      const prevMatched = matchedByCandidate[i - 1]
      const prevCandidate = candidates[i - 1]
      const currentCandidate = candidates[i]
      const isContiguous = (
        !!prevMatched
        && !!prevCandidate
        && !!currentCandidate
        && prevCandidate.endHrLine === currentCandidate.openHrLine
        && prevCandidate.hrType === currentCandidate.hrType
      )
      if (isContiguous) {
        continue
      }
    }

    if (runStart !== -1) {
      const runEnd = i - 1
      const first = matchedByCandidate[runStart]
      if (first) {
        const scGroup = []
        for (let ri = runStart; ri <= runEnd; ri++) {
          const matched = matchedByCandidate[ri]
          if (!matched) continue
          scGroup.push({
            ...matched.sc,
            startLine: matched.startLine,
            continued: ri > runStart,
          })
        }
        if (scGroup.length > 0) {
          groups.push({
            groupTokenStart: first.groupTokenStart,
            scGroup,
          })
        }
      }
      runStart = -1
    }
    if (current) {
      runStart = i
    }
  }

  if (groups.length === 0) {
    return { handledAll, appliedStartLineSet: null, plannedEdits: null }
  }

  const appliedStartLineSet = new Set()
  const plannedEdits = []
  for (let gi = groups.length - 1; gi >= 0; gi--) {
    const group = groups[gi]
    for (let sci = 0; sci < group.scGroup.length; sci++) {
      const startLine = group.scGroup[sci].startLine
      if (Number.isInteger(startLine)) {
        appliedStartLineSet.add(startLine)
      }
      plannedEdits.push({
        groupTokenStart: group.groupTokenStart,
        hrType: group.scGroup[sci].hrType,
        sc: group.scGroup[sci],
        sci,
      })
    }
  }

  return {
    handledAll,
    appliedStartLineSet: appliedStartLineSet.size > 0 ? appliedStartLineSet : null,
    plannedEdits,
  }
}

const createGitHubCandidatePlanner = (githubCheck) => (state, runtimePlan) => {
  if (typeof githubCheck !== 'function') return { handledAll: true, appliedLineSet: null, plannedEdits: null }
  const candidateLineSet = runtimePlan?.githubCandidateLineSet
  if (!candidateLineSet || candidateLineSet.size === 0) return { handledAll: true, appliedLineSet: null, plannedEdits: null }

  const tokenIndexByLine = buildBlockquoteTokenIndexByLine(state.tokens, candidateLineSet)
  const matchedCandidates = []
  let handledAll = true

  for (const line of candidateLineSet) {
    const tokenIndex = tokenIndexByLine.get(line)
    if (tokenIndex === undefined) {
      handledAll = false
      continue
    }

    const sc = []
    if (!githubCheck(state, tokenIndex, '', sc, false) || sc.length === 0) {
      handledAll = false
      continue
    }
    matchedCandidates.push({ tokenIndex, sc: sc[0] })
  }

  if (matchedCandidates.length === 0) return { handledAll, appliedLineSet: null, plannedEdits: null }

  const appliedLineSet = new Set()
  const plannedEdits = new Array(matchedCandidates.length)
  for (let i = matchedCandidates.length - 1, pi = 0; i >= 0; i--, pi++) {
    const candidate = matchedCandidates[i]
    const token = state.tokens[candidate.tokenIndex]
    const line = token?.map?.[0]
    if (Number.isInteger(line)) appliedLineSet.add(line)
    plannedEdits[pi] = {
      groupTokenStart: candidate.tokenIndex,
      hrType: '',
      sc: candidate.sc,
      sci: -1,
    }
  }

  return {
    handledAll,
    appliedLineSet: appliedLineSet.size > 0 ? appliedLineSet : null,
    plannedEdits,
  }
}

const createContainerRunner = (walkContainers, planHrCandidates, planGitHubCandidates, applyContainer) => (state, optLocal, runtimePlan = EMPTY_RUNTIME_PLAN) => {
  const hrCandidatePlan = planHrCandidates(state, runtimePlan)
  const githubCandidatePlan = (
    optLocal.githubTypeContainer
    ? planGitHubCandidates(state, runtimePlan)
    : null
  )
  const plannedEdits = mergePlannedEditsDescending(
    hrCandidatePlan?.plannedEdits,
    githubCandidatePlan?.plannedEdits
  )
  applyPlannedEdits(state, optLocal, applyContainer, plannedEdits)

  const appliedHrCandidateStartLineSet = hrCandidatePlan?.appliedStartLineSet || null
  const appliedGitHubCandidateLineSet = githubCandidatePlan?.appliedLineSet || null

  if (optLocal.requireHrAtOneParagraph) {
    const hrHandled = (
      !runtimePlan.hrStartLineKeySet
      || runtimePlan.hrStartLineKeySet.size === 0
      || !!hrCandidatePlan?.handledAll
    )
    const githubHandled = (
      !optLocal.githubTypeContainer
      || !runtimePlan.githubCandidateLineSet
      || runtimePlan.githubCandidateLineSet.size === 0
      || !!githubCandidatePlan?.handledAll
    )
    if (hrHandled && githubHandled) return true
  }

  let n = 0
  const cn = new Set()
  let tokensLength = state.tokens.length
  while (n < tokensLength) {
    n = walkContainers(
      state,
      n,
      cn,
      optLocal,
      runtimePlan,
      appliedHrCandidateStartLineSet,
      appliedGitHubCandidateLineSet
    )
    tokensLength = state.tokens.length
  }
  return true
}

const createSemanticEngine = (semantics, opt, featureHelpers) => {
  const semanticsReg = buildSemanticsReg(semantics)
  const { checkStandardLabel: semanticLabelMatcher, findMatchedSemantic } = createLabelMatcher(semantics, semanticsReg)
  const githubCheck = opt.githubTypeContainer ? featureHelpers.github?.checkGitHubAlertsCore : null
  const bracketCheck = opt.allowBracketJoint ? featureHelpers.bracket?.checkBracketSemanticContainerCore : null
  const activeCheck = createActiveCheck({ githubCheck, bracketCheck, defaultCheck: semanticLabelMatcher })
  const checkContainerRanges = createContainerRangeChecker(activeCheck)
  const applyContainer = createContainerApplier(semantics, featureHelpers)
  const walkContainers = createContainerWalker(activeCheck, checkContainerRanges, applyContainer)
  const findBracketSemanticMatch = opt.allowBracketJoint ? featureHelpers.bracket?.findBracketSemanticMatch : null
  const findHrCandidateSemantic = createHrCandidateSemanticFinder([
    findMatchedSemantic,
    findBracketSemanticMatch,
  ])
  const planHrCandidates = createHrCandidatePlanner(findHrCandidateSemantic)
  const planGitHubCandidates = createGitHubCandidatePlanner(githubCheck)
  const semanticContainer = createContainerRunner(
    walkContainers,
    planHrCandidates,
    planGitHubCandidates,
    applyContainer
  )
  return { semanticContainer }
}
const SAFE_CORE_ANCHOR_FALLBACK_ORDER = [
  'text_join',
  'inline',
]

const hasCoreRule = (md, name) => (
  !!name
  && Array.isArray(md?.core?.ruler?.__rules__)
  && md.core.ruler.__rules__.some((rule) => rule?.name === name)
)

const registerCoreRuleAfterSafeAnchor = (md, ruleName, handler) => {
  for (let i = 0; i < SAFE_CORE_ANCHOR_FALLBACK_ORDER.length; i++) {
    const anchor = SAFE_CORE_ANCHOR_FALLBACK_ORDER[i]
    try {
      md.core.ruler.after(anchor, ruleName, handler)
      return
    } catch (err) {
      // Try the next known anchor.
    }
  }
  md.core.ruler.push(ruleName, handler)
}

const mditSemanticContainer = (md, option) => {
  let opt = {
    requireHrAtOneParagraph: false,
    removeJointAtLineEnd: false,
    allowBracketJoint: false,
    // Bracket label rendering mode when allowBracketJoint is true.
    // "keep": keep [] / ［］ around labels (default)
    // "remove": remove bracket joints
    // "auto": remove bracket joints and use locale-aware label joints
    bracketLabelJointMode: 'keep',
    githubTypeContainer: false,
    // false: GitHub-like separate title paragraph (default)
    // true: inline label in the first paragraph
    githubTypeInlineLabel: false,
    // false: keep heading and label as separate blocks in inline mode (default)
    // true: when marker paragraph is empty and the next block is heading, prepend label to heading text
    githubTypeInlineLabelHeadingMixin: false,
    // Controls custom label suffix in GitHub inline mode.
    // "none": no suffix
    // "auto": CJK => "：", others => "."
    githubTypeInlineLabelJoint: 'none',
    labelControl: false,
    // true: parse trailing {label=...} from inline text when attrs are unavailable
    // false: attrs-only label control
    // "auto": enable fallback when curly_attributes is not registered
    labelControlInlineFallback: 'auto',
    // Additional languages to load on top of English
    languages: ['ja'],
  }
  if (option) Object.assign(opt, option)
  if (opt.bracketLabelJointMode !== 'remove' && opt.bracketLabelJointMode !== 'auto') {
    opt.bracketLabelJointMode = 'keep'
  }
  if (opt.githubTypeInlineLabelJoint !== 'auto') {
    opt.githubTypeInlineLabelJoint = 'none'
  }
  if (opt.labelControlInlineFallback !== true && opt.labelControlInlineFallback !== false) {
    opt.labelControlInlineFallback = 'auto'
  }
  if (opt.labelControlInlineFallback === 'auto') {
    opt.labelControlInlineFallback = !hasCoreRule(md, 'curly_attributes')
  }
  
  const baseSemantics = buildSemantics(opt.languages)
  const hrBlockCandidateCollector = createHrBlockCandidateCollector()
  const baseBracket = opt.allowBracketJoint ? createBracketFormat(baseSemantics) : null
  const baseGithub = opt.githubTypeContainer ? createGitHubTypeContainer(baseSemantics) : null
  const baseFeatureHelpers = { bracket: baseBracket, github: baseGithub }
  const { semanticContainer: baseSemanticContainer } = createSemanticEngine(baseSemantics, opt, baseFeatureHelpers)
  const semanticNameByLower = buildSemanticNameMap(baseSemantics)
  const baseAliasOwnerMap = buildBaseAliasOwnerMap(baseSemantics)
  const scEngineCache = new Map()
  const mdStateRef = { meta: md?.meta, frontmatter: md?.frontmatter }

  const getSemanticContainerWithSc = (scConfig) => {
    if (!scConfig || !scConfig.aliasBySemantic || scConfig.aliasBySemantic.size === 0) {
      return baseSemanticContainer
    }
    const cacheKey = scConfig.aliasKey
    const cached = scEngineCache.get(cacheKey)
    if (cached) return cached

    const semanticsWithSc = mergeSemanticsWithScAliases(baseSemantics, scConfig.aliasBySemantic)
    const bracket = opt.allowBracketJoint ? createBracketFormat(semanticsWithSc) : null
    const github = opt.githubTypeContainer ? createGitHubTypeContainer(semanticsWithSc) : null
    const featureHelpers = { bracket, github }
    const { semanticContainer } = createSemanticEngine(semanticsWithSc, opt, featureHelpers)

    if (scEngineCache.size >= SC_ENGINE_CACHE_MAX) {
      const firstKey = scEngineCache.keys().next().value
      scEngineCache.delete(firstKey)
    }
    scEngineCache.set(cacheKey, semanticContainer)
    return semanticContainer
  }

  md.core.ruler.before('block', 'semantic_container_prepare_env', (state) => {
    const env = state.env || (state.env = {})

    const hrCandidates = Array.isArray(env.semanticContainerHrCandidates)
      ? env.semanticContainerHrCandidates
      : (env.semanticContainerHrCandidates = [])
    hrCandidates.length = 0

    const hrCandidateKeySet = env.semanticContainerHrCandidateKeySet instanceof Set
      ? env.semanticContainerHrCandidateKeySet
      : (env.semanticContainerHrCandidateKeySet = new Set())
    hrCandidateKeySet.clear()

    const githubCandidateLineSet = env.semanticContainerGitHubCandidateLineSet
    if (githubCandidateLineSet instanceof Set) {
      githubCandidateLineSet.clear()
    } else if (opt.githubTypeContainer) {
      env.semanticContainerGitHubCandidateLineSet = new Set()
    }

    if (Array.isArray(env.semanticContainerWarnings)) {
      env.semanticContainerWarnings.length = 0
    }
  })

  if (opt.githubTypeContainer && baseGithub) {
    md.block.ruler.before('blockquote', 'github_alerts', baseGithub.githubAlertsBlock)
  }
  md.block.ruler.before('hr', 'semantic_container_hr_candidates', hrBlockCandidateCollector)

  // Run late in core (after text_join when available).
  // Running too early can shift token positions for later core transforms.
  registerCoreRuleAfterSafeAnchor(md, 'semantic_container', (state) => {
    const rawScInput = resolveRawScInput(state, md, mdStateRef)
    const scConfig = resolveSemanticContainerSc(
      rawScInput,
      semanticNameByLower,
      baseAliasOwnerMap
    )
    if (scConfig?.warnings?.length) {
      pushScWarnings(state, scConfig.warnings)
    }
    const semanticContainer = getSemanticContainerWithSc(scConfig)
    const renderOpt = withScHideSet(opt, scConfig?.hideSet)
    const runtimePlan = buildRuntimePlan(state)
    semanticContainer(state, renderOpt, runtimePlan)
  })
}

export default mditSemanticContainer
