import { escapeHtmlForAttr } from './label-control.js'

const createContainerStartToken = (state, sem, className, displayLabel, hideLabel, fallbackAriaLabel, map) => {
  const sToken = new state.Token('html_block', '', 0)
  let content = '<' + sem.tag
  content += ' class="' + className + '"'

  const attrs = sem.attrs
  let hasAriaLabel = false
  if (attrs.length > 0) {
    for (let ai = 0; ai < attrs.length; ai++) {
      const attrKey = attrs[ai][0]
      const attrVal = attrs[ai][1]
      const isAriaLabel = attrKey === 'aria-label'
      if (isAriaLabel) {
        hasAriaLabel = true
      }
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

export { createContainerStartToken, createContainerEndToken }
