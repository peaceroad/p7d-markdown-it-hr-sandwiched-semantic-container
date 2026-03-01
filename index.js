import { buildSemantics } from './src/semantics.js'
import { createBracketFormat } from './src/bracket-format.js'
import { createGitHubTypeContainer } from './src/github-type-container.js'
import { buildSemanticLeadCandidates } from './src/semantic-lead.js'
import { resolveLabelControl } from './src/label-control.js'
import { resolveContainerMaps, createContainerStartToken, createContainerEndToken } from './src/container-token.js'
import { createHrBlockCandidateCollector } from './src/semantic-hr-candidates.js'

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
const CODE_HASH = 35
const CODE_SPACE = 32
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

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const isSemanticJointChar = (char) => char === ':' || char === '.' || char === '　' || char === '：' || char === '。' || char === '．'
const removeLiteralPrefix = (value, prefix) => {
  if (!value || !prefix) return value
  return value.startsWith(prefix) ? value.slice(prefix.length) : value
}
const removeLiteralPrefixAndFollowingSpaces = (value, prefix) => {
  if (!value || !prefix || !value.startsWith(prefix)) return value
  let index = prefix.length
  while (index < value.length && value.charCodeAt(index) === CODE_SPACE) {
    index++
  }
  return value.slice(index)
}
const trimLeadingAsciiSpaces = (value) => {
  if (!value) return value
  let index = 0
  while (index < value.length && value.charCodeAt(index) === CODE_SPACE) {
    index++
  }
  return index === 0 ? value : value.slice(index)
}
const isAsciiSpacesOnly = (value) => {
  if (!value) return true
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) !== CODE_SPACE) return false
  }
  return true
}
const parseStrongLabelContent = (strongContent, actualName) => {
  if (!strongContent || !actualName || !strongContent.startsWith(actualName)) return null

  let index = actualName.length
  let joint = ''
  const jointChar = strongContent[index]
  if (isSemanticJointChar(jointChar)) {
    joint = jointChar
    index++
  }

  for (let i = index; i < strongContent.length; i++) {
    if (strongContent.charCodeAt(i) !== CODE_SPACE) return null
  }

  return {
    joint,
    trailingSpaces: strongContent.slice(index),
  }
}
const stripLeadingLabelFromChildren = (children, sc) => {
  if (!Array.isArray(children) || children.length === 0) return

  const first = children[0]
  if (first?.type === 'text' && first.content) {
    first.content = removeLiteralPrefixAndFollowingSpaces(first.content, sc.actualContNoStrong)
    if (sc.hasLastJoint && first.content) {
      first.content = removeLiteralPrefixAndFollowingSpaces(first.content, sc.actualNameJoint)
    }
    return
  }

  for (let i = 0; i < children.length - 2; i++) {
    const open = children[i]
    const text = children[i + 1]
    const close = children[i + 2]
    if (open?.type !== 'strong_open' || text?.type !== 'text' || close?.type !== 'strong_close') {
      continue
    }
    const strongLabel = parseStrongLabelContent(text.content, sc.actualName)
    if (!strongLabel) continue

    children.splice(i, 3)

    if (sc.hasLastJoint) {
      for (let j = i; j < children.length; j++) {
        const token = children[j]
        if (token?.type !== 'text' || !token.content) continue
        token.content = removeLiteralPrefix(token.content, sc.actualNameJoint)
        break
      }
    }

    for (let j = i; j < children.length; j++) {
      const token = children[j]
      if (token?.type !== 'text' || !token.content) continue
      token.content = trimLeadingAsciiSpaces(token.content)
      break
    }
    return
  }

  for (let i = 0; i < children.length; i++) {
    const token = children[i]
    if (token?.type !== 'text' || !token.content) continue
    const original = token.content
    token.content = removeLiteralPrefixAndFollowingSpaces(token.content, sc.actualContNoStrong)
    if (token.content === original && sc.hasLastJoint) {
      token.content = removeLiteralPrefixAndFollowingSpaces(token.content, sc.actualNameJoint)
    }
    if (token.content !== original) {
      return
    }
  }
}
const isAsciiAlnum = (code) => (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
const isPotentialLabelLeadCode = (code) => code === CODE_STAR || code === CODE_UNDERSCORE || code >= 128 || isAsciiAlnum(code)
const hasOwn = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key)
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

const buildRuntimePlan = (state) => {
  const candidates = Array.isArray(state?.env?.semanticContainerHrCandidates)
    ? state.env.semanticContainerHrCandidates
    : null
  const keySet = state?.env?.semanticContainerHrCandidateKeySet
  const githubCandidateLineSet = state?.env?.semanticContainerGitHubCandidateLineSet
  const activeGitHubCandidateLineSet = (
    githubCandidateLineSet && typeof githubCandidateLineSet.size === 'number' && githubCandidateLineSet.size > 0
      ? githubCandidateLineSet
      : null
  )
  if (keySet && typeof keySet.size === 'number' && keySet.size > 0) {
    return {
      hrStartLineKeySet: keySet,
      hrCandidates: candidates,
      githubCandidateLineSet: activeGitHubCandidateLineSet,
    }
  }

  if (!Array.isArray(candidates) || candidates.length === 0) {
    if (!activeGitHubCandidateLineSet) {
      return EMPTY_RUNTIME_PLAN
    }
    return {
      hrStartLineKeySet: null,
      hrCandidates: null,
      githubCandidateLineSet: activeGitHubCandidateLineSet,
    }
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
    return EMPTY_RUNTIME_PLAN
  }

  return {
    hrStartLineKeySet,
    hrCandidates: candidates,
    githubCandidateLineSet: activeGitHubCandidateLineSet,
  }
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
    const tokens = state.tokens
    const tokensLength = tokens.length
    const matchedSemantic = findMatchedSemantic(state, n)
    if (!matchedSemantic) return false

    let en = n
    let hasEndSemanticsHr = false
    let pCloseN = -1
    while (en < tokensLength) {
      const tokenAtEn = tokens[en]
      if (tokenAtEn.type === 'hr') {
        if (hrType && tokenAtEn.markup.includes(hrType)) {
          hasEndSemanticsHr = true
          break
        }
        en++
        continue
      }

      if (tokenAtEn.type === 'paragraph_close' && pCloseN === -1) {
        pCloseN = en
        if (!hrType) break
      }

      en++
    }
    if (hrType && !hasEndSemanticsHr) return false

    const rangeEnd = hrType ? en : (pCloseN !== -1 ? pCloseN + 1 : en)
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

const isNonGitHubCandidateBlockquote = (token, githubCandidateLineSet) => (
  !!githubCandidateLineSet
  && token?.type === 'blockquote_open'
  && token?.map
  && Number.isInteger(token.map[0])
  && !githubCandidateLineSet.has(token.map[0])
)

const createActiveCheck = ({ githubCheck, bracketCheck, defaultCheck }) => {
  return (state, n, hrType, sc, checked) => {
    const token = state.tokens[n]
    if (githubCheck && token.type === 'blockquote_open') {
      return githubCheck(state, n, hrType, sc, checked)
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

const createContainerApplier = (semantics, featureHelpers) => (state, n, hrType, sc, sci , optLocal) => {
  const tokens = state.tokens
  let nJump = 0
  let rs = sc.range[0]
  let re = sc.range[1]
  const sn = sc.sn
  const sem = semantics[sn]

  if (sc.isGitHubAlert && featureHelpers.github?.setGitHubAlertsSemanticContainer) {
    return featureHelpers.github.setGitHubAlertsSemanticContainer(state, n, hrType, sc, sci, optLocal)
  }

  if (sc.isBracketFormat && featureHelpers.bracket?.setBracketSemanticContainer) {
    return featureHelpers.bracket.setBracketSemanticContainer(state, n, hrType, sc, sci, optLocal)
  }

  // for continued semantic container.
  if(sci > 1) {
    rs += sci - 1
    re += sci - 1
  }
  const { startMap, endMap } = resolveContainerMaps(tokens, rs, re, hrType)
  const nt = tokens[rs+1]
  const ntChildren = nt.children
  const startToken = tokens[rs]
  const defaultHideLabel = !!optLocal.scHideSet?.has(sem.name)
  const labelControl = optLocal.labelControl ? resolveLabelControl(startToken, nt) : null
  const hideLabel = labelControl ? !!labelControl.hide : defaultHideLabel
  const labelText = labelControl && !labelControl.hide ? labelControl.value : sc.actualName
  const labelJoint = hideLabel ? '' : sc.actualNameJoint
  const hasSemanticAriaLabel = !!sem.hasAriaLabel

  const sToken = createContainerStartToken(
    state,
    sem,
    labelText,
    hideLabel,
    sc.actualName,
    startMap
  )
  tokens.splice(rs, 0, sToken)

  const eToken = createContainerEndToken(state, sem, endMap)

  if(sci !== -1) {
    tokens.splice(re+1, 1, eToken); // ending hr delete too.
    if (!sc.continued) {
      tokens.splice(rs-1, 1)// starting hr delete.
    }
  } else {
    tokens.splice(re+1, 0, eToken)
  }

  if(hideLabel || hasSemanticAriaLabel) {
    nt.content = removeLiteralPrefix(nt.content, sc.actualCont)
    nt.content = removeLiteralPrefix(nt.content, sc.actualContNoStrong)
    if (sc.hasLastJoint) {
      nt.content = removeLiteralPrefix(nt.content, sc.actualNameJoint)
    }
    stripLeadingLabelFromChildren(ntChildren, sc)
    nt.content = trimLeadingAsciiSpaces(nt.content)
    return nJump
  }

  if (nt.content?.charCodeAt(0) === CODE_HASH) {
    nJump += 2
  }
  if (nt.content && (
    (nt.content.charCodeAt(0) === CODE_STAR && nt.content.charCodeAt(1) === CODE_STAR)
    || (nt.content.charCodeAt(0) === CODE_UNDERSCORE && nt.content.charCodeAt(1) === CODE_UNDERSCORE)
  )) {
    let foundLabelStrong = false
    
    for (let i = 0; i < ntChildren.length - 2; i++) {
      if (ntChildren[i] && ntChildren[i].type === 'strong_open'
        && ntChildren[i + 2] && ntChildren[i + 2].type === 'strong_close'
        && ntChildren[i + 1] && ntChildren[i + 1].content) {
        
        const strongContent = ntChildren[i + 1].content
        const strongLabel = parseStrongLabelContent(strongContent, sc.actualName)
        
        if (strongLabel) {
          foundLabelStrong = true
          
          let textAfterStrongIndex = -1
          for (let j = i + 3; j < ntChildren.length; j++) {
            if (ntChildren[j] && ntChildren[j].type === 'text') {
              textAfterStrongIndex = j
              break
            }
          }
          
          ntChildren[i].attrJoin('class', sem.labelClass)
          ntChildren[i + 1].content = labelText
          let hasDisplayJoint = false
          let jointSpan
          let jointContent
          let jointSpanClose
          if (labelJoint) {
            hasDisplayJoint = true
            jointSpan = new state.Token('span_open', 'span', 1)
            jointSpan.attrJoin('class', sem.labelJointClass)
            jointContent = new state.Token('text', '', 0)
            jointContent.content = labelJoint
            jointSpanClose = new state.Token('span_close', 'span', -1)
          }
          
          if (strongLabel.joint) {
            const trailingSpaces = strongLabel.trailingSpaces || ''
            if (hasDisplayJoint) {
              ntChildren.splice(i + 2, 0, jointSpan, jointContent, jointSpanClose)
            }
            
            if (textAfterStrongIndex !== -1) {
              const adjustedTextIndex = textAfterStrongIndex + (hasDisplayJoint ? 3 : 0)
              if (trailingSpaces) {
                if (ntChildren[adjustedTextIndex].content === '') {
                  ntChildren[adjustedTextIndex].content = ' '
                } else {
                  ntChildren[adjustedTextIndex].content = ' ' + trimLeadingAsciiSpaces(ntChildren[adjustedTextIndex].content)
                }
              }
            }
          } else if (sc.hasLastJoint) {
            if (ntChildren[i + 3] && ntChildren[i + 3].content) {
              ntChildren[i + 3].content = removeLiteralPrefix(ntChildren[i + 3].content, sc.actualNameJoint)
            }
            if (hasDisplayJoint) {
              ntChildren.splice(i + 2, 0, jointSpan, jointContent, jointSpanClose)
            }
          }
          break
        }
      }
    }
    
    if (!foundLabelStrong) {
      const strongBefore = new state.Token('text', '', 0)
      const strongOpen = new state.Token('strong_open', 'strong', 1)
      const strongContent = new state.Token('text', '', 0)
      strongContent.content = labelText
      const strongClose = new state.Token('strong_close', 'strong', -1)
      strongOpen.attrJoin('class', sem.labelClass)

      const firstChild = ntChildren?.[0]
      if (firstChild?.content) {
        const escapedActualName = escapeRegExp(sc.actualName)
        const regStrongPattern = new RegExp('\\*\\* *?' + escapedActualName + '(' + semanticsHalfJoint + '|' + semanticsFullJoint + ')? *\\*\\* *')
        const originalContent = firstChild.content
        const match = originalContent.match(regStrongPattern)
        
        if (match && match[0]) {
          const trailingSpaces = match[0].match(/ +$/);
          const replacement = trailingSpaces ? trailingSpaces[0] : '';
          firstChild.content = firstChild.content.replace(regStrongPattern, replacement)
        }
        firstChild.content = removeLiteralPrefix(firstChild.content, sc.actualCont)
      }
      nt.content = removeLiteralPrefix(nt.content, sc.actualCont)

      const labelTokens = [strongBefore, strongOpen, strongContent]
      if (labelJoint) {
        const jointSpan = new state.Token('span_open', 'span', 1)
        jointSpan.attrJoin('class', sem.labelJointClass)
        const jointContent = new state.Token('text', '', 0)
        jointContent.content = labelJoint
        const jointSpanClose = new state.Token('span_close', 'span', -1)
        labelTokens.push(jointSpan, jointContent, jointSpanClose)
      }
      labelTokens.push(strongClose)
      ntChildren.splice(0, 0, ...labelTokens)
    }
    nJump += 3
  } else {
    const lt_first = new state.Token('text', '', 0)
    const lt_span_open = new state.Token('span_open', 'span', 1)
    lt_span_open.attrJoin('class', sem.labelClass)
    const lt_span_content = new state.Token('text', '', 0)
    lt_span_content.content = labelText
    const lt_span_close = new state.Token('span_close', 'span', -1)

    const firstChild = ntChildren?.[0]
    if (sc.hasHalfJoint && firstChild?.content) {
      firstChild.content = ' ' + removeLiteralPrefix(firstChild.content, sc.actualContNoStrong)
    } else if (firstChild?.content) {
      firstChild.content = removeLiteralPrefix(firstChild.content, sc.actualContNoStrong)
    }

    const labelTokens = [lt_first, lt_span_open, lt_span_content]
    if (labelJoint) {
      const lt_joint_span_open = new state.Token('span_open', 'span', 1)
      lt_joint_span_open.attrJoin('class', sem.labelJointClass)
      const lt_joint_content = new state.Token('text', '', 0)
      lt_joint_content.content = labelJoint
      const lt_joint_span_close = new state.Token('span_close', 'span', -1)
      labelTokens.push(lt_joint_span_open, lt_joint_content, lt_joint_span_close)
    }
    labelTokens.push(lt_span_close)
    ntChildren.splice(0, 0, ...labelTokens)
    nJump += 3
  }

  if (optLocal.removeJointAtLineEnd) {
    let jointIsAtLineEnd = false
    if (ntChildren && ntChildren.length > 0) {
      const lastToken = ntChildren[ntChildren.length - 1]
      if (lastToken.type === 'text' && isAsciiSpacesOnly(lastToken.content)) {
        jointIsAtLineEnd = true
        lastToken.content = ''
      } else if (lastToken.type === 'strong_close') {
        jointIsAtLineEnd = true
      } else if (lastToken.type === 'span_close') {
        jointIsAtLineEnd = true
      }
    }

    if (jointIsAtLineEnd) {
      for (let i = 0; i < ntChildren.length - 2; i++) {
        const className = ntChildren[i] && ntChildren[i].attrGet ? ntChildren[i].attrGet('class') : ''
        if (className && className.includes('-label-joint')) {
          ntChildren.splice(i, 3) // Remove joint span open, content, and close
          break
        }
      }
    }
  }

  return nJump
}

const createContainerWalker = (activeCheck, checkContainerRanges, applyContainer) => (
  state,
  n,
  cn,
  optLocal,
  runtimePlan,
  appliedHrCandidateStartLineSet
) => {
  const tokens = state.tokens
  let sc = []
  let sci = 0
  let hrType = ''
  let firstJump = 0
  const hrStartLineKeySet = runtimePlan?.hrStartLineKeySet
  const githubCandidateLineSet = runtimePlan?.githubCandidateLineSet

  const prevToken = tokens[n-1]
  const token = tokens[n]

  if (n === 0 || n === tokens.length -1) {
    if (!optLocal.requireHrAtOneParagraph && token.type === 'paragraph_open') {
      if (isAppliedHrCandidateParagraph(token, appliedHrCandidateStartLineSet)) {
        n++
        return n
      }
      if(activeCheck(state, n, hrType, sc, false)) {
        firstJump = applyContainer(state, n, hrType, sc[0], -1, optLocal)
        return n + (firstJump > 0 ? firstJump : 1)
      }
    } else if (optLocal.githubTypeContainer && token.type === 'blockquote_open') {
      if (isNonGitHubCandidateBlockquote(token, githubCandidateLineSet)) {
        n++
        return n
      }
      if(activeCheck(state, n, hrType, sc, false)) {
        firstJump = applyContainer(state, n, hrType, sc[0], -1, optLocal)
        return n + (firstJump > 0 ? firstJump : 1)
      }
    }
    n++
    return n
  }
  if (prevToken.type !== 'hr') {
    if (!optLocal.requireHrAtOneParagraph && token.type === 'paragraph_open') {
      if (isAppliedHrCandidateParagraph(token, appliedHrCandidateStartLineSet)) {
        n++
        return n
      }
      if (cn.has(n - 1)) {
        n++; return n
      }

      if (tokens[n - 1].type === 'list_item_open') {
        n++; return n
      }

      if(activeCheck(state, n, hrType, sc, false)) {
        firstJump = applyContainer(state, n, hrType, sc[0], -1, optLocal)
        return n + (firstJump > 0 ? firstJump : 1)
      }
    } else if (optLocal.githubTypeContainer && token.type === 'blockquote_open') {
      if (isNonGitHubCandidateBlockquote(token, githubCandidateLineSet)) {
        n++
        return n
      }
      if(activeCheck(state, n, hrType, sc, false)) {
        firstJump = applyContainer(state, n, hrType, sc[0], -1, optLocal)
        return n + (firstJump > 0 ? firstJump : 1)
      }
    }
    n++
    return n
  }

  hrType = getHrTypeFromMarkup(prevToken.markup || '')

  if (hrStartLineKeySet && token?.map && Number.isInteger(token.map[0])) {
    const hrCandidateKey = createHrCandidateKey(token.map[0], hrType)
    if (!hrStartLineKeySet.has(hrCandidateKey)) {
      n++
      return n
    }
  }

  if (!checkContainerRanges(state, n, hrType, sc)) {
    n++
    return n
  }

  for (sci = 0; sci < sc.length; sci++) {
    const jump = applyContainer(state, n, hrType, sc[sci], sci, optLocal)
    if (sci === 0) firstJump = jump
    cn.add(sc[sci].range[1] + sci + 1)
  }
  return n + (firstJump > 0 ? firstJump : 1)
}

const buildHrCandidateTokenIndex = (tokens) => {
  const startIndexByKey = new Map()
  const endIndexByKey = new Map()

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token?.type === 'hr' && token?.map && Number.isInteger(token.map[0])) {
      const hrType = getHrTypeFromMarkup(token.markup || '')
      if (hrType) {
        const key = createHrCandidateKey(token.map[0], hrType)
        endIndexByKey.set(key, i)
      }
    }

    if (i === 0) continue
    const prev = tokens[i - 1]
    if (prev?.type !== 'hr') continue
    if (!token?.map || !Number.isInteger(token.map[0])) continue
    const hrType = getHrTypeFromMarkup(prev.markup || '')
    if (!hrType) continue

    const key = createHrCandidateKey(token.map[0], hrType)
    if (!startIndexByKey.has(key)) {
      startIndexByKey.set(key, i)
    }
  }

  return { startIndexByKey, endIndexByKey }
}

const buildBlockquoteTokenIndexByLine = (tokens) => {
  const indexByLine = new Map()
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token?.type !== 'blockquote_open') continue
    if (!token?.map || !Number.isInteger(token.map[0])) continue
    const line = token.map[0]
    if (!indexByLine.has(line)) {
      indexByLine.set(line, i)
    }
  }
  return indexByLine
}

const createHrCandidateRunner = (findHrCandidateSemantic, applyContainer) => (state, optLocal, runtimePlan) => {
  const candidates = runtimePlan?.hrCandidates
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { handledAll: true, appliedStartLineSet: null }
  }

  const tokenIndex = buildHrCandidateTokenIndex(state.tokens)
  const matchedByCandidate = new Array(candidates.length)
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
    const n = tokenIndex.startIndexByKey.get(startKey)
    if (n === undefined) {
      handledAll = false
      continue
    }

    const endKey = createHrCandidateKey(endHrLine, hrType)
    const re = tokenIndex.endIndexByKey.get(endKey)
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
    return { handledAll, appliedStartLineSet: null }
  }

  const appliedStartLineSet = new Set()
  // Apply from tail to head so precomputed token indexes remain valid.
  for (let gi = groups.length - 1; gi >= 0; gi--) {
    const group = groups[gi]
    for (let sci = 0; sci < group.scGroup.length; sci++) {
      const startLine = group.scGroup[sci].startLine
      if (Number.isInteger(startLine)) {
        appliedStartLineSet.add(startLine)
      }
      applyContainer(
        state,
        group.groupTokenStart,
        group.scGroup[sci].hrType,
        group.scGroup[sci],
        sci,
        optLocal
      )
    }
  }

  return {
    handledAll,
    appliedStartLineSet: appliedStartLineSet.size > 0 ? appliedStartLineSet : null,
  }
}

const createGitHubCandidateRunner = (githubCheck, applyContainer) => (state, optLocal, runtimePlan) => {
  if (typeof githubCheck !== 'function') return { handledAll: true }
  const candidateLineSet = runtimePlan?.githubCandidateLineSet
  if (!candidateLineSet || candidateLineSet.size === 0) return { handledAll: true }

  const tokenIndexByLine = buildBlockquoteTokenIndexByLine(state.tokens)
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

  if (matchedCandidates.length === 0) {
    return { handledAll }
  }

  for (let i = matchedCandidates.length - 1; i >= 0; i--) {
    const candidate = matchedCandidates[i]
    applyContainer(state, candidate.tokenIndex, '', candidate.sc, -1, optLocal)
  }

  return { handledAll }
}

const createContainerRunner = (walkContainers, runHrCandidates, runGitHubCandidates) => (state, optLocal, runtimePlan = EMPTY_RUNTIME_PLAN) => {
  const hrCandidateResult = runHrCandidates(state, optLocal, runtimePlan)
  const githubCandidateResult = (
    optLocal.githubTypeContainer
    && runGitHubCandidates(state, optLocal, runtimePlan)
  )
  const appliedHrCandidateStartLineSet = hrCandidateResult?.appliedStartLineSet || null

  if (optLocal.requireHrAtOneParagraph) {
    const hrHandled = (
      !runtimePlan.hrStartLineKeySet
      || runtimePlan.hrStartLineKeySet.size === 0
      || (hrCandidateResult && hrCandidateResult.handledAll)
    )
    if (!optLocal.githubTypeContainer) {
      if (hrHandled) return true
    } else {
      const githubHandled = (
        !runtimePlan.githubCandidateLineSet
        || runtimePlan.githubCandidateLineSet.size === 0
        || (githubCandidateResult && githubCandidateResult.handledAll)
      )
      if (hrHandled && githubHandled) return true
    }
  }

  let n = 0
  const cn = new Set()
  let tokensLength = state.tokens.length
  while (n < tokensLength) {
    n = walkContainers(state, n, cn, optLocal, runtimePlan, appliedHrCandidateStartLineSet)
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
  const runHrCandidates = createHrCandidateRunner(findHrCandidateSemantic, applyContainer)
  const runGitHubCandidates = createGitHubCandidateRunner(githubCheck, applyContainer)
  const semanticContainer = createContainerRunner(walkContainers, runHrCandidates, runGitHubCandidates)
  return { semanticContainer }
}
const SAFE_CORE_ANCHOR_FALLBACK_ORDER = [
  'text_join',
  'inline',
]

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
