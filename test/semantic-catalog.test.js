import assert from 'assert'

export const runSemanticCatalogTests = (pass, runDirectTest, md) => {
  pass = runDirectTest('semantic catalog keeps DPUB roles close and neutral otherwise', pass, () => {
    const markdown = 'Toc. Items.\n\nTip. Helpful.\n\nErrata. Fixes.\n\nNote. Neutral.\n\nPull quote. Repeated.\n'
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
      + '<section class="sc-note">\n'
      + '<p><span class="sc-note-label">Note<span class="sc-note-label-joint">.</span></span> Neutral.</p>\n'
      + '</section>\n'
      + '<aside class="sc-pull-quote" role="doc-pullquote">\n'
      + '<p><span class="sc-pull-quote-label">Pull quote<span class="sc-pull-quote-label-joint">.</span></span> Repeated.</p>\n'
      + '</aside>\n'
    assert.strictEqual(html, expected)
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
      + '<section class="sc-assessments">\n'
      + '<p><span class="sc-assessments-label">Quiz<span class="sc-assessments-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-assessments">\n'
      + '<p><span class="sc-assessments-label">Exam<span class="sc-assessments-label-joint">.</span></span> Body.</p>\n'
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

  pass = runDirectTest('0.12 semantic promotions cover technical office and school labels conservatively', pass, () => {
    const markdown = 'Troubleshooting. Body.\n\nPrerequisites. Body.\n\nNext steps. Body.\n\nMinutes. Body.\n\nLearning objectives. Body.\n\nGrading rubric. Body.\n\n困ったときは：本文。\n\n事前準備：本文。\n\n今後の対応：本文。\n\n議事録：本文。\n\n学習目標：本文。\n\n採点基準：本文。\n\n企画案：本文。\n\nConfiguration. Body.\n\n設定：本文。\n\n企画：本文。\n\n問題解決：本文。\n'
    const html = md.render(markdown)
    const expectedClasses = [
      'sc-troubleshooting',
      'sc-prerequisites',
      'sc-next-steps',
      'sc-minutes',
      'sc-learning-objectives',
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

  pass = runDirectTest('Japanese broad aliases keep issue task reference and lesson boundaries', pass, () => {
    const markdown = 'Alerts. Body.\n\nIssues. Body.\n\nTasks. Body.\n\nLearning units. Body.\n\nNext step. Body.\n\n注意喚起：本文。\n\n検討課題：本文。\n\n課題：本文。\n\n参考資料：本文。\n\n単元：本文。\n\n参考：本文。\n\n教訓：本文。\n'
    const html = md.render(markdown)
    assert.ok(html.includes('<span class="sc-alert-label">Alerts'))
    assert.ok(html.includes('<span class="sc-issue-label">Issues'))
    assert.ok(html.includes('<span class="sc-task-label">Tasks'))
    assert.ok(html.includes('<span class="sc-lesson-label">Learning units'))
    assert.ok(html.includes('<span class="sc-next-steps-label">Next step'))
    assert.ok(html.includes('<span class="sc-alert-label">注意喚起'))
    assert.ok(html.includes('<span class="sc-issue-label">検討課題'))
    assert.ok(html.includes('<span class="sc-task-label">課題'))
    assert.ok(html.includes('<span class="sc-reference-label">参考資料'))
    assert.ok(html.includes('<span class="sc-lesson-label">単元'))
    assert.ok(html.includes('<p>参考：本文。</p>'))
    assert.ok(html.includes('<p>教訓：本文。</p>'))
  })

  pass = runDirectTest('semantic catalog canonical names and narrowed aliases stay deterministic', pass, () => {
    const markdown = 'Editor note. Body.\n\nImportant. Body.\n\nRelated. Body.\n\n問題：本文。\n\n問い：本文。\n\n設問：本文。\n\n抜粋：本文。\n'
    const html = md.render(markdown)
    const expected = '<section class="sc-editor-note">\n'
      + '<p><span class="sc-editor-note-label">Editor note<span class="sc-editor-note-label-joint">.</span></span> Body.</p>\n'
      + '</section>\n'
      + '<section class="sc-important" role="doc-notice">\n'
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
      + '<section class="sc-important" role="doc-notice">\n'
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
      + '<section class="sc-assessments">\n'
      + '<p><span class="sc-assessments-label">試験<span class="sc-assessments-label-joint">：</span></span>本文。</p>\n'
      + '</section>\n'
      + '<section class="sc-assessments">\n'
      + '<p><span class="sc-assessments-label">小テスト<span class="sc-assessments-label-joint">：</span></span>本文。</p>\n'
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

  return pass
}
