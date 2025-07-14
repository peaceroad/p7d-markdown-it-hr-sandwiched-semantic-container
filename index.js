import semantics from './semantics.json' with { type: 'json' }

const semanticsHalfJoint = '[:.]'
const semanticsFullJoint = '[　：。．]'
const sNumber = '(?:[ 　](?:[0-9]{1,6}|[A-Z]{1,2})(?:[.-](?:[0-9]{1,6}|[A-Z]{1,2})){0,6})?'
const strongMark = '[*_]{2}'

const semanticsReg = semantics.map((sem) => {
  let str = ''
  if (sem.as) {
    const patterns = sem.as.split(',')
    patterns.forEach((x) => {
      str += '|' + x.replace(/\(/g, '(?:').trim()
    })
  }
  const pattern =
    '^(' + strongMark + ')?((?:' + sem.name + str + ')' + sNumber + ')'
    + '(?:'
    + '(' + semanticsHalfJoint + ') *?\\1(?: |$)'
    + '| *?\\1 *?(' + semanticsHalfJoint + ') '
    + '|(' + semanticsFullJoint + ') *?\\1'
    + '| *?\\1 *?(' + semanticsFullJoint + ')'
    + ' *?)'
  return new RegExp(pattern, 'i')
})

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

const checkSematicContainerCore = (state, n, hrType, sc, checked) => {
  const hrRegex = hrType ? new RegExp('\\' + hrType) : null
  const tokens = state.tokens
  const tokensLength = tokens.length
  const nextToken = tokens[n+1]

  let sn = 0
  let actualName = null

  while (sn < semantics.length) {
    actualName = nextToken.content.match(semanticsReg[sn])
    if(actualName) break
    sn++
  }
  if(!actualName) return false

  let actualNameJoint = ''
  let hasLastJoint = false
  let hasHalfJoint = false

  if (actualName[3]) {
    hasHalfJoint = true
    actualNameJoint = actualName[3]
  } else if (actualName[4]) {
    hasHalfJoint = true
    hasLastJoint = true
    actualNameJoint = actualName[4]
  } else if (actualName[5]) {
    actualNameJoint = actualName[5]
  } else if (actualName[6]) {
    hasLastJoint = true
    actualNameJoint = actualName[6]
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
    actualCont: actualName[0],
    actualContNoStrong: actualName[0].replace(/[*_]{2}/g, ''),
    actualName: actualName[2],
    actualNameJoint: actualNameJoint,
    hasLastJoint: hasLastJoint,
    hasHalfJoint: hasHalfJoint,
  })
  if(hrType === '' && pCloseN !== -1) {
    sc[sc.length - 1].range[1] = pCloseN + 1
  }
  return true
}

// Bracket format check function
const checkBracketSemanticContainerCore = (state, n, hrType, sc, checked) => {
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

const checkSemanticContainer = (state, n, hrType, sc, allowBracketJoint) => {
  let continued = 0
  let checkFunc = allowBracketJoint ? checkBracketSemanticContainerCore : checkSematicContainerCore
  
  if (!checkFunc(state, n, hrType, sc, continued)) {
    return false
  }
  let cn = sc[sc.length - 1].range[1] + 1
  while (cn < state.tokens.length -1) {
    continued = true
    if (!checkFunc(state, cn, hrType, sc, continued)) {
      return true
    }
    cn = sc[sc.length - 1].range[1] + 1
    continued++
  }
  return true
}

const setSemanticContainer = (state, n, hrType, sc, sci , opt) => {
  const tokens = state.tokens
  let nJump = 0
  let moveToAriaLabel = false
  let rs = sc.range[0]
  let re = sc.range[1]
  const sn = sc.sn
  const sem = semantics[sn]

  // Handle bracket format processing
  if (sc.isBracketFormat) {
    return setBracketSemanticContainer(state, n, hrType, sc, sci, opt)
  }

  // Pre-compile all regex patterns to avoid multiple creations
  const regActualContNoStrong = new RegExp('^' + sc.actualContNoStrong)
  const regActualContNoStrongSpace = new RegExp('^' + sc.actualContNoStrong + ' *')
  const regActualContAsterisk = new RegExp('^' + sc.actualCont.replace(/\*/g, '\\*'))
  const regLeadSpace = /^ */
  const regStrongLabel = new RegExp('^' + sc.actualName + '(' + semanticsHalfJoint + '|' + semanticsFullJoint + ')?( *)$')
  const regStrongPattern = new RegExp('\\*\\* *?' + sc.actualName + '(' + semanticsHalfJoint + '|' + semanticsFullJoint + ')? *\\*\\* *')
  const regJointRemoval = new RegExp('^\\' + sc.actualNameJoint)

  // for continued semantic container.
  if(sci > 1) {
    let s = 1
    while (s < sci) {
      rs++
      re++
      s++
    }
  }
  const nt = tokens[rs+1]
  const ntChildren = nt.children

  const sToken = new state.Token('html_block', '', 0)
  sToken.content = '<' + sem.tag
  sToken.content += ' class="sc-' + sem.name + '"'
  if (sem.attrs.length > 0) {
    let ai = 0
    while (ai < sem.attrs.length) {
      if(!moveToAriaLabel) {
        moveToAriaLabel = sem.attrs[ai][0] === "aria-label"
        if(moveToAriaLabel) {
          sem.attrs[ai][1] = sc.actualName
        }
      }
      sToken.content += ' ' + sem.attrs[ai][0] + '="' + sem.attrs[ai][1] + '"'
      ai++
    }
  }
  sToken.content += '>\n'
  sToken.block = true
  tokens.splice(rs, 0, sToken)

  const eToken = new state.Token('html_block', '', 0)
  eToken.content = '</' + sem.tag + '>\n'
  eToken.block = true

  if(sci !== -1) {
    tokens.splice(re+1, 1, eToken); // ending hr delete too.
    if (!sc.continued) {
      tokens.splice(rs-1, 1)// starting hr delete.
    }
  } else {
    tokens.splice(re+1, 0, eToken)
  }

  if(moveToAriaLabel) {
    nt.content = nt.content.replace(regActualContNoStrong, '')
    const firstChild = ntChildren?.[0]
    if (firstChild?.content) {
      firstChild.content = firstChild.content.replace(regActualContNoStrongSpace, '')
    }
    nt.content = nt.content.replace(regLeadSpace, '')
    return nJump
  }

  if (/^#+/.test(nt.content)) {
    nJump += 2
  }
  if (/^[*_]{2}/.test(nt.content) ) {
    // Check if the first strong element contains the semantic label
    let foundLabelStrong = false
    let labelStrongIndex = -1
    
    // Look for the first strong element that matches the semantic label
    // Also collect information about subsequent text nodes in the same loop
    for (let i = 0; i < ntChildren.length - 2; i++) {
      if (ntChildren[i] && ntChildren[i].type === 'strong_open'
        && ntChildren[i + 2] && ntChildren[i + 2].type === 'strong_close'
        && ntChildren[i + 1] && ntChildren[i + 1].content) {
        
        const strongContent = ntChildren[i + 1].content
        const hasStrongJa = strongContent.match(regStrongLabel)
        
        if (hasStrongJa) {
          foundLabelStrong = true
          labelStrongIndex = i
          
          // Pre-calculate text node index after strong close for efficiency
          let textAfterStrongIndex = -1
          for (let j = i + 3; j < ntChildren.length; j++) {
            if (ntChildren[j] && ntChildren[j].type === 'text') {
              textAfterStrongIndex = j
              break
            }
          }
          
          // Add the semantic label class to this strong element
          ntChildren[i].attrJoin('class', 'sc-' + sem.name + '-label')
          
          // Create joint span inside the strong element
          const jointSpan = new state.Token('span_open', 'span', 1)
          jointSpan.attrJoin('class', 'sc-' + sem.name + '-label-joint')
          const jointContent = new state.Token('text', '', 0)
          jointContent.content = sc.actualNameJoint
          const jointSpanClose = new state.Token('span_close', 'span', -1)
          
          // Remove joint from the strong content and add joint span
          if (hasStrongJa[1]) {
            // Joint is inside the strong content
            const trailingSpaces = hasStrongJa[2] || ''
            ntChildren[i + 1].content = sc.actualName // Only keep the semantic name
            // Insert joint span after the text content
            ntChildren.splice(i + 2, 0, jointSpan, jointContent, jointSpanClose)
            
            // Handle spaces after strong element based on trailing spaces from original content
            if (textAfterStrongIndex !== -1) {
              // Adjust index after insertion of joint span (adds 3 elements)
              const adjustedTextIndex = textAfterStrongIndex + 3
              if (trailingSpaces) {
                // There were trailing spaces in the strong content, ensure single space after strong element
                if (ntChildren[adjustedTextIndex].content === '') {
                  // If the text node is empty, set it to a single space
                  ntChildren[adjustedTextIndex].content = ' '
                } else {
                  // If the text node has content, ensure it starts with a single space
                  ntChildren[adjustedTextIndex].content = ' ' + ntChildren[adjustedTextIndex].content.replace(/^ +/, '')
                }
              } else {
                // No trailing spaces in original strong content, keep text node as-is
                // (this preserves existing behavior for cases without spaces in strong)
              }
            }
          } else if (sc.hasLastJoint) {
            // Joint is after the strong element, move it inside
            if (ntChildren[i + 3] && ntChildren[i + 3].content) {
              ntChildren[i + 3].content = ntChildren[i + 3].content.replace(regJointRemoval, '')
            }
            // Insert joint span after the text content
            ntChildren.splice(i + 2, 0, jointSpan, jointContent, jointSpanClose)
          }
          break
        }
      }
    }
    
    if (!foundLabelStrong) {
      // No existing strong element contains the label, create a new one
      const strongBefore = new state.Token('text', '', 0)
      const strongOpen = new state.Token('strong_open', 'strong', 1)
      const strongContent = new state.Token('text', '', 0)
      strongContent.content = sc.actualName
      const jointSpan = new state.Token('span_open', 'span', 1)
      jointSpan.attrJoin('class', 'sc-' + sem.name + '-label-joint')
      const jointContent = new state.Token('text', '', 0)
      jointContent.content = sc.actualNameJoint
      const jointSpanClose = new state.Token('span_close', 'span', -1)
      const strongClose = new state.Token('strong_close', 'strong', -1)
      strongOpen.attrJoin('class', 'sc-' + sem.name + '-label')

      const firstChild = ntChildren?.[0]
      if (firstChild?.content) {
        // Extract spaces from the original content
        const originalContent = firstChild.content
        const match = originalContent.match(regStrongPattern)
        
        // Remove the strong pattern and preserve trailing spaces
        if (match && match[0]) {
          // Check if there are spaces after the strong pattern
          const trailingSpaces = match[0].match(/ +$/);
          const replacement = trailingSpaces ? trailingSpaces[0] : '';
          firstChild.content = firstChild.content.replace(regStrongPattern, replacement)
        }
        firstChild.content = firstChild.content.replace(regActualContAsterisk, '')
      }
      nt.content = nt.content.replace(regActualContAsterisk, '')

      ntChildren.splice(0, 0, strongBefore, strongOpen, strongContent, jointSpan, jointContent, jointSpanClose, strongClose)
    }
    nJump += 3
  } else {
    const lt_first = new state.Token('text', '', 0)
    const lt_span_open = new state.Token('span_open', 'span', 1)
    lt_span_open.attrJoin("class", "sc-" + sem.name + "-label")
    const lt_span_content = new state.Token('text', '', 0)
    lt_span_content.content = sc.actualName
    const lt_joint_span_open = new state.Token('span_open', 'span', 1)
    lt_joint_span_open.attrJoin("class", "sc-" + sem.name + "-label-joint")
    const lt_joint_content = new state.Token('text', '', 0)
    lt_joint_content.content = sc.actualNameJoint
    const lt_joint_span_close = new state.Token('span_close', 'span', -1)
    const lt_span_close = new state.Token('span_close', 'span', -1)

    const firstChild = ntChildren?.[0]
    if (sc.hasHalfJoint && firstChild?.content) {
      firstChild.content = ' ' + firstChild.content.replace(regActualContNoStrong, '')
    } else if (firstChild?.content) {
      firstChild.content = firstChild.content.replace(regActualContNoStrong, '')
    }

    ntChildren.splice(0, 0, lt_first, lt_span_open, lt_span_content, lt_joint_span_open, lt_joint_content, lt_joint_span_close, lt_span_close)
    nJump += 3
  }

  // Handle removeJointAtLineEnd option
  if (opt.removeJointAtLineEnd) {
    let jointIsAtLineEnd = false
    if (ntChildren && ntChildren.length > 0) {
      const lastToken = ntChildren[ntChildren.length - 1]
      if (lastToken.type === 'text' && /^ *$/.test(lastToken.content)) {
        jointIsAtLineEnd = true
        lastToken.content = ''
      } else if (lastToken.type === 'strong_close') {
        jointIsAtLineEnd = true
      } else if (lastToken.type === 'span_close') {
        jointIsAtLineEnd = true
      }
    }

    if (jointIsAtLineEnd) {
      // Remove joint span from strong or span elements
      for (let i = 0; i < ntChildren.length - 2; i++) {
        if (ntChildren[i] && ntChildren[i].attrGet && ntChildren[i].attrGet('class') && 
            ntChildren[i].attrGet('class').includes('-label-joint')) {
          ntChildren.splice(i, 3) // Remove joint span open, content, and close
          break
        }
      }
    }
  }

  return nJump
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
    let s = 1
    while (s < sci) {
      rs++
      re++
      s++
    }
  }
  const nt = tokens[rs+1]
  const ntChildren = nt.children

  const sToken = new state.Token('html_block', '', 0)
  sToken.content = '<' + sem.tag
  sToken.content += ' class="sc-' + sem.name + '"'
  if (sem.attrs.length > 0) {
    let ai = 0
    while (ai < sem.attrs.length) {
      sToken.content += ' ' + sem.attrs[ai][0] + '="' + sem.attrs[ai][1] + '"'
      ai++
    }
  }
  sToken.content += '>\n'
  sToken.block = true
  tokens.splice(rs, 0, sToken)

  const eToken = new state.Token('html_block', '', 0)
  eToken.content = '</' + sem.tag + '>\n'
  eToken.block = true

  if(sci !== -1) {
    tokens.splice(re+1, 1, eToken); // ending hr delete too.
    if (!sc.continued) {
      tokens.splice(rs-1, 1)// starting hr delete.
    }
  } else {
    tokens.splice(re+1, 0, eToken)
  }

  // Bracket format label processing
  if (sc.isStrongBracket) {
    // Strong markup case: **[Warning]** -> <strong class="sc-warning-label">...</strong>
    const lt_strong_open = new state.Token('strong_open', 'strong', 1)
    lt_strong_open.attrJoin("class", "sc-" + sem.name + "-label")

    // Opening bracket span
    const lt_open_bracket_span = new state.Token('span_open', 'span', 1)
    lt_open_bracket_span.attrJoin("class", "sc-" + sem.name + "-label-joint")
    const lt_open_bracket_content = new state.Token('text', '', 0)
    lt_open_bracket_content.content = sc.openBracket
    const lt_open_bracket_span_close = new state.Token('span_close', 'span', -1)

    // Semantic name
    const lt_span_content = new state.Token('text', '', 0)
    lt_span_content.content = sc.actualName

    // Closing bracket span
    const lt_close_bracket_span = new state.Token('span_open', 'span', 1)
    lt_close_bracket_span.attrJoin("class", "sc-" + sem.name + "-label-joint")
    const lt_close_bracket_content = new state.Token('text', '', 0)
    lt_close_bracket_content.content = sc.closeBracket
    const lt_close_bracket_span_close = new state.Token('span_close', 'span', -1)

    const lt_strong_close = new state.Token('strong_close', 'strong', -1)

    // Insert label elements
    ntChildren.splice(0, 0, 
      lt_strong_open, 
      lt_open_bracket_span, lt_open_bracket_content, lt_open_bracket_span_close,
      lt_span_content,
      lt_close_bracket_span, lt_close_bracket_content, lt_close_bracket_span_close,
      lt_strong_close
    )

    // Add space after half-width brackets, no space after full-width brackets
    if (sc.openBracket === '[') {
      const spaceAfterLabel = new state.Token('text', '', 0)
      spaceAfterLabel.content = ' '
      ntChildren.splice(9, 0, spaceAfterLabel) // Insert after complete strong label
    }

    // Post-label insertion cleanup: remove spaces from text tokens immediately after label
    let labelEndIndex = sc.openBracket === '[' ? 9 : 9;
    if (sc.openBracket === '[') {
      labelEndIndex = 10; // +1 for space token in half-width case
    }
    for (let i = labelEndIndex; i < ntChildren.length; i++) {
      if (ntChildren[i] && ntChildren[i].type === 'text') {
        if (ntChildren[i].content && ntChildren[i].content.trim()) {
          if (sc.openBracket === '[') {
            // Half-width bracket: remove leading spaces (space is required, so at least one must be removed)
            ntChildren[i].content = ntChildren[i].content.replace(/^ +/, '')
          } else {
            // Full-width bracket: for strong tags, remove **［semantics］** pattern
            if (sc.isStrongBracket) {
              const strongBracketPattern = new RegExp('^\\*\\*［' + sc.actualName + '］\\*\\* *')
              ntChildren[i].content = ntChildren[i].content.replace(strongBracketPattern, '')
            } else if (sc.trailingSpace && sc.trailingSpace.length > 0) {
              const spacePattern = new RegExp('^' + sc.trailingSpace.replace(/\s/g, '\\s'))
              ntChildren[i].content = ntChildren[i].content.replace(spacePattern, '')
            }
          }
          break // Only process first non-empty text token
        }
      }
    }

    // For strong bracket format, remove original **[Semantics]** strong tags (remove first, then handle spaces)
    let foundOriginalStrong = false
    let startIndex = sc.openBracket === '[' ? 10 : 9; // +1 for space token in half-width case
    for (let i = startIndex; i < ntChildren.length - 2; i++) {
      if (ntChildren[i] && ntChildren[i].type === 'strong_open'
        && ntChildren[i + 2] && ntChildren[i + 2].type === 'strong_close'
        && ntChildren[i + 1] && ntChildren[i + 1].content) {
        
        const strongContent = ntChildren[i + 1].content
        // Check if matches original bracket format
        const originalPattern = sc.openBracket === '[' 
          ? new RegExp('^\\[' + sc.actualName + '\\]$')
          : new RegExp('^［' + sc.actualName + '］$')
        
        if (originalPattern.test(strongContent)) {
          foundOriginalStrong = true

          // Remove original strong tag (3 tokens)
          ntChildren.splice(i, 3)
          // Post-removal space adjustment - merge excess spaces
          if (ntChildren[i] && ntChildren[i].type === 'text' && ntChildren[i-1] && ntChildren[i-1].type === 'text') {
            // Merge adjacent text tokens
            ntChildren[i-1].content += ntChildren[i].content
            ntChildren.splice(i, 1)
          }
          // Remove empty text tokens at removal position
          if (ntChildren[i] && ntChildren[i].type === 'text' && ntChildren[i].content === '') {
            ntChildren.splice(i, 1)
          }
          break
        }
      }
    }

    // After removing original strong tags, re-run space removal for half-width brackets only
    if (sc.openBracket === '[') {
      for (let i = 10; i < ntChildren.length; i++) {
        if (ntChildren[i] && ntChildren[i].type === 'text') {
          if (ntChildren[i].content && ntChildren[i].content.trim()) {
            // Half-width bracket: remove leading spaces (space is required, so at least one must be removed)
            ntChildren[i].content = ntChildren[i].content.replace(/^ +/, '')
            break // Only process first non-empty text token
          }
        }
      }
    } else if (sc.openBracket === '［' && sc.isStrongBracket) {
      // For full-width bracket strong format, remove remaining spaces after original strong tag removal
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
    // Regular span case
    const lt_span_open = new state.Token('span_open', 'span', 1)
    lt_span_open.attrJoin("class", "sc-" + sem.name + "-label")

    // Opening bracket span
    const lt_open_bracket_span = new state.Token('span_open', 'span', 1)
    lt_open_bracket_span.attrJoin("class", "sc-" + sem.name + "-label-joint")
    const lt_open_bracket_content = new state.Token('text', '', 0)
    lt_open_bracket_content.content = sc.openBracket
    const lt_open_bracket_span_close = new state.Token('span_close', 'span', -1)

    // Semantic name
    const lt_span_content = new state.Token('text', '', 0)
    lt_span_content.content = sc.actualName

    // Closing bracket span
    const lt_close_bracket_span = new state.Token('span_open', 'span', 1)
    lt_close_bracket_span.attrJoin("class", "sc-" + sem.name + "-label-joint")
    const lt_close_bracket_content = new state.Token('text', '', 0)
    lt_close_bracket_content.content = sc.closeBracket
    const lt_close_bracket_span_close = new state.Token('span_close', 'span', -1)

    const lt_span_close = new state.Token('span_close', 'span', -1)

    // Insert label elements
    ntChildren.splice(0, 0, 
      lt_span_open, 
      lt_open_bracket_span, lt_open_bracket_content, lt_open_bracket_span_close,
      lt_span_content,
      lt_close_bracket_span, lt_close_bracket_content, lt_close_bracket_span_close,
      lt_span_close
    )

    // Add space after half-width brackets, no space after full-width brackets
    if (sc.openBracket === '[') {
      const spaceAfterLabel = new state.Token('text', '', 0)
      spaceAfterLabel.content = ' '
      ntChildren.splice(9, 0, spaceAfterLabel) // Insert after complete label
    }

    // For regular span bracket format: remove original bracket format from text after label insertion
    // 9 tokens added by label insertion, so search from 10th token onwards (including space token)
    let startIndex = sc.openBracket === '[' ? 10 : 9; // +1 for space token in half-width case
    for (let i = startIndex; i < ntChildren.length; i++) {
      if (ntChildren[i] && ntChildren[i].type === 'text' && ntChildren[i].content) {
        if (sc.openBracket === '[') {
          // [Semantics] + space removal (space is required, so at least one must be removed)
          const bracketPattern = new RegExp('^\\[' + sc.actualName + '\\] +')
          ntChildren[i].content = ntChildren[i].content.replace(bracketPattern, '')
        } else {
          // ［Semantics］ + actual space removal
          const bracketPattern = new RegExp('^［' + sc.actualName + '］' + (sc.trailingSpace || ''))
          ntChildren[i].content = ntChildren[i].content.replace(bracketPattern, '')
        }
        break // Only process first text token found
      }
    }

    // Also remove from nt.content
    if (sc.openBracket === '[') {
      nt.content = nt.content.replace(new RegExp('^\\[' + sc.actualName + '\\] +'), '')
    } else {
      nt.content = nt.content.replace(new RegExp('^［' + sc.actualName + '］' + (sc.trailingSpace || '')), '')
    }

    // For regular span bracket format, also remove original strong tags if present
    if (!sc.isStrongBracket) {
      let foundOriginalStrong = false
      let startIndex = sc.openBracket === '[' ? 10 : 9; // +1 for space token in half-width case
      for (let i = startIndex; i < ntChildren.length - 2; i++) {
        if (ntChildren[i] && ntChildren[i].type === 'strong_open'
          && ntChildren[i + 2] && ntChildren[i + 2].type === 'strong_close'
          && ntChildren[i + 1] && ntChildren[i + 1].content) {
          
          const strongContent = ntChildren[i + 1].content
          // Check if matches original bracket format
          const originalPattern = sc.openBracket === '[' 
            ? new RegExp('^\\[' + sc.actualName + '\\]$')
            : new RegExp('^［' + sc.actualName + '］$')
          
          if (originalPattern.test(strongContent)) {
            foundOriginalStrong = true
            // Remove original strong tag (3 tokens)
            ntChildren.splice(i, 3)
            // Post-removal space adjustment
            if (ntChildren[i] && ntChildren[i].type === 'text' && ntChildren[i].content === ' ') {
              // Remove duplicate if previous token also ends with space
              if (ntChildren[i - 1] && ntChildren[i - 1].type === 'text' && ntChildren[i - 1].content.endsWith(' ')) {
                ntChildren.splice(i, 1)
              }
            }
            // Also remove empty text tokens at removal position
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

const semanticContainerCore = (state, n, cn, opt) => {
  const tokens = state.tokens
  let sc = []
  let sci = 0
  let hrType = ''
  let alreadyChecked = false
  let nJumps = []

  const prevToken = tokens[n-1]
  const token = tokens[n]

  if (n === 0 || n === tokens.length -1) {
    if (!opt.requireHrAtOneParagraph && token.type === 'paragraph_open') {
      let checkFunc = opt.allowBracketJoint ? checkBracketSemanticContainerCore : checkSematicContainerCore
      if(checkFunc(state, n, hrType, sc, false)) {
        nJumps.push(setSemanticContainer(state, n, hrType, sc[0], -1, opt))
        return n += nJumps[0]
      }
    }
    n++
    return n
  }
  if (prevToken.type !== 'hr') {
    if (!opt.requireHrAtOneParagraph && token.type === 'paragraph_open') {
      cn.forEach(cni => {
        if (n === cni + 1) { alreadyChecked = true; }
      })
      if (alreadyChecked) {
        n++; return n
      }

      if (tokens[n - 1].type === 'list_item_open') {
        n++; return n
      }

      let checkFunc = opt.allowBracketJoint ? checkBracketSemanticContainerCore : checkSematicContainerCore
      if(checkFunc(state, n, hrType, sc, false)) {
        nJumps.push(setSemanticContainer(state, n, hrType, sc[0], -1, opt))
        n += nJumps[0]
        return n
      }
    }
    n++
    return n
  }

  if(/\*/.test(prevToken.markup)) hrType = '*'
  if(/-/.test(prevToken.markup)) hrType = '-'
  if(/_/.test(prevToken.markup)) hrType = '_'

  if (!checkSemanticContainer(state, n, hrType, sc, opt.allowBracketJoint)) {
    n++
    return n
  }

  sci = 0
  while (sci < sc.length) {
    nJumps.push(setSemanticContainer(state, n, hrType, sc[sci], sci, opt))
    cn.push(sc[sci].range[1] + sci + 1)
    sci++
  }
  n += nJumps[0]
  return n
}

const semanticContainer = (state, opt) => {
  const tokens = state.tokens
  let n = 0
  let cn = []
  let tokensLength = tokens.length
  while (n < tokensLength) {
    n = semanticContainerCore(state, n, cn, opt)
    tokensLength = tokens.length
  }
  return true
}

const mditSemanticContainer = (md, option) => {
  let opt = {
    requireHrAtOneParagraph: false,
    removeJointAtLineEnd: false,
    allowBracketJoint: false,
  }
  if (option) Object.assign(opt, option)

  // Run after 'text_join' to prevent conflicts with @peaceroad/markdown-it-footnote-here.
  // FootnoteHere's anchor processing uses 'inline' phase to record footnote positions.
  // If SemanticContainer runs during 'inline' and uses tokens.splice(), it shifts indices, causing footnote backlinks to be lost.
  md.core.ruler.after('text_join', 'semantic_container', (state) => {
    semanticContainer(state, opt)
  })
}

export default mditSemanticContainer
