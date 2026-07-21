import { resolveContainerMaps, createContainerStartToken, createContainerEndToken } from './container-token.js'
import { parseHeadingRank } from './container-range.js'
import { createTextToken } from './label-token-builder.js'

const EN_TITLEPAGE_RE = /^(Chapter|Part|Appendix)(\s+)([0-9]{1,3}|[A-Za-z]{1,3}|[IVXLCDMivxlcdm]{1,8})([.:：．])?(?:(\s+)(.+))?$/i
const JA_DECIMAL_OR_KANJI_NUMBER = '[0-9０-９一二三四五六七八九十百千]{1,8}'
const JA_ASCII_ROMAN_NUMBER = '[IVXLCDMivxlcdm]{1,8}'
const JA_UNICODE_ROMAN_NUMBER = '[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫⅬⅭⅮⅯⅰⅱⅲⅳⅴⅵⅶⅷⅸⅹⅺⅻⅼⅽⅾⅿ]{1,8}'
const JA_NUMBER = '(?:' + JA_DECIMAL_OR_KANJI_NUMBER + '|' + JA_ASCII_ROMAN_NUMBER + '|' + JA_UNICODE_ROMAN_NUMBER + ')'
const JA_SUFFIX_NUMBER = '[0-9０-９A-Za-zＡ-Ｚａ-ｚ一二三四五六七八九十百千]{1,8}'
const JA_TITLEPAGE_RE = new RegExp('^(第)?(' + JA_NUMBER + ')(章|部)(?:([.:：．、。])([ 　]*)(.*)|([ 　]+)(.*))?$')
const JA_APPENDIX_TITLEPAGE_RE = new RegExp('^(付録|付属|附属)(' + JA_SUFFIX_NUMBER + ')(?:([.:：．、。])([ 　]*)(.*)|([ 　]+)(.*))?$')

const CODE_UPPER_A = 65
const CODE_UPPER_C = 67
const CODE_UPPER_P = 80
const CODE_LOWER_A = 97
const CODE_LOWER_C = 99
const CODE_LOWER_P = 112
const CODE_DIGIT_0 = 48
const CODE_DIGIT_9 = 57
const CODE_FULLWIDTH_DIGIT_0 = 65296
const CODE_FULLWIDTH_DIGIT_9 = 65305
const CODE_JA_PREFIX = 31532
const CODE_JA_APPENDIX = 20184
const CODE_JA_HISTORIC_APPENDIX = 38468
const JA_NUMERAL_LEADS = '一二三四五六七八九十百千'

const isJapaneseAppendixLeadCode = (code) => (
  code === CODE_JA_APPENDIX || code === CODE_JA_HISTORIC_APPENDIX
)

const isAsciiRomanLeadCode = (code) => code === 73
  || code === 86
  || code === 88
  || code === 76
  || code === 67
  || code === 68
  || code === 77
  || code === 105
  || code === 118
  || code === 120
  || code === 108
  || code === 99
  || code === 100
  || code === 109

const isUnicodeRomanLeadCode = (code) => (code >= 8544 && code <= 8555)
  || (code >= 8560 && code <= 8571)

const findSemanticIndex = (semantics, name) => {
  for (let i = 0; i < semantics.length; i++) {
    if (semantics[i]?.name === name) return i
  }
  return -1
}

const createSpanOpenToken = (state, className) => {
  const token = new state.Token('span_open', 'span', 1)
  token.attrSet('class', className)
  return token
}

const createSpanCloseToken = (state) => new state.Token('span_close', 'span', -1)

const appendSpanPart = (state, tokens, className, content) => {
  if (content === undefined || content === null || content === '') return
  tokens.push(
    createSpanOpenToken(state, className),
    createTextToken(state, content),
    createSpanCloseToken(state)
  )
}

const appendTextPart = (state, tokens, content) => {
  if (content === undefined || content === null || content === '') return
  tokens.push(createTextToken(state, content))
}

const classForPart = (sem, part) => sem.className + '-' + part

const appendJapaneseJointAndTitleParts = (parts, joint, jointSpace, jointTitle, titleSpace, spacedTitle) => {
  const title = jointTitle || spacedTitle
  if (joint) {
    parts.push({ kind: 'span', part: 'label-joint', content: joint })
  }
  if (title) {
    parts.push({ kind: 'text', content: joint ? jointSpace : titleSpace })
    parts.push({ kind: 'span', part: 'title', content: title })
  }
}

const canMatchEnglish = (code) => {
  return code === CODE_UPPER_A
    || code === CODE_UPPER_C
    || code === CODE_UPPER_P
    || code === CODE_LOWER_A
    || code === CODE_LOWER_C
    || code === CODE_LOWER_P
}

const canMatchJapanese = (code, firstChar) => {
  return code === CODE_JA_PREFIX
    || isJapaneseAppendixLeadCode(code)
    || isAsciiRomanLeadCode(code)
    || isUnicodeRomanLeadCode(code)
    || (code >= CODE_DIGIT_0 && code <= CODE_DIGIT_9)
    || (code >= CODE_FULLWIDTH_DIGIT_0 && code <= CODE_FULLWIDTH_DIGIT_9)
    || JA_NUMERAL_LEADS.includes(firstChar)
}

const buildEnglishParts = (content) => {
  const match = content.match(EN_TITLEPAGE_RE)
  if (!match) return null

  const label = match[1]
  const lowerLabel = label.toLowerCase()
  const semanticName = lowerLabel === 'part'
    ? 'part-titlepage'
    : (lowerLabel === 'appendix' ? 'appendix-titlepage' : 'chapter-titlepage')
  const numberSpace = match[2] || ''
  const number = match[3] || ''
  const joint = match[4] || ''
  const titleSpace = match[5] || ''
  const title = match[6] || ''

  const parts = [{ kind: 'span', part: 'label', content: label }]
  parts.push({ kind: 'text', content: numberSpace })
  parts.push({ kind: 'span', part: 'number', content: number })
  if (joint) {
    parts.push({ kind: 'span', part: 'label-joint', content: joint })
  }
  if (title) {
    parts.push({ kind: 'text', content: titleSpace })
    parts.push({ kind: 'span', part: 'title', content: title })
  }
  return { semanticName, parts }
}

const buildJapaneseParts = (content) => {
  const match = content.match(JA_TITLEPAGE_RE)
  if (!match) return null

  const prefix = match[1] || ''
  const number = match[2] || ''
  const label = match[3] || ''
  const semanticName = label === '部' ? 'part-titlepage' : 'chapter-titlepage'
  const joint = match[4] || ''
  const jointSpace = match[5] || ''
  const jointTitle = match[6] || ''
  const titleSpace = match[7] || ''
  const spacedTitle = match[8] || ''

  const parts = []
  if (prefix) {
    parts.push({ kind: 'span', part: 'label-prefix', content: prefix })
  }
  parts.push({ kind: 'span', part: 'number', content: number })
  parts.push({ kind: 'span', part: 'label', content: label })
  appendJapaneseJointAndTitleParts(parts, joint, jointSpace, jointTitle, titleSpace, spacedTitle)
  return { semanticName, parts }
}

const buildJapaneseAppendixParts = (content) => {
  const match = content.match(JA_APPENDIX_TITLEPAGE_RE)
  if (!match) return null

  const label = match[1] || ''
  const number = match[2] || ''
  const joint = match[3] || ''
  const jointSpace = match[4] || ''
  const jointTitle = match[5] || ''
  const titleSpace = match[6] || ''
  const spacedTitle = match[7] || ''

  const parts = [
    { kind: 'span', part: 'label', content: label },
    { kind: 'span', part: 'number', content: number },
  ]
  appendJapaneseJointAndTitleParts(parts, joint, jointSpace, jointTitle, titleSpace, spacedTitle)
  return { semanticName: 'appendix-titlepage', parts }
}

const createHeadingTitlepageMatcher = (semantics) => {
  const appendixIndex = findSemanticIndex(semantics, 'appendix-titlepage')
  const chapterIndex = findSemanticIndex(semantics, 'chapter-titlepage')
  const partIndex = findSemanticIndex(semantics, 'part-titlepage')
  if (appendixIndex < 0 && chapterIndex < 0 && partIndex < 0) return null

  return (state, n) => {
    const headingOpen = state.tokens[n]
    if (headingOpen?.type !== 'heading_open' || headingOpen.tag !== 'h1') return null

    const inlineToken = state.tokens[n + 1]
    if (inlineToken?.type !== 'inline') return null
    const children = inlineToken.children
    if (!Array.isArray(children) || children.length !== 1 || children[0]?.type !== 'text') {
      return null
    }

    const content = children[0].content
    if (!content) return null

    const leadCode = content.charCodeAt(0)
    const result = (canMatchEnglish(leadCode) ? buildEnglishParts(content) : null)
      || (canMatchJapanese(leadCode, content[0])
        ? (isJapaneseAppendixLeadCode(leadCode)
          ? buildJapaneseAppendixParts(content)
          : buildJapaneseParts(content))
        : null)
    if (!result) return null

    const sn = result.semanticName === 'part-titlepage'
      ? partIndex
      : (result.semanticName === 'appendix-titlepage' ? appendixIndex : chapterIndex)
    if (sn < 0) return null

    return {
      sn,
      isHeadingTitlepage: true,
      titlepageParts: result.parts,
    }
  }
}

const resolveFrontmatterTitlepageRangeEnd = (tokens, startIndex) => {
  const startLevel = tokens[startIndex]?.level
  if (!Number.isInteger(startLevel)) return -1

  for (let i = startIndex + 1; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.level < startLevel) return i

    if (token.type === 'heading_open' && token.level === startLevel) {
      const rank = parseHeadingRank(token)
      if (rank === 1 || rank === 2) return i
    }
  }

  return tokens.length
}

const createFrontmatterTitlepageFinder = (semantics, findHeadingTitlepage = createHeadingTitlepageMatcher(semantics)) => {
  if (!findHeadingTitlepage) return null

  return (state) => {
    const tokens = state?.tokens
    if (!Array.isArray(tokens) || tokens.length === 0) return null

    const startIndex = tokens[0]?.type === 'front_matter' ? 1 : 0
    const matchedSemantic = findHeadingTitlepage(state, startIndex)
    if (!matchedSemantic) return null

    const rangeEnd = resolveFrontmatterTitlepageRangeEnd(tokens, startIndex)
    if (rangeEnd < 0) return null

    return {
      ...matchedSemantic,
      range: [startIndex, rangeEnd],
      continued: false,
    }
  }
}

const applyHeadingTitlepageParts = (state, inlineToken, sem, parts) => {
  if (!inlineToken || !Array.isArray(parts) || parts.length === 0) return
  const children = []
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (part.kind === 'text') {
      appendTextPart(state, children, part.content)
      continue
    }
    appendSpanPart(state, children, classForPart(sem, part.part), part.content)
  }
  if (children.length === 0) return
  inlineToken.children = children
  inlineToken.content = parts.map((part) => part.content || '').join('')
}

const setHeadingTitlepageContainer = (semantics) => (state, hrType, sc, sci) => {
  const tokens = state.tokens
  let rs = sc.range[0]
  let re = sc.range[1]
  const sem = semantics[sc.sn]

  if (sci > 1) {
    rs += sci - 1
    re += sci - 1
  }

  applyHeadingTitlepageParts(state, tokens[rs + 1], sem, sc.titlepageParts)

  const { startMap, endMap } = resolveContainerMaps(tokens, rs, re, hrType)
  const sToken = createContainerStartToken(
    state,
    sem,
    false,
    '',
    startMap
  )
  tokens.splice(rs, 0, sToken)

  const eToken = createContainerEndToken(state, sem, endMap)
  if (sci !== -1) {
    tokens.splice(re + 1, 1, eToken)
    if (!sc.continued) {
      tokens.splice(rs - 1, 1)
    }
  } else {
    tokens.splice(re + 1, 0, eToken)
  }

  return 0
}

export {
  createFrontmatterTitlepageFinder,
  createHeadingTitlepageMatcher,
  setHeadingTitlepageContainer,
}
