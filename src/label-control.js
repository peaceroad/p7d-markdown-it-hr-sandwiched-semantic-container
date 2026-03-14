const LABEL_ATTR = 'label'
const LABEL_TAIL_REGEX_CACHE_MAX = 8
const labelTailRegexCache = new Map()
const CODE_RIGHT_BRACE = 125
const DEFAULT_TAIL_LABEL_MARKER = '{' + LABEL_ATTR

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const buildTailLabelRegex = (attrName) => {
  const key = attrName || LABEL_ATTR
  // Tail-only parser for attrs-less mode:
  // ... {label="..."} / {label='...'} / {label=value}
  const pattern = '(?:^|[ \\t]+)\\{' + escapeRegExp(key)
    + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s{}"\']+))\\}\\s*$'
  return new RegExp(pattern)
}

const DEFAULT_TAIL_LABEL_REGEX = buildTailLabelRegex(LABEL_ATTR)

const getTailLabelRegex = (attrName) => {
  const key = attrName || LABEL_ATTR
  if (key === LABEL_ATTR) return DEFAULT_TAIL_LABEL_REGEX
  const cached = labelTailRegexCache.get(key)
  if (cached) return cached
  const reg = buildTailLabelRegex(key)
  if (labelTailRegexCache.size >= LABEL_TAIL_REGEX_CACHE_MAX) {
    const firstKey = labelTailRegexCache.keys().next().value
    labelTailRegexCache.delete(firstKey)
  }
  labelTailRegexCache.set(key, reg)
  return reg
}

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

const getAndRemoveInlineTailLabel = (inlineToken, attrName = LABEL_ATTR) => {
  const key = attrName || LABEL_ATTR
  const marker = key === LABEL_ATTR ? DEFAULT_TAIL_LABEL_MARKER : '{' + key
  const inlineContent = typeof inlineToken?.content === 'string' ? inlineToken.content : null
  if (inlineContent) {
    const inlineLength = inlineContent.length
    if (!inlineLength || inlineContent.charCodeAt(inlineLength - 1) !== CODE_RIGHT_BRACE) return undefined
    if (inlineContent.lastIndexOf(marker) === -1) return undefined
  }
  if (!inlineToken || !Array.isArray(inlineToken.children) || inlineToken.children.length === 0) return undefined

  let textToken = null
  for (let i = inlineToken.children.length - 1; i >= 0; i--) {
    const child = inlineToken.children[i]
    if (!child) continue
    if (child.type !== 'text') return undefined
    if (!child.content) continue
    textToken = child
    break
  }
  if (!textToken || !textToken.content) return undefined
  const content = textToken.content
  const contentLength = content.length
  if (!contentLength || content.charCodeAt(contentLength - 1) !== CODE_RIGHT_BRACE) return undefined
  if (content.lastIndexOf(marker) === -1) return undefined

  const tailReg = getTailLabelRegex(key)
  const match = tailReg.exec(content)
  if (!match) return undefined

  const matched = match[0]
  const value = match[1] ?? match[2] ?? match[3] ?? ''
  textToken.content = content.slice(0, contentLength - matched.length)

  if (typeof inlineToken.content === 'string' && inlineToken.content.endsWith(matched)) {
    inlineToken.content = inlineToken.content.slice(0, inlineToken.content.length - matched.length)
  }

  return value
}

const resolveLabelControl = (
  blockToken,
  inlineToken,
  attrName = LABEL_ATTR,
  fallbackInlineTail = false
) => {
  let labelValue = getAndRemoveTokenAttr(blockToken, attrName)
  if (labelValue === undefined) {
    labelValue = getAndRemoveTokenAttr(inlineToken, attrName)
  }
  if (labelValue === undefined && fallbackInlineTail) {
    labelValue = getAndRemoveInlineTailLabel(inlineToken, attrName)
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
