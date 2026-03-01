const CODE_TAB = 9
const CODE_SPACE = 32
const CODE_STAR = 42
const CODE_MINUS = 45
const CODE_UNDERSCORE = 95
const KEY_SEP = ':'

const isAsciiWhitespace = (code) => code === CODE_SPACE || code === CODE_TAB

const parseHrTypeAtLine = (state, line) => {
  if (state.sCount[line] - state.blkIndent >= 4) return ''
  const start = state.bMarks[line] + state.tShift[line]
  const max = state.eMarks[line]
  if (start >= max) return ''

  let marker = state.src.charCodeAt(start)
  if (marker !== CODE_STAR && marker !== CODE_MINUS && marker !== CODE_UNDERSCORE) return ''
  let count = 0

  for (let i = start; i < max; i++) {
    const code = state.src.charCodeAt(i)
    if (code === marker) {
      count++
      continue
    }
    if (!isAsciiWhitespace(code)) return ''
  }
  if (count < 3) return ''
  return String.fromCharCode(marker)
}

const createCandidateKey = (line, hrType) => String(line) + KEY_SEP + hrType

const createHrBlockCandidateCollector = () => {
  return (state, startLine, endLine, silent) => {
    if (silent) return false

    const hrType = parseHrTypeAtLine(state, startLine)
    if (!hrType) return false

    let contentStartLine = startLine + 1
    while (contentStartLine < endLine && state.isEmpty(contentStartLine)) {
      contentStartLine++
    }
    if (contentStartLine >= endLine) return false
    let endHrLine = -1
    for (let line = contentStartLine + 1; line < endLine; line++) {
      if (parseHrTypeAtLine(state, line) !== hrType) continue
      endHrLine = line
      break
    }
    if (endHrLine < 0) return false

    const env = state.env || (state.env = {})
    const list = Array.isArray(env.semanticContainerHrCandidates)
      ? env.semanticContainerHrCandidates
      : (env.semanticContainerHrCandidates = [])
    const keySet = env.semanticContainerHrCandidateKeySet instanceof Set
      ? env.semanticContainerHrCandidateKeySet
      : (env.semanticContainerHrCandidateKeySet = new Set())
    list.push({
      openHrLine: startLine,
      startLine: contentStartLine,
      hrType,
      endHrLine,
    })
    keySet.add(createCandidateKey(contentStartLine, hrType))
    return false
  }
}

export { createHrBlockCandidateCollector }
