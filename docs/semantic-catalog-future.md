# Semantic catalog future candidates

This note keeps future semantic-catalog candidates separate from the current
released contract. The built-in catalog should remain conservative: add a new
canonical semantic only when it is useful as a standalone document label across
multiple document types, and do not emit a default `role` unless DPUB-ARIA has a
close match.

Released changes and migration guidance belong in
[`CHANGELOG.md`](../CHANGELOG.md). Current catalog behavior and decision
boundaries are documented in the generated English and Japanese catalogs. This
file is limited to unresolved boundaries and possible future additions.

## Boundaries under observation

The current EPUB/DPUB review found no further role assignment that needs an
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
- Bare `案内`/`ご案内` remains unregistered because it can introduce
  information, procedures, events, products, facilities, or navigation. A
  project can add it through `semanticContainerSc` when its local document
  convention gives it one stable function.
- `評価`, `評価結果`, and `総合評価` are recognized as the roleless
  `evaluation` semantic because they are natural standalone headings and do not
  assert an assessment or grading role. Assessment-like `リスク評価` and
  grading-like `成績評価` remain unregistered where their boundaries are less
  stable.
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

These decisions remain documented because the recognized labels are established
standalone headings and the omitted labels still lack a stable boundary. Widen,
reassign, or remove them only with corpus evidence and neighboring-semantic
regression tests.

## Strong future candidates

### Technical documentation

- `configuration`
  - English candidates: `Configuration`, `Settings`
  - Japanese candidates: `設定`, `設定項目`
  - Notes: Useful, but `設定` and `Settings` can be broad. Add tests for false
    positives if promoted.
- Additional `troubleshooting` aliases
  - Japanese candidate: `問題解決`
  - Notes: Keep it under observation because it can overlap with `solution` and
    general problem-solving sections.

### Office documents

- `proposal` aliases
  - Japanese candidates: `企画`
  - Notes: `企画案` is recognized as `proposal`. Bare `企画` still needs
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
