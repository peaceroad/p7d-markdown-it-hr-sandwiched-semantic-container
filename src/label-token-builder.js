const createTextToken = (state, content) => {
  const token = new state.Token('text', '', 0)
  token.content = content
  return token
}

const createLabelWrapperOpenToken = (state, useStrongWrapper, labelClass) => {
  const open = new state.Token(
    useStrongWrapper ? 'strong_open' : 'span_open',
    useStrongWrapper ? 'strong' : 'span',
    1
  )
  open.attrJoin('class', labelClass)
  return open
}

const createLabelWrapperCloseToken = (state, useStrongWrapper) => (
  new state.Token(
    useStrongWrapper ? 'strong_close' : 'span_close',
    useStrongWrapper ? 'strong' : 'span',
    -1
  )
)

const createJointSpanTokens = (state, labelJointClass, content) => {
  const open = new state.Token('span_open', 'span', 1)
  open.attrJoin('class', labelJointClass)
  const text = createTextToken(state, content)
  const close = new state.Token('span_close', 'span', -1)
  return [open, text, close]
}

const createWrappedLabelTokens = (
  state,
  useStrongWrapper,
  labelClass,
  labelText,
  labelJointClass,
  labelJoint = ''
) => {
  const tokens = [
    createLabelWrapperOpenToken(state, useStrongWrapper, labelClass),
    createTextToken(state, labelText),
  ]
  if (labelJoint) {
    tokens.push(...createJointSpanTokens(state, labelJointClass, labelJoint))
  }
  tokens.push(createLabelWrapperCloseToken(state, useStrongWrapper))
  return tokens
}

const createBracketWrappedLabelTokens = (
  state,
  useStrongWrapper,
  labelClass,
  labelJointClass,
  openBracket,
  labelText,
  closeBracket
) => [
  createLabelWrapperOpenToken(state, useStrongWrapper, labelClass),
  ...createJointSpanTokens(state, labelJointClass, openBracket),
  createTextToken(state, labelText),
  ...createJointSpanTokens(state, labelJointClass, closeBracket),
  createLabelWrapperCloseToken(state, useStrongWrapper),
]

export {
  createTextToken,
  createWrappedLabelTokens,
  createBracketWrappedLabelTokens,
}
