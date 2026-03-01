import { buildSemanticLeadCandidates } from './semantic-lead.js'
import { resolveLabelControl } from './label-control.js'
import { resolveContainerMaps, createContainerStartToken, createContainerEndToken } from './container-token.js'

const createGitHubTypeContainer = (semantics) => {
  const MATCH_CACHE_MAX = 128
  const CACHE_MISS = 0
  const CODE_TAB = 9
  const CODE_LF = 10
  const CODE_VTAB = 11
  const CODE_FF = 12
  const CODE_CR = 13
  const CODE_SPACE = 32
  const CODE_RIGHT_BRACKET = 93
  const CODE_LEFT_BRACKET = 91
  const CODE_BANG = 33
  const CODE_FULLWIDTH_SPACE = 12288
  const CODE_FULLWIDTH_LEFT_BRACKET = 65339
  const CODE_FULLWIDTH_RIGHT_BRACKET = 65341
  const CODE_FULLWIDTH_BANG = 65281
  const RE_JAPANESE_CHARS = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/
  const INLINE_LABEL_JOINT_NONE = 'none'
  const INLINE_LABEL_JOINT_AUTO = 'auto'
  const isTrimWhitespaceCode = (code) => (
    code === CODE_SPACE
    || code === CODE_TAB
    || code === CODE_LF
    || code === CODE_VTAB
    || code === CODE_FF
    || code === CODE_CR
    || code === CODE_FULLWIDTH_SPACE
  )
  const trimLeadingWhitespace = (value) => {
    if (!value) return value
    let index = 0
    while (index < value.length && isTrimWhitespaceCode(value.charCodeAt(index))) {
      index++
    }
    return index === 0 ? value : value.slice(index)
  }
  const hasNonWhitespace = (value) => {
    if (!value) return false
    for (let i = 0; i < value.length; i++) {
      if (!isTrimWhitespaceCode(value.charCodeAt(i))) return true
    }
    return false
  }
  const normalizeInlineLabelJointMode = (mode) => mode === INLINE_LABEL_JOINT_AUTO ? INLINE_LABEL_JOINT_AUTO : INLINE_LABEL_JOINT_NONE
  const isLikelyJapaneseText = (value) => !!value && RE_JAPANESE_CHARS.test(value)
  const resolveCustomLabelStyle = (labelText, inlineLabelJointMode) => {
    const isJapanese = isLikelyJapaneseText(labelText)
    if (inlineLabelJointMode === INLINE_LABEL_JOINT_AUTO) {
      return isJapanese
        ? { joint: '：', spacer: '' }
        : { joint: '.', spacer: ' ' }
    }
    return { joint: '', spacer: ' ' }
  }
  const stripAlertMarkerPrefix = (value) => {
    if (!value) return value

    const firstCode = value.charCodeAt(0)
    const secondCode = value.charCodeAt(1)
    let closeCode = 0
    let scanFrom = -1

    if (firstCode === CODE_LEFT_BRACKET && secondCode === CODE_BANG) {
      closeCode = CODE_RIGHT_BRACKET
      scanFrom = 2
    } else if (firstCode === CODE_FULLWIDTH_LEFT_BRACKET
      && (secondCode === CODE_BANG || secondCode === CODE_FULLWIDTH_BANG)) {
      closeCode = CODE_FULLWIDTH_RIGHT_BRACKET
      scanFrom = 2
    } else {
      return value
    }

    let closeIndex = -1
    for (let i = scanFrom; i < value.length; i++) {
      if (value.charCodeAt(i) === closeCode) {
        closeIndex = i
        break
      }
    }
    if (closeIndex === -1) return value

    return trimLeadingWhitespace(value.slice(closeIndex + 1))
  }
  const semanticsGitHubAlertsReg = semantics.map((sem) => {
    const aliasStr = sem.aliases.length
      ? '|' + sem.aliases.map((x) => x.replace(/\(/g, '(?:').trim()).join('|')
      : ''
    // Supports ASCII [!TYPE] and full-width ［!TYPE］ / ［！TYPE］
    const ghPattern = '^(?:\\[!|［[!！])(' + sem.name + aliasStr + ')(?:\\]|］)'
    return new RegExp(ghPattern, 'i')
  })

  let cachedBlockquoteRule = null
  let hasResolvedBlockquoteRule = false
  const matchCache = new Map()
  const { candidatesByLead, fallback } = buildSemanticLeadCandidates(semantics)
  const cacheSet = (key, value) => {
    if (matchCache.size >= MATCH_CACHE_MAX) {
      const firstKey = matchCache.keys().next().value
      matchCache.delete(firstKey)
    }
    matchCache.set(key, value)
  }

  const getBlockquoteRule = (state) => {
    if (hasResolvedBlockquoteRule) return cachedBlockquoteRule
    const rules = state?.md?.block?.ruler?.__rules__
    if (!Array.isArray(rules)) {
      hasResolvedBlockquoteRule = true
      cachedBlockquoteRule = null
      return null
    }
    const blockquoteRule = rules.find((rule) => rule?.name === 'blockquote' && typeof rule?.fn === 'function')
    cachedBlockquoteRule = blockquoteRule ? blockquoteRule.fn : null
    hasResolvedBlockquoteRule = true
    return cachedBlockquoteRule
  }

  const hasAlertPrefix = (content) => {
    if (!content) return false
    const firstCode = content.charCodeAt(0)
    const secondCode = content.charCodeAt(1)
    if (firstCode === CODE_LEFT_BRACKET) return secondCode === CODE_BANG
    if (firstCode === CODE_FULLWIDTH_LEFT_BRACKET) {
      return secondCode === CODE_BANG || secondCode === CODE_FULLWIDTH_BANG
    }
    return false
  }
  const parseGitHubSemanticMatch = (sn, semanticMatch) => {
    const isFullWidth = semanticMatch[0].charCodeAt(0) === CODE_FULLWIDTH_LEFT_BRACKET
    return {
      sn,
      actualName: semanticMatch[1],
      openBracket: isFullWidth ? '［' : '[',
      closeBracket: isFullWidth ? '］' : ']',
    }
  }

  const findGitHubSemanticMatch = (content) => {
    if (!content || !hasAlertPrefix(content)) return null
    const cached = matchCache.get(content)
    if (cached !== undefined) {
      return cached === CACHE_MISS ? null : cached
    }

    let semanticMatch = null
    const semanticLead = content[2]
    const leadKey = semanticLead ? semanticLead.toLowerCase() : ''
    let candidates = candidatesByLead.get(leadKey)
    if (!candidates) {
      if (fallback.length === 0) {
        cacheSet(content, CACHE_MISS)
        return null
      }
      candidates = fallback
    }
    for (let ci = 0; ci < candidates.length; ci++) {
      const sn = candidates[ci]
      semanticMatch = content.match(semanticsGitHubAlertsReg[sn])
      if (!semanticMatch) continue
      const result = parseGitHubSemanticMatch(sn, semanticMatch)
      cacheSet(content, result)
      return result
    }
    cacheSet(content, CACHE_MISS)
    return null
  }

  const hasInlineContent = (inlineToken, children) => {
    if (hasNonWhitespace(inlineToken?.content)) return true
    if (!Array.isArray(children) || children.length === 0) return false
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child) continue
      if (child.type === 'text' && hasNonWhitespace(child.content)) return true
      if (child.type === 'code_inline' && hasNonWhitespace(child.content)) return true
      if (child.type === 'html_inline' && hasNonWhitespace(child.content)) return true
      if (child.type === 'image') return true
    }
    return false
  }

  const trimLeadingBreaks = (children) => {
    if (!Array.isArray(children) || children.length === 0) return
    let trimCount = 0
    for (let i = 0; i < children.length; i++) {
      const token = children[i]
      if (!token) {
        trimCount++
        continue
      }
      if (token.type === 'text' && !hasNonWhitespace(token.content)) {
        trimCount++
        continue
      }
      if (token.type === 'softbreak' || token.type === 'hardbreak') {
        trimCount++
        continue
      }
      break
    }
    if (trimCount > 0) {
      children.splice(0, trimCount)
    }
  }
  const cloneMap = (map) => map ? [map[0], map[1]] : null
  const buildGitHubLabelChildren = (state, sem, sc, labelText, labelControl, inlineLabelJointMode) => {
    const strongOpen = new state.Token('strong_open', 'strong', 1)
    strongOpen.attrJoin('class', sem.labelClass)
    const semanticNameContent = new state.Token('text', '', 0)
    semanticNameContent.content = labelText
    const strongClose = new state.Token('strong_close', 'strong', -1)

    if (labelControl) {
      const { joint, spacer } = resolveCustomLabelStyle(labelText, inlineLabelJointMode)
      if (!joint) {
        return { children: [strongOpen, semanticNameContent, strongClose], spacer }
      }
      const jointOpen = new state.Token('span_open', 'span', 1)
      jointOpen.attrJoin('class', sem.labelJointClass)
      const jointContent = new state.Token('text', '', 0)
      jointContent.content = joint
      const jointClose = new state.Token('span_close', 'span', -1)
      return { children: [strongOpen, semanticNameContent, jointOpen, jointContent, jointClose, strongClose], spacer }
    }

    const openBracketSpan = new state.Token('span_open', 'span', 1)
    openBracketSpan.attrJoin('class', sem.labelJointClass)
    const openBracketContent = new state.Token('text', '', 0)
    openBracketContent.content = sc.openBracket
    const openBracketSpanClose = new state.Token('span_close', 'span', -1)

    const closeBracketSpan = new state.Token('span_open', 'span', 1)
    closeBracketSpan.attrJoin('class', sem.labelJointClass)
    const closeBracketContent = new state.Token('text', '', 0)
    closeBracketContent.content = sc.closeBracket
    const closeBracketSpanClose = new state.Token('span_close', 'span', -1)

    return {
      children: [
        strongOpen,
        openBracketSpan, openBracketContent, openBracketSpanClose,
        semanticNameContent,
        closeBracketSpan, closeBracketContent, closeBracketSpanClose,
        strongClose
      ],
      spacer: ' ',
    }
  }
  const prependInlineLabelWithSpacer = (state, children, labelChildren, spacerText) => {
    children.splice(0, 0, ...labelChildren)
    if (!spacerText) return
    const firstContentIndex = labelChildren.length
    if (children.length <= firstContentIndex) return
    const firstContent = children[firstContentIndex]
    if (firstContent?.type === 'text') {
      const code0 = firstContent.content ? firstContent.content.charCodeAt(0) : 0
      if (code0 !== CODE_SPACE && code0 !== CODE_FULLWIDTH_SPACE) {
        firstContent.content = spacerText + firstContent.content
      }
      return
    }
    const spacer = new state.Token('text', '', 0)
    spacer.content = spacerText
    children.splice(firstContentIndex, 0, spacer)
  }
  const findHeadingAfter = (tokens, start, end) => {
    for (let i = start; i <= end - 2; i++) {
      if (tokens[i]?.type !== 'heading_open') continue
      if (tokens[i + 1]?.type !== 'inline') continue
      if (tokens[i + 2]?.type !== 'heading_close') continue
      return {
        openIndex: i,
        inlineIndex: i + 1,
      }
    }
    return null
  }

  const checkGitHubAlertsCore = (state, n, hrType, sc, checked) => {
    const tokens = state.tokens
    const tokensLength = tokens.length
    const currentToken = tokens[n]

    if (currentToken.type !== 'blockquote_open') return false

    // Fast path: marker paragraph is usually the first child block.
    const firstParagraphOpen = tokens[n + 1]
    const firstParagraphInline = tokens[n + 2]
    if (firstParagraphOpen?.type === 'paragraph_open' && firstParagraphInline?.type === 'inline') {
      const semantic = findGitHubSemanticMatch(firstParagraphInline.content)
      if (!semantic) return false

      let depth = 0
      for (let i = n; i < tokensLength; i++) {
        const token = tokens[i]
        if (token.type === 'blockquote_open') {
          depth++
        } else if (token.type === 'blockquote_close') {
          depth--
          if (depth === 0) {
            sc.push({
              range: [n, i],
              sn: semantic.sn,
              actualName: semantic.actualName,
              openBracket: semantic.openBracket,
              closeBracket: semantic.closeBracket,
              isGitHubAlert: true
            })
            return true
          }
        }
      }
      return false
    }

    // Fallback: keep nested-depth-safe scan for uncommon structures.
    let depth = 0
    let semantic = null
    let hasParagraphMarker = false
    for (let i = n; i < tokensLength; i++) {
      const token = tokens[i]
      if (token.type === 'blockquote_open') {
        depth++
        continue
      }
      if (!hasParagraphMarker) {
        if (depth === 1 && token.type === 'paragraph_open') {
          const paragraphToken = tokens[i + 1]
          if (!paragraphToken || paragraphToken.type !== 'inline') return false
          semantic = findGitHubSemanticMatch(paragraphToken.content)
          if (!semantic) return false
          hasParagraphMarker = true
        } else if (token.type === 'blockquote_close') {
          return false
        }
      }
      if (token.type === 'blockquote_close') {
        depth--
        if (depth === 0) {
          if (!semantic) return false
          sc.push({
            range: [n, i],
            sn: semantic.sn,
            actualName: semantic.actualName,
            openBracket: semantic.openBracket,
            closeBracket: semantic.closeBracket,
            isGitHubAlert: true
          })
          return true
        }
      }
    }

    return false
  }

  const setGitHubAlertsSemanticContainer = (state, _n, _hrType, sc, _sci, opt) => {
    const tokens = state.tokens
    const rs = sc.range[0]
    const re = sc.range[1]
    const sn = sc.sn
    const sem = semantics[sn]

    let paragraphOpenIndex = -1
    let paragraphInlineIndex = -1
    let paragraphCloseIndex = -1

    for (let i = rs + 1; i <= re; i++) {
      if (tokens[i].type === 'paragraph_open') {
        paragraphOpenIndex = i
        paragraphInlineIndex = i + 1
        paragraphCloseIndex = i + 2
        break
      }
    }

    if (paragraphOpenIndex === -1) return 0
    const { startMap, endMap } = resolveContainerMaps(tokens, rs, re, null)

    const paragraphOpenToken = tokens[paragraphOpenIndex]
    const paragraphInlineToken = tokens[paragraphInlineIndex]
    const paragraphCloseToken = tokens[paragraphCloseIndex]
    const paragraphChildren = Array.isArray(paragraphInlineToken.children)
      ? paragraphInlineToken.children
      : (paragraphInlineToken.children = [])
    const inlineLabelJointMode = normalizeInlineLabelJointMode(opt?.githubTypeInlineLabelJoint)
    const separateTitleParagraph = !opt?.githubTypeInlineLabel
    const inlineLabelHeadingMixin = !!opt?.githubTypeInlineLabelHeadingMixin

    for (let i = rs + 1; i < re; i++) {
      const token = tokens[i]
      if (!token) continue
      if (token.type === 'fence' || token.type === 'code_block') {
        if (token.content && token.content.charCodeAt(0) !== CODE_LF) {
          token.content = '\n' + token.content
        }
      }
    }

    if (paragraphChildren[0] && paragraphChildren[0].type === 'text') {
      paragraphChildren[0].content = stripAlertMarkerPrefix(paragraphChildren[0].content)
    }

    if (paragraphInlineToken.content) {
      paragraphInlineToken.content = stripAlertMarkerPrefix(paragraphInlineToken.content)
    }

    trimLeadingBreaks(paragraphChildren)

    const shouldDropOriginalParagraph = !hasInlineContent(paragraphInlineToken, paragraphChildren)
    let firstHeading = null
    if (shouldDropOriginalParagraph && (inlineLabelHeadingMixin || opt?.labelControl)) {
      firstHeading = findHeadingAfter(tokens, paragraphCloseIndex + 1, re)
    }
    const useHeadingLabelControl = !!(opt?.labelControl && shouldDropOriginalParagraph && firstHeading)
    const labelControl = !opt?.labelControl
      ? null
      : (useHeadingLabelControl
          ? resolveLabelControl(tokens[firstHeading.openIndex], tokens[firstHeading.inlineIndex])
          : resolveLabelControl(paragraphOpenToken, paragraphInlineToken))
    const hideLabel = !!labelControl?.hide
    const labelText = labelControl && !labelControl.hide ? labelControl.value : sc.actualName
    const sToken = createContainerStartToken(
      state,
      sem,
      labelText,
      hideLabel,
      sc.actualName,
      startMap
    )
    tokens[rs] = sToken
    const eToken = createContainerEndToken(state, sem, endMap)
    tokens[re] = eToken
    let mixedIntoHeading = false

    if (!hideLabel) {
      const labelBuild = buildGitHubLabelChildren(state, sem, sc, labelText, labelControl, inlineLabelJointMode)
      const labelChildren = labelBuild.children
      if (separateTitleParagraph) {
        const openMap = paragraphOpenToken?.map || null
        const inlineMap = paragraphInlineToken?.map || openMap
        const closeMap = paragraphCloseToken?.map || openMap
        const labelParagraphOpen = new state.Token('paragraph_open', 'p', 1)
        const labelParagraphInline = new state.Token('inline', '', 0)
        const labelParagraphClose = new state.Token('paragraph_close', 'p', -1)
        labelParagraphOpen.block = true
        labelParagraphInline.block = true
        labelParagraphClose.block = true
        if (openMap) labelParagraphOpen.map = cloneMap(openMap)
        if (inlineMap) labelParagraphInline.map = cloneMap(inlineMap)
        if (closeMap) labelParagraphClose.map = cloneMap(closeMap)

        labelParagraphInline.children = labelChildren
        labelParagraphInline.content = ''
        tokens.splice(paragraphOpenIndex, 0, labelParagraphOpen, labelParagraphInline, labelParagraphClose)
      } else if (inlineLabelHeadingMixin && shouldDropOriginalParagraph && firstHeading) {
        const headingInlineToken = tokens[firstHeading.inlineIndex]
        const headingChildren = Array.isArray(headingInlineToken.children)
          ? headingInlineToken.children
          : (headingInlineToken.children = [])
        prependInlineLabelWithSpacer(state, headingChildren, labelChildren, labelBuild.spacer)
        mixedIntoHeading = true
      } else {
        prependInlineLabelWithSpacer(state, paragraphChildren, labelChildren, labelBuild.spacer)
      }
    }

    if (shouldDropOriginalParagraph && (hideLabel || separateTitleParagraph || mixedIntoHeading)) {
      const originalParagraphIndex = (separateTitleParagraph && !hideLabel)
        ? paragraphOpenIndex + 3
        : paragraphOpenIndex
      tokens.splice(originalParagraphIndex, 3)
    }

    return 0
  }

  const githubAlertsBlock = (state, start, end, silent) => {
    if (state.sCount[start] - state.blkIndent >= 4) return false

    const pos = state.bMarks[start] + state.tShift[start]
    if (pos >= state.eMarks[start]) return false

    if (state.src.charCodeAt(pos) !== 0x3E) return false

    const firstLineContent = trimLeadingWhitespace(state.src.slice(pos + 1, state.eMarks[start]))
    if (!findGitHubSemanticMatch(firstLineContent)) return false
    if (silent) return true

    const blockquoteRule = getBlockquoteRule(state)
    if (!blockquoteRule) return false

    return blockquoteRule(state, start, end, false)
  }

  return { checkGitHubAlertsCore, setGitHubAlertsSemanticContainer, githubAlertsBlock }
}

export { createGitHubTypeContainer }
