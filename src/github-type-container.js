const createGitHubTypeContainer = (semantics) => {
  const semanticsGitHubAlertsReg = semantics.map((sem) => {
    const aliasStr = sem.aliases.length
      ? '|' + sem.aliases.map((x) => x.replace(/\(/g, '(?:').trim()).join('|')
      : ''
    // Supports ASCII [!TYPE] and full-width ［!TYPE］ / ［！TYPE］
    const ghPattern = '^(?:\\[!|［[!！])(' + sem.name + aliasStr + ')(?:\\]|］)'
    return new RegExp(ghPattern, 'i')
  })

  let cachedBlockquoteRule = null

  const getBlockquoteRule = (state) => {
    if (cachedBlockquoteRule !== null) return cachedBlockquoteRule
    const rules = state?.md?.block?.ruler?.__rules__
    if (!Array.isArray(rules)) {
      cachedBlockquoteRule = null
      return null
    }
    const blockquoteRule = rules.find((rule) => rule.name === 'blockquote')
    cachedBlockquoteRule = blockquoteRule?.fn || null
    return cachedBlockquoteRule
  }

  const hasAlertPrefix = (content) => {
    if (!content) return false
    const firstChar = content[0]
    return firstChar === '[' || firstChar === '［'
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
    if (!hasAlertPrefix(paragraphToken.content)) return false

    let sn = 0
    let actualName = null
    let semanticMatch = null

    while (sn < semantics.length) {
      semanticMatch = paragraphToken.content.match(semanticsGitHubAlertsReg[sn])
      if (semanticMatch) {
        actualName = semanticMatch
        break
      }
      sn++
    }

    if (!actualName) return false

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
      actualCont: actualName[0],
      actualContNoStrong: actualName[0],
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
    if (!hasAlertPrefix(firstLineContent)) return false

    let semanticMatch = null
    for (let sn = 0; sn < semantics.length; sn++) {
      semanticMatch = firstLineContent.match(semanticsGitHubAlertsReg[sn])
      if (semanticMatch) break
    }

    if (!semanticMatch) return false
    if (silent) return true

    const blockquoteRule = getBlockquoteRule(state)
    if (!blockquoteRule) return false

    return blockquoteRule(state, start, end, false)
  }

  return { checkGitHubAlertsCore, setGitHubAlertsSemanticContainer, githubAlertsBlock }
}

export { createGitHubTypeContainer }
