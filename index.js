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

const checkSemanticContainer = (state, n, hrType, sc) => {
  let continued = 0
  if (!checkSematicContainerCore(state, n, hrType, sc, continued)) {
    return false
  }
  let cn = sc[sc.length - 1].range[1] + 1
  while (cn < state.tokens.length -1) {
    continued = true
    if (!checkSematicContainerCore(state, cn, hrType, sc, continued)) {
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

  const regActualContNoStrong = new RegExp('^' + sc.actualContNoStrong)
  const regActualContNoStrongSpace = new RegExp('^' + sc.actualContNoStrong + ' *')
  const regActualContAsterisk = new RegExp('^' + sc.actualCont.replace(/\*/g, '\\*'))
  const regLeadSpace = /^ */

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
    ntChildren[0].content = ntChildren[0].content.replace(regActualContNoStrongSpace, '')
    nt.content = nt.content.replace(regLeadSpace, '')
    return nJump
  }

  if (/^#+/.test(nt.content)) {
    //console.log('processing(heading):')
    nJump += 2
  }
  if (/^[*_]{2}/.test(nt.content) ) {
    //console.log('processing(strong):')
    if (opt.mditStrongJa && ntChildren.length > 2) {
      if (ntChildren[0].type === 'strong_open'
        && ntChildren[2].type === 'strong_close') {
        const hasStrongJa = ntChildren[1].content.match(new RegExp('^' + sc.actualName + '(' + semanticsHalfJoint + '|' + semanticsFullJoint + ')?( *)$'))
        if (hasStrongJa) {
          ntChildren.splice(0, 3)
          if (!hasStrongJa[1]) {
            ntChildren[0].content = ntChildren[0].content.replace(new RegExp('^(?:' + semanticsHalfJoint + '|' + semanticsFullJoint + ')'), '')
          }
        }
      }
    }
    if (ntChildren[1]) {
      if (ntChildren[1].type === 'strong_open') {
        ntChildren[1].attrJoin('class', 'sc-' + sem.name + '-label')
        if (sc.hasLastJoint) {
          ntChildren[4].content =  ntChildren[4].content.replace(new RegExp('^\\' + sc.actualNameJoint ), '')
        } else {
          ntChildren[2].content = ntChildren[2].content.replace(new RegExp('\\' + sc.actualNameJoint + '$'), '')
        }
      } else {
        const strongBefore = new state.Token('text', '', 0)
        const strongOpen = new state.Token('strong_open', 'strong', 1)
        const strongContent = new state.Token('text', '', 0)
        strongContent.content = sc.actualName
        const strongClose = new state.Token('strong_close', 'strong', -1)
        strongOpen.attrJoin('class', 'sc-' + sem.name + '-label')

        if (!opt.mditStrongJa) {
          ntChildren[0].content = ntChildren[0].content.replace(new RegExp('[*_]{2} *?' + sc.actualName + ' *[*_]{2}'), '')
          if (sc.hasLastSpace || sc.hasHalfJoint) {
            ntChildren[0].content = ' ' + ntChildren[0].content.replace(regActualContAsterisk, '')
          } else {
            ntChildren[0].content = ntChildren[0].content.replace(regActualContAsterisk, '')
          }
        }
        nt.content = nt.content.replace(regActualContAsterisk, '')
        ntChildren.splice(0, 0, strongBefore, strongOpen, strongContent, strongClose)
      }
      nJump += 3
    } else {
      const strongBefore = new state.Token('text', '', 0)
      const strongOpen = new state.Token('strong_open', 'strong', 1)
      const strongContent = new state.Token('text', '', 0)
      strongContent.content =sc.actualName
      const strongClose = new state.Token('strong_close', 'strong', -1)
      strongOpen.attrJoin('class', 'sc-' + sem.name + '-label')

      if (!opt.mditStrongJa) {
        ntChildren[0].content = ntChildren[0].content.replace(new RegExp('[*_]{2} *?' + sc.actualName + ' *[*_]{2}'), '')
        ntChildren[0].content = ntChildren[0].content.replace(regActualContAsterisk, '')
      }
      nt.content = nt.content.replace(regActualContAsterisk, '')

      ntChildren.splice(0, 0, strongBefore, strongOpen, strongContent, strongClose)
    }
  } else {
    const lt_first = new state.Token('text', '', 0)
    const lt_span_open = new state.Token('span_open', 'span', 1)
    lt_span_open.attrJoin("class", "sc-" + sem.name + "-label")
    const lt_span_content = new state.Token('text', '', 0)
    lt_span_content.content = sc.actualName
    const lt_span_close = new state.Token('span_close', 'span', -1)

    if (sc.hasHalfJoint) {
      ntChildren[0].content = ' ' + ntChildren[0].content.replace(regActualContNoStrong, '')
    } else {
      ntChildren[0].content = ntChildren[0].content.replace(regActualContNoStrong, '')
    }

    ntChildren.splice(0, 0, lt_first, lt_span_open, lt_span_content, lt_span_close)
    nJump += 3
  }

  // Add label joint span.
  if (opt.removeJointAtLineEnd) {
    let jointIsAtLineEnd = false
    if (ntChildren) {
      if (ntChildren[ntChildren.length - 1].type === 'text' && /^ *$/.test(ntChildren[ntChildren.length - 1].content)) {
        jointIsAtLineEnd = true
        ntChildren[ntChildren.length - 1].content = ''
      } else {
        if (ntChildren[ntChildren.length - 1].type === 'strong_close') {
          jointIsAtLineEnd = true
        }
      }
    }

    if (jointIsAtLineEnd) return nJump
  }

  const ljt_span_open = new state.Token('span_open', 'span', 1)
  ljt_span_open.attrJoin("class", "sc-" + sem.name + "-label-joint")
  const ljt_span_content = new state.Token('text', sc.actualNameJoint, 0)
  ljt_span_content.content = sc.actualNameJoint
  const ljt_span_close = new state.Token('span_close', 'span', -1)

  ntChildren.splice(3, 0, ljt_span_open, ljt_span_content, ljt_span_close)

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
      if(checkSematicContainerCore(state, n, hrType, sc, false)) {
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

      if(checkSematicContainerCore(state, n, hrType, sc, false)) {
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

  if (!checkSemanticContainer(state, n, hrType, sc)) {
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
    mditStrongJa: false,
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
