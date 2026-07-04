# Architecture Notes for Agents

This plugin converts paragraph groups into semantic containers in markdown-it. Key flow (defined in `index.js`):

## Drift guard checklist

Update this file in the same change set when you change any of these behavior contracts:

- Public options, option defaults, or option normalization policy.
- Rule registration order, rule names, or parser phase ownership.
- Runtime `semanticContainerSc` input precedence, warning behavior, or cache keys.
- Semantic catalog layout, alias interpretation, generated classes, output tags, or default attributes.
- Semantic catalog documentation generation (`npm run docs:semantic-catalog`) or category/overview copy in `docs/generate-semantic-catalog.js`.
- DPUB-ARIA alignment policy for emitted `role="doc-*"` attributes or decisions to leave a semantic without a default `role`.
- Label-control behavior across standard, bracket, and GitHub alert paths.
- Candidate collection/planning/apply order, map propagation, or walker skip guards.
- Test loader semantics, direct regression-test scope, or benchmark commands.

1) **Options & data**
   - Options: `requireHrAtOneParagraph`, `headingSectionContainer`, `removeJointAtLineEnd`, `allowBracketJoint`, `bracketLabelJointMode`, `githubTypeContainer`, `githubTypeInlineLabel`, `githubTypeInlineLabelHeadingMixin`, `githubTypeInlineLabelJoint`, `labelControl`, `labelControlInlineFallback`, `languages` (English always included, defaults to `["ja"]` for extra labels).
   - Option normalization is intentionally tolerant: unknown options are ignored, invalid enum-like values fall back to safe defaults, and dependent options are disabled when their parent feature flag is off.
   - Per-render SC alias/hide input sources (priority): `state.env.semanticContainerSc` -> `state.env.frontmatter.sc` -> `state.env.meta.sc` -> `md.frontmatter.sc` -> `md.meta.sc`.
   - Per-render titlepage control sources (priority): `state.env.semanticContainerSc.titlepage` -> `state.env.frontmatter["sc.titlepage"]` / `state.env.frontmatter.sc.titlepage` -> corresponding `env.meta`, `md.frontmatter`, and `md.meta` keys. `sc.titlepage` is reserved control data, not a semantic alias entry.
   - `md.frontmatter.sc` / `md.meta.sc` are consumed only in current-render context (front matter token present) or when object reference changed, to avoid stale cross-render metadata leakage.
   - Semantics are built via `buildSemantics(languages)` (see `src/semantics.js`), then regexes are generated once per init.

2) **Core factories**
   - `createHrBlockCandidateCollector(...)` (in `src/semantic-hr-candidates.js`): lightweight block-stage collector that records hr-sandwich candidates (`openHrLine`, `startLine`, `endHrLine`, `hrType`) into `env.semanticContainerHrCandidates` and precomputed candidate keys into `env.semanticContainerHrCandidateKeySet` (append-only in block phase; env stores are prepared/reset in core before block).
   - `buildSemanticsReg(semantics)`: builds regexes for the standard joint formats (`.` `:` `。` `：` etc.).
   - `buildSemanticLeadCandidates(semantics)` (in `src/semantic-lead.js`): pre-buckets semantic candidates by leading label character for faster checks.
   - `resolveLabelControl(...)` / `escapeHtmlForAttr(...)` (in `src/label-control.js`): shared `label` extraction/removal and safe attribute escaping. Supports attrs-based extraction and optional inline-tail fallback (`{label=...}`) when attrs are unavailable.
   - `resolveContainerRangeEnd(...)` / `resolveHeadingSectionRangeEnd(...)` (in `src/container-range.js`): shared range-end resolvers for standard/bracket detection; the first handles hr-close and paragraph-only standalone contracts, while the second resolves heading-scoped standalone sections using heading rank + token nesting level.
   - `createContainerStartToken(...)` / `createContainerEndToken(...)` (in `src/container-token.js`): shared HTML container start/end token generation for standard, bracket, and GitHub paths.
   - `createWrappedLabelTokens(...)` / `createBracketWrappedLabelTokens(...)` (in `src/label-token-builder.js`): shared inline label token builders reused by bracket/GitHub appliers.
   - `createHeadingTitlepageMatcher(...)` / `createFrontmatterTitlepageFinder(...)` / `setHeadingTitlepageContainer(...)` (in `src/heading-titlepage.js`): matcher/applier for `chapter-titlepage`, `appendix-titlepage`, and `part-titlepage` h1 opening pages, including token-level span parts for label, number, joint, and title text. Hr-sandwich matching is candidate-only; frontmatter titlepage matching is first-content-heading-only.
   - `createLabelMatcher(...)`: checks the next inline token for a semantic label and finds the container end (hr or paragraph close); includes a cheap leading-char guard to avoid regex work on non-candidates.
   - `createActiveCheck(...)`: delegates to GitHub alert check, then bracket check, then the core checker, with an early token-type gate for non paragraph/heading targets.
   - `createContainerRangeChecker(...)`: walks forward to find continued containers.
   - `createContainerApplier(...)`: dispatches to GitHub/bracket setters, otherwise delegates standard behavior to `createStandardContainerApplier(...)` in `src/standard-applier.js`. Standard path wraps tokens with `html_block` start/end tags, fixes labels/joints/aria-label, and copies `map` from nearby hr/paragraph tokens.
   - `tryApplyStandaloneContainer(...)`: shared no-hr path helper for heading/paragraph/blockquote checks; consolidates list-item exclusion and GitHub candidate gating, and applies single-container conversions without duplicating walker branches.
   - `createContainerWalker(...)`: main token walker; skips applied hr-candidate lead tokens and other non-target tokens before standalone/hr-path checks and uses a Set of checked positions to avoid reprocessing.
   - `createHrCandidatePlanner(...)`: resolves semantic matches with standard+bracket matchers on hr candidates and produces descending planned edits + applied start-line sets.
   - `createGitHubCandidatePlanner(...)`: resolves GitHub alert candidates and produces descending planned edits + applied candidate-line sets.
   - `mergePlannedEditsDescending(...)`: linearly merges hr/github descending edit lists.
   - `applyPlannedEdits(...)`: applies merged planned edits as-is (no per-render sort), localizing splice-shift impact.
   - Planned hr-candidate application records applied start lines; walker skips applied candidate-start paragraph and heading tokens to avoid double-application across hr-delimited and standalone heading-section paths.
   - `createContainerRunner(...)`: orchestrates candidate planners, applies planned edits, then runs the fallback walker only when needed.
   - Render-time SC helpers in `index.js` resolve SC input, normalize aliases/hide flags, collect conflicts, build runtime plans, and cache per-alias semantic engines.
   - `semanticContainerSc` runtime aliases are treated as literal aliases (escaped before regex assembly); built-in `semantics/*.json` aliases remain regex-capable.
   - `buildRuntimePlan(...)` reuses block-stage start-line key sets when available, then normalizes hr candidates against actual parsed `hr` tokens in core so raw-line false positives (for example setext/fence-like lines) do not leak into candidate application.

3) **Feature helpers**
   - Label style helpers are shared in `src/label-style.js` and reused by bracket/github auto-joint modes.
   - Label token construction helpers are shared in `src/label-token-builder.js` and reused by bracket/github to reduce duplicated token-shape logic.
   - Bracket format helpers are built in `src/bracket-format.js` and only instantiated when `allowBracketJoint` is true.
     - `bracketLabelJointMode` controls bracket-label rendering (`keep`/`remove`/`auto`).
   - GitHub alert helpers are built in `src/github-type-container.js` and only instantiated when `githubTypeContainer` is true; block rule registered before `blockquote`.
     - Default emits a dedicated label paragraph before body paragraphs (GitHub-like).
     - `githubTypeInlineLabel: true` keeps inline label style (`<p><strong>label</strong> body...`).
     - `githubTypeInlineLabelHeadingMixin: true` mixes inline label into a following heading when the marker paragraph has no body text.
     - `githubTypeInlineLabelJoint` controls custom-label suffix/spacing in inline mode (`none`/`auto`) and is ignored unless `githubTypeInlineLabel` is true.
     - `githubTypeInlineLabelHeadingMixin` is ignored unless `githubTypeInlineLabel` is true.
     - In heading-first cases, `labelControl` reads `{label=...}` from the heading line, not the `[!TYPE]` marker line.
     - The block rule only gates on the first line and records candidate start lines in `env.semanticContainerGitHubCandidateLineSet`; it then returns `false` so native blockquote parsing remains the single source of truth for blockquote structure.
     - Core detection uses a fast path when the first child block is marker paragraph (`> [!TYPE]`), with a depth-safe fallback scan for uncommon structures.
     - Core conversion trims the `[!TYPE]` marker from the first paragraph, removes leading breaks, and ensures inserted label paragraph tokens are block-level for renderer line breaks; label paragraph map is inherited from the original paragraph for editor jump accuracy.
      - GitHub alert range detection accounts for nested blockquotes by tracking depth.
      - End `map` is resolved from the nearest mapped token within the blockquote, because `blockquote_close` has no map.
   - `labelControl` behavior is handled in standard/bracket/GitHub appliers via shared helper logic.
     - With `labelControlInlineFallback`, trailing inline `{label=...}` can be consumed safely even without `markdown-it-attrs`.
     - Empty/whitespace `label` values are treated as hide-label directives in all three paths.
   - `headingSectionContainer: true` allows semantic headings to open a no-`hr` section that continues through smaller headings and closes before the next same-level/higher-level heading or before leaving the parent token structure.
   - Titlepage inference is built in. It allows an hr-sandwiched `h1` such as `Chapter 1. Title`, `Chapter A. Title`, `Appendix A. Reference Data`, `Part 1. Title`, `第1章 はじめに`, `第II章 ローマ数字`, `付録A 参考データ`, `付属A 参考データ`, or `第1部 扉タイトル` to become `chapter-titlepage`/`appendix-titlepage`/`part-titlepage`. It is not a standalone heading-section mode; hr detection is intentionally limited to block-collected hr candidates.
   - Parsed frontmatter can set `sc.titlepage: true` or `sc: { titlepage: true }` to wrap from the first content `h1` to before the first `h2` or next `h1` without an opening body `hr`. Top-level `titlepage: true` and hyphenated `sc-titlepage: true` are intentionally not recognized.
   - `semanticContainerSc` default hide flags are applied in standard/bracket/GitHub appliers; inline `label` (when `labelControl` is enabled) takes precedence.

4) **Initialization**
   - `createSemanticEngine` wires the factories: builds regexes, picks the checker, builds the setter and walker, and returns `semanticContainer`.
   - `mditSemanticContainer` is first-install-wins per `markdown-it` instance, then sets defaults, builds semantics/helpers, registers `semantic_container_prepare_env` before core `block` to reset plugin-owned env stores (`hr` candidates, GitHub candidate lines, warnings), registers the hr-candidate block rule before `hr`, optionally registers the GitHub alert block rule, and adds the core ruler (`semantic_container`) after `text_join` when available (fallback: `inline`).

5) **Data layout**
   - Locale data: `semantics/en.json` (canonical entries with tags/attrs/aliases), `semantics/ja.json` (label map). Additional locales can be added similarly and passed via `languages`.
   - Semantic catalog documentation is generated from `semantics/*.json` plus documentation copy in `docs/generate-semantic-catalog.js`; run `npm run docs:semantic-catalog` when canonical semantics, default tags/attrs, or important alias policy changes.
   - This plugin handles semantics that wrap content as `section`, `aside`, or `div`. HTML tag selection follows native HTML semantics first: use `section` for standalone document sections, `aside` for tangential/sidebar-like material, and `div` only when a stronger sectioning element would overstate the structure (`question`). This plugin does not include `example` as a built-in semantic; figure-like examples and figure-specific `role="doc-example"` output are intentionally delegated to figure/caption tooling such as `p7d-markdown-it-figure-with-p-caption`.
   - `chapter-titlepage`, `appendix-titlepage`, and `part-titlepage` use `div` by default because they represent page-like opening material inside a chapter/appendix-or-attachment/part structure rather than standalone sectioning content.
   - The default `role="doc-*"` attributes prioritize DPUB-ARIA close matches. If a semantic label has no close DPUB-ARIA role, keep the `sc-*` class and do not emit a default `role` rather than forcing a broad document role. `glossary` is included as a close DPUB-ARIA role match (`doc-glossary`); workflow-oriented semantics such as `requirements`, `procedure`, `resources`, `explanation`, `limitations`, `decision`, `troubleshooting`, `prerequisites`, `next-steps`, `minutes`, `learning-objectives`, and `rubric` do not emit default `role` attributes.
   - `epub:type` is not emitted by default; EPUB structural vocabulary is reference material for future EPUB-specific output only.

Performance considerations:
- Regexes and helpers are built once per init; helpers are only created for enabled features.
- Hot paths avoid extra allocations and repeated scans; the walker uses a Set for checked positions.
- Non-hr standalone detection for heading/paragraph/blockquote paths is centralized in one helper, reducing duplicated branch logic and keeping skip guards consistent across edge/non-edge positions.
- Heading-section standalone ranges are closed from parser-derived heading tokens and `token.level`, avoiding raw-source section scans and preventing the section from escaping parent list/blockquote structure.
- Heading-titlepage hr-sandwich matching only runs inside hr-candidate planning; non-hr headings do not pay the regex cost unless frontmatter titlepage control is present.
- Frontmatter titlepage matching runs after planned hr/GitHub edits, so its range is resolved against the current token stream and does not stale-shift around nested planned edits.
- Per-render env reset is done once in core (`semantic_container_prepare_env`), then block collectors only append matched candidates; this avoids stale candidate leakage when `env` is reused and removes per-line init checks.
- Candidate gating is based on hr-sandwich structure only (not semantic name matching), so it can be applied safely before semantic regex checks across standard/bracket/github enabled renders.
- Hr candidates are applied before the general walker in both require/non-require modes; the walker skips applied candidate-start paragraphs and heading tokens so hr-delimited heading sections are not re-applied by standalone heading-section checks.
- Candidate-based edits are collected first and then applied in descending token-index order, reducing forward index-shift risk and centralizing splice behavior.
- With GitHub enabled, candidate-based GitHub conversion is also attempted before deciding whether a full walk is still necessary.
- Hr candidate planning reuses normalized candidate token indexes when available and only falls back to start/end token re-indexing for candidates that lack token indexes, avoiding repeated scans on the common path.
- Hr runtime plans normalize block-stage hr candidates against actual parsed `hr` tokens before planning, preventing raw-line closing mismatches from setext/fence-like content while preserving candidate gating.
- GitHub blockquote checks in walker are gated by block-stage candidate start lines when available, reducing scans over non-alert blockquotes.
- `semanticContainerSc` alias engines are cached by deterministic alias signatures (bounded cache) to avoid rebuilding regex/helper pipelines on repeated renders.
- SC normalization allocates alias conflict maps lazily (only when aliases exist), and semantics alias merging uses copy-on-write so unchanged semantics entries are reused.
- GitHub/bracket/standard label checks use fast leading-char guards to reduce regex work on non-candidates.
- Standard/bracket/GitHub label matchers keep small bounded match caches to reduce repeated regex scans for identical leading content.
- Match caches store parsed semantic metadata instead of raw regex match arrays to reduce cache footprint and repeated group parsing.
- Matchers also pre-bucket semantics by detectable leading label character and only scan candidate subsets (with safe fallback for regex-like alias patterns).
- If no candidate bucket exists and fallback is empty, matchers short-circuit to cache-miss without full semantic scans.
- Match caches are always enabled; this favors preview workflows (repeated renders of largely similar content), which are the primary target usage for this plugin.
- Benchmarking guidance: use deterministic corpus + median-per-render (`npm run performance:ab`) for reliable before/after comparisons; avoid random-input benchmarks when evaluating optimizer impact.
- Case-insensitive matching is not full Unicode case folding; for locales with special rules (e.g., German `ß`/`ẞ`/`SS`), register explicit aliases.

Testing notes:
- The test loader supports multiple expected HTML blocks per case via `[HTML:<label>]` headers.
- Default assertions use `[HTML]` (or the first HTML block if unlabeled); labeled assertions are selected explicitly from `test/test.js`.
- Direct option normalization tests cover tolerant fallback for unknown and invalid option values.
- Direct semantic catalog tests lock DPUB-ARIA close-match roles, no-default-role fallbacks, canonical-name class output, narrowed alias behavior, and technical/office/school label coverage in English and Japanese.
- Direct tests include block candidate collection/reset checks to lock per-render env behavior.
- Direct tests include non-requireHr candidate re-apply skip checks and headingSectionContainer hr-delimited double-apply regression coverage.
- Direct tests include built-in titlepage inference, ignored legacy titlepage option behavior, English/Japanese chapter/appendix/part span output, non-h1/non-hr non-conversion behavior, and frontmatter titlepage control aliases.
- Fixture coverage includes heading-section boundary checks for same/higher heading closure, nested smaller headings, and structural exits from blockquotes/lists.
- Local preflight checks are `npm test` and `npm run labels:audit:strict`; use `performance:ab` when parser phases, hot paths, or rule ordering change.
