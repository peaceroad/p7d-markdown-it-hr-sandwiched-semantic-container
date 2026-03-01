# Architecture Notes for Agents

This plugin converts paragraph groups into semantic containers in markdown-it. Key flow (defined in `index.js`):

1) **Options & data**
   - Options: `requireHrAtOneParagraph`, `removeJointAtLineEnd`, `allowBracketJoint`, `bracketLabelJointMode`, `githubTypeContainer`, `githubTypeInlineLabel`, `githubTypeInlineLabelHeadingMixin`, `githubTypeInlineLabelJoint`, `labelControl`, `languages` (English always included, defaults to `["ja"]` for extra labels).
   - Per-render SC input sources (priority): `state.env.semanticContainerSc` -> `state.env.frontmatter.sc` -> `state.env.meta.sc` -> `md.frontmatter.sc` -> `md.meta.sc`.
   - `md.frontmatter.sc` / `md.meta.sc` are consumed only in current-render context (front matter token present) or when object reference changed, to avoid stale cross-render metadata leakage.
   - Semantics are built via `buildSemantics(languages)` (see `src/semantics.js`), then regexes are generated once per init.

2) **Core factories**
   - `createHrBlockCandidateCollector(...)` (in `src/semantic-hr-candidates.js`): lightweight block-stage collector that records hr-sandwich candidates (`openHrLine`, `startLine`, `endHrLine`, `hrType`) into `env.semanticContainerHrCandidates` and precomputed candidate keys into `env.semanticContainerHrCandidateKeySet` (append-only in block phase; env stores are prepared/reset in core before block).
   - `buildSemanticsReg(semantics)`: builds regexes for the standard joint formats (`.` `:` `。` `：` etc.).
   - `buildSemanticLeadCandidates(semantics)` (in `src/semantic-lead.js`): pre-buckets semantic candidates by leading label character for faster checks.
   - `resolveLabelControl(...)` / `escapeHtmlForAttr(...)` (in `src/label-control.js`): shared `label` attr extraction/removal and safe attribute escaping.
   - `createContainerStartToken(...)` / `createContainerEndToken(...)` (in `src/container-token.js`): shared HTML container start/end token generation for standard, bracket, and GitHub paths.
   - `createLabelMatcher(...)`: checks the next inline token for a semantic label and finds the container end (hr or paragraph close); includes a cheap leading-char guard to avoid regex work on non-candidates.
   - `createActiveCheck(...)`: delegates to GitHub alert check, then bracket check, then the core checker.
   - `createContainerRangeChecker(...)`: walks forward to find continued containers.
   - `createContainerApplier(...)`: wraps tokens with `html_block` start/end tags, fixes labels/joints/aria-label, and copies `map` from nearby hr/paragraph tokens for scroll sync (delegates to GitHub/bracket setters when applicable). With `labelControl`, empty/whitespace `label` means "hide visible label" while accessibility label fallback is preserved.
   - `createContainerWalker(...)`: main token walker; skips non-target tokens and uses a Set of checked positions to avoid reprocessing.
   - `createHrCandidateRunner(...)`: resolves semantic matches with standard+bracket matchers on hr candidates, pre-indexes start/end token positions by line+hrType, and applies groups from tail-to-head so token index shifts do not require repeated rescans.
   - For `requireHrAtOneParagraph: false`, hr-candidate application records applied start lines; walker skips those paragraph starts to avoid double-application.
   - `createGitHubCandidateRunner(...)`: resolves GitHub alert candidates from block-collected start lines and applies them from tail-to-head before the general walker.
   - `createContainerRunner(...)`: orchestrates candidate runners first (hr/github) and runs the walker only when needed.
   - Render-time SC helpers in `index.js` resolve SC input, normalize aliases/hide flags, collect conflicts, build runtime plans, and cache per-alias semantic engines.
   - `buildRuntimePlan(...)` reuses block-stage key sets when available (`hr` and GitHub alert line candidates), avoiding per-render reconstruction in core.

3) **Feature helpers**
   - Bracket format helpers are built in `src/bracket-format.js` and only instantiated when `allowBracketJoint` is true.
     - `bracketLabelJointMode` controls bracket-label rendering (`keep`/`remove`/`auto`).
   - GitHub alert helpers are built in `src/github-type-container.js` and only instantiated when `githubTypeContainer` is true; block rule registered before `blockquote`.
     - Default emits a dedicated label paragraph before body paragraphs (GitHub-like).
     - `githubTypeInlineLabel: true` keeps inline label style (`<p><strong>label</strong> body...`).
     - `githubTypeInlineLabelHeadingMixin: true` mixes inline label into a following heading when the marker paragraph has no body text.
     - `githubTypeInlineLabelJoint` controls custom-label suffix/spacing in inline mode (`none`/`auto`).
     - In heading-first cases, `labelControl` reads `{label=...}` from the heading line, not the `[!TYPE]` marker line.
     - The block rule only gates on the first line and records candidate start lines in `env.semanticContainerGitHubCandidateLineSet`; it then returns `false` so native blockquote parsing remains the single source of truth for blockquote structure.
     - Core detection uses a fast path when the first child block is marker paragraph (`> [!TYPE]`), with a depth-safe fallback scan for uncommon structures.
     - Core conversion trims the `[!TYPE]` marker from the first paragraph, removes leading breaks, and ensures inserted label paragraph tokens are block-level for renderer line breaks; label paragraph map is inherited from the original paragraph for editor jump accuracy.
      - GitHub alert range detection accounts for nested blockquotes by tracking depth.
      - End `map` is resolved from the nearest mapped token within the blockquote, because `blockquote_close` has no map.
   - `labelControl` behavior is handled in standard/bracket/GitHub appliers via shared helper logic (typically with `markdown-it-attrs`).
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
- Per-render env reset is done once in core (`semantic_container_prepare_env`), then block collectors only append matched candidates; this avoids stale candidate leakage when `env` is reused and removes per-line init checks.
- Candidate gating is based on hr-sandwich structure only (not semantic name matching), so it can be applied safely before semantic regex checks across standard/bracket/github enabled renders.
- Hr candidates are applied before the general walker in both require/non-require modes; in non-require mode the walker skips applied candidate-start paragraphs.
- With GitHub enabled, candidate-based GitHub conversion is also attempted before deciding whether a full walk is still necessary.
- Hr candidate application pre-indexes hr start/end token locations once per render and applies groups in reverse order, reducing repeated token scans on hr-heavy documents.
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
