const RE_JAPANESE_CHARS = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/

const isLikelyJapaneseText = (value) => !!value && RE_JAPANESE_CHARS.test(value)

const resolveAutoJointLabelStyle = (labelText, enabledAutoMode) => {
  if (!enabledAutoMode) {
    return { joint: '', spacer: ' ' }
  }
  return isLikelyJapaneseText(labelText)
    ? { joint: '：', spacer: '' }
    : { joint: '.', spacer: ' ' }
}

export { resolveAutoJointLabelStyle }
