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

const mdRemoveJointAtLineEnd = mdit().use(mditSemanticContainer, {removeJointAtLineEnd: true})
const mdRemoveJointAtLineEndJa = mdit().use(mditStrongJa).use(mditSemanticContainer, {removeJointAtLineEnd: true})

const mdGitHubAlerts = mdit().use(mditSemanticContainer, {githubTypeContainer: true}).use(mditStrongJa)

const mdBracketFormat = mdit().use(mditSemanticContainer, {allowBracketJoint: true})
const mdAllFeatures = mdit().use(mditSemanticContainer, {allowBracketJoint: true, githubTypeContainer: true})

let __dirname = path.dirname(new URL(import.meta.url).pathname)
const isWindows = (process.platform === 'win32')
if (isWindows) {
  __dirname = __dirname.replace(/^\/+/, '').replace(/\//g, '\\')
}

const testData = {
  noOption: __dirname + path.sep +  'examples.txt',
  requireHrAtOneParagraph: __dirname + path.sep +  'examples-require-hr-at-one-paragraph.txt',
  removeJointAtLineEnd: __dirname + path.sep + 'examples-remove-joint-at-line-end.txt',
  complex: __dirname + path.sep + 'examples-complex.txt',
  githubAlerts: __dirname + path.sep + 'examples-github-type-container.txt',
  bracketFormat: __dirname + path.sep + 'examples-bracket-format.txt',
  mixedFeatures: __dirname + path.sep + 'examples-mixed-types.txt',
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
    let mhs = ms0[n].split(/\n+\[HTML[^\]]*?\]\n/);
    let i = 1;
    while (i < 2) {
      if (mhs[i] === undefined) {
        mhs[i] = '';
      } else {
        mhs[i] = mhs[i].replace(/$/,'\n');
      }
      i++;
    }
    ms[n] = {
      "markdown": mhs[0],
      "html": mhs[1],
    };
    n++;
  }
  return ms
}

const runTest = (process, pat, pass, testId) => {
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
    console.log('Test: ' + n + ' >>>');
    try {
      assert.strictEqual(h, ms[n].html);
    } catch(e) {
      pass = false
      //console.log('Test: ' + n + ' >>>');
      //console.log(opt);
      console.log(ms[n].markdown);
      console.log('incorrect:');
      console.log('H: ' + h +'C: ' + ms[n].html);
    }
    n++;
  }
  return pass
}

let pass = true
pass = runTest(md, testData.noOption, pass)
pass = runTest(mdRequireHrAtOneParagraph, testData.requireHrAtOneParagraph, pass)
pass = runTest(mdRemoveJointAtLineEnd, testData.removeJointAtLineEnd, pass)
pass = runTest(md, testData.complex, pass)
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
