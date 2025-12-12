import semantics from './semantics.json' with { type: 'json' }
import { checkBracketSemanticContainerCore, setBracketSemanticContainer } from './src/bracket-format.js'
import { checkGitHubAlertsCore, setGitHubAlertsSemanticContainer, githubAlertsBlock } from './src/github-type-container.js'

const sNumber = '(?:[ 　](?:[0-9]{1,6}|[A-Z]{1,2})(?:[.-](?:[0-9]{1,6}|[A-Z]{1,2})){0,6})?'
const strongMark = '[*_]{2}'

const semanticsHalfJoint = '[:.]'
const semanticsFullJoint = '[　：。．]'

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

const checkSematicContainerCore = (state, n, hrType, sc, checked) => {
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
    actualCont: actualName[0],
    actualContNoStrong: actualName[0].replace(/[*_]{2}/g, ''),
    actualName: actualName[2],
    actualNameJoint: actualNameJoint,
    hasLastJoint: hasLastJoint,
    hasHalfJoint: hasHalfJoint,
  })
  return true
}

const getCheckFunction = (opt) => {
  if (opt.githubTypeContainer) {
    return checkGitHubAlertsCore
  } else if (opt.allowBracketJoint) {
    return checkBracketSemanticContainerCore
  } else {
    return checkSematicContainerCore
  }
}

const checkSemanticContainer = (state, n, hrType, sc, checkFunc) => {
  if (!checkFunc(state, n, hrType, sc, false)) {
    return false
  }

  let cn = sc[sc.length - 1].range[1] + 1
  const tokensLength = state.tokens.length
  while (cn < tokensLength - 1) {
    if (!checkFunc(state, cn, hrType, sc, true)) {
      break
    }
    cn = sc[sc.length - 1].range[1] + 1
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

  if (sc.isGitHubAlert) {
    return setGitHubAlertsSemanticContainer(state, n, hrType, sc, sci, opt)
  }

  if (sc.isBracketFormat) {
    return setBracketSemanticContainer(state, n, hrType, sc, sci, opt)
  }
  const regActualContNoStrong = new RegExp('^' + sc.actualContNoStrong)
  const regActualContNoStrongSpace = new RegExp('^' + sc.actualContNoStrong + ' *')
  const regActualContAsterisk = new RegExp('^' + sc.actualCont.replace(/\*/g, '\\*'))
  const regLeadSpace = /^ */
  const regStrongLabel = new RegExp('^' + sc.actualName + '(' + semanticsHalfJoint + '|' + semanticsFullJoint + ')?( *)$')
  const regStrongPattern = new RegExp('\\*\\* *?' + sc.actualName + '(' + semanticsHalfJoint + '|' + semanticsFullJoint + ')? *\\*\\* *')
  const regJointRemoval = new RegExp('^\\' + sc.actualNameJoint)

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
      if(!moveToAriaLabel) {
        moveToAriaLabel = sem.attrs[ai][0] === "aria-label"
        if(moveToAriaLabel) {
          sem.attrs[ai][1] = sc.actualName
        }
      }
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
    let foundLabelStrong = false
    
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
          
          // Pre-calculate text node index after strong close for efficiency
          let textAfterStrongIndex = -1
          for (let j = i + 3; j < ntChildren.length; j++) {
            if (ntChildren[j] && ntChildren[j].type === 'text') {
              textAfterStrongIndex = j
              break
            }
          }
          
          ntChildren[i].attrJoin('class', 'sc-' + sem.name + '-label')
          
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
        const originalContent = firstChild.content
        const match = originalContent.match(regStrongPattern)
        
        if (match && match[0]) {
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

const semanticContainerCore = (state, n, cn, opt, checkFunc) => {
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

  if (!checkSemanticContainer(state, n, hrType, sc, checkFunc)) {
    n++
    return n
  }

  for (sci = 0; sci < sc.length; sci++) {
    nJumps.push(setSemanticContainer(state, n, hrType, sc[sci], sci, opt))
    cn.push(sc[sci].range[1] + sci + 1)
  }
  n += nJumps[0]
  return n
}

const semanticContainer = (state, opt) => {
  const tokens = state.tokens
  const checkFunc = getCheckFunction(opt)
  let n = 0
  let cn = []
  let tokensLength = tokens.length
  while (n < tokensLength) {
    n = semanticContainerCore(state, n, cn, opt, checkFunc)
    tokensLength = tokens.length
  }
  return true
}

const mditSemanticContainer = (md, option) => {
  let opt = {
    requireHrAtOneParagraph: false,
    removeJointAtLineEnd: false,
    allowBracketJoint: false,
    githubTypeContainer: false,
  }
  if (option) Object.assign(opt, option)
  
  if (opt.githubTypeContainer) {
    md.block.ruler.before('blockquote', 'github_alerts', githubAlertsBlock)
  }

  // Run after 'text_join' to prevent conflicts with @peaceroad/markdown-it-footnote-here.
  // FootnoteHere's anchor processing uses 'inline' phase to record footnote positions.
  // If SemanticContainer runs during 'inline' and uses tokens.splice(), it shifts indices, causing footnote backlinks to be lost.
  md.core.ruler.after('text_join', 'semantic_container', (state) => {
    semanticContainer(state, opt)
  })
}

export default mditSemanticContainer
