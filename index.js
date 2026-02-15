import { buildSemantics } from './src/semantics.js'
import { createBracketFormat } from './src/bracket-format.js'
import { createGitHubTypeContainer } from './src/github-type-container.js'
import { buildSemanticLeadCandidates } from './src/semantic-lead.js'
import { resolveLabelControl } from './src/label-control.js'
import { resolveContainerMaps, createContainerStartToken, createContainerEndToken } from './src/container-token.js'

const sNumber = '(?:[ 　](?:[0-9]{1,6}|[A-Z]{1,2})(?:[.-](?:[0-9]{1,6}|[A-Z]{1,2})){0,6})?'
const strongMark = '[*_]{2}'

const semanticsHalfJoint = '[:.]'
const semanticsFullJoint = '[　：。．]'
const STRONG_MARK_GLOBAL_REG = /[*_]{2}/g
const MATCH_CACHE_MAX = 256
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

  return (state, n, hrType, sc, checked) => {
    const tokens = state.tokens
    const tokensLength = tokens.length
    const nextToken = tokens[n+1]
    if (nextToken?.type !== 'inline') return false

    const content = nextToken?.content
    if (!content) return false
    let leadIndex = 0
    const firstCode = content.charCodeAt(0)
    const secondCode = content.charCodeAt(1)
    if ((firstCode === CODE_STAR && secondCode === CODE_STAR) || (firstCode === CODE_UNDERSCORE && secondCode === CODE_UNDERSCORE)) {
      leadIndex = 2
    }
    const leadCode = content.charCodeAt(leadIndex)
    if (!leadCode) return false
    if (leadCode === CODE_LEFT_BRACKET || leadCode === CODE_FULLWIDTH_LEFT_BRACKET) return false
    if (!isPotentialLabelLeadCode(leadCode)) {
      return false
    }
    if (!hasSemanticJointInPrefix(content, leadIndex)) {
      return false
    }

    let matchedSemantic = null
    const cached = matchCache.get(content)
    if (cached !== undefined) {
      if (cached === CACHE_MISS) return false
      matchedSemantic = cached
    } else {
      let sn = 0
      let actualName = null
      const leadKey = content[leadIndex].toLowerCase()
      let candidates = candidatesByLead.get(leadKey)
      if (!candidates) {
        if (fallback.length === 0) {
          cacheSet(content, CACHE_MISS)
          return false
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
        return false
      }
      matchedSemantic = parseMatchedSemantic(sn, actualName)
      cacheSet(content, matchedSemantic)
    }

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
}

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
  const labelControl = optLocal.labelControl ? resolveLabelControl(startToken, nt) : null
  const hideLabel = !!labelControl?.hide
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

const createContainerWalker = (activeCheck, checkContainerRanges, applyContainer) => (state, n, cn, optLocal) => {
  const tokens = state.tokens
  let sc = []
  let sci = 0
  let hrType = ''
  let firstJump = 0
  const advanceAfterApply = (index, jump) => index + (jump > 0 ? jump : 1)

  const prevToken = tokens[n-1]
  const token = tokens[n]

  if (n === 0 || n === tokens.length -1) {
    if (!optLocal.requireHrAtOneParagraph && token.type === 'paragraph_open') {
      if(activeCheck(state, n, hrType, sc, false)) {
        firstJump = applyContainer(state, n, hrType, sc[0], -1, optLocal)
        return advanceAfterApply(n, firstJump)
      }
    } else if (optLocal.githubTypeContainer && token.type === 'blockquote_open') {
      if(activeCheck(state, n, hrType, sc, false)) {
        firstJump = applyContainer(state, n, hrType, sc[0], -1, optLocal)
        return advanceAfterApply(n, firstJump)
      }
    }
    n++
    return n
  }
  if (prevToken.type !== 'hr') {
    if (!optLocal.requireHrAtOneParagraph && token.type === 'paragraph_open') {
      if (cn.has(n - 1)) {
        n++; return n
      }

      if (tokens[n - 1].type === 'list_item_open') {
        n++; return n
      }

      if(activeCheck(state, n, hrType, sc, false)) {
        firstJump = applyContainer(state, n, hrType, sc[0], -1, optLocal)
        return advanceAfterApply(n, firstJump)
      }
    } else if (optLocal.githubTypeContainer && token.type === 'blockquote_open') {
      if(activeCheck(state, n, hrType, sc, false)) {
        firstJump = applyContainer(state, n, hrType, sc[0], -1, optLocal)
        return advanceAfterApply(n, firstJump)
      }
    }
    n++
    return n
  }

  const prevMarkup = prevToken.markup || ''
  if (prevMarkup.includes('*')) {
    hrType = '*'
  } else if (prevMarkup.includes('-')) {
    hrType = '-'
  } else if (prevMarkup.includes('_')) {
    hrType = '_'
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
  return advanceAfterApply(n, firstJump)
}

const createContainerRunner = (walkContainers) => (state, optLocal) => {
  let n = 0
  const cn = new Set()
  let tokensLength = state.tokens.length
  while (n < tokensLength) {
    n = walkContainers(state, n, cn, optLocal)
    tokensLength = state.tokens.length
  }
  return true
}

const createSemanticEngine = (semantics, opt, featureHelpers) => {
  const semanticsReg = buildSemanticsReg(semantics)
  const semanticLabelMatcher = createLabelMatcher(semantics, semanticsReg)
  const githubCheck = opt.githubTypeContainer ? featureHelpers.github?.checkGitHubAlertsCore : null
  const bracketCheck = opt.allowBracketJoint ? featureHelpers.bracket?.checkBracketSemanticContainerCore : null
  const activeCheck = createActiveCheck({ githubCheck, bracketCheck, defaultCheck: semanticLabelMatcher })
  const checkContainerRanges = createContainerRangeChecker(activeCheck)
  const applyContainer = createContainerApplier(semantics, featureHelpers)
  const walkContainers = createContainerWalker(activeCheck, checkContainerRanges, applyContainer)
  const semanticContainer = createContainerRunner(walkContainers)
  return { semanticContainer }
}

const SAFE_CORE_ANCHORS = new Set([
  'inline',
  'curly_attributes',
  'cjk_breaks',
  'text_join',
  'strong_ja_postprocess',
  'footnote_anchor',
  'endnotes_move',
])

const getSafeCoreAnchor = (md) => {
  const rules = md?.core?.ruler?.__rules__
  if (!Array.isArray(rules)) return 'inline'
  let maxIndex = -1
  let anchorName = 'inline'
  for (let i = 0; i < rules.length; i++) {
    const name = rules[i]?.name
    if (!name || !SAFE_CORE_ANCHORS.has(name)) continue
    if (i > maxIndex) {
      maxIndex = i
      anchorName = name
    }
  }
  return anchorName
}

const registerCoreRuleAfterSafeAnchor = (md, ruleName, handler) => {
  const anchor = getSafeCoreAnchor(md)
  try {
    md.core.ruler.after(anchor, ruleName, handler)
  } catch (err) {
    md.core.ruler.push(ruleName, handler)
  }
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
  
  const semantics = buildSemantics(opt.languages)
  const bracket = opt.allowBracketJoint ? createBracketFormat(semantics) : null
  const github = opt.githubTypeContainer ? createGitHubTypeContainer(semantics) : null
  const featureHelpers = { bracket, github }
  const { semanticContainer } = createSemanticEngine(semantics, opt, featureHelpers)

  if (opt.githubTypeContainer && github) {
    md.block.ruler.before('blockquote', 'github_alerts', github.githubAlertsBlock)
  }

  // Run after index-sensitive plugins (footnote/strong-ja) and after inline processing.
  // If SemanticContainer runs too early, tokens.splice() can shift recorded indices.
  registerCoreRuleAfterSafeAnchor(md, 'semantic_container', (state) => {
    semanticContainer(state, opt)
  })
}

export default mditSemanticContainer
