# Changelog

Notable changes to this project are documented in this file.

## 0.14.0 - 2026-07-22

Version 0.14.0 refines the English and Japanese semantic catalog, makes the
generated HTML and DPUB-ARIA contracts more conservative, and hardens matching
and nested token transforms. It also includes the core stabilization work from
commit `53e6c53` (`fix(core): preserve nested semantic container ranges`).

### Breaking changes

- Renamed canonical `assessments` to `assessment`. Generated classes and
  canonical `semanticContainerSc` keys now use `sc-assessment` and `assessment`.
- Renamed canonical `learning-objectives` to `learning-objective`. Generated
  classes and canonical `semanticContainerSc` keys now use
  `sc-learning-objective` and `learning-objective`.
- Renamed canonical `pull-quote` to the current EPUB/DPUB spelling `pullquote`.
  Generated classes and canonical `semanticContainerSc` keys now use
  `sc-pullquote` and `pullquote`.
- Changed `lead` to a roleless `div` and made its catalog label hidden by
  default. This applies consistently to standard, bracket, and GitHub-style
  inputs.
- Changed `point` from an `aside` with `role="doc-tip"` to a roleless thematic
  `section`.
- Removed the default `doc-notice` role from `important` and the default
  `doc-qna` role from `interview`; both remain recognized through their
  `sc-*` classes.
- Removed, narrowed, or reassigned aliases whose grammar or semantic boundary
  was too broad. Existing Markdown that used one of these labels may produce a
  different canonical container or remain unconverted.

Natural singular, plural, spaced, and former hyphenated spellings remain input
aliases where they are unambiguous. These aliases preserve source recognition,
but they do not restore former generated classes or former canonical
`semanticContainerSc` keys.

### Semantic catalog

- Added the roleless `evaluation` semantic for judgment-oriented
  headings. English recognizes product, quality, and performance evaluation in
  natural singular and plural forms. Japanese recognizes `評価`, `評価結果`,
  and `総合評価` as practical roleless headings, plus `製品評価`, `品質評価`,
  `性能評価`, and `パフォーマンス評価`.
- Kept `リスク評価`, `成績評価`, and `採点` unregistered because those phrases
  cross assessment, grading, and action boundaries. `評価基準` remains under
  `rubric`.
- Kept `book` as the canonical for book, magazine, and publication-information
  blocks. Publication and magazine forms are input aliases and continue to emit
  `sc-book`; bare plural `Publications.` is not recognized.
- Kept `related-book` as the canonical for related books, magazines, and
  publications. `related-publication` and natural publication forms are input
  aliases and continue to emit `sc-related-book`.
- Refined proposal, suggestion, recommendation, planning, requirement,
  assessment, evaluation, information, reference, resources, task, issue,
  keywords, lead, preamble, event, and publication boundaries in English and
  Japanese.
- Mapped generic Japanese `お知らせ` and `告知` headings to roleless
  `information`; retained `通知` and `通告` under consequence-oriented `notice`
  with `role="doc-notice"`; moved `注意書` and `注意書き` to `caution`.
  Kept bare `案内` and `ご案内` unregistered because they can denote
  information, procedures, events, products, facilities, or navigation.
- Recognized compact Japanese appendix headings such as `付録A`, `付属A`,
  `付属B`, and `附属A`, while keeping bare `付属` and `附属` unregistered.
- Extended appendix titlepage inference to `附属A` forms and consolidated
  Japanese appendix lead classification.
- Kept broad or unstable labels such as bare `課題`, `作業`, `関連`, `掲示`,
  `出来事`, and `重大` unregistered.
- Removed bare `QA.` from `qna` recognition because it commonly means quality
  assurance in technical documentation.
- Documented canonical stability, grammatical-number policy, DPUB-ARIA role
  policy, downstream structure responsibilities, composite-alias ownership, and
  intentionally omitted ambiguous labels.

### Label and alias handling

- Added catalog-level `hideLabel` handling shared by the standard, bracket, and
  GitHub-style paths.
- Prevented hidden-by-default semantics from matching exact marker-only
  jointless headings, which would otherwise leave an empty heading.
- Shared normalized alias-pattern lists and leading-character candidates across
  standard, bracket, GitHub, jointless-heading, and runtime-conflict matchers.
- Added conservative FIRST-set bucketing for regex-capable built-in aliases so
  common matches scan only relevant semantic candidates while unsupported
  patterns remain on a safe fallback path.
- Matched runtime `semanticContainerSc` aliases against anchored built-in label
  patterns, including regex-expanded and numbered forms, instead of comparing
  raw alias strings only.
- Kept runtime aliases literal, reported conflicts against the canonical
  built-in owner, and prevented runtime rebinding of built-in headings such as
  `お知らせ`.
- Added bounded exact-label and semantic-engine caches, lazy built-in regex
  compilation, and copy-on-write alias extension for repeated preview renders.

### Core correctness and performance

- Tracked token-count deltas while applying descending planned edits so an inner
  conversion that inserts or removes tokens cannot invalidate a later enclosing
  semantic-container range.
- Used a lazily allocated Fenwick-tree delta index for nested edits, avoiding
  quadratic rescans of pending edits.
- Normalized block-stage horizontal-rule candidates against actual parsed `hr`
  tokens before application so setext- and fence-like source lines cannot leak
  into candidate conversion.
- Reused collected GitHub fence/code indexes during conversion, with a
  compatibility fallback for externally constructed match objects.
- Replaced a fixed bracket-label token offset with the actual generated label
  token length.
- Reused shared container-token and heading-rank helpers and isolated semantic
  attribute arrays to prevent cross-engine mutation.
- Kept optional bracket and GitHub helpers lazy so disabled feature paths do not
  pay their construction cost.

### Options and integration

- Normalized boolean options, dependent GitHub options, and locale lists
  consistently. Invalid values fall back to documented safe defaults and
  dependent options are disabled when their parent feature is off.
- Resolved `labelControlInlineFallback: "auto"` at render time so
  `markdown-it-attrs` can be detected even when it is installed after this
  plugin.
- Preserved first-install-wins behavior and isolated per-render semantic state
  when a `markdown-it` instance is reused.

### Tests, audit, and documentation

- Expanded regressions for nested edits, option normalization, reused parser
  instances, runtime alias conflicts, label hiding, semantic boundaries,
  appendix/titlepage inference, and all standard, bracket, and GitHub-style
  option flows.
- Hardened the label audit for duplicate canonicals, locale-key drift,
  non-array locale entries, regex-capable alias conflicts, inline arrays, and
  Windows path reporting.
- Regenerated the English and Japanese semantic catalogs and updated README and
  architecture contracts.
- Streamlined README around installation, syntax, output contracts, and
  configuration; moved per-semantic guidance to the generated catalogs and
  removed the obsolete README label-list helper.
- Added `CHANGELOG.md` to the published package file list.

### Migration notes

- Replace canonical SC keys `assessments`, `learning-objectives`, and
  `pull-quote` with `assessment`, `learning-objective`, and `pullquote`.
- Update CSS selectors from `.sc-assessments`, `.sc-learning-objectives`, and
  `.sc-pull-quote` to `.sc-assessment`, `.sc-learning-objective`, and
  `.sc-pullquote`, including corresponding label and joint class selectors.
- If styling or downstream processing depended on `lead` being a `section`,
  update it for a roleless `div`; its marker label is hidden unless an explicit
  non-empty label control overrides the catalog default.
- If downstream code selected `point`, `important`, or `interview` by their old
  roles, select their stable `sc-*` classes or apply a project-specific role only
  when the rendered content satisfies that role.
- Review documents using aliases removed or moved in this release. In
  particular, `お知らせ` and `告知` now produce `sc-information`, while `通知`
  and `通告` produce `sc-notice` with `role="doc-notice"`. Bare `案内` and
  `ご案内` no longer convert by default; use a more specific label or a local
  `semanticContainerSc` alias. `評価`, `評価結果`, and `総合評価` now produce
  the roleless `sc-evaluation` section.
