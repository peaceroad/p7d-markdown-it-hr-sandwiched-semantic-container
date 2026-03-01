import assert from 'assert'
import fs from 'fs'
import path from 'path'
import mdit from 'markdown-it'
import mditAttrs from 'markdown-it-attrs'
import mditFrontMatter from 'markdown-it-front-matter'
import mditMeta from 'markdown-it-meta'
import mditSemanticContainer from '../index.js'
import mditFootnoteHere from '@peaceroad/markdown-it-footnote-here'
import mditStrongJa from '@peaceroad/markdown-it-strong-ja'
import mditFigureWithPCaption from '@peaceroad/markdown-it-figure-with-p-caption'


const md = mdit().use(mditSemanticContainer).use(mditFootnoteHere)
const mdJa = mdit().use(mditStrongJa).use(mditFootnoteHere).use(mditSemanticContainer)
const mdJaWithFigure = mdit()
  .use(mditStrongJa)
  .use(mditFootnoteHere)
  .use(mditFigureWithPCaption)
  .use(mditSemanticContainer)

const mdRequireHrAtOneParagraph = mdit().use(mditSemanticContainer, {requireHrAtOneParagraph: true})
const mdRequireHrAtOneParagraphJa = mdit().use(mditStrongJa).use(mditSemanticContainer, {requireHrAtOneParagraph: true})
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
const mdLabelControlBracket = mdit().use(mditAttrs).use(mditSemanticContainer, {allowBracketJoint: true, labelControl: true})
const mdLabelControlBracketOff = mdit().use(mditAttrs).use(mditSemanticContainer, {allowBracketJoint: true, labelControl: false})
const mdLabelControlGitHub = mdit().use(mditAttrs).use(mditSemanticContainer, {
  githubTypeContainer: true,
  labelControl: true
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

if (pass) console.log('Passed all test.')
