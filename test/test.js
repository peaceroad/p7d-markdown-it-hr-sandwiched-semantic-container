import assert from 'assert'
import fs from 'fs'
import path from 'path'
import mdit from 'markdown-it'
import mditAttrs from 'markdown-it-attrs'
import mditFrontMatter from 'markdown-it-front-matter'
import mditMeta from 'markdown-it-meta'
import mditSemanticContainer from '../index.js'
import mditCjkBreaks from '@peaceroad/markdown-it-cjk-breaks-mod'
import mditFootnoteHere from '@peaceroad/markdown-it-footnote-here'
import mditStrongJa from '@peaceroad/markdown-it-strong-ja'
import mditFigureWithPCaption from '@peaceroad/markdown-it-figure-with-p-caption'
import { resolveLabelControl } from '../src/label-control.js'


const md = mdit().use(mditSemanticContainer).use(mditFootnoteHere)
const mdJa = mdit().use(mditStrongJa).use(mditFootnoteHere).use(mditSemanticContainer)
const mdJaWithFigure = mdit()
  .use(mditStrongJa)
  .use(mditFootnoteHere)
  .use(mditFigureWithPCaption)
  .use(mditSemanticContainer)

const mdRequireHrAtOneParagraph = mdit().use(mditSemanticContainer, {requireHrAtOneParagraph: true})
const mdRequireHrAtOneParagraphJa = mdit().use(mditStrongJa).use(mditSemanticContainer, {requireHrAtOneParagraph: true})
const mdRequireHrBracket = mdit().use(mditSemanticContainer, {
  requireHrAtOneParagraph: true,
  allowBracketJoint: true,
})
const mdHeadingSection = mdit().use(mditSemanticContainer, { headingSectionContainer: true })
const mdHeadingSectionRequireHr = mdit().use(mditSemanticContainer, {
  headingSectionContainer: true,
  requireHrAtOneParagraph: true,
})
const mdHeadingSectionBracket = mdit().use(mditSemanticContainer, {
  headingSectionContainer: true,
  allowBracketJoint: true,
})
const mdRequireHrAllFeatures = mdit().use(mditSemanticContainer, {
  requireHrAtOneParagraph: true,
  allowBracketJoint: true,
  githubTypeContainer: true,
})

const mdRemoveJointAtLineEnd = mdit().use(mditSemanticContainer, {removeJointAtLineEnd: true})
const mdRemoveJointAtLineEndJa = mdit().use(mditStrongJa).use(mditSemanticContainer, {removeJointAtLineEnd: true})

const mdGitHubAlerts = mdit().use(mditSemanticContainer, {
  githubTypeContainer: true,
}).use(mditStrongJa)
const mdGitHubAlertsInlineTitle = mdit().use(mditSemanticContainer, {
  githubTypeContainer: true,
  githubTypeInlineLabel: true,
})
const mdGitHubAlertsInlineTitleMixin = mdit().use(mditSemanticContainer, {
  githubTypeContainer: true,
  githubTypeInlineLabel: true,
  githubTypeInlineLabelHeadingMixin: true,
})

const mdBracketFormat = mdit().use(mditSemanticContainer, {allowBracketJoint: true})
const mdBracketJointModeRemove = mdit().use(mditSemanticContainer, {
  allowBracketJoint: true,
  bracketLabelJointMode: 'remove',
})
const mdBracketJointModeAuto = mdit().use(mditSemanticContainer, {
  allowBracketJoint: true,
  bracketLabelJointMode: 'auto',
})
const mdBracketJointModeRemoveLabelControl = mdit().use(mditAttrs).use(mditSemanticContainer, {
  allowBracketJoint: true,
  bracketLabelJointMode: 'remove',
  labelControl: true,
})
const mdBracketJointModeAutoLabelControl = mdit().use(mditAttrs).use(mditSemanticContainer, {
  allowBracketJoint: true,
  bracketLabelJointMode: 'auto',
  labelControl: true,
})
const mdAllFeatures = mdit().use(mditSemanticContainer, {
  allowBracketJoint: true,
  githubTypeContainer: true,
})
const mdLanguagesEnOnly = mdit().use(mditSemanticContainer, {languages: []})
const mdLanguagesString = mdit().use(mditSemanticContainer, {languages: 'ja'})
const mdLanguagesDuplicate = mdit().use(mditSemanticContainer, {languages: ['ja', 'ja']})
const mdLabelControl = mdit().use(mditAttrs).use(mditSemanticContainer, {labelControl: true})
const mdLabelControlOff = mdit().use(mditAttrs).use(mditSemanticContainer, {labelControl: false})
const mdLabelControlNoAttrs = mdit().use(mditSemanticContainer, { labelControl: true, labelControlInlineFallback: true })
const mdLabelControlNoAttrsFallbackOff = mdit().use(mditSemanticContainer, { labelControl: true, labelControlInlineFallback: false })
const mdLabelControlBracket = mdit().use(mditAttrs).use(mditSemanticContainer, {allowBracketJoint: true, labelControl: true})
const mdLabelControlBracketOff = mdit().use(mditAttrs).use(mditSemanticContainer, {allowBracketJoint: true, labelControl: false})
const mdLabelControlBracketNoAttrs = mdit().use(mditSemanticContainer, { allowBracketJoint: true, labelControl: true, labelControlInlineFallback: true })
const mdLabelControlHeadingSection = mdit().use(mditAttrs).use(mditSemanticContainer, {
  headingSectionContainer: true,
  labelControl: true,
})
const mdLabelControlGitHub = mdit().use(mditAttrs).use(mditSemanticContainer, {
  githubTypeContainer: true,
  labelControl: true
})
const mdLabelControlGitHubNoAttrs = mdit().use(mditSemanticContainer, {
  githubTypeContainer: true,
  labelControl: true,
  labelControlInlineFallback: true
})
const mdLabelControlGitHubOff = mdit().use(mditAttrs).use(mditSemanticContainer, {
  githubTypeContainer: true,
  labelControl: false
})
const mdLabelControlGitHubInlineTitle = mdit().use(mditAttrs).use(mditSemanticContainer, {
  githubTypeContainer: true,
  githubTypeInlineLabel: true,
  labelControl: true
})
const mdLabelControlGitHubInlineTitleMixin = mdit().use(mditAttrs).use(mditSemanticContainer, {
  githubTypeContainer: true,
  githubTypeInlineLabel: true,
  githubTypeInlineLabelHeadingMixin: true,
  labelControl: true
})
const mdLabelControlGitHubInlineTitleAuto = mdit().use(mditAttrs).use(mditSemanticContainer, {
  githubTypeContainer: true,
  githubTypeInlineLabel: true,
  githubTypeInlineLabelJoint: 'auto',
  labelControl: true
})
const mdLabelControlGitHubInlineTitleMixinAuto = mdit().use(mditAttrs).use(mditSemanticContainer, {
  githubTypeContainer: true,
  githubTypeInlineLabel: true,
  githubTypeInlineLabelHeadingMixin: true,
  githubTypeInlineLabelJoint: 'auto',
  labelControl: true
})
const mdLabelControlGitHubInlineTitleOff = mdit().use(mditAttrs).use(mditSemanticContainer, {
  githubTypeContainer: true,
  githubTypeInlineLabel: true,
  labelControl: false
})
const mdMetaSc = mdit().use(mditMeta).use(mditSemanticContainer)
const parseFrontMatterNotice = (raw) => {
  const match = String(raw || '').match(/(?:^|\n)\s*notice\s*:\s*["']?([^"'\n]+)["']?\s*$/m)
  if (!match) return {}
  return { sc: { notice: match[1].trim() } }
}
const mdFrontMatterSc = mdit()
mdFrontMatterSc.use(mditFrontMatter, (fm) => {
  mdFrontMatterSc.frontmatter = parseFrontMatterNotice(fm)
})
mdFrontMatterSc.use(mditSemanticContainer)
const mdFrontMatterMetaSc = mdit()
mdFrontMatterMetaSc.meta = {}
mdFrontMatterMetaSc.use(mditFrontMatter, (fm) => {
  const parsed = parseFrontMatterNotice(fm)
  mdFrontMatterMetaSc.meta.sc = parsed.sc
})
mdFrontMatterMetaSc.use(mditSemanticContainer)

let __dirname = path.dirname(new URL(import.meta.url).pathname)
const isWindows = (process.platform === 'win32')
if (isWindows) {
  __dirname = __dirname.replace(/^\/+/, '').replace(/\//g, '\\')
}

const testData = {
  noOption: __dirname + path.sep +  'examples.txt',
  htmlLabels: __dirname + path.sep + 'examples-html-labels.txt',
  requireHrAtOneParagraph: __dirname + path.sep +  'examples-require-hr-at-one-paragraph.txt',
  requireHrMixedOptions: __dirname + path.sep + 'examples-require-hr-mixed-options.txt',
  removeJointAtLineEnd: __dirname + path.sep + 'examples-remove-joint-at-line-end.txt',
  complex: __dirname + path.sep + 'examples-complex.txt',
  githubAlerts: __dirname + path.sep + 'examples-github-type-container.txt',
  githubAlertsInlineTitle: __dirname + path.sep + 'examples-github-type-container-inline-title.txt',
  bracketFormat: __dirname + path.sep + 'examples-bracket-format.txt',
  mixedFeatures: __dirname + path.sep + 'examples-mixed-types.txt',
  languagesEnOnly: __dirname + path.sep + 'examples-languages-en-only.txt',
  languagesNonArrayOrDuplicate: __dirname + path.sep + 'examples-languages-nonarray-and-duplicate.txt',
  strongJaWithFigure: __dirname + path.sep + 'examples-strong-ja-figure-with-p-caption.txt',
  labelControl: __dirname + path.sep + 'examples-label-control.txt',
  labelControlBracket: __dirname + path.sep + 'examples-label-control-bracket.txt',
  bracketJointMode: __dirname + path.sep + 'examples-bracket-label-joint-mode.txt',
  bracketJointModeLabelControl: __dirname + path.sep + 'examples-bracket-label-joint-mode-label-control.txt',
  labelControlGitHub: __dirname + path.sep + 'examples-label-control-github.txt',
  labelControlGitHubInlineTitle: __dirname + path.sep + 'examples-label-control-github-inline-title.txt',
  headingSection: __dirname + path.sep + 'examples-heading-section-container.txt',
  headingSectionBracket: __dirname + path.sep + 'examples-heading-section-container-bracket.txt',
  headingSectionLabelControl: __dirname + path.sep + 'examples-heading-section-container-label-control.txt',
}

const getTestData = (pat) => {
  let ms = [];
  if(!fs.existsSync(pat)) {
    console.log('No exist: ' + pat)
    return ms
  }
  const exampleCont = fs.readFileSync(pat, 'utf-8').trim();

  let ms0 = exampleCont.split(/\n*\[Markdown\]\n/);
  let n = 1;
  while(n < ms0.length) {
    const entry = ms0[n]
    const htmlByLabel = {}
    const htmlHeaders = Array.from(entry.matchAll(/\n+\[HTML(?:\:([^\]]+))?\]\n/g))
    let markdown = ''

    if (htmlHeaders.length === 0) {
      markdown = entry
      htmlByLabel.default = ''
    } else {
      markdown = entry.slice(0, htmlHeaders[0].index)
      for (let hi = 0; hi < htmlHeaders.length; hi++) {
        const header = htmlHeaders[hi]
        const label = header[1] ? header[1].trim() : 'default'
        const start = header.index + header[0].length
        const end = hi + 1 < htmlHeaders.length ? htmlHeaders[hi + 1].index : entry.length
        const labelKey = label || 'default'
        // Keep the first block for a label to preserve legacy behavior.
        if (htmlByLabel[labelKey] === undefined) {
          htmlByLabel[labelKey] = entry.slice(start, end).replace(/$/, '\n')
        }
      }
    }

    const firstHtmlLabel = Object.keys(htmlByLabel)[0]
    const htmlDefault = htmlByLabel.default !== undefined
      ? htmlByLabel.default
      : (firstHtmlLabel ? htmlByLabel[firstHtmlLabel] : '')

    ms[n] = {
      "markdown": markdown,
      "html": htmlDefault,
      "htmlByLabel": htmlByLabel,
    };
    n++;
  }
  return ms
}

const runTest = (process, pat, pass, testId, htmlLabel = 'default') => {
  console.log('===========================================================')
  console.log(pat)
  let ms = getTestData(pat)
  if (ms.length === 0) return
  let n = 1;
  let end = ms.length - 1
  if(testId) {
    if (testId[0]) n = testId[0]
    if (testId[1]) {
      if (ms.length >= testId[1]) {
        end = testId[1]
      }
    }
  }
  //console.log(n, end)

  while(n <= end) {

    if (!ms[n]
       //|| n != 1
       //|| n != 7
    ) {
      n++
      continue
    }

    const m = ms[n].markdown;
    const h = process.render(m)
    const expectedHtml = ms[n].htmlByLabel?.[htmlLabel] ?? ms[n].html
    console.log('Test: ' + n + ' >>>');
    try {
      assert.strictEqual(h, expectedHtml);
    } catch(e) {
      pass = false
      //console.log('Test: ' + n + ' >>>');
      //console.log(opt);
      console.log(ms[n].markdown);
      console.log('incorrect:');
      console.log('H: ' + h +'C: ' + expectedHtml);
    }
    n++;
  }
  return pass
}

const runDirectTest = (title, pass, fn) => {
  console.log('Direct Test: ' + title + ' >>>')
  try {
    fn()
  } catch (e) {
    pass = false
    console.log(e?.stack || e)
  }
  return pass
}

let pass = true
pass = runTest(md, testData.noOption, pass)
pass = runTest(md, testData.htmlLabels, pass)
pass = runTest(mdRequireHrAtOneParagraph, testData.htmlLabels, pass, undefined, 'requireHrAtOneParagraph')
pass = runTest(mdRequireHrAtOneParagraph, testData.requireHrAtOneParagraph, pass)
pass = runTest(mdRequireHrAllFeatures, testData.requireHrMixedOptions, pass)
pass = runTest(mdRemoveJointAtLineEnd, testData.removeJointAtLineEnd, pass)
pass = runTest(md, testData.complex, pass)
pass = runTest(mdLanguagesEnOnly, testData.languagesEnOnly, pass)
pass = runTest(mdLanguagesString, testData.languagesNonArrayOrDuplicate, pass)
pass = runTest(mdLanguagesDuplicate, testData.languagesNonArrayOrDuplicate, pass)
pass = runTest(mdLabelControl, testData.labelControl, pass)
pass = runTest(mdLabelControlOff, testData.labelControl, pass, undefined, 'labelControlOff')
pass = runTest(mdLabelControlBracket, testData.labelControlBracket, pass)
pass = runTest(mdLabelControlBracketOff, testData.labelControlBracket, pass, undefined, 'labelControlOff')
pass = runTest(mdBracketJointModeRemove, testData.bracketJointMode, pass, undefined, 'remove')
pass = runTest(mdBracketJointModeAuto, testData.bracketJointMode, pass, undefined, 'auto')
pass = runTest(mdBracketJointModeRemoveLabelControl, testData.bracketJointModeLabelControl, pass, undefined, 'remove')
pass = runTest(mdBracketJointModeAutoLabelControl, testData.bracketJointModeLabelControl, pass, undefined, 'auto')
pass = runTest(mdLabelControlGitHub, testData.labelControlGitHub, pass)
pass = runTest(mdLabelControlGitHubOff, testData.labelControlGitHub, pass, undefined, 'labelControlOff')
pass = runTest(mdLabelControlGitHubInlineTitle, testData.labelControlGitHubInlineTitle, pass)
pass = runTest(mdLabelControlGitHubInlineTitleMixin, testData.labelControlGitHubInlineTitle, pass, undefined, 'mixin')
pass = runTest(mdLabelControlGitHubInlineTitleAuto, testData.labelControlGitHubInlineTitle, pass, undefined, 'autoJoint')
pass = runTest(mdLabelControlGitHubInlineTitleMixinAuto, testData.labelControlGitHubInlineTitle, pass, undefined, 'mixinAutoJoint')
pass = runTest(mdLabelControlGitHubInlineTitleOff, testData.labelControlGitHubInlineTitle, pass, undefined, 'labelControlOff')
console.log('\nstrongJa: true ::::::::::::::::::::::::::::::::::::::::::::')
pass = runTest(mdJa, testData.noOption, pass)
pass = runTest(mdRequireHrAtOneParagraphJa, testData.requireHrAtOneParagraph, pass)
pass = runTest(mdRemoveJointAtLineEndJa, testData.removeJointAtLineEnd, pass)
pass = runTest(mdJa, testData.complex, pass)
console.log('\nstrongJa + figure-with-p-caption :::::::::::::::::::::::::::::::::')
pass = runTest(mdJaWithFigure, testData.strongJaWithFigure, pass)

pass = runTest(mdGitHubAlerts, testData.githubAlerts, pass)
pass = runTest(mdGitHubAlertsInlineTitle, testData.githubAlertsInlineTitle, pass)
pass = runTest(mdGitHubAlertsInlineTitleMixin, testData.githubAlertsInlineTitle, pass, undefined, 'mixin')
pass = runTest(mdBracketFormat, testData.bracketFormat, pass)
pass = runTest(mdAllFeatures, testData.mixedFeatures, pass)
pass = runTest(mdHeadingSection, testData.headingSection, pass)
pass = runTest(mdHeadingSectionRequireHr, testData.headingSection, pass)
pass = runTest(mdHeadingSectionBracket, testData.headingSectionBracket, pass)
pass = runTest(mdLabelControlHeadingSection, testData.headingSectionLabelControl, pass)

pass = runDirectTest('sc alias standard', pass, () => {
  const env = { semanticContainerSc: { notice: 'お知らせ' } }
  const markdown = '---\n\nお知らせ：本文。\n\n---\n'
  const html = md.render(markdown, env)
  const expected = '<section class="sc-notice" role="doc-notice">\n'
    + '<p><span class="sc-notice-label">お知らせ<span class="sc-notice-label-joint">：</span></span>本文。</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
  assert.strictEqual(Array.isArray(env.semanticContainerWarnings), false)
})

pass = runDirectTest('sc hide standard', pass, () => {
  const env = { semanticContainerSc: { notice: '' } }
  const markdown = '---\n\nNotice. Body.\n\n---\n'
  const html = md.render(markdown, env)
  const expected = '<section class="sc-notice" role="doc-notice" aria-label="Notice">\n'
    + '<p>Body.</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('inline label overrides sc hide', pass, () => {
  const env = { semanticContainerSc: { notice: '' } }
  const markdown = '---\n\nNotice. Body. {label="Custom"}\n\n---\n'
  const html = mdLabelControl.render(markdown, env)
  const expected = '<section class="sc-notice" role="doc-notice">\n'
    + '<p><span class="sc-notice-label">Custom<span class="sc-notice-label-joint">.</span></span> Body.</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('labelControl works without markdown-it-attrs (standard)', pass, () => {
  const markdown = '---\n\nNotice. Body. {label="Custom"}\n\n---\n'
  const html = mdLabelControlNoAttrs.render(markdown)
  const expected = '<section class="sc-notice" role="doc-notice">\n'
    + '<p><span class="sc-notice-label">Custom<span class="sc-notice-label-joint">.</span></span> Body.</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('labelControl fallback can be disabled without markdown-it-attrs', pass, () => {
  const markdown = '---\n\nNotice. Body. {label="Custom"}\n\n---\n'
  const html = mdLabelControlNoAttrsFallbackOff.render(markdown)
  const expected = '<section class="sc-notice" role="doc-notice">\n'
    + '<p><span class="sc-notice-label">Notice<span class="sc-notice-label-joint">.</span></span> Body. {label=&quot;Custom&quot;}</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('labelControl works without markdown-it-attrs (bracket)', pass, () => {
  const markdown = '---\n\n[Notice] Body. {label="通知"}\n\n---\n'
  const html = mdLabelControlBracketNoAttrs.render(markdown)
  const expected = '<section class="sc-notice" role="doc-notice">\n'
    + '<p><span class="sc-notice-label"><span class="sc-notice-label-joint">[</span>通知<span class="sc-notice-label-joint">]</span></span> Body.</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('labelControl works without markdown-it-attrs (github)', pass, () => {
  const markdown = '> [!NOTE] {label="通知"}\n>\n> Body.\n'
  const html = mdLabelControlGitHubNoAttrs.render(markdown)
  const expected = '<section class="sc-note" role="doc-notice">\n'
    + '<p><strong class="sc-note-label">通知</strong></p>\n'
    + '<p></p>\n'
    + '<p>Body.</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('labelControl fallback supports partial inline tokens without inline content', pass, () => {
  const inlineToken = {
    children: [
      { type: 'text', content: 'Body. {label="Custom"}' }
    ]
  }
  const resolved = resolveLabelControl(null, inlineToken, undefined, true)
  assert.deepStrictEqual(resolved, { hide: false, value: 'Custom' })
  assert.strictEqual(inlineToken.children[0].content, 'Body.')
})

pass = runDirectTest('runtime sc alias treats regex metacharacters literally (standard)', pass, () => {
  const exactHtml = md.render('---\n\nNo+tice. Body.\n\n---\n', {
    semanticContainerSc: { notice: 'No+tice' }
  })
  assert.strictEqual(exactHtml.includes('<section class="sc-notice"'), true)

  const overmatchHtml = md.render('---\n\nNootice. Body.\n\n---\n', {
    semanticContainerSc: { notice: 'No+tice' }
  })
  assert.strictEqual(overmatchHtml.includes('<section class="sc-notice"'), false)
})

pass = runDirectTest('runtime sc alias treats regex metacharacters literally (bracket)', pass, () => {
  const exactHtml = mdBracketFormat.render('---\n\n[A|B] Body.\n\n---\n', {
    semanticContainerSc: { notice: 'A|B' }
  })
  assert.strictEqual(exactHtml.includes('<section class="sc-notice"'), true)

  const overmatchHtml = mdBracketFormat.render('---\n\n[A] Body.\n\n---\n', {
    semanticContainerSc: { notice: 'A|B' }
  })
  assert.strictEqual(overmatchHtml.includes('<section class="sc-notice"'), false)
})

pass = runDirectTest('runtime sc alias treats regex metacharacters literally (github)', pass, () => {
  const exactHtml = mdGitHubAlerts.render('> [!No+tice]\n> Body.\n', {
    semanticContainerSc: { notice: 'No+tice' }
  })
  assert.strictEqual(exactHtml.includes('<section class="sc-notice"'), true)

  const overmatchHtml = mdGitHubAlerts.render('> [!Nootice]\n> Body.\n', {
    semanticContainerSc: { notice: 'No+tice' }
  })
  assert.strictEqual(overmatchHtml.includes('<section class="sc-notice"'), false)
})

pass = runDirectTest('runtime sc alias with regex syntax characters does not throw', pass, () => {
  const html = md.render('---\n\nBad). Body.\n\n---\n', {
    semanticContainerSc: { notice: 'Bad)' }
  })
  assert.strictEqual(html.includes('<section class="sc-notice"'), true)
})

pass = runDirectTest('sc alias bracket', pass, () => {
  const env = { semanticContainerSc: { notice: 'お知らせ' } }
  const markdown = '---\n\n[お知らせ] 本文。\n\n---\n'
  const html = mdBracketFormat.render(markdown, env)
  const expected = '<section class="sc-notice" role="doc-notice">\n'
    + '<p><span class="sc-notice-label"><span class="sc-notice-label-joint">[</span>お知らせ<span class="sc-notice-label-joint">]</span></span> 本文。</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('sc alias github', pass, () => {
  const env = { semanticContainerSc: { notice: 'お知らせ' } }
  const markdown = '> [!お知らせ]\n> 本文。\n'
  const html = mdGitHubAlerts.render(markdown, env)
  const expected = '<section class="sc-notice" role="doc-notice">\n'
    + '<p><strong class="sc-notice-label"><span class="sc-notice-label-joint">[</span>お知らせ<span class="sc-notice-label-joint">]</span></strong></p>\n'
    + '<p>本文。</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('sc hide bracket', pass, () => {
  const env = { semanticContainerSc: { notice: '' } }
  const markdown = '---\n\n[Notice] Body.\n\n---\n'
  const html = mdBracketFormat.render(markdown, env)
  const expected = '<section class="sc-notice" role="doc-notice" aria-label="Notice">\n'
    + '<p>Body.</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('sc hide github', pass, () => {
  const env = { semanticContainerSc: { notice: '' } }
  const markdown = '> [!NOTICE]\n> Body.\n'
  const html = mdGitHubAlerts.render(markdown, env)
  const expected = '<section class="sc-notice" role="doc-notice" aria-label="NOTICE">\n'
    + '<p>Body.</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('sc alias conflict warning', pass, () => {
  const env = { semanticContainerSc: { note: 'Notice' } }
  const markdown = '---\n\nNotice. Body.\n\n---\n'
  const html = md.render(markdown, env)
  const expected = '<section class="sc-notice" role="doc-notice">\n'
    + '<p><span class="sc-notice-label">Notice<span class="sc-notice-label-joint">.</span></span> Body.</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
  assert.strictEqual(Array.isArray(env.semanticContainerWarnings), true)
  assert.strictEqual(env.semanticContainerWarnings.length > 0, true)
})

pass = runDirectTest('semanticContainerWarnings reset on env reuse', pass, () => {
  const env = { semanticContainerSc: { note: 'Notice' } }
  md.render('---\n\nNotice. Body.\n\n---\n', env)
  assert.strictEqual(Array.isArray(env.semanticContainerWarnings), true)
  assert.strictEqual(env.semanticContainerWarnings.length > 0, true)

  env.semanticContainerSc = { notice: 'お知らせ' }
  md.render('---\n\nお知らせ：本文。\n\n---\n', env)
  assert.strictEqual(Array.isArray(env.semanticContainerWarnings), true)
  assert.strictEqual(env.semanticContainerWarnings.length, 0)
})

pass = runDirectTest('sc alias via env.frontmatter.sc', pass, () => {
  const env = { frontmatter: { sc: { notice: '特別通知' } } }
  const markdown = '---\n\n特別通知：本文。\n\n---\n'
  const html = md.render(markdown, env)
  const expected = '<section class="sc-notice" role="doc-notice">\n'
    + '<p><span class="sc-notice-label">特別通知<span class="sc-notice-label-joint">：</span></span>本文。</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('semanticContainerSc precedence over env.frontmatter.sc', pass, () => {
  const env = {
    semanticContainerSc: { notice: '先頭入力' },
    frontmatter: { sc: { notice: '後続入力' } },
  }
  const markdown = '---\n\n先頭入力：本文。\n\n---\n'
  const html = md.render(markdown, env)
  assert.strictEqual(html.includes('<section class="sc-notice"'), true)
  assert.strictEqual(html.includes('先頭入力'), true)
})

pass = runDirectTest('sc alias via markdown-it-meta', pass, () => {
  const markdown = '---\nsc:\n  notice: "特別通知"\n---\n\n---\n\n特別通知：本文。\n\n---\n'
  const html = mdMetaSc.render(markdown)
  assert.strictEqual(html.includes('<section class="sc-notice"'), true)
  assert.strictEqual(html.includes('特別通知'), true)
})

pass = runDirectTest('markdown-it-meta sc does not leak to next render', pass, () => {
  mdMetaSc.render('---\nsc:\n  notice: "特別通知"\n---\n\n---\n\n特別通知：本文。\n\n---\n')
  const html = mdMetaSc.render('---\n\n特別通知：本文。\n\n---\n')
  assert.strictEqual(html.includes('<section class="sc-notice"'), false)
})

pass = runDirectTest('sc alias via markdown-it-front-matter (md.frontmatter.sc)', pass, () => {
  const markdown = '---\nsc:\n  notice: "特別通知"\n---\n\n---\n\n特別通知：本文。\n\n---\n'
  const html = mdFrontMatterSc.render(markdown)
  assert.strictEqual(html.includes('<section class="sc-notice"'), true)
  assert.strictEqual(html.includes('特別通知'), true)
})

pass = runDirectTest('markdown-it-front-matter md.frontmatter.sc does not leak to next render', pass, () => {
  mdFrontMatterSc.render('---\nsc:\n  notice: "特別通知"\n---\n\n---\n\n特別通知：本文。\n\n---\n')
  const html = mdFrontMatterSc.render('---\n\n特別通知：本文。\n\n---\n')
  assert.strictEqual(html.includes('<section class="sc-notice"'), false)
})

pass = runDirectTest('sc alias via markdown-it-front-matter (md.meta.sc)', pass, () => {
  const markdown = '---\nsc:\n  notice: "特別通知"\n---\n\n---\n\n特別通知：本文。\n\n---\n'
  const html = mdFrontMatterMetaSc.render(markdown)
  assert.strictEqual(html.includes('<section class="sc-notice"'), true)
  assert.strictEqual(html.includes('特別通知'), true)
})

pass = runDirectTest('markdown-it-front-matter md.meta.sc does not leak to next render', pass, () => {
  mdFrontMatterMetaSc.render('---\nsc:\n  notice: "特別通知"\n---\n\n---\n\n特別通知：本文。\n\n---\n')
  const html = mdFrontMatterMetaSc.render('---\n\n特別通知：本文。\n\n---\n')
  assert.strictEqual(html.includes('<section class="sc-notice"'), false)
})

pass = runDirectTest('block hr candidates are collected', pass, () => {
  const env = {}
  md.render('---\n\nNotice. Body.\n\n---\n', env)
  assert.strictEqual(Array.isArray(env.semanticContainerHrCandidates), true)
  assert.strictEqual(env.semanticContainerHrCandidates.length > 0, true)
  assert.strictEqual(env.semanticContainerHrCandidates[0].hrType, '-')
  assert.strictEqual(env.semanticContainerHrCandidates[0].openHrLine, 0)
  assert.strictEqual(env.semanticContainerHrCandidates[0].startLine, 2)
  assert.strictEqual(env.semanticContainerHrCandidates[0].endHrLine, 4)
  assert.strictEqual(env.semanticContainerHrCandidateKeySet instanceof Set, true)
  assert.strictEqual(env.semanticContainerHrCandidateKeySet.has('2:-'), true)
})

pass = runDirectTest('block hr candidates reset on env reuse', pass, () => {
  const env = {}
  md.render('---\n\nNotice. Body.\n\n---\n', env)
  assert.strictEqual(env.semanticContainerHrCandidates.length > 0, true)
  assert.strictEqual(env.semanticContainerHrCandidateKeySet.size > 0, true)
  md.render('A paragraph only.\n', env)
  assert.strictEqual(Array.isArray(env.semanticContainerHrCandidates), true)
  assert.strictEqual(env.semanticContainerHrCandidates.length, 0)
  assert.strictEqual(env.semanticContainerHrCandidateKeySet instanceof Set, true)
  assert.strictEqual(env.semanticContainerHrCandidateKeySet.size, 0)
})

pass = runDirectTest('block hr candidates normalize setext underline to the next actual hr', pass, () => {
  const env = {}
  mdRequireHrAtOneParagraph.render('---\n\nNotice. Body.\n\nSubhead\n---\n\n---\n', env)
  assert.strictEqual(Array.isArray(env.semanticContainerHrCandidates), true)
  assert.strictEqual(env.semanticContainerHrCandidates.length, 1)
  assert.strictEqual(env.semanticContainerHrCandidates[0].startLine, 2)
  assert.strictEqual(env.semanticContainerHrCandidates[0].endHrLine, 7)
  assert.strictEqual(env.semanticContainerHrCandidateKeySet instanceof Set, true)
  assert.strictEqual(env.semanticContainerHrCandidateKeySet.has('2:-'), true)
})

pass = runDirectTest('block hr candidates drop setext underline without an actual closing hr', pass, () => {
  const env = {}
  mdRequireHrAtOneParagraph.render('---\n\nNotice. Body.\n\nSubhead\n---\n', env)
  assert.strictEqual(Array.isArray(env.semanticContainerHrCandidates), true)
  assert.strictEqual(env.semanticContainerHrCandidates.length, 0)
  assert.strictEqual(env.semanticContainerHrCandidateKeySet instanceof Set, true)
  assert.strictEqual(env.semanticContainerHrCandidateKeySet.size, 0)
})

pass = runDirectTest('requireHr hr-candidate runner handles standard + bracket mixed', pass, () => {
  const markdown = '---\n\nNotice. Standard body.\n\n---\n\n[Notice] Bracket body.\n\n---\n'
  const html = mdRequireHrBracket.render(markdown)
  const expected = '<section class="sc-notice" role="doc-notice">\n'
    + '<p><span class="sc-notice-label">Notice<span class="sc-notice-label-joint">.</span></span> Standard body.</p>\n'
    + '</section>\n'
    + '<section class="sc-notice" role="doc-notice">\n'
    + '<p><span class="sc-notice-label"><span class="sc-notice-label-joint">[</span>Notice<span class="sc-notice-label-joint">]</span></span> Bracket body.</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('non-requireHr hr candidates are applied once and skip re-apply', pass, () => {
  const mdDefault = mdit().use(mditSemanticContainer)
  const markdown = '---\n\nNotice. Hr body.\n\n---\n\nNotice. One body.\n'
  const html = mdDefault.render(markdown)
  const expected = '<section class="sc-notice" role="doc-notice">\n'
    + '<p><span class="sc-notice-label">Notice<span class="sc-notice-label-joint">.</span></span> Hr body.</p>\n'
    + '</section>\n'
    + '<section class="sc-notice" role="doc-notice">\n'
    + '<p><span class="sc-notice-label">Notice<span class="sc-notice-label-joint">.</span></span> One body.</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('headingSection hr candidates are applied once and skip heading re-apply', pass, () => {
  const markdown = '---\n\n## Column: Title\n\nBody.\n\n---\n'
  const html = mdHeadingSection.render(markdown)
  const expected = '<aside class="sc-column">\n'
    + '<h2><span class="sc-column-label">Column<span class="sc-column-label-joint">:</span></span> Title</h2>\n'
    + '<p>Body.</p>\n'
    + '</aside>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('headingSection shared hr consecutive headings render as siblings', pass, () => {
  const markdown = '---\n\n## Column: First\n\n---\n\n## Column: Second\n\n---\n'
  const html = mdHeadingSection.render(markdown)
  const expected = '<aside class="sc-column">\n'
    + '<h2><span class="sc-column-label">Column<span class="sc-column-label-joint">:</span></span> First</h2>\n'
    + '</aside>\n'
    + '<aside class="sc-column">\n'
    + '<h2><span class="sc-column-label">Column<span class="sc-column-label-joint">:</span></span> Second</h2>\n'
    + '</aside>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('headingSection shared hr empty-title headings render as siblings', pass, () => {
  const markdown = '---\n\n## コラム：\n\n---\n\n## コラム：\n\n---\n'
  const html = mdHeadingSection.render(markdown)
  const expected = '<aside class="sc-column">\n'
    + '<h2><span class="sc-column-label">コラム<span class="sc-column-label-joint">：</span></span></h2>\n'
    + '</aside>\n'
    + '<aside class="sc-column">\n'
    + '<h2><span class="sc-column-label">コラム<span class="sc-column-label-joint">：</span></span></h2>\n'
    + '</aside>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('github candidate lines are collected and reset on env reuse', pass, () => {
  const env = {}
  mdGitHubAlerts.render('> [!NOTE]\n> body\n', env)
  assert.strictEqual(env.semanticContainerGitHubCandidateLineSet instanceof Set, true)
  assert.strictEqual(env.semanticContainerGitHubCandidateLineSet.has(0), true)

  mdGitHubAlerts.render('Paragraph only.\n', env)
  assert.strictEqual(env.semanticContainerGitHubCandidateLineSet instanceof Set, true)
  assert.strictEqual(env.semanticContainerGitHubCandidateLineSet.size, 0)
})

pass = runDirectTest('semantic core rule is after text_join and after curly_attributes when attrs is used', pass, () => {
  const mdOrder = mdit().use(mditAttrs).use(mditSemanticContainer)
  const names = mdOrder.core.ruler.__rules__.map((rule) => rule.name)
  const semanticIndex = names.indexOf('semantic_container')
  const textJoinIndex = names.indexOf('text_join')
  const attrsIndex = names.indexOf('curly_attributes')
  assert.strictEqual(semanticIndex > -1, true)
  assert.strictEqual(textJoinIndex > -1, true)
  assert.strictEqual(attrsIndex > -1, true)
  assert.strictEqual(semanticIndex > textJoinIndex, true)
  assert.strictEqual(semanticIndex > attrsIndex, true)
})

pass = runDirectTest('semantic core rule falls back to inline anchor when text_join rule is absent', pass, () => {
  const mdOrder = mdit()
  mdOrder.core.ruler.__rules__ = mdOrder.core.ruler.__rules__.filter((rule) => rule.name !== 'text_join')
  mdOrder.use(mditSemanticContainer)
  const names = mdOrder.core.ruler.__rules__.map((rule) => rule.name)
  const semanticIndex = names.indexOf('semantic_container')
  const inlineIndex = names.indexOf('inline')
  assert.strictEqual(names.includes('text_join'), false)
  assert.strictEqual(semanticIndex > -1, true)
  assert.strictEqual(inlineIndex > -1, true)
  assert.strictEqual(semanticIndex > inlineIndex, true)
})

pass = runDirectTest('detection priority keeps github alerts deterministic over other modes', pass, () => {
  const mdPriority = mdit().use(mditSemanticContainer, {
    allowBracketJoint: true,
    githubTypeContainer: true,
  })
  const html = mdPriority.render('> [!NOTE]\n> Body.\n')
  const sectionCount = (html.match(/<section class=\"sc-note\"/g) || []).length
  assert.strictEqual(sectionCount, 1)
  assert.strictEqual(html.includes('<strong class="sc-note-label">'), true)
})

pass = runDirectTest('githubTypeInlineLabelJoint is ignored when githubTypeInlineLabel is false', pass, () => {
  const mdGitHubSeparateAutoJoint = mdit().use(mditAttrs).use(mditSemanticContainer, {
    githubTypeContainer: true,
    githubTypeInlineLabelJoint: 'auto',
    labelControl: true,
  })
  const html = mdGitHubSeparateAutoJoint.render('> [!NOTE]\n> Body text. {label="重要メモ"}\n')
  const expected = '<section class="sc-note" role="doc-notice">\n'
    + '<p><strong class="sc-note-label">重要メモ</strong></p>\n'
    + '<p>Body text.</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('githubTypeInlineLabelHeadingMixin is ignored when githubTypeInlineLabel is false', pass, () => {
  const mdGitHubSeparateHeadingMixin = mdit().use(mditSemanticContainer, {
    githubTypeContainer: true,
    githubTypeInlineLabelHeadingMixin: true,
  })
  const html = mdGitHubSeparateHeadingMixin.render('> [!NOTE]\n>\n> ## Heading\n> Body\n')
  const expected = '<section class="sc-note" role="doc-notice">\n'
    + '<p><strong class="sc-note-label"><span class="sc-note-label-joint">[</span>NOTE<span class="sc-note-label-joint">]</span></strong></p>\n'
    + '<h2>Heading</h2>\n'
    + '<p>Body</p>\n'
    + '</section>\n'
  assert.strictEqual(html, expected)
})

pass = runDirectTest('cjk/attrs plugin order keeps rendered output stable', pass, () => {
  const markdown = '---\n\nNotice. これは\nテストです。 {label="通知"}\n\n---\n'
  const mdA = mdit().use(mditAttrs).use(mditCjkBreaks).use(mditSemanticContainer, { labelControl: true })
  const mdB = mdit().use(mditSemanticContainer, { labelControl: true }).use(mditAttrs).use(mditCjkBreaks)
  const mdC = mdit().use(mditCjkBreaks).use(mditSemanticContainer, { labelControl: true }).use(mditAttrs)
  const htmlA = mdA.render(markdown)
  const htmlB = mdB.render(markdown)
  const htmlC = mdC.render(markdown)
  assert.strictEqual(htmlA, htmlB)
  assert.strictEqual(htmlA, htmlC)
})

pass = runDirectTest('standard container html_block maps are propagated from hr bounds', pass, () => {
  const tokens = md.parse('---\n\nNotice. Body.\n\n---\n', {})
  const htmlBlocks = tokens.filter((token) => token.type === 'html_block')
  const open = htmlBlocks.find((token) => token.content.startsWith('<section class="sc-notice"'))
  const close = htmlBlocks.find((token) => token.content.startsWith('</section>'))
  assert.strictEqual(!!open, true)
  assert.strictEqual(!!close, true)
  assert.deepStrictEqual(open.map, [0, 1])
  assert.deepStrictEqual(close.map, [4, 5])
})

pass = runDirectTest('github container html_block maps are present', pass, () => {
  const tokens = mdGitHubAlerts.parse('> [!NOTE]\n> body\n', {})
  const htmlBlocks = tokens.filter((token) => token.type === 'html_block')
  const open = htmlBlocks.find((token) => token.content.startsWith('<section class="sc-note"'))
  const close = htmlBlocks.find((token) => token.content.startsWith('</section>'))
  assert.strictEqual(!!open, true)
  assert.strictEqual(!!close, true)
  assert.strictEqual(Array.isArray(open.map), true)
  assert.strictEqual(Array.isArray(close.map), true)
  assert.strictEqual(open.map[0] <= open.map[1], true)
  assert.strictEqual(close.map[0] <= close.map[1], true)
})

if (pass) console.log('Passed all test.')
