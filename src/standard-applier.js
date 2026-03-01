import { resolveLabelControl } from './label-control.js'
import { resolveContainerMaps, createContainerStartToken, createContainerEndToken } from './container-token.js'

const semanticsHalfJoint = '[:.]'
const semanticsFullJoint = '[　：。．]'
const CODE_STAR = 42
const CODE_UNDERSCORE = 95
const CODE_HASH = 35
const CODE_SPACE = 32

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const isSemanticJointChar = (char) => char === ':' || char === '.' || char === '　' || char === '：' || char === '。' || char === '．'
const removeLiteralPrefix = (value, prefix) => {
  if (!value || !prefix) return value
  return value.startsWith(prefix) ? value.slice(prefix.length) : value
}
const removeLiteralPrefixAndFollowingSpaces = (value, prefix) => {
  if (!value || !prefix || !value.startsWith(prefix)) return value
  let index = prefix.length
  while (index < value.length && value.charCodeAt(index) === CODE_SPACE) {
    index++
  }
  return value.slice(index)
}
const trimLeadingAsciiSpaces = (value) => {
  if (!value) return value
  let index = 0
  while (index < value.length && value.charCodeAt(index) === CODE_SPACE) {
    index++
  }
  return index === 0 ? value : value.slice(index)
}
const isAsciiSpacesOnly = (value) => {
  if (!value) return true
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) !== CODE_SPACE) return false
  }
  return true
}
const parseStrongLabelContent = (strongContent, actualName) => {
  if (!strongContent || !actualName || !strongContent.startsWith(actualName)) return null

  let index = actualName.length
  let joint = ''
  const jointChar = strongContent[index]
  if (isSemanticJointChar(jointChar)) {
    joint = jointChar
    index++
  }

  for (let i = index; i < strongContent.length; i++) {
    if (strongContent.charCodeAt(i) !== CODE_SPACE) return null
  }

  return {
    joint,
    trailingSpaces: strongContent.slice(index),
  }
}
const stripLeadingLabelFromChildren = (children, sc) => {
  if (!Array.isArray(children) || children.length === 0) return

  const first = children[0]
  if (first?.type === 'text' && first.content) {
    first.content = removeLiteralPrefixAndFollowingSpaces(first.content, sc.actualContNoStrong)
    if (sc.hasLastJoint && first.content) {
      first.content = removeLiteralPrefixAndFollowingSpaces(first.content, sc.actualNameJoint)
    }
    return
  }

  for (let i = 0; i < children.length - 2; i++) {
    const open = children[i]
    const text = children[i + 1]
    const close = children[i + 2]
    if (open?.type !== 'strong_open' || text?.type !== 'text' || close?.type !== 'strong_close') {
      continue
    }
    const strongLabel = parseStrongLabelContent(text.content, sc.actualName)
    if (!strongLabel) continue

    children.splice(i, 3)

    if (sc.hasLastJoint) {
      for (let j = i; j < children.length; j++) {
        const token = children[j]
        if (token?.type !== 'text' || !token.content) continue
        token.content = removeLiteralPrefix(token.content, sc.actualNameJoint)
        break
      }
    }

    for (let j = i; j < children.length; j++) {
      const token = children[j]
      if (token?.type !== 'text' || !token.content) continue
      token.content = trimLeadingAsciiSpaces(token.content)
      break
    }
    return
  }

  for (let i = 0; i < children.length; i++) {
    const token = children[i]
    if (token?.type !== 'text' || !token.content) continue
    const original = token.content
    token.content = removeLiteralPrefixAndFollowingSpaces(token.content, sc.actualContNoStrong)
    if (token.content === original && sc.hasLastJoint) {
      token.content = removeLiteralPrefixAndFollowingSpaces(token.content, sc.actualNameJoint)
    }
    if (token.content !== original) {
      return
    }
  }
}

const createStandardContainerApplier = (semantics) => (state, hrType, sc, sci, optLocal) => {
  const tokens = state.tokens
  let nJump = 0
  let rs = sc.range[0]
  let re = sc.range[1]
  const sem = semantics[sc.sn]

  // for continued semantic container.
  if(sci > 1) {
    rs += sci - 1
    re += sci - 1
  }
  const { startMap, endMap } = resolveContainerMaps(tokens, rs, re, hrType)
  const nt = tokens[rs + 1]
  const ntChildren = nt.children
  const startToken = tokens[rs]
  const defaultHideLabel = !!optLocal.scHideSet?.has(sem.name)
  const labelControl = optLocal.labelControl
    ? resolveLabelControl(startToken, nt, undefined, !!optLocal.labelControlInlineFallback)
    : null
  const hideLabel = labelControl ? !!labelControl.hide : defaultHideLabel
  const labelText = labelControl && !labelControl.hide ? labelControl.value : sc.actualName
  const labelJoint = hideLabel ? '' : sc.actualNameJoint
  const hasSemanticAriaLabel = !!sem.hasAriaLabel

  const sToken = createContainerStartToken(
    state,
    sem,
    labelText,
    hideLabel,
    sc.actualName,
    startMap
  )
  tokens.splice(rs, 0, sToken)

  const eToken = createContainerEndToken(state, sem, endMap)

  if(sci !== -1) {
    tokens.splice(re + 1, 1, eToken)
    if (!sc.continued) {
      tokens.splice(rs - 1, 1)
    }
  } else {
    tokens.splice(re + 1, 0, eToken)
  }

  if(hideLabel || hasSemanticAriaLabel) {
    nt.content = removeLiteralPrefix(nt.content, sc.actualCont)
    nt.content = removeLiteralPrefix(nt.content, sc.actualContNoStrong)
    if (sc.hasLastJoint) {
      nt.content = removeLiteralPrefix(nt.content, sc.actualNameJoint)
    }
    stripLeadingLabelFromChildren(ntChildren, sc)
    nt.content = trimLeadingAsciiSpaces(nt.content)
    return nJump
  }

  if (nt.content?.charCodeAt(0) === CODE_HASH) {
    nJump += 2
  }
  if (nt.content && (
    (nt.content.charCodeAt(0) === CODE_STAR && nt.content.charCodeAt(1) === CODE_STAR)
    || (nt.content.charCodeAt(0) === CODE_UNDERSCORE && nt.content.charCodeAt(1) === CODE_UNDERSCORE)
  )) {
    let foundLabelStrong = false

    for (let i = 0; i < ntChildren.length - 2; i++) {
      if (ntChildren[i] && ntChildren[i].type === 'strong_open'
        && ntChildren[i + 2] && ntChildren[i + 2].type === 'strong_close'
        && ntChildren[i + 1] && ntChildren[i + 1].content) {

        const strongContent = ntChildren[i + 1].content
        const strongLabel = parseStrongLabelContent(strongContent, sc.actualName)

        if (strongLabel) {
          foundLabelStrong = true

          let textAfterStrongIndex = -1
          for (let j = i + 3; j < ntChildren.length; j++) {
            if (ntChildren[j] && ntChildren[j].type === 'text') {
              textAfterStrongIndex = j
              break
            }
          }

          ntChildren[i].attrJoin('class', sem.labelClass)
          ntChildren[i + 1].content = labelText
          let hasDisplayJoint = false
          let jointSpan
          let jointContent
          let jointSpanClose
          if (labelJoint) {
            hasDisplayJoint = true
            jointSpan = new state.Token('span_open', 'span', 1)
            jointSpan.attrJoin('class', sem.labelJointClass)
            jointContent = new state.Token('text', '', 0)
            jointContent.content = labelJoint
            jointSpanClose = new state.Token('span_close', 'span', -1)
          }

          if (strongLabel.joint) {
            const trailingSpaces = strongLabel.trailingSpaces || ''
            if (hasDisplayJoint) {
              ntChildren.splice(i + 2, 0, jointSpan, jointContent, jointSpanClose)
            }

            if (textAfterStrongIndex !== -1) {
              const adjustedTextIndex = textAfterStrongIndex + (hasDisplayJoint ? 3 : 0)
              if (trailingSpaces) {
                if (ntChildren[adjustedTextIndex].content === '') {
                  ntChildren[adjustedTextIndex].content = ' '
                } else {
                  ntChildren[adjustedTextIndex].content = ' ' + trimLeadingAsciiSpaces(ntChildren[adjustedTextIndex].content)
                }
              }
            }
          } else if (sc.hasLastJoint) {
            if (ntChildren[i + 3] && ntChildren[i + 3].content) {
              ntChildren[i + 3].content = removeLiteralPrefix(ntChildren[i + 3].content, sc.actualNameJoint)
            }
            if (hasDisplayJoint) {
              ntChildren.splice(i + 2, 0, jointSpan, jointContent, jointSpanClose)
            }
          }
          break
        }
      }
    }

    if (!foundLabelStrong) {
      const strongBefore = new state.Token('text', '', 0)
      const strongOpen = new state.Token('strong_open', 'strong', 1)
      const strongContent = new state.Token('text', '', 0)
      strongContent.content = labelText
      const strongClose = new state.Token('strong_close', 'strong', -1)
      strongOpen.attrJoin('class', sem.labelClass)

      const firstChild = ntChildren?.[0]
      if (firstChild?.content) {
        const escapedActualName = escapeRegExp(sc.actualName)
        const regStrongPattern = new RegExp('\\*\\* *?' + escapedActualName + '(' + semanticsHalfJoint + '|' + semanticsFullJoint + ')? *\\*\\* *')
        const originalContent = firstChild.content
        const match = originalContent.match(regStrongPattern)

        if (match && match[0]) {
          const trailingSpaces = match[0].match(/ +$/)
          const replacement = trailingSpaces ? trailingSpaces[0] : ''
          firstChild.content = firstChild.content.replace(regStrongPattern, replacement)
        }
        firstChild.content = removeLiteralPrefix(firstChild.content, sc.actualCont)
      }
      nt.content = removeLiteralPrefix(nt.content, sc.actualCont)

      const labelTokens = [strongBefore, strongOpen, strongContent]
      if (labelJoint) {
        const jointSpan = new state.Token('span_open', 'span', 1)
        jointSpan.attrJoin('class', sem.labelJointClass)
        const jointContent = new state.Token('text', '', 0)
        jointContent.content = labelJoint
        const jointSpanClose = new state.Token('span_close', 'span', -1)
        labelTokens.push(jointSpan, jointContent, jointSpanClose)
      }
      labelTokens.push(strongClose)
      ntChildren.splice(0, 0, ...labelTokens)
    }
    nJump += 3
  } else {
    const ltFirst = new state.Token('text', '', 0)
    const ltSpanOpen = new state.Token('span_open', 'span', 1)
    ltSpanOpen.attrJoin('class', sem.labelClass)
    const ltSpanContent = new state.Token('text', '', 0)
    ltSpanContent.content = labelText
    const ltSpanClose = new state.Token('span_close', 'span', -1)

    const firstChild = ntChildren?.[0]
    if (sc.hasHalfJoint && firstChild?.content) {
      firstChild.content = ' ' + removeLiteralPrefix(firstChild.content, sc.actualContNoStrong)
    } else if (firstChild?.content) {
      firstChild.content = removeLiteralPrefix(firstChild.content, sc.actualContNoStrong)
    }

    const labelTokens = [ltFirst, ltSpanOpen, ltSpanContent]
    if (labelJoint) {
      const ltJointSpanOpen = new state.Token('span_open', 'span', 1)
      ltJointSpanOpen.attrJoin('class', sem.labelJointClass)
      const ltJointContent = new state.Token('text', '', 0)
      ltJointContent.content = labelJoint
      const ltJointSpanClose = new state.Token('span_close', 'span', -1)
      labelTokens.push(ltJointSpanOpen, ltJointContent, ltJointSpanClose)
    }
    labelTokens.push(ltSpanClose)
    ntChildren.splice(0, 0, ...labelTokens)
    nJump += 3
  }

  if (optLocal.removeJointAtLineEnd) {
    let jointIsAtLineEnd = false
    if (ntChildren && ntChildren.length > 0) {
      const lastToken = ntChildren[ntChildren.length - 1]
      if (lastToken.type === 'text' && isAsciiSpacesOnly(lastToken.content)) {
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
        const className = ntChildren[i] && ntChildren[i].attrGet ? ntChildren[i].attrGet('class') : ''
        if (className && className.includes('-label-joint')) {
          ntChildren.splice(i, 3)
          break
        }
      }
    }
  }

  return nJump
}

export { createStandardContainerApplier }
