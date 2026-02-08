import assert from 'assert'
import fs from 'fs'
import path from 'path'
import mdit from 'markdown-it'
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

const mdGitHubAlerts = mdit().use(mditSemanticContainer, {githubTypeContainer: true}).use(mditStrongJa)

const mdBracketFormat = mdit().use(mditSemanticContainer, {allowBracketJoint: true})
const mdAllFeatures = mdit().use(mditSemanticContainer, {allowBracketJoint: true, githubTypeContainer: true})
const mdLanguagesEnOnly = mdit().use(mditSemanticContainer, {languages: []})
const mdLanguagesString = mdit().use(mditSemanticContainer, {languages: 'ja'})
const mdLanguagesDuplicate = mdit().use(mditSemanticContainer, {languages: ['ja', 'ja']})

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
  bracketFormat: __dirname + path.sep + 'examples-bracket-format.txt',
  mixedFeatures: __dirname + path.sep + 'examples-mixed-types.txt',
  languagesEnOnly: __dirname + path.sep + 'examples-languages-en-only.txt',
  languagesNonArrayOrDuplicate: __dirname + path.sep + 'examples-languages-nonarray-and-duplicate.txt',
  strongJaWithFigure: __dirname + path.sep + 'examples-strong-ja-figure-with-p-caption.txt',
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
console.log('\nstrongJa: true ::::::::::::::::::::::::::::::::::::::::::::')
pass = runTest(mdJa, testData.noOption, pass)
pass = runTest(mdRequireHrAtOneParagraphJa, testData.requireHrAtOneParagraph, pass)
pass = runTest(mdRemoveJointAtLineEndJa, testData.removeJointAtLineEnd, pass)
pass = runTest(mdJa, testData.complex, pass)
console.log('\nstrongJa + figure-with-p-caption :::::::::::::::::::::::::::::::::')
pass = runTest(mdJaWithFigure, testData.strongJaWithFigure, pass)

pass = runTest(mdGitHubAlerts, testData.githubAlerts, pass)
pass = runTest(mdBracketFormat, testData.bracketFormat, pass)
pass = runTest(mdAllFeatures, testData.mixedFeatures, pass)

if (pass) console.log('Passed all test.')
