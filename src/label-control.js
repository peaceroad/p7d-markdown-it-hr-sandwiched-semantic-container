const LABEL_ATTR = 'label'

const getAndRemoveTokenAttr = (token, attrName = LABEL_ATTR) => {
  if (!token || !Array.isArray(token.attrs) || token.attrs.length === 0) return undefined
  for (let i = 0; i < token.attrs.length; i++) {
    const attr = token.attrs[i]
    if (!attr || attr[0] !== attrName) continue
    const value = attr[1]
    token.attrs.splice(i, 1)
    if (token.attrs.length === 0) {
      token.attrs = null
    }
    return value
  }
  return undefined
}

const resolveLabelControl = (blockToken, inlineToken, attrName = LABEL_ATTR) => {
  let labelValue = getAndRemoveTokenAttr(blockToken, attrName)
  if (labelValue === undefined) {
    labelValue = getAndRemoveTokenAttr(inlineToken, attrName)
  }
  if (labelValue === undefined) return null
  const normalized = typeof labelValue === 'string' ? labelValue : String(labelValue)
  if (!normalized.trim()) {
    return { hide: true, value: '' }
  }
  return { hide: false, value: normalized }
}

const escapeHtmlForAttr = (state, value) => {
  const stringValue = value === undefined || value === null ? '' : String(value)
  const escapeHtml = state?.md?.utils?.escapeHtml
  return typeof escapeHtml === 'function' ? escapeHtml(stringValue) : stringValue
}

export { LABEL_ATTR, getAndRemoveTokenAttr, resolveLabelControl, escapeHtmlForAttr }
