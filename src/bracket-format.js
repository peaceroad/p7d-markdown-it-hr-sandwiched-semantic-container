const createBracketFormat = (semantics) => {
  const strongMark = '[*_]{2}'
  const sNumber = '(?:[ 　](?:[0-9]{1,6}|[A-Z]{1,2})(?:[.-](?:[0-9]{1,6}|[A-Z]{1,2})){0,6})?'

  // Bracket format regex patterns
  const semanticsBracketReg = semantics.map((sem) => {
    const aliasStr = sem.aliases.length
      ? '|' + sem.aliases.map((x) => x.replace(/\(/g, '(?:').trim()).join('|')
      : ''
    // Match [Semantics] (half-width, space required) or ［Semantics］ (full-width, space optional)
    const bkPattern = '^(?:(' + strongMark + ')?([\\[])((?:' + sem.name + aliasStr + ')' + sNumber + ')([\\]])\\1?( +)|(' + strongMark + ')?([［])((?:' + sem.name + aliasStr + ')' + sNumber + ')([］])\\6?( *))'
    return new RegExp(bkPattern, 'i')
  })

  // Bracket format check function
  const checkBracketSemanticContainerCore = (state, n, hrType, sc, checked) => {
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
    let strongMarkLocal, openBracket, semanticName, closeBracket, trailingSpace
    if (actualName[2]) {
      // Half-width bracket match: (strongMark)?([[])(semantics)([])(space)
      strongMarkLocal = actualName[1]
      openBracket = actualName[2]
      semanticName = actualName[3]
      closeBracket = actualName[4]
      trailingSpace = actualName[5]
    } else if (actualName[7]) {
      // Full-width bracket match: (strongMark)?([［])(semantics)([］])(space)
      strongMarkLocal = actualName[6]
      openBracket = actualName[7]
      semanticName = actualName[8]
      closeBracket = actualName[9]
      trailingSpace = actualName[10]
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
      sn: sn,
      hrType: hrType,
      actualCont: actualName[0], // full match
      actualContNoStrong: strongMarkLocal ? actualName[0].replace(/\*\*/g, '') : actualName[0],
      actualName: semanticName,
      actualNameJoint: '',
      hasLastJoint: false,
      hasHalfJoint: false,
      isBracketFormat: true,
      isStrongBracket: !!strongMarkLocal,
      openBracket: openBracket,
      closeBracket: closeBracket,
      trailingSpace: trailingSpace || ''
    })
    return true
  }

  // Bracket format semantic container setup function
  const setBracketSemanticContainer = (state, n, hrType, sc, sci, opt) => {
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
    const startRefToken = (hrType && tokens[rs - 1] && tokens[rs - 1].type === 'hr')
      ? tokens[rs - 1]
      : tokens[rs]
    let endRefToken = null
    if (hrType && tokens[re] && tokens[re].type === 'hr') {
      endRefToken = tokens[re]
    } else {
      for (let i = re - 1; i >= rs; i--) {
        if (tokens[i] && tokens[i].map) {
          endRefToken = tokens[i]
          break
        }
      }
      if (!endRefToken && tokens[rs] && tokens[rs].map) {
        endRefToken = tokens[rs]
      }
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
    if (startRefToken && startRefToken.map) {
      sToken.map = [startRefToken.map[0], startRefToken.map[1]]
    }
    tokens.splice(rs, 0, sToken)

    const eToken = new state.Token('html_block', '', 0)
    eToken.content = '</' + sem.tag + '>\n'
    eToken.block = true
    if (endRefToken && endRefToken.map) {
      eToken.map = [endRefToken.map[0], endRefToken.map[1]]
    }

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
                const spacePattern = new RegExp('^' + sc.trailingSpace.replace(/\\s/g, '\\\\s'))
                ntChildren[i].content = ntChildren[i].content.replace(spacePattern, '')
              }
            }
            break
          }
        }
      }

      for (let i = (sc.openBracket === '[' ? 10 : 9); i < ntChildren.length - 2; i++) {
        if (ntChildren[i] && ntChildren[i].type === 'strong_open'
          && ntChildren[i + 2] && ntChildren[i + 2].type === 'strong_close'
          && ntChildren[i + 1] && ntChildren[i + 1].content) {
          
          const strongContent = ntChildren[i + 1].content
          const originalPattern = sc.openBracket === '[' 
            ? new RegExp('^\\[' + sc.actualName + '\\]$')
            : new RegExp('^［' + sc.actualName + '］$')
          
          if (originalPattern.test(strongContent)) {
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

      for (let i = (sc.openBracket === '[' ? 10 : 9); i < ntChildren.length; i++) {
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
