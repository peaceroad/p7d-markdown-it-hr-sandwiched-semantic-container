import { buildSemantics } from './src/semantics.js'
import { createBracketFormat } from './src/bracket-format.js'
import { createGitHubTypeContainer } from './src/github-type-container.js'

const sNumber = '(?:[ 　](?:[0-9]{1,6}|[A-Z]{1,2})(?:[.-](?:[0-9]{1,6}|[A-Z]{1,2})){0,6})?'
const strongMark = '[*_]{2}'

const semanticsHalfJoint = '[:.]'
const semanticsFullJoint = '[　：。．]'

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const buildSemanticsReg = (semantics) => semantics.map((sem) => {
  const aliasStr = sem.aliases.length
    ? '|' + sem.aliases.map((x) => x.replace(/\(/g, '(?:').trim()).join('|')
    : ''
  const pattern =
    '^(' + strongMark + ')?((?:' + sem.name + aliasStr + ')' + sNumber + ')'
    + '(?:'
    + '(' + semanticsHalfJoint + ') *?\\1(?: |$)'
    + '| *?\\1 *?(' + semanticsHalfJoint + ') '
    + '|(' + semanticsFullJoint + ') *?\\1'
    + '| *?\\1 *?(' + semanticsFullJoint + ')'
    + ' *?)'
  return new RegExp(pattern, 'i')
})

const createLabelMatcher = (semantics, semanticsReg) => {
  const semanticsLength = semantics.length
  return (state, n, hrType, sc, checked) => {
    const tokens = state.tokens
    const tokensLength = tokens.length
    const nextToken = tokens[n+1]

    const content = nextToken?.content
    if (!content) return false
    let leadIndex = 0
    if (content.startsWith('**') || content.startsWith('__')) {
      leadIndex = 2
    }
    const leadChar = content[leadIndex]
    if (!leadChar) return false
    if (leadChar === '[' || leadChar === '［') return false
    if (leadChar !== '*' && leadChar !== '_' && !/[0-9A-Za-z\u0080-\uFFFF]/.test(leadChar)) {
      return false
    }

    let sn = 0
    let actualName = null

    while (sn < semanticsLength) {
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
}

const createActiveCheck = ({ githubCheck, bracketCheck, defaultCheck }) => {
  return (state, n, hrType, sc, checked) => {
    const token = state.tokens[n]
    if (githubCheck && token.type === 'blockquote_open') {
      return githubCheck(state, n, hrType, sc, checked)
    }
    if (bracketCheck && bracketCheck(state, n, hrType, sc, checked)) {
      return true
    }
    return defaultCheck(state, n, hrType, sc, checked)
  }
}

const createContainerRangeChecker = (activeCheck) => (state, n, hrType, sc) => {
  if (!activeCheck(state, n, hrType, sc, false)) {
    return false
  }

  let cn = sc[sc.length - 1].range[1] + 1
  const tokensLength = state.tokens.length
  while (cn < tokensLength - 1) {
    if (!activeCheck(state, cn, hrType, sc, true)) {
      break
    }
    cn = sc[sc.length - 1].range[1] + 1
  }
  return true
}

const createContainerApplier = (semantics, featureHelpers) => (state, n, hrType, sc, sci , optLocal) => {
  const tokens = state.tokens
  let nJump = 0
  let moveToAriaLabel = false
  let rs = sc.range[0]
  let re = sc.range[1]
  const sn = sc.sn
  const sem = semantics[sn]

  if (sc.isGitHubAlert && featureHelpers.github?.setGitHubAlertsSemanticContainer) {
    return featureHelpers.github.setGitHubAlertsSemanticContainer(state, n, hrType, sc, sci, optLocal)
  }

  if (sc.isBracketFormat && featureHelpers.bracket?.setBracketSemanticContainer) {
    return featureHelpers.bracket.setBracketSemanticContainer(state, n, hrType, sc, sci, optLocal)
  }
  const escapedActualContNoStrong = escapeRegExp(sc.actualContNoStrong)
  const escapedActualCont = escapeRegExp(sc.actualCont)
  const escapedActualName = escapeRegExp(sc.actualName)
  const escapedActualNameJoint = escapeRegExp(sc.actualNameJoint)

  const regActualContNoStrong = new RegExp('^' + escapedActualContNoStrong)
  const regActualContNoStrongSpace = new RegExp('^' + escapedActualContNoStrong + ' *')
  const regActualContAsterisk = new RegExp('^' + escapedActualCont)
  const regLeadSpace = /^ */
  const regStrongLabel = new RegExp('^' + escapedActualName + '(' + semanticsHalfJoint + '|' + semanticsFullJoint + ')?( *)$')
  const regStrongPattern = new RegExp('\\*\\* *?' + escapedActualName + '(' + semanticsHalfJoint + '|' + semanticsFullJoint + ')? *\\*\\* *')
  const regJointRemoval = new RegExp('^' + escapedActualNameJoint)

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
      const [attrKey, attrVal] = sem.attrs[ai]
      if (!moveToAriaLabel) {
        moveToAriaLabel = attrKey === 'aria-label'
      }
      const value = attrKey === 'aria-label' ? sc.actualName : attrVal
      sToken.content += ' ' + attrKey + '="' + value + '"'
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
    
    for (let i = 0; i < ntChildren.length - 2; i++) {
      if (ntChildren[i] && ntChildren[i].type === 'strong_open'
        && ntChildren[i + 2] && ntChildren[i + 2].type === 'strong_close'
        && ntChildren[i + 1] && ntChildren[i + 1].content) {
        
        const strongContent = ntChildren[i + 1].content
        const hasStrongJa = strongContent.match(regStrongLabel)
        
        if (hasStrongJa) {
          foundLabelStrong = true
          
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
          
          if (hasStrongJa[1]) {
            const trailingSpaces = hasStrongJa[2] || ''
            ntChildren[i + 1].content = sc.actualName
            ntChildren.splice(i + 2, 0, jointSpan, jointContent, jointSpanClose)
            
            if (textAfterStrongIndex !== -1) {
              const adjustedTextIndex = textAfterStrongIndex + 3
              if (trailingSpaces) {
                if (ntChildren[adjustedTextIndex].content === '') {
                  ntChildren[adjustedTextIndex].content = ' '
                } else {
                  ntChildren[adjustedTextIndex].content = ' ' + ntChildren[adjustedTextIndex].content.replace(/^ +/, '')
                }
              }
            }
          } else if (sc.hasLastJoint) {
            if (ntChildren[i + 3] && ntChildren[i + 3].content) {
              ntChildren[i + 3].content = ntChildren[i + 3].content.replace(regJointRemoval, '')
            }
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

  if (optLocal.removeJointAtLineEnd) {
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

const createContainerWalker = (activeCheck, checkContainerRanges, applyContainer) => (state, n, cn, optLocal) => {
  const tokens = state.tokens
  let sc = []
  let sci = 0
  let hrType = ''
  let firstJump = 0

  const prevToken = tokens[n-1]
  const token = tokens[n]

  if (n === 0 || n === tokens.length -1) {
    if (!optLocal.requireHrAtOneParagraph && token.type === 'paragraph_open') {
      if(activeCheck(state, n, hrType, sc, false)) {
        firstJump = applyContainer(state, n, hrType, sc[0], -1, optLocal)
        return n += firstJump
      }
    } else if (optLocal.githubTypeContainer && token.type === 'blockquote_open') {
      if(activeCheck(state, n, hrType, sc, false)) {
        firstJump = applyContainer(state, n, hrType, sc[0], -1, optLocal)
        return n += firstJump
      }
    }
    n++
    return n
  }
  if (prevToken.type !== 'hr') {
    if (!optLocal.requireHrAtOneParagraph && token.type === 'paragraph_open') {
      if (cn.has(n - 1)) {
        n++; return n
      }

      if (tokens[n - 1].type === 'list_item_open') {
        n++; return n
      }

      if(activeCheck(state, n, hrType, sc, false)) {
        firstJump = applyContainer(state, n, hrType, sc[0], -1, optLocal)
        n += firstJump
        return n
      }
    } else if (optLocal.githubTypeContainer && token.type === 'blockquote_open') {
      if(activeCheck(state, n, hrType, sc, false)) {
        firstJump = applyContainer(state, n, hrType, sc[0], -1, optLocal)
        n += firstJump
        return n
      }
    }
    n++
    return n
  }

  if(/\*/.test(prevToken.markup)) hrType = '*'
  if(/-/.test(prevToken.markup)) hrType = '-'
  if(/_/.test(prevToken.markup)) hrType = '_'

  if (!checkContainerRanges(state, n, hrType, sc)) {
    n++
    return n
  }

  for (sci = 0; sci < sc.length; sci++) {
    const jump = applyContainer(state, n, hrType, sc[sci], sci, optLocal)
    if (sci === 0) firstJump = jump
    cn.add(sc[sci].range[1] + sci + 1)
  }
  n += firstJump
  return n
}

const createContainerRunner = (walkContainers) => (state, optLocal) => {
  const tokens = state.tokens
  let n = 0
  let cn = new Set()
  let tokensLength = tokens.length
  while (n < tokensLength) {
    n = walkContainers(state, n, cn, optLocal)
    tokensLength = tokens.length
  }
  return true
}

const createSemanticEngine = (semantics, opt, featureHelpers) => {
  const semanticsReg = buildSemanticsReg(semantics)
  const semanticLabelMatcher = createLabelMatcher(semantics, semanticsReg)
  const githubCheck = opt.githubTypeContainer ? featureHelpers.github?.checkGitHubAlertsCore : null
  const bracketCheck = opt.allowBracketJoint ? featureHelpers.bracket?.checkBracketSemanticContainerCore : null
  const activeCheck = createActiveCheck({ githubCheck, bracketCheck, defaultCheck: semanticLabelMatcher })
  const checkContainerRanges = createContainerRangeChecker(activeCheck)
  const applyContainer = createContainerApplier(semantics, featureHelpers)
  const walkContainers = createContainerWalker(activeCheck, checkContainerRanges, applyContainer)
  const semanticContainer = createContainerRunner(walkContainers)
  return { semanticContainer }
}

const SAFE_CORE_ANCHORS = new Set([
  'inline',
  'cjk_breaks',
  'text_join',
  'strong_ja_postprocess',
  'footnote_anchor',
  'endnotes_move',
])

const getSafeCoreAnchor = (md) => {
  const rules = md?.core?.ruler?.__rules__
  if (!Array.isArray(rules)) return 'inline'
  let maxIndex = -1
  let anchorName = 'inline'
  for (let i = 0; i < rules.length; i++) {
    const name = rules[i]?.name
    if (!name || !SAFE_CORE_ANCHORS.has(name)) continue
    if (i > maxIndex) {
      maxIndex = i
      anchorName = name
    }
  }
  return anchorName
}

const registerCoreRuleAfterSafeAnchor = (md, ruleName, handler) => {
  const anchor = getSafeCoreAnchor(md)
  try {
    md.core.ruler.after(anchor, ruleName, handler)
  } catch (err) {
    md.core.ruler.push(ruleName, handler)
  }
}

const mditSemanticContainer = (md, option) => {
  let opt = {
    requireHrAtOneParagraph: false,
    removeJointAtLineEnd: false,
    allowBracketJoint: false,
    githubTypeContainer: false,
    // Additional languages to load on top of English
    languages: ['ja'],
  }
  if (option) Object.assign(opt, option)
  
  const semantics = buildSemantics(opt.languages)
  const bracket = opt.allowBracketJoint ? createBracketFormat(semantics) : null
  const github = opt.githubTypeContainer ? createGitHubTypeContainer(semantics) : null
  const featureHelpers = { bracket, github }
  const { semanticContainer } = createSemanticEngine(semantics, opt, featureHelpers)

  if (opt.githubTypeContainer && github) {
    md.block.ruler.before('blockquote', 'github_alerts', github.githubAlertsBlock)
  }

  // Run after index-sensitive plugins (footnote/strong-ja) and after inline processing.
  // If SemanticContainer runs too early, tokens.splice() can shift recorded indices.
  registerCoreRuleAfterSafeAnchor(md, 'semantic_container', (state) => {
    semanticContainer(state, opt)
  })
}

export default mditSemanticContainer
