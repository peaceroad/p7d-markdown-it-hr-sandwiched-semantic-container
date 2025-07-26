import semantics from '../semantics.json' with { type: 'json' }

const semanticsGitHubAlertsReg = semantics.map((sem) => {
  let str = ''
  if (sem.as) {
    const ghPatterns = sem.as.split(',')
    ghPatterns.forEach((x) => {
      str += '|' + x.replace(/\(/g, '(?:').trim()
    })
  }
  const ghPattern = '^(?:\\[!(' + sem.name + str + ')\\]|［[!！](' + sem.name + str + ')］)'
  return new RegExp(ghPattern, 'i')
})

export const checkGitHubAlertsCore = (state, n, hrType, sc, checked) => {
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
  for (let i = paragraphOpenIndex + 1; i < tokensLength; i++) {
    if (tokens[i].type === 'blockquote_close') {
      blockquoteCloseIndex = i
      break
    }
  }

  if (blockquoteCloseIndex === -1) return false

  const semanticType = semanticMatch[1] || semanticMatch[2]
  const isFullWidth = semanticMatch[0].startsWith('［')
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

export const setGitHubAlertsSemanticContainer = (state, n, hrType, sc, sci, opt) => {
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

  const paragraphInlineToken = tokens[paragraphInlineIndex]
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
  tokens[rs] = sToken

  const eToken = new state.Token('html_block', '', 0)
  eToken.content = '</' + sem.tag + '>\n'
  eToken.block = true
  tokens[re] = eToken

  if (paragraphChildren && paragraphChildren.length > 0) {
    const labelParagraphOpen = new state.Token('paragraph_open', 'p', 1)
    const labelParagraphInline = new state.Token('inline', '', 0)
    const labelParagraphClose = new state.Token('paragraph_close', 'p', -1)

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
      cleanedContent = cleanedContent.replace(/^(?:\[![^\]]+\]|［[!！][^\]]*］)[\s\n]*/, '')
      cleanedContent = cleanedContent.replace(/[\s\n]*(?:&gt;\s*|>\s*)/g, ' ')
      cleanedContent = cleanedContent.replace(/\s+/g, ' ')
      cleanedContent = cleanedContent.replace(/\n/g, ' ')
      cleanedContent = cleanedContent.replace(/^\s+/, '')
      cleanedContent = cleanedContent.trim()
      paragraphChildren[0].content = cleanedContent
    }

    for (let i = 1; i < paragraphChildren.length; i++) {
      if (paragraphChildren[i] && paragraphChildren[i].type === 'text' && paragraphChildren[i].content) {
        let content = paragraphChildren[i].content
        content = content.replace(/\n/g, ' ')
        content = content.replace(/\s+/g, ' ')
        content = content.replace(/^\s+/, '')
        content = content.trim()
        paragraphChildren[i].content = content
      }
    }

    if (paragraphInlineToken.content) {
      let finalContent = paragraphInlineToken.content
      finalContent = finalContent.replace(/^(?:\[![^\]]+\]|［[!！][^\]]*］)[\s\n]*/, '')
      finalContent = finalContent.replace(/[\s\n]*(?:&gt;\s*|>\s*)/g, ' ')
      finalContent = finalContent.replace(/\n/g, ' ')
      finalContent = finalContent.replace(/\s+/g, ' ')
      finalContent = finalContent.replace(/^\s+/, '')
      finalContent = finalContent.trim()
      paragraphInlineToken.content = finalContent
    }

    tokens.splice(paragraphOpenIndex, 0, labelParagraphOpen, labelParagraphInline, labelParagraphClose)
    
    paragraphOpenIndex += 3
    paragraphInlineIndex += 3
    paragraphCloseIndex += 3
  }

  return nJump
}

export const githubAlertsBlock = (state, start, end, silent) => {
  let pos, nextLine, oldParent, oldLineMax
  let startLine = start

  if (state.bMarks[start] + state.tShift[start] >= state.eMarks[start]) {
    return false
  }

  if (state.src.charCodeAt(state.bMarks[start] + state.tShift[start]) !== 0x3E) {
    return false
  }

  pos = state.bMarks[start] + state.tShift[start] + 1
  let firstLineContent = state.src.slice(pos, state.eMarks[start])
  
  firstLineContent = firstLineContent.replace(/^\s*>?\s*/, '')
  
  let semanticMatch = null
  let sn = 0
  
  for (sn = 0; sn < semantics.length; sn++) {
    semanticMatch = firstLineContent.match(semanticsGitHubAlertsReg[sn])
    if (semanticMatch) {
      break
    }
  }

  if (!semanticMatch) {
    return false
  }

  if (silent) {
    return true
  }

  const semanticType = semanticMatch[1] || semanticMatch[2]
  const isFullWidth = semanticMatch[0].startsWith('［')
  const openBracket = isFullWidth ? '［' : '['
  const closeBracket = isFullWidth ? '］' : ']'
  const sem = semantics[sn]

  nextLine = start
  
  while (nextLine < end) {
    nextLine++
    if (nextLine >= end) {
      break
    }

    pos = state.bMarks[nextLine] + state.tShift[nextLine]
    
    if (pos < state.eMarks[nextLine] && state.src.charCodeAt(pos) === 0x3E) {
      continue
    }
    
    if (state.isEmpty(nextLine)) {
      continue
    }
    
    break
  }

  oldParent = state.parentType
  oldLineMax = state.lineMax
  state.parentType = 'github_alert'

  let token_o = state.push('html_block', '', 0)
  token_o.content = '<' + sem.tag + ' class="sc-' + sem.name + '"'
  if (sem.attrs && sem.attrs.length > 0) {
    for (const attr of sem.attrs) {
      token_o.content += ' ' + attr[0] + '="' + attr[1] + '"'
    }
  }
  token_o.content += '>\n'
  token_o.block = true
  token_o.map = [start, 0]
  token_o._githubAlert = true

  let labelToken_o = state.push('paragraph_open', 'p', 1)
  labelToken_o.map = [start, start + 1]

  let labelToken_inline = state.push('inline', '', 0)
  labelToken_inline.content = ''
  labelToken_inline.map = [start, start + 1]
  labelToken_inline.children = []

  const strongOpen = new state.Token('strong_open', 'strong', 1)
  strongOpen.attrJoin("class", "sc-" + sem.name + "-label")
  
  const openBracketSpan = new state.Token('span_open', 'span', 1)
  openBracketSpan.attrJoin("class", "sc-" + sem.name + "-label-joint")
  const openBracketContent = new state.Token('text', '', 0)
  openBracketContent.content = openBracket
  const openBracketSpanClose = new state.Token('span_close', 'span', -1)

  const semanticNameContent = new state.Token('text', '', 0)
  semanticNameContent.content = semanticType

  const closeBracketSpan = new state.Token('span_open', 'span', 1)
  closeBracketSpan.attrJoin("class", "sc-" + sem.name + "-label-joint")
  const closeBracketContent = new state.Token('text', '', 0)
  closeBracketContent.content = closeBracket
  const closeBracketSpanClose = new state.Token('span_close', 'span', -1)

  const strongClose = new state.Token('strong_close', 'strong', -1)

  labelToken_inline.children = [
    strongOpen,
    openBracketSpan, openBracketContent, openBracketSpanClose,
    semanticNameContent,
    closeBracketSpan, closeBracketContent, closeBracketSpanClose,
    strongClose
  ]

  let labelToken_c = state.push('paragraph_close', 'p', -1)
  labelToken_c.map = [start, start + 1]

  state.lineMax = nextLine
  
  let contentLines = []
  for (let line = start; line < nextLine; line++) {
    let lineStart = state.bMarks[line] + state.tShift[line]
    let lineEnd = state.eMarks[line]
    let lineContent = state.src.slice(lineStart, lineEnd)
    
    lineContent = lineContent.replace(/^\s*>\s*/, '')
    
    if (line === start) {
      lineContent = lineContent.replace(/^(?:\[![^\]]+\]|［[!！][^\]]*］)\s*/, '')
    }
    
    contentLines.push(lineContent)
  }

  let paragraphs = []
  let currentParagraph = []
  
  for (let i = 0; i < contentLines.length; i++) {
    const line = contentLines[i]
    if (line.trim() === '') {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join('\n').trim())
        currentParagraph = []
      }
    } else {
      currentParagraph.push(line)
    }
  }
  
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join('\n').trim())
  }

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraphContent = paragraphs[i]
    if (paragraphContent.trim()) {
      if (paragraphContent.startsWith('```') && paragraphContent.endsWith('```')) {
        const codeContent = paragraphContent.slice(3, -3).trim()
        let codeToken = state.push('code_block', 'code', 0)
        codeToken.content = '\n' + codeContent + '\n'
        codeToken.map = [start + 1, nextLine]
        codeToken.markup = '```'
      } else {
        let contentToken_o = state.push('paragraph_open', 'p', 1)
        contentToken_o.map = [start + 1, nextLine]

        let contentToken_inline = state.push('inline', '', 0)
        contentToken_inline.content = paragraphContent
        contentToken_inline.map = [start + 1, nextLine]
        contentToken_inline.children = []

        let contentToken_c = state.push('paragraph_close', 'p', -1)
        contentToken_c.map = [start + 1, nextLine]
      }
    }
  }

  let token_c = state.push('html_block', '', 0)
  token_c.content = '</' + sem.tag + '>\n'
  token_c.block = true
  token_c.map = [nextLine, nextLine]

  state.parentType = oldParent
  state.lineMax = oldLineMax
  state.line = nextLine

  return true
}
