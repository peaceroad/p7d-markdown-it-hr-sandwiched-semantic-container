import { buildSemanticLeadCandidates } from './semantic-lead.js'
import { resolveLabelControl } from './label-control.js'
import { resolveContainerMaps, createContainerStartToken, createContainerEndToken } from './container-token.js'

const createBracketFormat = (semantics) => {
  const strongMark = '[*_]{2}'
  const sNumber = '(?:[ 　](?:[0-9]{1,6}|[A-Z]{1,2})(?:[.-](?:[0-9]{1,6}|[A-Z]{1,2})){0,6})?'
  const MATCH_CACHE_MAX = 128
  const CACHE_MISS = 0
  const CODE_STAR = 42
  const CODE_UNDERSCORE = 95
  const CODE_TAB = 9
  const CODE_LF = 10
  const CODE_VTAB = 11
  const CODE_FF = 12
  const CODE_CR = 13
  const CODE_SPACE = 32
  const CODE_FULLWIDTH_SPACE = 12288
  const CODE_LEFT_BRACKET = 91
  const CODE_FULLWIDTH_LEFT_BRACKET = 65339
  const RE_JAPANESE_CHARS = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/
  const BRACKET_LABEL_JOINT_KEEP = 'keep'
  const BRACKET_LABEL_JOINT_REMOVE = 'remove'
  const BRACKET_LABEL_JOINT_AUTO = 'auto'
  const removeLiteralPrefix = (value, prefix) => {
    if (!value || !prefix) return value
    return value.startsWith(prefix) ? value.slice(prefix.length) : value
  }
  const trimLeadingAsciiSpaces = (value) => {
    if (!value) return value
    let index = 0
    while (index < value.length && value.charCodeAt(index) === CODE_SPACE) {
      index++
    }
    return index === 0 ? value : value.slice(index)
  }
  const ensureLeadingSpaceAfterLabel = (children, startIndex) => {
    if (!Array.isArray(children)) return
    for (let i = startIndex; i < children.length; i++) {
      const token = children[i]
      if (token?.type !== 'text' || !token.content) continue
      if (token.content.charCodeAt(0) !== CODE_SPACE) {
        token.content = ' ' + token.content
      }
      return
    }
  }
  const isTrimWhitespaceCode = (code) => (
    code === CODE_SPACE
    || code === CODE_TAB
    || code === CODE_LF
    || code === CODE_VTAB
    || code === CODE_FF
    || code === CODE_CR
    || code === CODE_FULLWIDTH_SPACE
  )
  const hasNonWhitespace = (value) => {
    if (!value) return false
    for (let i = 0; i < value.length; i++) {
      if (!isTrimWhitespaceCode(value.charCodeAt(i))) return true
    }
    return false
  }
  const prependBracketLabelTokens = (state, sem, children, labelText, sc, useStrongWrapper, spaceMode) => {
    const wrapperOpen = new state.Token(useStrongWrapper ? 'strong_open' : 'span_open', useStrongWrapper ? 'strong' : 'span', 1)
    wrapperOpen.attrJoin('class', sem.labelClass)
    const openBracketSpan = new state.Token('span_open', 'span', 1)
    openBracketSpan.attrJoin('class', sem.labelJointClass)
    const openBracketContent = new state.Token('text', '', 0)
    openBracketContent.content = sc.openBracket
    const openBracketSpanClose = new state.Token('span_close', 'span', -1)
    const labelContent = new state.Token('text', '', 0)
    labelContent.content = labelText
    const closeBracketSpan = new state.Token('span_open', 'span', 1)
    closeBracketSpan.attrJoin('class', sem.labelJointClass)
    const closeBracketContent = new state.Token('text', '', 0)
    closeBracketContent.content = sc.closeBracket
    const closeBracketSpanClose = new state.Token('span_close', 'span', -1)
    const wrapperClose = new state.Token(useStrongWrapper ? 'strong_close' : 'span_close', useStrongWrapper ? 'strong' : 'span', -1)
    children.splice(0, 0,
      wrapperOpen,
      openBracketSpan, openBracketContent, openBracketSpanClose,
      labelContent,
      closeBracketSpan, closeBracketContent, closeBracketSpanClose,
      wrapperClose
    )

    if (sc.openBracket !== '[') return 9

    if (spaceMode === 'force') {
      const spaceAfterLabel = new state.Token('text', '', 0)
      spaceAfterLabel.content = ' '
      children.splice(9, 0, spaceAfterLabel)
      return 10
    }

    ensureLeadingSpaceAfterLabel(children, 9)
    return 9
  }
  const isLikelyJapaneseText = (value) => !!value && RE_JAPANESE_CHARS.test(value)
  const resolvePlainLabelStyle = (labelText, bracketLabelJointMode) => {
    if (bracketLabelJointMode === BRACKET_LABEL_JOINT_AUTO) {
      return isLikelyJapaneseText(labelText)
        ? { joint: '：', spacer: '' }
        : { joint: '.', spacer: ' ' }
    }
    return { joint: '', spacer: ' ' }
  }
  const prependPlainLabelTokens = (state, sem, children, labelText, useStrongWrapper, bracketLabelJointMode) => {
    const wrapperOpen = new state.Token(useStrongWrapper ? 'strong_open' : 'span_open', useStrongWrapper ? 'strong' : 'span', 1)
    wrapperOpen.attrJoin('class', sem.labelClass)
    const labelContent = new state.Token('text', '', 0)
    labelContent.content = labelText
    const wrapperClose = new state.Token(useStrongWrapper ? 'strong_close' : 'span_close', useStrongWrapper ? 'strong' : 'span', -1)
    const tokens = [wrapperOpen, labelContent]
    const { joint, spacer } = resolvePlainLabelStyle(labelText, bracketLabelJointMode)
    if (joint) {
      const jointOpen = new state.Token('span_open', 'span', 1)
      jointOpen.attrJoin('class', sem.labelJointClass)
      const jointContent = new state.Token('text', '', 0)
      jointContent.content = joint
      const jointClose = new state.Token('span_close', 'span', -1)
      tokens.push(jointOpen, jointContent, jointClose)
    }
    tokens.push(wrapperClose)
    children.splice(0, 0, ...tokens)
    const bodyStartIndex = tokens.length
    if (spacer) {
      ensureLeadingSpaceAfterLabel(children, bodyStartIndex)
    }
    return bodyStartIndex
  }
  const stripBracketLabelPrefix = (inlineToken, children, sc) => {
    if (inlineToken?.content) {
      inlineToken.content = removeLiteralPrefix(inlineToken.content, sc.actualCont)
      inlineToken.content = trimLeadingAsciiSpaces(inlineToken.content)
    }
    if (!Array.isArray(children) || children.length === 0) return

    const labelCore = sc.openBracket + sc.actualName + sc.closeBracket
    if (children[0]?.type === 'strong_open'
      && children[1]?.type === 'text'
      && children[1].content === labelCore
      && children[2]?.type === 'strong_close') {
      children.splice(0, 3)
      for (let i = 0; i < children.length; i++) {
        const token = children[i]
        if (token?.type === 'text' && token.content) {
          token.content = trimLeadingAsciiSpaces(token.content)
          break
        }
      }
      return
    }

    for (let i = 0; i < children.length; i++) {
      const token = children[i]
      if (token?.type !== 'text' || !token.content) continue
      const original = token.content
      let stripped = removeLiteralPrefix(original, sc.actualCont)
      if (stripped === original) {
        stripped = removeLiteralPrefix(original, labelCore)
      }
      if (stripped === original) continue
      token.content = trimLeadingAsciiSpaces(stripped)
      break
    }

    // Cleanup: if stripping emptied a leading strong wrapper, remove it.
    let strongStartIndex = 0
    while (strongStartIndex < children.length) {
      const token = children[strongStartIndex]
      if (token?.type === 'text' && !token.content) {
        strongStartIndex++
        continue
      }
      break
    }
    if (children[strongStartIndex]?.type === 'strong_open') {
      let closeIndex = -1
      let hasVisibleContent = false
      for (let i = strongStartIndex + 1; i < children.length; i++) {
        const token = children[i]
        if (token?.type === 'strong_close') {
          closeIndex = i
          break
        }
        if (token?.type !== 'text') {
          hasVisibleContent = true
          break
        }
        if (hasNonWhitespace(token.content)) {
          hasVisibleContent = true
          break
        }
      }
      if (!hasVisibleContent && closeIndex !== -1) {
        children.splice(strongStartIndex, closeIndex - strongStartIndex + 1)
        while (children[0]?.type === 'text' && !children[0].content) {
          children.splice(0, 1)
        }
        for (let i = 0; i < children.length; i++) {
          const token = children[i]
          if (token?.type === 'text' && token.content) {
            token.content = trimLeadingAsciiSpaces(token.content)
            break
          }
        }
      }
    }
  }

  // Bracket format regex patterns
  const semanticsBracketReg = semantics.map((sem) => {
    const aliasStr = sem.aliases.length
      ? '|' + sem.aliases.map((x) => x.replace(/\(/g, '(?:').trim()).join('|')
      : ''
    // Match [Semantics] (half-width, space required) or ［Semantics］ (full-width, space optional)
    const bkPattern = '^(?:(' + strongMark + ')?([\\[])((?:' + sem.name + aliasStr + ')' + sNumber + ')([\\]])\\1?( +)|(' + strongMark + ')?([［])((?:' + sem.name + aliasStr + ')' + sNumber + ')([］])\\6?( *))'
    return new RegExp(bkPattern, 'i')
  })
  const parseBracketMatchedSemantic = (sn, actualMatch) => {
    // Half-width bracket match: (strongMark)?([[])(semantics)([])(space)
    if (actualMatch[2]) {
      return {
        sn,
        actualCont: actualMatch[0],
        actualName: actualMatch[3],
        isStrongBracket: !!actualMatch[1],
        openBracket: actualMatch[2],
        closeBracket: actualMatch[4],
      }
    }
    // Full-width bracket match: (strongMark)?([［])(semantics)([］])(space)
    return {
      sn,
      actualCont: actualMatch[0],
      actualName: actualMatch[8],
      isStrongBracket: !!actualMatch[6],
      openBracket: actualMatch[7],
      closeBracket: actualMatch[9],
    }
  }
  const matchCache = new Map()
  const { candidatesByLead, fallback } = buildSemanticLeadCandidates(semantics)
  const cacheSet = (key, value) => {
    if (matchCache.size >= MATCH_CACHE_MAX) {
      const firstKey = matchCache.keys().next().value
      matchCache.delete(firstKey)
    }
    matchCache.set(key, value)
  }

  // Bracket format check function
  const checkBracketSemanticContainerCore = (state, n, hrType, sc, checked) => {
    const tokens = state.tokens
    const tokensLength = tokens.length
    const nextToken = tokens[n+1]
    if (nextToken?.type !== 'inline') return false

    const content = nextToken?.content
    if (!content) return false
    let startIndex = 0
    const firstCode = content.charCodeAt(0)
    const secondCode = content.charCodeAt(1)
    if ((firstCode === CODE_STAR && secondCode === CODE_STAR) || (firstCode === CODE_UNDERSCORE && secondCode === CODE_UNDERSCORE)) {
      startIndex = 2
    }
    const leadCode = content.charCodeAt(startIndex)
    if (leadCode !== CODE_LEFT_BRACKET && leadCode !== CODE_FULLWIDTH_LEFT_BRACKET) return false

    let matchedSemantic = null
    const cached = matchCache.get(content)
    if (cached !== undefined) {
      if (cached === CACHE_MISS) return false
      matchedSemantic = cached
    } else {
      let sn = 0
      let actualName = null
      const labelLead = content[startIndex + 1]
      const leadKey = labelLead ? labelLead.toLowerCase() : ''
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
        actualName = content.match(semanticsBracketReg[sn])
        if(actualName) break
      }
      if(!actualName) {
        cacheSet(content, CACHE_MISS)
        return false
      }
      matchedSemantic = parseBracketMatchedSemantic(sn, actualName)
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
      actualCont: matchedSemantic.actualCont,
      actualName: matchedSemantic.actualName,
      isBracketFormat: true,
      isStrongBracket: matchedSemantic.isStrongBracket,
      openBracket: matchedSemantic.openBracket,
      closeBracket: matchedSemantic.closeBracket,
    })
    return true
  }

  // Bracket format semantic container setup function
  const setBracketSemanticContainer = (state, _n, hrType, sc, sci, opt) => {
    const tokens = state.tokens
    let nJump = 0
    let rs = sc.range[0]
    let re = sc.range[1]
    const sn = sc.sn
    const sem = semantics[sn]

    // for continued semantic container.
    if(sci > 1) {
      rs += sci - 1
      re += sci - 1
    }
    const { startMap, endMap } = resolveContainerMaps(tokens, rs, re, hrType)
    const nt = tokens[rs+1]
    const ntChildren = nt.children
    const startToken = tokens[rs]
    const defaultHideLabel = !!opt?.scHideSet?.has(sem.name)
    const labelControl = opt?.labelControl ? resolveLabelControl(startToken, nt) : null
    const hideLabel = labelControl ? !!labelControl.hide : defaultHideLabel
    const labelText = labelControl && !labelControl.hide ? labelControl.value : sc.actualName
    const bracketLabelJointMode = opt?.bracketLabelJointMode === BRACKET_LABEL_JOINT_REMOVE
      ? BRACKET_LABEL_JOINT_REMOVE
      : (opt?.bracketLabelJointMode === BRACKET_LABEL_JOINT_AUTO ? BRACKET_LABEL_JOINT_AUTO : BRACKET_LABEL_JOINT_KEEP)
    // Inline child tokens normally do not carry map; paragraph/inline token maps remain the sync anchor.

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
      tokens.splice(re+1, 1, eToken)
      if (!sc.continued) {
        tokens.splice(rs-1, 1)
      }
    } else {
      tokens.splice(re+1, 0, eToken)
    }

    if (labelControl || hideLabel) {
      stripBracketLabelPrefix(nt, ntChildren, sc)
      if (hideLabel) return nJump

      if (bracketLabelJointMode === BRACKET_LABEL_JOINT_KEEP) {
        prependBracketLabelTokens(state, sem, ntChildren, labelText, sc, sc.isStrongBracket, 'ensure')
      } else {
        prependPlainLabelTokens(state, sem, ntChildren, labelText, sc.isStrongBracket, bracketLabelJointMode)
      }
      nJump += 3
      return nJump
    }

    if (bracketLabelJointMode !== BRACKET_LABEL_JOINT_KEEP) {
      stripBracketLabelPrefix(nt, ntChildren, sc)
      prependPlainLabelTokens(state, sem, ntChildren, sc.actualName, sc.isStrongBracket, bracketLabelJointMode)
      nJump += 3
      return nJump
    }

    if (sc.isStrongBracket) {
      const bodyStartIndex = prependBracketLabelTokens(state, sem, ntChildren, sc.actualName, sc, true, 'force')

      for (let i = bodyStartIndex; i < ntChildren.length - 2; i++) {
        if (ntChildren[i] && ntChildren[i].type === 'strong_open'
          && ntChildren[i + 2] && ntChildren[i + 2].type === 'strong_close'
          && ntChildren[i + 1] && ntChildren[i + 1].content) {
          
          const strongContent = ntChildren[i + 1].content
          const originalLabel = sc.openBracket === '['
            ? '[' + sc.actualName + ']'
            : '［' + sc.actualName + '］'
          
          if (strongContent === originalLabel) {
            ntChildren.splice(i, 3)
            if (ntChildren[i] && ntChildren[i].type === 'text' && ntChildren[i-1] && ntChildren[i-1].type === 'text') {
              ntChildren[i-1].content += ntChildren[i].content
              ntChildren.splice(i, 1)
            }
            if (ntChildren[i] && ntChildren[i].type === 'text' && ntChildren[i].content === '') {
              ntChildren.splice(i, 1)
            }
            break
          }
        }
      }

      for (let i = bodyStartIndex; i < ntChildren.length; i++) {
        if (ntChildren[i] && ntChildren[i].type === 'text' && ntChildren[i].content) {
          ntChildren[i].content = trimLeadingAsciiSpaces(ntChildren[i].content)
          break
        }
      }
    } else {
      const bodyStartIndex = prependBracketLabelTokens(state, sem, ntChildren, sc.actualName, sc, false, 'force')

      for (let i = bodyStartIndex; i < ntChildren.length; i++) {
        if (ntChildren[i] && ntChildren[i].type === 'text' && ntChildren[i].content) {
          ntChildren[i].content = removeLiteralPrefix(ntChildren[i].content, sc.actualCont)
          break
        }
      }

      nt.content = removeLiteralPrefix(nt.content, sc.actualCont)

      for (let i = bodyStartIndex; i < ntChildren.length - 2; i++) {
        if (ntChildren[i] && ntChildren[i].type === 'strong_open'
          && ntChildren[i + 2] && ntChildren[i + 2].type === 'strong_close'
          && ntChildren[i + 1] && ntChildren[i + 1].content) {
          
          const strongContent = ntChildren[i + 1].content
          const originalLabel = sc.openBracket === '['
            ? '[' + sc.actualName + ']'
            : '［' + sc.actualName + '］'
          
          if (strongContent === originalLabel) {
            ntChildren.splice(i, 3)
            if (ntChildren[i] && ntChildren[i].type === 'text' && ntChildren[i].content === ' ') {
              if (ntChildren[i - 1] && ntChildren[i - 1].type === 'text' && ntChildren[i - 1].content.endsWith(' ')) {
                ntChildren.splice(i, 1)
              }
            }
            if (ntChildren[i] && ntChildren[i].type === 'text' && ntChildren[i].content === '') {
              ntChildren.splice(i, 1)
            }
            break
          }
        }
      }
    }
    nJump += 3

    return nJump
  }

  return { checkBracketSemanticContainerCore, setBracketSemanticContainer }
}

export { createBracketFormat }
