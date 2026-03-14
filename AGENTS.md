# Architecture Notes for Agents

This plugin converts paragraph groups into semantic containers in markdown-it. Key flow (defined in `index.js`):

1) **Options & data**
   - Options: `requireHrAtOneParagraph`, `removeJointAtLineEnd`, `allowBracketJoint`, `bracketLabelJointMode`, `githubTypeContainer`, `githubTypeInlineLabel`, `githubTypeInlineLabelHeadingMixin`, `githubTypeInlineLabelJoint`, `labelControl`, `labelControlInlineFallback`, `languages` (English always included, defaults to `["ja"]` for extra labels).
   - Per-render SC input sources (priority): `state.env.semanticContainerSc` -> `state.env.frontmatter.sc` -> `state.env.meta.sc` -> `md.frontmatter.sc` -> `md.meta.sc`.
   - `md.frontmatter.sc` / `md.meta.sc` are consumed only in current-render context (front matter token present) or when object reference changed, to avoid stale cross-render metadata leakage.
   - Semantics are built via `buildSemantics(languages)` (see `src/semantics.js`), then regexes are generated once per init.

2) **Core factories**
   - `createHrBlockCandidateCollector(...)` (in `src/semantic-hr-candidates.js`): lightweight block-stage collector that records hr-sandwich candidates (`openHrLine`, `startLine`, `endHrLine`, `hrType`) into `env.semanticContainerHrCandidates` and precomputed candidate keys into `env.semanticContainerHrCandidateKeySet` (append-only in block phase; env stores are prepared/reset in core before block).
   - `buildSemanticsReg(semantics)`: builds regexes for the standard joint formats (`.` `:` `。` `：` etc.).
   - `buildSemanticLeadCandidates(semantics)` (in `src/semantic-lead.js`): pre-buckets semantic candidates by leading label character for faster checks.
   - `resolveLabelControl(...)` / `escapeHtmlForAttr(...)` (in `src/label-control.js`): shared `label` extraction/removal and safe attribute escaping. Supports attrs-based extraction and optional inline-tail fallback (`{label=...}`) when attrs are unavailable.
   - `resolveContainerRangeEnd(...)` (in `src/container-range.js`): shared range-end resolver for standard/bracket detection; returns hr-close token index for hr paths and post-`paragraph_close` index for standalone paths, matching applier splice contracts.
   - `createContainerStartToken(...)` / `createContainerEndToken(...)` (in `src/container-token.js`): shared HTML container start/end token generation for standard, bracket, and GitHub paths.
   - `createWrappedLabelTokens(...)` / `createBracketWrappedLabelTokens(...)` (in `src/label-token-builder.js`): shared inline label token builders reused by bracket/GitHub appliers.
   - `createLabelMatcher(...)`: checks the next inline token for a semantic label and finds the container end (hr or paragraph close); includes a cheap leading-char guard to avoid regex work on non-candidates.
   - `createActiveCheck(...)`: delegates to GitHub alert check, then bracket check, then the core checker, with an early token-type gate for non paragraph/heading targets.
   - `createContainerRangeChecker(...)`: walks forward to find continued containers.
   - `createContainerApplier(...)`: dispatches to GitHub/bracket setters, otherwise delegates standard behavior to `createStandardContainerApplier(...)` in `src/standard-applier.js`. Standard path wraps tokens with `html_block` start/end tags, fixes labels/joints/aria-label, and copies `map` from nearby hr/paragraph tokens.
   - `tryApplyStandaloneContainer(...)`: shared no-hr path helper for paragraph/blockquote checks; consolidates skip guards (`applied hr candidate`, list-item exclusion, GitHub candidate gating) and applies single-container conversions without duplicating walker branches.
   - `createContainerWalker(...)`: main token walker; skips non-target tokens before standalone/hr-path checks and uses a Set of checked positions to avoid reprocessing.
   - `createHrCandidatePlanner(...)`: resolves semantic matches with standard+bracket matchers on hr candidates and produces descending planned edits + applied start-line sets.
   - `createGitHubCandidatePlanner(...)`: resolves GitHub alert candidates and produces descending planned edits + applied candidate-line sets.
   - `mergePlannedEditsDescending(...)`: linearly merges hr/github descending edit lists.
   - `applyPlannedEdits(...)`: applies merged planned edits as-is (no per-render sort), localizing splice-shift impact.
   - For `requireHrAtOneParagraph: false`, planned hr-candidate application records applied start lines; walker skips those paragraph starts to avoid double-application.
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
   - `semanticContainerSc` default hide flags are applied in standard/bracket/GitHub appliers; inline `label` (when `labelControl` is enabled) takes precedence.

4) **Initialization**
   - `createSemanticEngine` wires the factories: builds regexes, picks the checker, builds the setter and walker, and returns `semanticContainer`.
   - `mditSemanticContainer` sets defaults, builds semantics/helpers, registers `semantic_container_prepare_env` before core `block` to reset plugin-owned env stores (`hr` candidates, GitHub candidate lines, warnings), registers the hr-candidate block rule before `hr`, optionally registers the GitHub alert block rule, and adds the core ruler (`semantic_container`) after `text_join` when available (fallback: `inline`).

5) **Data layout**
   - Locale data: `semantics/en.json` (canonical entries with tags/attrs/aliases), `semantics/ja.json` (label map). Additional locales can be added similarly and passed via `languages`.

Performance considerations:
- Regexes and helpers are built once per init; helpers are only created for enabled features.
- Hot paths avoid extra allocations and repeated scans; the walker uses a Set for checked positions.
- Non-hr standalone detection for paragraph/blockquote paths is centralized in one helper, reducing duplicated branch logic and keeping skip guards consistent across edge/non-edge positions.
- Per-render env reset is done once in core (`semantic_container_prepare_env`), then block collectors only append matched candidates; this avoids stale candidate leakage when `env` is reused and removes per-line init checks.
- Candidate gating is based on hr-sandwich structure only (not semantic name matching), so it can be applied safely before semantic regex checks across standard/bracket/github enabled renders.
- Hr candidates are applied before the general walker in both require/non-require modes; in non-require mode the walker skips applied candidate-start paragraphs.
- Candidate-based edits are collected first and then applied in descending token-index order, reducing forward index-shift risk and centralizing splice behavior.
- With GitHub enabled, candidate-based GitHub conversion is also attempted before deciding whether a full walk is still necessary.
- Hr candidate application pre-indexes hr start/end token locations once per render and applies groups in reverse order, reducing repeated token scans on hr-heavy documents.
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
- Direct tests include block candidate collection/reset checks to lock per-render env behavior.
- Direct tests include non-requireHr candidate re-apply skip checks.
