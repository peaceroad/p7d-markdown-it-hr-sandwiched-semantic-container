// Range-end contract:
// - hr path: return the closing hr token index
// - standalone paragraph path: return the index after paragraph_close
// Standard/bracket appliers rely on that offset when they insert wrappers.
const resolveContainerRangeEnd = (tokens, startIndex, hrType) => {
  let endIndex = startIndex
  let paragraphCloseIndex = -1

  while (endIndex < tokens.length) {
    const tokenAtEnd = tokens[endIndex]
    if (tokenAtEnd.type === 'hr') {
      if (hrType && tokenAtEnd.markup.includes(hrType)) {
        return endIndex
      }
      endIndex++
      continue
    }

    if (tokenAtEnd.type === 'paragraph_close' && paragraphCloseIndex === -1) {
      paragraphCloseIndex = endIndex
      if (!hrType) {
        return paragraphCloseIndex + 1
      }
    }

    endIndex++
  }

  if (hrType) return -1
  return paragraphCloseIndex !== -1 ? paragraphCloseIndex + 1 : endIndex
}

const parseHeadingRank = (token) => {
  const tag = token?.tag
  if (!tag || tag.length !== 2 || tag.charCodeAt(0) !== 104) return 0
  const rank = tag.charCodeAt(1) - 48
  return rank >= 1 && rank <= 6 ? rank : 0
}

// Heading-section contract:
// - standalone heading path returns the exclusive token index where the section ends
// - the section closes before a same-level or higher-level heading at the same nesting level
// - the section also closes before leaving the parent structure (token.level drop)
const resolveHeadingSectionRangeEnd = (tokens, startIndex) => {
  const startToken = tokens?.[startIndex]
  const startRank = parseHeadingRank(startToken)
  const startLevel = startToken?.level
  if (!startRank || !Number.isInteger(startLevel)) return -1

  for (let i = startIndex + 1; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.level < startLevel) {
      return i
    }

    if (token.type === 'heading_open' && token.level === startLevel) {
      const rank = parseHeadingRank(token)
      if (rank && rank <= startRank) {
        return i
      }
    }
  }

  return tokens.length
}

export { resolveContainerRangeEnd, resolveHeadingSectionRangeEnd }
