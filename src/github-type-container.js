const createGitHubTypeContainer = (semantics) => {
  const MATCH_CACHE_MAX = 128
  const CACHE_MISS = 0
  const CODE_LEFT_BRACKET = 91
  const CODE_BANG = 33
  const CODE_FULLWIDTH_LEFT_BRACKET = 65339
  const CODE_FULLWIDTH_BANG = 65281
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
  const buildSemanticLeadCandidates = () => {
    const byLead = new Map()
    const fallback = []
    for (let sn = 0; sn < semantics.length; sn++) {
      const sem = semantics[sn]
      const keys = new Set()
      const semKey = getLiteralLeadKey(sem.name)
      if (semKey) keys.add(semKey)
      let hasUnknown = false
      for (let i = 0; i < sem.aliases.length; i++) {
        const aliasKey = getLiteralLeadKey(sem.aliases[i])
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
  const { candidatesByLead, fallback } = buildSemanticLeadCandidates()
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

  const findGitHubSemanticMatch = (content) => {
    if (!content || !hasAlertPrefix(content)) return null
    const cached = matchCache.get(content)
    if (cached !== undefined) {
      return cached === CACHE_MISS ? null : cached
    }

    let semanticMatch = null
    const semanticLead = content[2]
    const leadKey = semanticLead ? semanticLead.toLowerCase() : ''
    const candidates = candidatesByLead.get(leadKey) || fallback
    if (candidates.length > 0) {
      for (let ci = 0; ci < candidates.length; ci++) {
        const sn = candidates[ci]
        semanticMatch = content.match(semanticsGitHubAlertsReg[sn])
        if (!semanticMatch) continue
        const result = { sn, semanticMatch }
        cacheSet(content, result)
        return result
      }
    } else {
      for (let sn = 0; sn < semantics.length; sn++) {
        semanticMatch = content.match(semanticsGitHubAlertsReg[sn])
        if (!semanticMatch) continue
        const result = { sn, semanticMatch }
        cacheSet(content, result)
        return result
      }
    }
    cacheSet(content, CACHE_MISS)
    return null
  }

  const hasInlineContent = (inlineToken, children) => {
    if (inlineToken?.content && inlineToken.content.trim()) return true
    if (!children) return false
    for (const child of children) {
      if (!child) continue
      if (child.type === 'text' && child.content && child.content.trim()) return true
      if (child.type === 'code_inline' && child.content && child.content.trim()) return true
      if (child.type === 'html_inline' && child.content && child.content.trim()) return true
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
      if (token.type === 'text' && (!token.content || /^\s*$/.test(token.content))) {
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

  const checkGitHubAlertsCore = (state, n, hrType, sc, checked) => {
    const tokens = state.tokens
    const tokensLength = tokens.length
    const currentToken = tokens[n]

    if (currentToken.type !== 'blockquote_open') return false

    let paragraphOpenIndex = -1
    let paragraphToken = null
    
    for (let i = n + 1; i < tokensLength; i++) {
      if (tokens[i].type === 'paragraph_open') {
        paragraphOpenIndex = i
        paragraphToken = tokens[i + 1]
        break
      }
      if (tokens[i].type === 'blockquote_close') break
    }

    if (!paragraphToken || paragraphToken.type !== 'inline') return false
    const semantic = findGitHubSemanticMatch(paragraphToken.content)
    if (!semantic) return false
    const sn = semantic.sn
    const semanticMatch = semantic.semanticMatch

    let blockquoteCloseIndex = -1
    let depth = 0
    for (let i = n; i < tokensLength; i++) {
      const token = tokens[i]
      if (token.type === 'blockquote_open') {
        depth++
        continue
      }
      if (token.type === 'blockquote_close') {
        depth--
        if (depth === 0) {
          blockquoteCloseIndex = i
          break
        }
      }
    }

    if (blockquoteCloseIndex === -1) return false

    const semanticType = semanticMatch[1]
    const isFullWidth = /［/.test(semanticMatch[0])
    const openBracket = isFullWidth ? '［' : '['
    const closeBracket = isFullWidth ? '］' : ']'

    sc.push({
      range: [n, blockquoteCloseIndex],
      continued: checked,
      sn: sn,
      hrType: hrType,
      actualCont: semanticMatch[0],
      actualContNoStrong: semanticMatch[0],
      actualName: semanticType,
      actualNameJoint: '',
      hasLastJoint: false,
      hasHalfJoint: !isFullWidth,
      isBracketFormat: true,
      isStrongBracket: true,
      openBracket: openBracket,
      closeBracket: closeBracket,
      trailingSpace: isFullWidth ? '' : ' ',
      isGitHubAlert: true
    })

    return true
  }

  const setGitHubAlertsSemanticContainer = (state, n, hrType, sc, sci, opt) => {
    const tokens = state.tokens
    let nJump = 0
    let rs = sc.range[0]
    let re = sc.range[1]
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

    if (paragraphOpenIndex === -1) return nJump
    const startRefToken = tokens[rs]
    let endRefToken = tokens[re]
    if (!endRefToken?.map) {
      for (let i = re - 1; i >= rs; i--) {
        if (tokens[i] && tokens[i].map) {
          endRefToken = tokens[i]
          break
        }
      }
    }

    const paragraphOpenToken = tokens[paragraphOpenIndex]
    const paragraphInlineToken = tokens[paragraphInlineIndex]
    const paragraphCloseToken = tokens[paragraphCloseIndex]
    const paragraphChildren = paragraphInlineToken.children

    const sToken = new state.Token('html_block', '', 0)
    sToken.content = '<' + sem.tag
    sToken.content += ' class="sc-' + sem.name + '"'
    if (sem.attrs.length > 0) {
      for (let ai = 0; ai < sem.attrs.length; ai++) {
        sToken.content += ' ' + sem.attrs[ai][0] + '="' + sem.attrs[ai][1] + '"'
      }
    }
    sToken.content += '>\n'
    sToken.block = true
    if (startRefToken && startRefToken.map) {
      sToken.map = [startRefToken.map[0], startRefToken.map[1]]
    }
    tokens[rs] = sToken

    const eToken = new state.Token('html_block', '', 0)
    eToken.content = '</' + sem.tag + '>\n'
    eToken.block = true
    if (endRefToken && endRefToken.map) {
      eToken.map = [endRefToken.map[0], endRefToken.map[1]]
    }
    tokens[re] = eToken

    for (let i = rs + 1; i < re; i++) {
      const token = tokens[i]
      if (!token) continue
      if (token.type === 'fence' || token.type === 'code_block') {
        if (token.content && !token.content.startsWith('\n')) {
          token.content = '\n' + token.content
        }
      }
    }

    if (paragraphChildren && paragraphChildren.length > 0) {
      const labelParagraphOpen = new state.Token('paragraph_open', 'p', 1)
      const labelParagraphInline = new state.Token('inline', '', 0)
      const labelParagraphClose = new state.Token('paragraph_close', 'p', -1)
      labelParagraphOpen.block = true
      labelParagraphInline.block = true
      labelParagraphClose.block = true
      if (paragraphOpenToken?.map) {
        labelParagraphOpen.map = [paragraphOpenToken.map[0], paragraphOpenToken.map[1]]
      }
      if (paragraphInlineToken?.map) {
        labelParagraphInline.map = [paragraphInlineToken.map[0], paragraphInlineToken.map[1]]
      } else if (paragraphOpenToken?.map) {
        labelParagraphInline.map = [paragraphOpenToken.map[0], paragraphOpenToken.map[1]]
      }
      if (paragraphCloseToken?.map) {
        labelParagraphClose.map = [paragraphCloseToken.map[0], paragraphCloseToken.map[1]]
      } else if (paragraphOpenToken?.map) {
        labelParagraphClose.map = [paragraphOpenToken.map[0], paragraphOpenToken.map[1]]
      }

      const strongOpen = new state.Token('strong_open', 'strong', 1)
      strongOpen.attrJoin("class", "sc-" + sem.name + "-label")

      const openBracketSpan = new state.Token('span_open', 'span', 1)
      openBracketSpan.attrJoin("class", "sc-" + sem.name + "-label-joint")
      const openBracketContent = new state.Token('text', '', 0)
      openBracketContent.content = sc.openBracket
      const openBracketSpanClose = new state.Token('span_close', 'span', -1)

      const semanticNameContent = new state.Token('text', '', 0)
      semanticNameContent.content = sc.actualName

      const closeBracketSpan = new state.Token('span_open', 'span', 1)
      closeBracketSpan.attrJoin("class", "sc-" + sem.name + "-label-joint")
      const closeBracketContent = new state.Token('text', '', 0)
      closeBracketContent.content = sc.closeBracket
      const closeBracketSpanClose = new state.Token('span_close', 'span', -1)

      const strongClose = new state.Token('strong_close', 'strong', -1)

      labelParagraphInline.children = [
        strongOpen,
        openBracketSpan, openBracketContent, openBracketSpanClose,
        semanticNameContent,
        closeBracketSpan, closeBracketContent, closeBracketSpanClose,
        strongClose
      ]
      labelParagraphInline.content = ''

      if (paragraphChildren[0] && paragraphChildren[0].type === 'text') {
        const originalContent = paragraphChildren[0].content
        let cleanedContent = originalContent
        cleanedContent = cleanedContent.replace(/^(?:\[![^\]]+\]|［[!！][^\]]*］)\s*/, '')
        cleanedContent = cleanedContent.replace(/^\s+/, '')
        paragraphChildren[0].content = cleanedContent
      }

      if (paragraphInlineToken.content) {
        let finalContent = paragraphInlineToken.content
        finalContent = finalContent.replace(/^(?:\[![^\]]+\]|［[!！][^\]]*］)\s*/, '')
        finalContent = finalContent.replace(/^\s+/, '')
        paragraphInlineToken.content = finalContent
      }

      trimLeadingBreaks(paragraphChildren)

      const shouldDropOriginalParagraph = !hasInlineContent(paragraphInlineToken, paragraphChildren)

      tokens.splice(paragraphOpenIndex, 0, labelParagraphOpen, labelParagraphInline, labelParagraphClose)

      if (shouldDropOriginalParagraph) {
        tokens.splice(paragraphOpenIndex + 3, 3)
      }
    }

    return nJump
  }

  const githubAlertsBlock = (state, start, end, silent) => {
    if (state.sCount[start] - state.blkIndent >= 4) return false

    const pos = state.bMarks[start] + state.tShift[start]
    if (pos >= state.eMarks[start]) return false

    if (state.src.charCodeAt(pos) !== 0x3E) return false

    let firstLineContent = state.src.slice(pos + 1, state.eMarks[start])
    firstLineContent = firstLineContent.replace(/^\s+/, '')
    if (!findGitHubSemanticMatch(firstLineContent)) return false
    if (silent) return true

    const blockquoteRule = getBlockquoteRule(state)
    if (!blockquoteRule) return false

    return blockquoteRule(state, start, end, false)
  }

  return { checkGitHubAlertsCore, setGitHubAlertsSemanticContainer, githubAlertsBlock }
}

export { createGitHubTypeContainer }
