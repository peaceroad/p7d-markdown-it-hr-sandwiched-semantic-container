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

export { resolveContainerRangeEnd }
