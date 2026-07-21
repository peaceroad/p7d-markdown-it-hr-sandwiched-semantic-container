import assert from 'assert'
import { buildSemantics } from '../src/semantics.js'

export const runSemanticCatalogTests = (pass, runDirectTest, md) => {
  pass = runDirectTest('semantic catalog locks every default tag and DPUB role', pass, () => {
    const roleBySemantic = new Map([
      ['abstract', 'doc-abstract'],
      ['acknowledgments', 'doc-acknowledgments'],
      ['afterword', 'doc-afterword'],
      ['alert', 'doc-notice'],
      ['appendix', 'doc-appendix'],
      ['bibliography', 'doc-bibliography'],
      ['caution', 'doc-notice'],
      ['chapter-toc', 'doc-toc'],
      ['colophon', 'doc-colophon'],
      ['conclusion', 'doc-conclusion'],
      ['credits', 'doc-credits'],
      ['danger', 'doc-notice'],
      ['dedication', 'doc-dedication'],
      ['endnotes', 'doc-endnotes'],
      ['epigraph', 'doc-epigraph'],
      ['epilogue', 'doc-epilogue'],
      ['errata', 'doc-errata'],
      ['faq', 'doc-qna'],
      ['foreword', 'doc-foreword'],
      ['glossary', 'doc-glossary'],
      ['hint', 'doc-tip'],
      ['index', 'doc-index'],
      ['introduction', 'doc-introduction'],
      ['notice', 'doc-notice'],
      ['preface', 'doc-preface'],
      ['prologue', 'doc-prologue'],
      ['pullquote', 'doc-pullquote'],
      ['qna', 'doc-qna'],
      ['tip', 'doc-tip'],
      ['toc', 'doc-toc'],
      ['warning', 'doc-notice'],
    ])
    const asideSemantics = new Set([
      'annotation',
      'column',
      'hint',
      'pullquote',
      'related-book',
      'related-article',
      'related-link',
      'related',
      'tip',
    ])
    const divSemantics = new Set([
      'appendix-titlepage',
      'chapter-titlepage',
      'lead',
      'part-titlepage',
      'question',
    ])
    const navSemantics = new Set(['chapter-toc', 'toc'])

    for (const semantic of buildSemantics([])) {
      const expectedTag = asideSemantics.has(semantic.name)
        ? 'aside'
        : (divSemantics.has(semantic.name)
            ? 'div'
            : (navSemantics.has(semantic.name) ? 'nav' : 'section'))
      assert.strictEqual(semantic.tag, expectedTag, semantic.name + ' tag')
      const expectedRole = roleBySemantic.get(semantic.name)
      assert.deepStrictEqual(
        semantic.attrs,
        expectedRole ? [['role', expectedRole]] : [],
        semantic.name + ' attrs'
      )
    }
  })

  pass = runDirectTest('semantic catalog keeps DPUB roles close and neutral otherwise', pass, () => {
    const markdown = 'Toc. Items.\n\nTip. Helpful.\n\nErrata. Fixes.\n\nCorrections. Fixes.\n\n7月4日訂正：修正。\n\nNote. Neutral.\n\nPull quote. Repeated.\n'
    const html = md.render(markdown)
    const expected = '<nav class="sc-toc" role="doc-toc">\n'
      + '<p><span class="sc-toc-label">Toc<span class="sc-toc-label-joint">.</span></span> Items.</p>\n'
      + '</nav>\n'
      + '<aside class="sc-tip" role="doc-tip">\n'
      + '<p><span class="sc-tip-label">Tip<span class="sc-tip-label-joint">.</span></span> Helpful.</p>\n'
      + '</aside>\n'
      + '<section class="sc-errata" role="doc-errata">\n'
      + '<p><span class="sc-errata-label">Errata<span class="sc-errata-label-joint">.</span></span> Fixes.</p>\n'
      + '</section>\n'
      + '<section class="sc-errata" role="doc-errata">\n'
      + '<p><span class="sc-errata-label">Corrections<span class="sc-errata-label-joint">.</span></span> Fixes.</p>\n'
      + '</section>\n'
      + '<section class="sc-errata" role="doc-errata">\n'
      + '<p><span class="sc-errata-label">7月4日訂正<span class="sc-errata-label-joint">：</span></span>修正。</p>\n'
      + '</section>\n'
      + '<section class="sc-note">\n'
      + '<p><span class="sc-note-label">Note<span class="sc-note-label-joint">.</span></span> Neutral.</p>\n'
      + '</section>\n'
      + '<aside class="sc-pullquote" role="doc-pullquote">\n'
      + '<p><span class="sc-pullquote-label">Pull quote<span class="sc-pullquote-label-joint">.</span></span> Repeated.</p>\n'
      + '</aside>\n'
    assert.strictEqual(html, expected)
  })

  pass = runDirectTest('pullquote canonical keeps former spellings as input aliases', pass, () => {
    const markdown = 'Pullquote. One.\n\nPull quote. Two.\n\nPull-quote. Three.\n\nプルクオート：四。\n\nプル・クォート：五。\n'
    const html = md.render(markdown)
    assert.strictEqual((html.match(/<aside class="sc-pullquote" role="doc-pullquote">/g) || []).length, 5)
    assert.ok(html.includes('<span class="sc-pullquote-label">Pullquote'))
    assert.ok(html.includes('<span class="sc-pullquote-label">Pull quote'))
    assert.ok(html.includes('<span class="sc-pullquote-label">Pull-quote'))
    assert.ok(html.includes('<span class="sc-pullquote-label">プルクオート'))
    assert.ok(html.includes('<span class="sc-pullquote-label">プル・クォート'))
    assert.strictEqual(html.includes('sc-pull-quote'), false)
  })

  pass = runDirectTest('interview stays roleless unless the author selects qna', pass, () => {
    const markdown = 'Interview. Narrative and conversation.\n\nFAQ. Questions and answers.\n\nQ&A. Questions and answers.\n'
    const html = md.render(markdown)
    assert.ok(html.includes('<section class="sc-interview">'))
    assert.strictEqual(html.includes('<section class="sc-interview" role='), false)
    assert.ok(html.includes('<section class="sc-faq" role="doc-qna">'))
    assert.ok(html.includes('<section class="sc-qna" role="doc-qna">'))
  })

  pass = runDirectTest('problem and question labels stay independently composable', pass, () => {
    const expected = [
      ['問題1', 'problem'],
      ['演習問題2', 'problem'],
      ['練習問題A', 'problem'],
      ['問い1', 'question'],
      ['設問３', 'question'],
      ['小問', 'question'],
      ['小問2', 'question'],
      ['問一', 'question'],
      ['発問', 'question'],
      ['発問1', 'question'],
      ['主発問', 'question'],
      ['中心発問', 'question'],
    ]
    const rejected = ['問', '質問1', '主発問1', '中心発問1', '基本発問', '補助発問']
    const markdown = [
      ...expected.map(([label]) => `${label}：本文。`),
      'Question 1. English body.',
      'Problem 1. Solve directly.',
      'Answer 1. Separate answer.',
      ...rejected.map((label) => `${label}：本文。`),
    ].join('\n\n')
    const html = md.render(markdown)

    for (const [label, semantic] of expected) {
      assert.ok(html.includes(`<span class="sc-${semantic}-label">${label}`), `${label} should map to ${semantic}`)
    }
    assert.ok(html.includes('<span class="sc-question-label">Question 1'))
    assert.ok(html.includes('<span class="sc-problem-label">Problem 1'))
    assert.ok(html.includes('<span class="sc-answer-label">Answer 1'))
    for (const label of rejected) {
      assert.ok(html.includes(`<p>${label}：本文。</p>`), `${label} should stay ordinary text`)
    }
    assert.strictEqual(html.includes('aria-controls='), false)
    assert.strictEqual(html.includes('aria-labelledby='), false)
  })

  pass = runDirectTest('titlepage semantics use div without default roles', pass, () => {
    const markdown = 'Chapter titlepage. Body.\n\n章扉：本文。\n\nAppendix title page. Body.\n\n付録扉：本文。\n\n付属扉：本文。\n\nPart title page. Body.\n\n部扉：本文。\n'
    const html = md.render(markdown)
    const expected = '<div class="sc-chapter-titlepage">\n'
      + '<p><span class="sc-chapter-titlepage-label">Chapter titlepage<span class="sc-chapter-titlepage-label-joint">.</span></span> Body.</p>\n'
      + '</div>\n'
      + '<div class="sc-chapter-titlepage">\n'
      + '<p><span class="sc-chapter-titlepage-label">章扉<span class="sc-chapter-titlepage-label-joint">：</span></span>本文。</p>\n'
      + '</div>\n'
      + '<div class="sc-appendix-titlepage">\n'
      + '<p><span class="sc-appendix-titlepage-label">Appendix title page<span class="sc-appendix-titlepage-label-joint">.</span></span> Body.</p>\n'
      + '</div>\n'
      + '<div class="sc-appendix-titlepage">\n'
      + '<p><span class="sc-appendix-titlepage-label">付録扉<span class="sc-appendix-titlepage-label-joint">：</span></span>本文。</p>\n'
      + '</div>\n'
      + '<div class="sc-appendix-titlepage">\n'
      + '<p><span class="sc-appendix-titlepage-label">付属扉<span class="sc-appendix-titlepage-label-joint">：</span></span>本文。</p>\n'
      + '</div>\n'
      + '<div class="sc-part-titlepage">\n'
      + '<p><span class="sc-part-titlepage-label">Part title page<span class="sc-part-titlepage-label-joint">.</span></span> Body.</p>\n'
      + '</div>\n'
      + '<div class="sc-part-titlepage">\n'
      + '<p><span class="sc-part-titlepage-label">部扉<span class="sc-part-titlepage-label-joint">：</span></span>本文。</p>\n'
      + '</div>\n'
    assert.strictEqual(html, expected)
    assert.strictEqual(html.includes('role='), false)
  })

  pass = runDirectTest('English document labels cover technical office and school headings', pass, () => {
    const markdown = 'Table of contents. Body.\n\nContents. Body.\n\nReferences. Body.\n\nWorks cited. Body.\n\nAcknowledgment. Body.\n\nGlossary. Body.\n\nGlossary of terms. Body.\n\nQuiz. Body.\n\nExam. Body.\n\nExercise. Body.\n\nPractice problems. Body.\n\nExample. Body.\n\nSample. Body.\n\nChecklist. Body.\n\nAction items. Body.\n\nFurther reading. Body.\n\nTest. Body.\n\nPractice. Body.\n'
    const html = md.render(markdown)
    const expected = '<nav class="sc-toc" role="doc-toc">\n'
      + '<p><span class="sc-toc-label">Table of contents<span class="sc-toc-label-joint">.</span></span> Body.</p>\n'
      + '</nav>\n'
      + '<nav class="sc-toc" role="doc-toc">\n'
      + '<p><span class="sc-toc-label">Contents<span class="sc-toc-label-joint">.</span></span> Body.</p>\n'
      + '</nav>\n'
      + '<section class="sc-bibliography" role="doc-bibliography">\n'
      + '<p><span class="sc-bibliography-label">References<span class="sc-bibliography-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-bibliography" role="doc-bibliography">\n'
      + '<p><span class="sc-bibliography-label">Works cited<span class="sc-bibliography-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-acknowledgments" role="doc-acknowledgments">\n'
      + '<p><span class="sc-acknowledgments-label">Acknowledgment<span class="sc-acknowledgments-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-glossary" role="doc-glossary">\n'
      + '<p><span class="sc-glossary-label">Glossary<span class="sc-glossary-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-glossary" role="doc-glossary">\n'
      + '<p><span class="sc-glossary-label">Glossary of terms<span class="sc-glossary-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-assessment">\n'
      + '<p><span class="sc-assessment-label">Quiz<span class="sc-assessment-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-assessment">\n'
      + '<p><span class="sc-assessment-label">Exam<span class="sc-assessment-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-problem">\n'
      + '<p><span class="sc-problem-label">Exercise<span class="sc-problem-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-problem">\n'
      + '<p><span class="sc-problem-label">Practice problems<span class="sc-problem-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<p>Example. Body.</p>\n'
      + '<p>Sample. Body.</p>\n'
      + '<section class="sc-check">\n'
      + '<p><span class="sc-check-label">Checklist<span class="sc-check-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-task">\n'
      + '<p><span class="sc-task-label">Action items<span class="sc-task-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<aside class="sc-related-link">\n'
      + '<p><span class="sc-related-link-label">Further reading<span class="sc-related-link-label-joint">.</span></span> Body.</p>\n'
      + '</aside>\n'
      + '<p>Test. Body.</p>\n'
      + '<p>Practice. Body.</p>\n'
    assert.strictEqual(html, expected)
  })

  pass = runDirectTest('technical office and school workflow semantics emit no default roles', pass, () => {
    const markdown = 'Requirements. Body.\n\nSystem requirements. Body.\n\nProcedure. Body.\n\nSteps. Body.\n\nResources. Body.\n\nMaterials. Body.\n\nExplanation. Body.\n\nLimitations. Body.\n\nConstraints. Body.\n\nDecision. Body.\n\nDecisions. Body.\n\n要件：本文。\n\nシステム要件：本文。\n\n手順：本文。\n\n操作手順：本文。\n\n資料：本文。\n\n教材：本文。\n\n解説：本文。\n\n制限事項：本文。\n\n制約事項：本文。\n\n決定事項：本文。\n\n決定内容：本文。\n'
    const html = md.render(markdown)
    const expected = '<section class="sc-requirements">\n'
      + '<p><span class="sc-requirements-label">Requirements<span class="sc-requirements-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-requirements">\n'
      + '<p><span class="sc-requirements-label">System requirements<span class="sc-requirements-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-procedure">\n'
      + '<p><span class="sc-procedure-label">Procedure<span class="sc-procedure-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-procedure">\n'
      + '<p><span class="sc-procedure-label">Steps<span class="sc-procedure-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-resources">\n'
      + '<p><span class="sc-resources-label">Resources<span class="sc-resources-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-resources">\n'
      + '<p><span class="sc-resources-label">Materials<span class="sc-resources-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-explanation">\n'
      + '<p><span class="sc-explanation-label">Explanation<span class="sc-explanation-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-limitations">\n'
      + '<p><span class="sc-limitations-label">Limitations<span class="sc-limitations-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-limitations">\n'
      + '<p><span class="sc-limitations-label">Constraints<span class="sc-limitations-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-decision">\n'
      + '<p><span class="sc-decision-label">Decision<span class="sc-decision-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-decision">\n'
      + '<p><span class="sc-decision-label">Decisions<span class="sc-decision-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-requirements">\n'
      + '<p><span class="sc-requirements-label">要件<span class="sc-requirements-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-requirements">\n'
      + '<p><span class="sc-requirements-label">システム要件<span class="sc-requirements-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-procedure">\n'
      + '<p><span class="sc-procedure-label">手順<span class="sc-procedure-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-procedure">\n'
      + '<p><span class="sc-procedure-label">操作手順<span class="sc-procedure-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-resources">\n'
      + '<p><span class="sc-resources-label">資料<span class="sc-resources-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-resources">\n'
      + '<p><span class="sc-resources-label">教材<span class="sc-resources-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-explanation">\n'
      + '<p><span class="sc-explanation-label">解説<span class="sc-explanation-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-limitations">\n'
      + '<p><span class="sc-limitations-label">制限事項<span class="sc-limitations-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-limitations">\n'
      + '<p><span class="sc-limitations-label">制約事項<span class="sc-limitations-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-decision">\n'
      + '<p><span class="sc-decision-label">決定事項<span class="sc-decision-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-decision">\n'
      + '<p><span class="sc-decision-label">決定内容<span class="sc-decision-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
    assert.strictEqual(html, expected)
    assert.strictEqual(html.includes('role="doc-requirements"'), false)
    assert.strictEqual(html.includes('role="doc-procedure"'), false)
    assert.strictEqual(html.includes('role="doc-resources"'), false)
    assert.strictEqual(html.includes('role="doc-explanation"'), false)
    assert.strictEqual(html.includes('role="doc-limitations"'), false)
    assert.strictEqual(html.includes('role="doc-decision"'), false)
  })

  pass = runDirectTest('technical prefixed issue requirement and update labels stay bounded', pass, () => {
    const markdown = 'Known issues. Body.\n\nHardware requirements. Body.\n\nSoftware requirements. Body.\n\nUpdates. Body.\n\nRevision history. Body.\n\nChange history. Body.\n\n既知の問題：本文。\n\n既知の問題点：本文。\n\n動作環境：本文。\n\n推奨環境：本文。\n\n更新：本文。\n\n2026年7月4日更新：本文。\n\n更新履歴：本文。\n\n改訂履歴：本文。\n\nKnown problems. Body.\n\n環境：本文。\n'
    const html = md.render(markdown)
    assert.ok(html.includes('<span class="sc-issue-label">Known issues'))
    assert.ok(html.includes('<span class="sc-issue-label">既知の問題'))
    assert.ok(html.includes('<span class="sc-issue-label">既知の問題点'))
    assert.ok(html.includes('<span class="sc-requirements-label">Hardware requirements'))
    assert.ok(html.includes('<span class="sc-requirements-label">Software requirements'))
    assert.ok(html.includes('<span class="sc-requirements-label">動作環境'))
    assert.ok(html.includes('<span class="sc-requirements-label">推奨環境'))
    assert.ok(html.includes('<span class="sc-updates-label">Updates'))
    assert.ok(html.includes('<span class="sc-updates-label">Revision history'))
    assert.ok(html.includes('<span class="sc-updates-label">Change history'))
    assert.ok(html.includes('<span class="sc-updates-label">更新'))
    assert.ok(html.includes('<span class="sc-updates-label">2026年7月4日更新'))
    assert.ok(html.includes('<span class="sc-updates-label">更新履歴'))
    assert.ok(html.includes('<span class="sc-updates-label">改訂履歴'))
    assert.ok(html.includes('<p>Known problems. Body.</p>'))
    assert.ok(html.includes('<p>環境：本文。</p>'))
    assert.strictEqual(html.includes('role="doc-updates"'), false)
    assert.strictEqual(html.includes('role="doc-requirements"'), false)
    assert.strictEqual(html.includes('role="doc-issue"'), false)
  })

  pass = runDirectTest('0.13 semantic promotions cover technical office and school labels conservatively', pass, () => {
    const markdown = 'Troubleshooting. Body.\n\nPrerequisites. Body.\n\nNext steps. Body.\n\nMinutes. Body.\n\nLearning objectives. Body.\n\nGrading rubric. Body.\n\n困ったときは：本文。\n\n事前準備：本文。\n\n今後の対応：本文。\n\n議事録：本文。\n\n学習目標：本文。\n\n採点基準：本文。\n\n企画案：本文。\n\nConfiguration. Body.\n\n設定：本文。\n\n企画：本文。\n\n問題解決：本文。\n'
    const html = md.render(markdown)
    const expectedClasses = [
      'sc-troubleshooting',
      'sc-prerequisites',
      'sc-next-steps',
      'sc-minutes',
      'sc-learning-objective',
      'sc-rubric',
      'sc-proposal',
    ]
    for (const className of expectedClasses) {
      assert.ok(html.includes(`class="${className}"`), `${className} should render`)
      assert.strictEqual(html.includes(`role="doc-${className.slice(3)}"`), false)
    }
    assert.ok(html.includes('<p>Configuration. Body.</p>'))
    assert.ok(html.includes('<p>設定：本文。</p>'))
    assert.ok(html.includes('<p>企画：本文。</p>'))
    assert.ok(html.includes('<p>問題解決：本文。</p>'))
  })

  pass = runDirectTest('Japanese alert severity and planning proposal labels stay distinct', pass, () => {
    const markdown = 'Cautions. Body.\n\nWarnings. Body.\n\nDangers. Body.\n\nご注意：本文。\n\n使用上の注意：本文。\n\n警告事項：本文。\n\n危険事項：本文。\n\nPlan. Body.\n\nProject proposal. Body.\n\n計画案：本文。\n\n企画案：本文。\n\n企画：本文。\n'
    const html = md.render(markdown)
    assert.strictEqual((html.match(/class="sc-caution"/g) || []).length, 3)
    assert.strictEqual((html.match(/class="sc-warning"/g) || []).length, 2)
    assert.strictEqual((html.match(/class="sc-danger"/g) || []).length, 2)
    assert.ok(html.includes('<section class="sc-planning">'))
    assert.ok(html.includes('<span class="sc-planning-label">Plan'))
    assert.ok(html.includes('<span class="sc-planning-label">計画案'))
    assert.ok(html.includes('<section class="sc-proposal">'))
    assert.ok(html.includes('<span class="sc-proposal-label">Project proposal'))
    assert.ok(html.includes('<span class="sc-proposal-label">企画案'))
    assert.ok(html.includes('<p>企画：本文。</p>'))
  })

  pass = runDirectTest('Japanese specific aliases keep issue task resources and lesson boundaries', pass, () => {
    const markdown = 'Alerts. Body.\n\nIssues. Body.\n\nTasks. Body.\n\nLearning units. Body.\n\nNext step. Body.\n\n注意喚起：本文。\n\n検討課題：本文。\n\nタスク：本文。\n\n参考資料：本文。\n\n単元：本文。\n\n参考：本文。\n\n教訓：本文。\n\n課題：本文。\n\n作業：本文。\n\n関連：本文。\n'
    const html = md.render(markdown)
    assert.ok(html.includes('<span class="sc-alert-label">Alerts'))
    assert.ok(html.includes('<span class="sc-issue-label">Issues'))
    assert.ok(html.includes('<span class="sc-task-label">Tasks'))
    assert.ok(html.includes('<span class="sc-lesson-label">Learning units'))
    assert.ok(html.includes('<span class="sc-next-steps-label">Next step'))
    assert.ok(html.includes('<span class="sc-alert-label">注意喚起'))
    assert.ok(html.includes('<span class="sc-issue-label">検討課題'))
    assert.ok(html.includes('<span class="sc-task-label">タスク'))
    assert.ok(html.includes('<span class="sc-resources-label">参考資料'))
    assert.ok(html.includes('<span class="sc-lesson-label">単元'))
    assert.ok(html.includes('<p>参考：本文。</p>'))
    assert.ok(html.includes('<p>教訓：本文。</p>'))
    assert.ok(html.includes('<p>課題：本文。</p>'))
    assert.ok(html.includes('<p>作業：本文。</p>'))
    assert.ok(html.includes('<p>関連：本文。</p>'))
  })

  pass = runDirectTest('semantic catalog canonical names and narrowed aliases stay deterministic', pass, () => {
    const markdown = 'Editor note. Body.\n\nImportant. Body.\n\nRelated. Body.\n\n問題：本文。\n\n問い：本文。\n\n設問：本文。\n\n抜粋：本文。\n'
    const html = md.render(markdown)
    const expected = '<section class="sc-editor-note">\n'
      + '<p><span class="sc-editor-note-label">Editor note<span class="sc-editor-note-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-important">\n'
      + '<p><span class="sc-important-label">Important<span class="sc-important-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<aside class="sc-related">\n'
      + '<p><span class="sc-related-label">Related<span class="sc-related-label-joint">.</span></span> Body.</p>\n'
      + '</aside>\n'
      + '<section class="sc-problem">\n'
      + '<p><span class="sc-problem-label">問題<span class="sc-problem-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<div class="sc-question">\n'
      + '<p><span class="sc-question-label">問い<span class="sc-question-label-joint">：</span></span>本文。</p>\n'
      + '</div>\n'
      + '<div class="sc-question">\n'
      + '<p><span class="sc-question-label">設問<span class="sc-question-label-joint">：</span></span>本文。</p>\n'
      + '</div>\n'
      + '<p>抜粋：本文。</p>\n'
    assert.strictEqual(html, expected)
  })

  pass = runDirectTest('Japanese question and answer labels accept compact item suffixes', pass, () => {
    const markdown = '問題1：本文。\n\n問1：本文。\n\n問いA：本文。\n\n設問３：本文。\n\n問一：本文。\n\n回答1：本文。\n\n答えA：本文。\n\n答え十：本文。\n\n問：本文。\n\n答：本文。\n'
    const html = md.render(markdown)
    const expected = '<section class="sc-problem">\n'
      + '<p><span class="sc-problem-label">問題1<span class="sc-problem-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<div class="sc-question">\n'
      + '<p><span class="sc-question-label">問1<span class="sc-question-label-joint">：</span></span>本文。</p>\n'
      + '</div>\n'
      + '<div class="sc-question">\n'
      + '<p><span class="sc-question-label">問いA<span class="sc-question-label-joint">：</span></span>本文。</p>\n'
      + '</div>\n'
      + '<div class="sc-question">\n'
      + '<p><span class="sc-question-label">設問３<span class="sc-question-label-joint">：</span></span>本文。</p>\n'
      + '</div>\n'
      + '<div class="sc-question">\n'
      + '<p><span class="sc-question-label">問一<span class="sc-question-label-joint">：</span></span>本文。</p>\n'
      + '</div>\n'
      + '<section class="sc-answer">\n'
      + '<p><span class="sc-answer-label">回答1<span class="sc-answer-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-answer">\n'
      + '<p><span class="sc-answer-label">答えA<span class="sc-answer-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-answer">\n'
      + '<p><span class="sc-answer-label">答え十<span class="sc-answer-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<p>問：本文。</p>\n'
      + '<p>答：本文。</p>\n'
    assert.strictEqual(html, expected)
  })

  pass = runDirectTest('Japanese document labels use natural terms and avoid broad aliases', pass, () => {
    const markdown = '概要：本文。\n\n注：本文。\n\n備考：本文。\n\n文献表：本文。\n\n付属資料：本文。\n\n編集注：本文。\n\n重要事項：本文。\n\n注意事項：本文。\n\n計画案：本文。\n\nおすすめ：本文。\n\nもくじ：本文。\n\n豆知識：本文。\n\n注目：本文。\n\n案：本文。\n\n付属：本文。\n'
    const html = md.render(markdown)
    const expected = '<section class="sc-overview">\n'
      + '<p><span class="sc-overview-label">概要<span class="sc-overview-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-note">\n'
      + '<p><span class="sc-note-label">注<span class="sc-note-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-note">\n'
      + '<p><span class="sc-note-label">備考<span class="sc-note-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-bibliography" role="doc-bibliography">\n'
      + '<p><span class="sc-bibliography-label">文献表<span class="sc-bibliography-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-appendix" role="doc-appendix">\n'
      + '<p><span class="sc-appendix-label">付属資料<span class="sc-appendix-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-editor-note">\n'
      + '<p><span class="sc-editor-note-label">編集注<span class="sc-editor-note-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-important">\n'
      + '<p><span class="sc-important-label">重要事項<span class="sc-important-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-caution" role="doc-notice">\n'
      + '<p><span class="sc-caution-label">注意事項<span class="sc-caution-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-planning">\n'
      + '<p><span class="sc-planning-label">計画案<span class="sc-planning-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-recommendation">\n'
      + '<p><span class="sc-recommendation-label">おすすめ<span class="sc-recommendation-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<nav class="sc-toc" role="doc-toc">\n'
      + '<p><span class="sc-toc-label">もくじ<span class="sc-toc-label-joint">：</span></span>本文。</p>\n'
      + '</nav>\n'
      + '<aside class="sc-tip" role="doc-tip">\n'
      + '<p><span class="sc-tip-label">豆知識<span class="sc-tip-label-joint">：</span></span>本文。</p>\n'
      + '</aside>\n'
      + '<p>注目：本文。</p>\n'
      + '<p>案：本文。</p>\n'
      + '<p>付属：本文。</p>\n'
    assert.strictEqual(html, expected)
  })

  pass = runDirectTest('Japanese labels cover technical office and school headings without broad test aliases', pass, () => {
    const markdown = '用語集：本文。\n\n用語一覧：本文。\n\n試験：本文。\n\n小テスト：本文。\n\n練習問題：本文。\n\n例：本文。\n\nサンプル：本文。\n\nチェックリスト：本文。\n\n宿題：本文。\n\nアクションアイテム：本文。\n\n解答1：本文。\n\n解答例：本文。\n\n参考リンク：本文。\n\n関連資料：本文。\n\nテスト：本文。\n\n練習：本文。\n'
    const html = md.render(markdown)
    const expected = '<section class="sc-glossary" role="doc-glossary">\n'
      + '<p><span class="sc-glossary-label">用語集<span class="sc-glossary-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-glossary" role="doc-glossary">\n'
      + '<p><span class="sc-glossary-label">用語一覧<span class="sc-glossary-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-assessment">\n'
      + '<p><span class="sc-assessment-label">試験<span class="sc-assessment-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-assessment">\n'
      + '<p><span class="sc-assessment-label">小テスト<span class="sc-assessment-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-problem">\n'
      + '<p><span class="sc-problem-label">練習問題<span class="sc-problem-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<p>例：本文。</p>\n'
      + '<p>サンプル：本文。</p>\n'
      + '<section class="sc-check">\n'
      + '<p><span class="sc-check-label">チェックリスト<span class="sc-check-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-task">\n'
      + '<p><span class="sc-task-label">宿題<span class="sc-task-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-task">\n'
      + '<p><span class="sc-task-label">アクションアイテム<span class="sc-task-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-solution">\n'
      + '<p><span class="sc-solution-label">解答1<span class="sc-solution-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-solution">\n'
      + '<p><span class="sc-solution-label">解答例<span class="sc-solution-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<aside class="sc-related-link">\n'
      + '<p><span class="sc-related-link-label">参考リンク<span class="sc-related-link-label-joint">：</span></span>本文。</p>\n'
      + '</aside>\n'
      + '<aside class="sc-related">\n'
      + '<p><span class="sc-related-label">関連資料<span class="sc-related-label-joint">：</span></span>本文。</p>\n'
      + '</aside>\n'
      + '<p>テスト：本文。</p>\n'
      + '<p>練習：本文。</p>\n'
    assert.strictEqual(html, expected)
  })

  pass = runDirectTest('0.14 English catalog keeps book output and adds complete noun aliases', pass, () => {
    const expected = [
      ['Publication', 'book'],
      ['Book', 'book'],
      ['Book info', 'book'],
      ['Book information', 'book'],
      ['Magazine', 'book'],
      ['Magazine info', 'book'],
      ['Magazine information', 'book'],
      ['Publication info', 'book'],
      ['Publication information', 'book'],
      ['Related-book', 'related-book'],
      ['Related book', 'related-book'],
      ['Related magazine', 'related-book'],
      ['Related-publication', 'related-book'],
      ['Related publication', 'related-book'],
      ['Related publications', 'related-book'],
      ['Evaluation', 'evaluation'],
      ['Evaluations', 'evaluation'],
      ['Product evaluation', 'evaluation'],
      ['Product evaluations', 'evaluation'],
      ['Quality evaluation', 'evaluation'],
      ['Quality evaluations', 'evaluation'],
      ['Performance evaluation', 'evaluation'],
      ['Performance evaluations', 'evaluation'],
      ["Editor's note", 'editor-note'],
      ["Editors' note", 'editor-note'],
      ['Editorial note', 'editor-note'],
      ['Assessment', 'assessment'],
      ['Assessments', 'assessment'],
      ['Learning-objectives', 'learning-objective'],
      ['Learning objective', 'learning-objective'],
      ['Learning objectives', 'learning-objective'],
      ['Point', 'point'],
      ['Key point', 'point'],
      ['Key points', 'point'],
      ['Main point', 'point'],
      ['Main points', 'point'],
      ['Q&A', 'qna'],
      ['Important notice', 'important'],
      ['Important information', 'important'],
      ['Related information', 'related'],
      ['Related resources', 'related'],
      ['Warnings', 'warning'],
      ['Suggestions', 'suggestion'],
      ['Recommendations', 'recommendation'],
    ]
    const rejected = [
      'Publications',
      'Importance',
      'Relation',
      'Warn',
      'Suggest',
      'Recommend',
      'Recommended',
      'QA',
      'Objectives',
      'EditorNote',
      'Editors note',
    ]
    const markdown = [...expected.map(([label]) => `${label}. Body.`), ...rejected.map((label) => `${label}. Body.`)].join('\n\n')
    const html = md.render(markdown)

    for (const [label, semantic] of expected) {
      if (label === 'Q&A') {
        assert.ok(html.includes('<span class="sc-qna-label">Q&amp;A'), 'Q&A should map to qna')
        continue
      }
      assert.ok(html.includes(`<span class="sc-${semantic}-label">${label}`), `${label} should map to ${semantic}`)
    }
    for (const label of rejected) {
      assert.ok(html.includes(`<p>${label}. Body.</p>`), `${label} should stay ordinary text`)
    }
    assert.ok(html.includes('class="sc-book"'))
    assert.strictEqual(html.includes('sc-publication'), false)
    assert.ok(html.includes('class="sc-related-book"'))
    assert.strictEqual(html.includes('sc-related-publication'), false)
    assert.strictEqual(html.includes('<aside class="sc-point"'), false)
    assert.strictEqual(html.includes('<section class="sc-point" role='), false)
    assert.strictEqual(html.includes('<section class="sc-evaluation" role='), false)
    assert.strictEqual(html.includes('<section class="sc-important" role='), false)
  })

  pass = runDirectTest('0.14 Japanese catalog keeps neighboring semantic boundaries explicit', pass, () => {
    const expected = [
      ['書籍', 'book'],
      ['雑誌情報', 'book'],
      ['書誌情報', 'book'],
      ['出版物情報', 'book'],
      ['刊行物案内', 'book'],
      ['関連雑誌', 'related-book'],
      ['関連刊行物', 'related-book'],
      ['プロポーザル', 'proposal'],
      ['提案書', 'proposal'],
      ['企画案', 'proposal'],
      ['企画書', 'proposal'],
      ['提案', 'suggestion'],
      ['サジェスト', 'suggestion'],
      ['提言', 'recommendation'],
      ['推奨事項', 'recommendation'],
      ['推奨項目', 'recommendation'],
      ['必須要件', 'requirements'],
      ['要求事項', 'requirements'],
      ['必要事項', 'requirements'],
      ['必須項目', 'requirements'],
      ['推奨環境', 'requirements'],
      ['アセスメント', 'assessment'],
      ['製品評価', 'evaluation'],
      ['品質評価', 'evaluation'],
      ['性能評価', 'evaluation'],
      ['パフォーマンス評価', 'evaluation'],
      ['評価基準', 'rubric'],
      ['重要', 'important'],
      ['重要なこと', 'important'],
      ['重要な事柄', 'important'],
      ['重要情報', 'important'],
      ['重要な情報', 'important'],
      ['重要事項', 'important'],
      ['重要な事項', 'important'],
      ['重要語', 'keywords'],
      ['手がかり語', 'keywords'],
      ['導入文', 'lead'],
      ['前文', 'preamble'],
      ['付録A', 'appendix'],
      ['付属A', 'appendix'],
      ['付属B', 'appendix'],
      ['附属A', 'appendix'],
      ['付属書', 'appendix'],
      ['附属書', 'appendix'],
      ['付属資料', 'appendix'],
      ['附属資料', 'appendix'],
      ['注意書', 'caution'],
      ['注意書き', 'caution'],
      ['通知', 'notice'],
      ['通告', 'notice'],
      ['ご案内', 'information'],
      ['お知らせ', 'information'],
      ['告知', 'information'],
      ['情報', 'information'],
      ['参考情報', 'information'],
      ['参照', 'reference'],
      ['参照先', 'reference'],
      ['参照情報', 'reference'],
      ['参考資料', 'resources'],
      ['アラート', 'alert'],
      ['注意喚起', 'alert'],
      ['刊行に寄せて', 'foreword'],
      ['本書の刊行に寄せて', 'foreword'],
      ['日本語版の発刊に寄せて', 'foreword'],
      ['計画', 'planning'],
      ['計画案', 'planning'],
      ['ポイント', 'point'],
      ['要点', 'point'],
      ['補足情報', 'supplement'],
      ['補遺', 'supplement'],
      ['追記', 'postscript'],
    ]
    const rejected = [
      '出版物',
      '刊行物',
      '警報',
      '出来事',
      '重大',
      '重大情報',
      '手がかり',
      '導入',
      '序',
      '序文',
      '勧め',
      'の刊行に寄せて',
      '評価',
      '評価結果',
      '総合評価',
      '採点',
      '成績評価',
      'リスク評価',
      'セキュリティ評価',
      '追補',
      '関連',
      '作業',
      '課題',
      '付属',
      '附属',
      '掲示',
    ]
    const markdown = [...expected.map(([label]) => `${label}：本文。`), ...rejected.map((label) => `${label}：本文。`)].join('\n\n')
    const html = md.render(markdown)

    for (const [label, semantic] of expected) {
      if (semantic === 'lead') {
        assert.strictEqual(
          md.render(`${label}：本文。`),
          `<div class="sc-lead">\n<p>本文。</p>\n</div>\n`,
          `${label} should map to lead`
        )
        continue
      }
      assert.ok(html.includes(`<span class="sc-${semantic}-label">${label}`), `${label} should map to ${semantic}`)
    }
    for (const label of rejected) {
      assert.ok(html.includes(`<p>${label}：本文。</p>`), `${label} should stay ordinary text`)
    }
  })

  return pass
}
