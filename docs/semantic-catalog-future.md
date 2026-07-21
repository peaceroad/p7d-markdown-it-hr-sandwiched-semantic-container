# Semantic catalog future candidates

This note keeps future semantic-catalog candidates separate from the current
released contract. The built-in catalog should remain conservative: add a new
canonical semantic only when it is useful as a standalone document label across
multiple document types, and do not emit a default `role` unless DPUB-ARIA has a
close match.

## Catalog refinements promoted in 0.14.0

Version 0.14.0 deliberately tightens the catalog around natural document
labels. Canonical semantics remain conceptual API names; aliases may be
multiword phrases when that is the natural or safer heading form.
Canonical grammatical number follows an intentionally corresponding external
vocabulary when one exists; otherwise singular conceptual names are preferred,
while lexicalized or deliberately aggregate concepts may remain plural.

- `book` remains the compatibility-stable canonical while its documented scope
  broadens to book, magazine, and publication-information blocks.
  - `book`, `book info`, `book information`, `magazine`, `magazine info`,
    `magazine information`, `publication`, `publication info`, and
    `publication information` are recognized English labels.
  - Output remains `sc-book`; canonical-name configuration remains `book`.
  - Dual `sc-book` / `sc-publication` output was intentionally not added.
    Supporting both correctly would also require legacy aliases for label and
    joint classes and would turn a one-semantic migration into a general
    long-lived output contract.
  - Bare plural `publications` stays unregistered because it often denotes an
    author's works, a bibliography-like list, or a publication archive rather
    than one publication-information block.
  - Canonical `related-book` remains unchanged for compatibility, while its
    recognized headings cover books, magazines, and other publications.
    `related-publication` remains an input alias, while output and
    canonical-name configuration use `sc-related-book` / `related-book`.
  - Use `related-book` for related or suggested publications and
    `colophon` for the current work's formal imprint.
- English aliases now favor complete noun labels:
  - `important notice` and `important information` replace abstract
    `importance`.
  - `related information` and `related resources` replace abstract `relation`.
  - `warnings`, `suggestions`, and `recommendations` remain alongside their
    canonical singular nouns; verb or adjective labels such as `warn`,
    `suggest`, `recommend`, and `recommended` were removed.
  - `editor-note` recognizes natural spaced forms such as `editor's note` and
    `editorial note`; unspaced `editornote` and apostrophe-less `editors note`
    were removed.
- Japanese planning terms have an explicit decision boundary:
  - `提案書`, `企画案`, `企画書`, and `プロポーザル` map to formal
    `proposal`.
  - Bare `提案` and `サジェスト` map to lighter `suggestion`.
  - `提言` maps to `recommendation`; bare `企画` remains unregistered.
- Broad Japanese labels were narrowed:
  - `出来事`, `警報`, `重大`, bare `手がかり`, bare `導入`, bare `関連`,
    bare `作業`, bare `課題`, `序`, `序文`, `採点`, and `勧め` are no
    longer recognized by those former mappings.
  - `前文` now maps precisely to `preamble`; `アセスメント` maps to
    `assessment`.
  - `参考資料` maps to supporting `resources`, while `参照先`, `参照情報`,
    and `リファレンス` map to `reference`.
  - `付属書` / `附属書`, `付属資料` / `附属資料`, and compact numbered or
    lettered book labels such as `付録A`, `付属A`, and `附属A` map to
    `appendix`. Bare `付属` / `附属` remains unregistered because it can
    describe accessories or affiliation instead of appended document structure.
  - `ご案内` joins `案内` under roleless `information` as a natural honorific
    heading; this does not enable a general automatic `ご` prefix.
- Requirements and recommendations gained specific natural headings:
  - `必須要件`, `要求事項`, `必要事項`, and `必須項目` map to
    `requirements`.
  - `推奨事項` and `推奨項目` map to `recommendation`, while `推奨環境`
    remains `requirements` because it describes an operating environment.
- `evaluation` was added as a roleless canonical semantic with English
  `evaluation` / `evaluations`, `product evaluation(s)`, `quality
  evaluation(s)`, and `performance evaluation(s)` labels. Japanese aliases are
  limited to `製品評価`, `品質評価`, `性能評価`, and `パフォーマンス評価`. Bare `評価`,
  `評価結果`, and `総合評価` cross assessment, grading, and judgment boundaries,
  so they remain unregistered together with assessment-like `リスク評価` and
  grading-like `成績評価`; `評価基準` stays under `rubric`.
- `important` is now roleless. It still recognizes priority-oriented labels,
  including `important notice` and `important information`, but importance by
  itself does not imply the consequences described by DPUB-ARIA `doc-notice`.
  `notice`, `alert`, `caution`, `warning`, and `danger` retain that structural
  role. It is not the live-region `role="alert"` and does not by itself cause a
  pop-up or immediate announcement.
  - A follow-up reading of the normative `doc-notice` definition corrected the
    Japanese boundary. The role explicitly *notifies* users of consequences
    that might arise from an action or event, and gives warnings, cautions, and
    dangers as examples. `通知` and the more formal `通告` therefore remain
    direct natural author-selected headings, just as English `Notice` is.
  - `注意書` and `注意書き` are closer to a concrete caution and map to
    `caution`. Generic announcement labels `お知らせ` and `告知` map to
    roleless `information`: this recognizes their practical heading function
    without asserting the consequence-oriented `doc-notice` contract. Bare
    `掲示` remains unregistered because it also denotes posting or a noticeboard.
  - Adding a separate `announcement` semantic remains rejected because it
    would create a difficult boundary without a distinct output contract.
- Alias additions are output-contract decisions, not only vocabulary changes.
  Every built-in and runtime alias inherits the canonical tag, classes, and
  default attributes, including `role`. The catalog therefore avoids per-alias
  role suppression: a broad label stays unregistered or maps to a roleless
  semantic when it cannot safely assert the role-bearing canonical.
- Canonical `assessments` was renamed to singular `assessment`, and canonical
  `learning-objectives` was renamed to singular `learning-objective`, following
  the current EPUB Structural Semantics Vocabulary terms.
  - Output now uses `sc-assessment` and `sc-learning-objective`; this is a
    breaking output-contract change.
  - The former hyphenated canonical `learning-objectives` remains a compatibility
    alias. Natural spaced singular/plural headings also remain recognized, but
    bare `objectives` stays unregistered because project and business objectives
    are not necessarily learning objectives.
- `lead` now records its exceptional presentation explicitly with
  `hideLabel: true`. It remains the only built-in semantic whose marker is
  hidden by default, and standard, bracket, and GitHub alert inputs now share
  that behavior. It uses a roleless `div`: ordinary publishing usage treats a
  lead/lede as opening prose rather than a separately navigable document
  section, and `lead` is not an EPUB or DPUB-ARIA vocabulary term. Hiding its
  control marker therefore does not create a named `region` landmark. Exact
  jointless headings skip hidden-by-default semantics so a marker-only
  `## Lead` does not become an empty heading. The matcher applies that rule to
  every hidden-by-default semantic rather than branching on the canonical name.
- `point` now means a central point or takeaway, recognizes `key point(s)` and
  `main point(s)`, and emits a roleless main-flow `section`. Japanese `要点`
  stays here. Helpful advice remains under `hint` / `tip` with `doc-tip`.
- `補遺` remains a `supplement` alias. Japanese documentation terminology
  distinguishes it from `付録` (`appendix`) and `追補` (addenda), so rarity alone
  is not a reason to remove this precise heading. `追補` remains unregistered
  until a useful addendum semantic and real heading examples justify it;
  `追記` remains under `postscript`.
- Bare `QA` was removed from `qna` because it commonly means quality assurance
  in technical documents. The Japanese `foreword` pattern was also tightened
  so malformed bare `の刊行に寄せて` no longer matches.

These choices are recorded here so omitted broad labels can be reconsidered
with concrete documents and collision tests instead of being restored merely
for morphological completeness.

## Deliberate residual boundaries

The latest EPUB/DPUB review found no further role assignment that needs an
immediate catalog change, but several natural Japanese headings remain
genre-dependent:

- `はじめに` is recognized as `introduction`; use `前書き`/`まえがき` for
  an authorial `preface` when the distinction matters.
- `おわりに`/`終わりに` is recognized as `conclusion`; use
  `あとがき`/`後書き` for an authorial `afterword`. Both `afterword` and
  `conclusion` remain current EPUB/DPUB concepts: the former comments on the
  work's creation, significance, or later events, while the latter closes the
  subject, argument, or narrative.
- `序章`/`終章` remain `prologue`/`epilogue`, although nonfiction can use
  them as ordinary opening and closing chapter titles. EPUB-level tooling with
  document-wide context should take precedence over word-only inference.
- `概略` remains an `outline` alias but can overlap a prose `overview`. The two
  wrappers are both roleless `section` elements, reducing accessibility risk;
  use `アウトライン` versus `概要` when a project needs a stable distinction.
- `案内` remains a pragmatic roleless `information` alias, although it can
  introduce procedures, events, or navigation. Prefer a more specific label
  when that document function is known.
- Bare `問題` remains under the roleless `problem` for common problem and
  exercise headings. Use `問題点` or `既知の問題` for issue-reporting sections.
- `まとめ` remains under the roleless `summary`, although it can function as a
  closing conclusion. Use `結論` or `おわりに` when `doc-conclusion` is intended.
- `概要` remains under the roleless `overview`, although it can label a formal
  abstract. Use `要旨` or `抄録` when `doc-abstract` is intended.
- `outline`, `overview`, and `summary` remain roleless because a label alone
  does not establish formal publication structure or closing position.
  `abstract` is the role-bearing exception. Although DPUB-ARIA shows a
  `Summary` heading in a `doc-conclusion` example, bare `Summary`/`まとめ` can
  also occur at the start or middle of a work, so the catalog does not infer
  `doc-conclusion` from that label.

These are kept because they are established standalone headings and their
current mappings are explainable. Reassign or remove them only with corpus
evidence and neighboring-semantic regression tests.

## Catalog candidates promoted in 0.13.0

These started as review candidates and were promoted to canonical semantics
because they are common headings in technical documents, office documents, or
school materials:

- `requirements`
  - English labels: `Requirements`, `System requirements`, `Hardware requirements`, `Software requirements`
  - Japanese labels: `要件`, `必要条件`, `動作要件`, `システム要件`, `動作環境`, `推奨環境`
  - Default role: none
- `procedure`
  - English labels: `Procedure`, `Steps`, `Instructions`
  - Japanese labels: `手順`, `操作手順`, `作業手順`
  - Default role: none
- `resources`
  - English labels: `Resources`, `Materials`
  - Japanese labels: `資料`, `教材`
  - Default role: none
- `explanation`
  - English labels: `Explanation`
  - Japanese labels: `解説`
  - Default role: none
- `limitations`
  - English labels: `Limitations`, `Constraints`, `Restrictions`
  - Japanese labels: `制限事項`, `制約`, `制約事項`
  - Default role: none
- `decision`
  - English labels: `Decision`, `Decisions`
  - Japanese labels: `決定事項`, `決定内容`
  - Default role: none
- `glossary`
  - English labels: `Glossary`, `Glossary of terms`
  - Japanese labels: `用語集`, `用語一覧`
  - Default role: `doc-glossary`
- `troubleshooting`
  - English labels: `Troubleshooting`
  - Japanese labels: `トラブルシューティング`, `困ったときは`
  - Default role: none
- `updates`
  - English labels: `Updates`, `Revision history`, `Change history`
  - Japanese labels: `更新`, `更新履歴`, `改訂履歴`, date-prefixed `更新`
  - Default role: none
- `prerequisites`
  - English labels: `Prerequisites`, `Prerequisite`
  - Japanese labels: `前提条件`, `事前準備`
  - Default role: none
- `next-steps`
  - English labels: `Next steps`
  - Japanese labels: `次のステップ`, `今後の対応`, `今後の予定`
  - Default role: none
- `minutes`
  - English labels: `Minutes`, `Meeting minutes`
  - Japanese labels: `議事録`
  - Default role: none
- `learning-objective`
  - English labels: `Learning objective`, `Learning objectives`
  - Japanese labels: `学習目標`, `到達目標`
  - Default role: none
- `rubric`
  - English labels: `Rubric`, `Grading rubric`
  - Japanese labels: `評価基準`, `採点基準`, `ルーブリック`
  - Default role: none

Entries with no default role above intentionally do not emit invented `doc-*`
roles.
The `proposal` semantic also gained the narrow Japanese alias `企画案`; bare
`企画` remains a future candidate because it can mean planning more broadly.

The previous broad `example` semantic is intentionally not part of the 0.13.0
built-in catalog. DPUB-ARIA 1.1 treats `doc-example` as figure-like, and
examples often overlap with captioned code, terminal, image, or table figures.
Use `p7d-markdown-it-figure-with-p-caption` with `roleDocExample: true` for
figure-specific `role="doc-example"` output. If a project still wants
paragraph-level `Example.` recognition, map it to a suitable existing semantic
locally with `semanticContainerSc`.

## Strong future candidates

### Technical documentation

- `configuration`
  - English candidates: `Configuration`, `Settings`
  - Japanese candidates: `設定`, `設定項目`
  - Notes: Useful, but `設定` and `Settings` can be broad. Add tests for false
    positives if promoted.
- Additional `troubleshooting` aliases
  - Japanese candidate: `問題解決`
  - Notes: `troubleshooting` was promoted in 0.13.0 without this broad form.
    Keep it under observation because it can overlap with `solution` and
    general problem-solving sections.

### Office documents

- `proposal` aliases
  - Japanese candidates: `企画`
  - Notes: `企画案` is now recognized as `proposal`. Bare `企画` still needs
    boundary checks against `planning` (`計画`, `計画案`).

### School and training materials

- `review`
  - English candidates: none yet
  - Japanese candidates: `復習`
  - Notes: English `Review` is broad; Japanese `復習` is more specific. Adding a
    canonical `review` would also make bare English `review` recognized, so keep
    this out for now.

## Candidates to keep out by default

- `Prologue` / `Epilogue` h1 titlepage inference and Japanese equivalents
  (`序章`, `終章`, `プロローグ`, `エピローグ`)
  - These labels remain supported as explicit `prologue` / `epilogue`
    semantics and keep their DPUB-ARIA roles (`doc-prologue`,
    `doc-epilogue`).
  - Keep them out of automatic h1 titlepage inference by default. They often
    describe a whole EPUB document or a major document section, while this
    plugin should not infer a wrapper for the entire rendered document.
  - If a project wants `序章` or `Prologue` to share the same visual design as a
    numbered chapter titlepage, handle that in an EPUB-level structuring tool or
    with explicit project-local markup rather than broad built-in inference.
- `test` / `テスト`
  - Too broad, especially in software documentation.
  - Prefer `quiz`, `exam`, `小テスト`, or `確認テスト`.
- `practice` / `練習`
  - Too broad as a section label for `problem`.
  - Prefer `practice problem(s)`, `exercise`, `演習問題`, or `練習問題`.
- Bare `問` / bare `答`
  - Too short and collision-prone.
  - Prefer numbered compact labels such as `問1`, `問いA`, `回答1`, and
    `答えA`.
- Additional teaching-prompt labels
  - Held Japanese candidates: `基本発問`, `補助発問`, `ゆさぶり発問`.
  - `発問`, `主発問`, and `中心発問` are recognized, but broader specialist
    variants remain held until corpus examples show that they commonly stand
    alone as container headings.
  - Numbered `主発問1` and `中心発問1` are also intentionally not inferred;
    add them only if real documents establish that form.
- `example` / `sample` / `例` / `サンプル`
  - Too broad for this plugin's built-in paragraph-level catalog and too close
    to figure/caption semantics.
  - Prefer figure/caption tooling for `doc-example`, or project-local
    `semanticContainerSc` aliases to a suitable existing semantic when
    paragraph-level examples are required.

## Promotion checklist

Before promoting a candidate:

1. Confirm that the candidate is plausible as a standalone heading in actual
   target documents. Dictionary correspondence alone is insufficient.
2. Confirm a stable boundary from neighboring semantics and verify that the
   chosen tag, role, class, and label behavior fit the document function.
3. Confirm whether it has a close DPUB-ARIA role. If not, do not emit a default
   `role`.
4. Add English and Japanese direct tests that lock useful matches.
5. Add at least one negative test for broad words when applicable.
6. Update `semantics/en.json`, `semantics/ja.json`, and
   `docs/semantic-catalog-references.md` when the role policy changes.
7. Regenerate docs with `npm run docs:semantic-catalog`.
8. Run `npm test`, `npm run labels:audit:strict`, and `npm run performance:quick`.
