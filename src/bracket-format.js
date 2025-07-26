import semantics from '../semantics.json' with { type: 'json' }

const strongMark = '[*_]{2}'
const sNumber = '(?:[ 　](?:[0-9]{1,6}|[A-Z]{1,2})(?:[.-](?:[0-9]{1,6}|[A-Z]{1,2})){0,6})?'

// Bracket format regex patterns
const semanticsBracketReg = semantics.map((sem) => {
  let str = ''
  if (sem.as) {
    const bkPatterns = sem.as.split(',')
    bkPatterns.forEach((x) => {
      str += '|' + x.replace(/\(/g, '(?:').trim()
    })
  }
  // Match [Semantics] (half-width, space required) or ［Semantics］ (full-width, space optional)
  const bkPattern = '^(?:(' + strongMark + ')?([\\[])((?:' + sem.name + str + ')' + sNumber + ')([\\]])\\1?( +)|(' + strongMark + ')?([［])((?:' + sem.name + str + ')' + sNumber + ')([］])\\6?( *))'
  return new RegExp(bkPattern, 'i')
})

// Bracket format check function
export const checkBracketSemanticContainerCore = (state, n, hrType, sc, checked) => {
  const hrRegex = hrType ? new RegExp('\\' + hrType) : null
  const tokens = state.tokens
  const tokensLength = tokens.length
  const nextToken = tokens[n+1]

  let sn = 0
  let actualName = null

  while (sn < semantics.length) {
    actualName = nextToken.content.match(semanticsBracketReg[sn])
    if(actualName) break
    sn++
  }
  if(!actualName) return false

  // Parse regex match results
  let strongMark, openBracket, semanticName, closeBracket, trailingSpace
  if (actualName[2]) {
    // Half-width bracket match: (strongMark)?([[])(semantics)([])(space)
    strongMark = actualName[1]    // ** or undefined
    openBracket = actualName[2]   // [
    semanticName = actualName[3]  // Note, Warning, etc.
    closeBracket = actualName[4]  // ]
    trailingSpace = actualName[5] // required space
  } else if (actualName[7]) {
    // Full-width bracket match: (strongMark)?([［])(semantics)([］])(space)
    strongMark = actualName[6]    // ** or undefined
    openBracket = actualName[7]   // ［
    semanticName = actualName[8]  // Note, Warning, etc.
    closeBracket = actualName[9]  // ］
    trailingSpace = actualName[10] // optional space
  }

  let en = n
  let hasEndSemanticsHr = false
  let pCloseN = -1
  while (en < tokensLength) {
    const tokenAtEn = tokens[en]
    if (tokenAtEn.type !== 'hr') {
      if (tokenAtEn.type === 'paragraph_close' && pCloseN == -1) {
        pCloseN = en
      }
      en++
      continue
    }

    if (hrRegex && hrRegex.test(tokenAtEn.markup)) {
      hasEndSemanticsHr = true
      break
    }
    en++
  }
  if (hrType !== '' && !hasEndSemanticsHr) return false

  sc.push({
    range: [n, en],
    continued: checked,
    sn: sn,
    hrType: hrType,
    actualCont: actualName[0], // full match
    actualContNoStrong: strongMark ? actualName[0].replace(/\*\*/g, '') : actualName[0], // content without strong marks
    actualName: semanticName,
    actualNameJoint: '', // not used in bracket format
    hasLastJoint: false,
    hasHalfJoint: false,
    isBracketFormat: true,
    isStrongBracket: !!strongMark, // whether it has strong markup
    openBracket: openBracket,
    closeBracket: closeBracket,
    trailingSpace: trailingSpace || ''
  })
  if(hrType === '' && pCloseN !== -1) {
    sc[sc.length - 1].range[1] = pCloseN + 1
  }
  return true
}

// Bracket format semantic container setup function
export const setBracketSemanticContainer = (state, n, hrType, sc, sci, opt) => {
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
  const nt = tokens[rs+1]
  const ntChildren = nt.children

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
  tokens.splice(rs, 0, sToken)

  const eToken = new state.Token('html_block', '', 0)
  eToken.content = '</' + sem.tag + '>\n'
  eToken.block = true

  if(sci !== -1) {
    tokens.splice(re+1, 1, eToken)
    if (!sc.continued) {
      tokens.splice(rs-1, 1)
    }
  } else {
    tokens.splice(re+1, 0, eToken)
  }

  if (sc.isStrongBracket) {
    const lt_strong_open = new state.Token('strong_open', 'strong', 1)
    lt_strong_open.attrJoin("class", "sc-" + sem.name + "-label")

    const lt_open_bracket_span = new state.Token('span_open', 'span', 1)
    lt_open_bracket_span.attrJoin("class", "sc-" + sem.name + "-label-joint")
    const lt_open_bracket_content = new state.Token('text', '', 0)
    lt_open_bracket_content.content = sc.openBracket
    const lt_open_bracket_span_close = new state.Token('span_close', 'span', -1)

    const lt_span_content = new state.Token('text', '', 0)
    lt_span_content.content = sc.actualName

    const lt_close_bracket_span = new state.Token('span_open', 'span', 1)
    lt_close_bracket_span.attrJoin("class", "sc-" + sem.name + "-label-joint")
    const lt_close_bracket_content = new state.Token('text', '', 0)
    lt_close_bracket_content.content = sc.closeBracket
    const lt_close_bracket_span_close = new state.Token('span_close', 'span', -1)

    const lt_strong_close = new state.Token('strong_close', 'strong', -1)

    ntChildren.splice(0, 0, 
      lt_strong_open, 
      lt_open_bracket_span, lt_open_bracket_content, lt_open_bracket_span_close,
      lt_span_content,
      lt_close_bracket_span, lt_close_bracket_content, lt_close_bracket_span_close,
      lt_strong_close
    )

    if (sc.openBracket === '[') {
      const spaceAfterLabel = new state.Token('text', '', 0)
      spaceAfterLabel.content = ' '
      ntChildren.splice(9, 0, spaceAfterLabel)
    }
    
    const labelEndIndex = sc.openBracket === '[' ? 10 : 9
    for (let i = labelEndIndex; i < ntChildren.length; i++) {
      if (ntChildren[i] && ntChildren[i].type === 'text') {
        if (ntChildren[i].content && ntChildren[i].content.trim()) {
          if (sc.openBracket === '[') {
            ntChildren[i].content = ntChildren[i].content.replace(/^ +/, '')
          } else {
            if (sc.isStrongBracket) {
              const strongBracketPattern = new RegExp('^\\*\\*［' + sc.actualName + '］\\*\\* *')
              ntChildren[i].content = ntChildren[i].content.replace(strongBracketPattern, '')
            } else if (sc.trailingSpace && sc.trailingSpace.length > 0) {
              const spacePattern = new RegExp('^' + sc.trailingSpace.replace(/\s/g, '\\s'))
              ntChildren[i].content = ntChildren[i].content.replace(spacePattern, '')
            }
          }
          break
        }
      }
    }

    let foundOriginalStrong = false
    let startIndex = sc.openBracket === '[' ? 10 : 9
    for (let i = startIndex; i < ntChildren.length - 2; i++) {
      if (ntChildren[i] && ntChildren[i].type === 'strong_open'
        && ntChildren[i + 2] && ntChildren[i + 2].type === 'strong_close'
        && ntChildren[i + 1] && ntChildren[i + 1].content) {
        
        const strongContent = ntChildren[i + 1].content
        const originalPattern = sc.openBracket === '[' 
          ? new RegExp('^\\[' + sc.actualName + '\\]$')
          : new RegExp('^［' + sc.actualName + '］$')
        
        if (originalPattern.test(strongContent)) {
          foundOriginalStrong = true

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

    if (sc.openBracket === '[') {
      for (let i = 10; i < ntChildren.length; i++) {
        if (ntChildren[i] && ntChildren[i].type === 'text') {
          if (ntChildren[i].content && ntChildren[i].content.trim()) {
            ntChildren[i].content = ntChildren[i].content.replace(/^ +/, '')
            break
          }
        }
      }
    } else if (sc.openBracket === '［' && sc.isStrongBracket) {
      for (let i = 9; i < ntChildren.length; i++) {
        if (ntChildren[i] && ntChildren[i].type === 'text' && ntChildren[i].content) {
          if (ntChildren[i].content.startsWith(' ')) {
            ntChildren[i].content = ntChildren[i].content.replace(/^ +/, '')
          }
          break
        }
      }
    }
  } else {
    const lt_span_open = new state.Token('span_open', 'span', 1)
    lt_span_open.attrJoin("class", "sc-" + sem.name + "-label")

    const lt_open_bracket_span = new state.Token('span_open', 'span', 1)
    lt_open_bracket_span.attrJoin("class", "sc-" + sem.name + "-label-joint")
    const lt_open_bracket_content = new state.Token('text', '', 0)
    lt_open_bracket_content.content = sc.openBracket
    const lt_open_bracket_span_close = new state.Token('span_close', 'span', -1)

    const lt_span_content = new state.Token('text', '', 0)
    lt_span_content.content = sc.actualName

    const lt_close_bracket_span = new state.Token('span_open', 'span', 1)
    lt_close_bracket_span.attrJoin("class", "sc-" + sem.name + "-label-joint")
    const lt_close_bracket_content = new state.Token('text', '', 0)
    lt_close_bracket_content.content = sc.closeBracket
    const lt_close_bracket_span_close = new state.Token('span_close', 'span', -1)

    const lt_span_close = new state.Token('span_close', 'span', -1)

    ntChildren.splice(0, 0, 
      lt_span_open, 
      lt_open_bracket_span, lt_open_bracket_content, lt_open_bracket_span_close,
      lt_span_content,
      lt_close_bracket_span, lt_close_bracket_content, lt_close_bracket_span_close,
      lt_span_close
    )

    if (sc.openBracket === '[') {
      const spaceAfterLabel = new state.Token('text', '', 0)
      spaceAfterLabel.content = ' '
      ntChildren.splice(9, 0, spaceAfterLabel)
    }

    let startIndex = sc.openBracket === '[' ? 10 : 9
    for (let i = startIndex; i < ntChildren.length; i++) {
      if (ntChildren[i] && ntChildren[i].type === 'text' && ntChildren[i].content) {
        if (sc.openBracket === '[') {
          const bracketPattern = new RegExp('^\\[' + sc.actualName + '\\] +')
          ntChildren[i].content = ntChildren[i].content.replace(bracketPattern, '')
        } else {
          const bracketPattern = new RegExp('^［' + sc.actualName + '］' + (sc.trailingSpace || ''))
          ntChildren[i].content = ntChildren[i].content.replace(bracketPattern, '')
        }
        break
      }
    }

    if (sc.openBracket === '[') {
      nt.content = nt.content.replace(new RegExp('^\\[' + sc.actualName + '\\] +'), '')
    } else {
      nt.content = nt.content.replace(new RegExp('^［' + sc.actualName + '］' + (sc.trailingSpace || '')), '')
    }

    if (!sc.isStrongBracket) {
      let foundOriginalStrong = false
      let startIndex = sc.openBracket === '[' ? 10 : 9
      for (let i = startIndex; i < ntChildren.length - 2; i++) {
        if (ntChildren[i] && ntChildren[i].type === 'strong_open'
          && ntChildren[i + 2] && ntChildren[i + 2].type === 'strong_close'
          && ntChildren[i + 1] && ntChildren[i + 1].content) {
          
          const strongContent = ntChildren[i + 1].content
          const originalPattern = sc.openBracket === '[' 
            ? new RegExp('^\\[' + sc.actualName + '\\]$')
            : new RegExp('^［' + sc.actualName + '］$')
          
          if (originalPattern.test(strongContent)) {
            foundOriginalStrong = true
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
  }
  nJump += 3

  return nJump
}
