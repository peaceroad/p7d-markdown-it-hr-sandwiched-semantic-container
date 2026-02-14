import { escapeHtmlForAttr } from './label-control.js'

const resolveContainerMaps = (tokens, rs, re, hrType) => {
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
  return {
    startMap: startRefToken?.map || null,
    endMap: endRefToken?.map || null,
  }
}

const createContainerStartToken = (state, sem, displayLabel, hideLabel, fallbackAriaLabel, map) => {
  const sToken = new state.Token('html_block', '', 0)
  let content = '<' + sem.tag
  content += ' class="' + sem.className + '"'

  const attrs = sem.attrs
  const hasAriaLabel = !!sem.hasAriaLabel
  if (attrs.length > 0) {
    for (let ai = 0; ai < attrs.length; ai++) {
      const attrKey = attrs[ai][0]
      const attrVal = attrs[ai][1]
      const isAriaLabel = hasAriaLabel && attrKey === 'aria-label'
      const value = isAriaLabel ? (hideLabel ? fallbackAriaLabel : displayLabel) : attrVal
      content += ' ' + attrKey + '="' + escapeHtmlForAttr(state, value) + '"'
    }
  }

  if (hideLabel && !hasAriaLabel) {
    content += ' aria-label="' + escapeHtmlForAttr(state, fallbackAriaLabel) + '"'
  }

  sToken.content = content + '>\n'
  sToken.block = true
  if (map) {
    sToken.map = [map[0], map[1]]
  }
  return sToken
}

const createContainerEndToken = (state, sem, map) => {
  const eToken = new state.Token('html_block', '', 0)
  eToken.content = '</' + sem.tag + '>\n'
  eToken.block = true
  if (map) {
    eToken.map = [map[0], map[1]]
  }
  return eToken
}

export { resolveContainerMaps, createContainerStartToken, createContainerEndToken }
