# Architecture Notes for Agents

This plugin converts paragraph groups into semantic containers in markdown-it. Key flow (defined in `index.js`):

1) **Options & data**
   - Options: `requireHrAtOneParagraph`, `removeJointAtLineEnd`, `allowBracketJoint`, `githubTypeContainer`, `languages` (English always included, defaults to `["ja"]` for extra labels).
   - Semantics are built via `buildSemantics(languages)` (see `src/semantics.js`), then regexes are generated once per init.

2) **Core factories**
   - `buildSemanticsReg(semantics)`: builds regexes for the standard joint formats (`.` `:` `。` `：` etc.).
   - `createLabelMatcher(...)`: checks the next inline token for a semantic label and finds the container end (hr or paragraph close); includes a cheap leading-char guard to avoid regex work on non-candidates.
   - `createActiveCheck(...)`: delegates to GitHub alert check, then bracket check, then the core checker.
   - `createContainerRangeChecker(...)`: walks forward to find continued containers.
   - `createContainerApplier(...)`: wraps tokens with `html_block` start/end tags, fixes labels/joints/aria-label, and copies `map` from nearby hr/paragraph tokens for scroll sync (delegates to GitHub/bracket setters when applicable).
   - `createContainerWalker(...)`: main token walker; skips non-target tokens and uses a Set of checked positions to avoid reprocessing.
   - `createContainerRunner(...)`: runs the walker over all tokens.

3) **Feature helpers**
   - Bracket format helpers are built in `src/bracket-format.js` and only instantiated when `allowBracketJoint` is true.
   - GitHub alert helpers are built in `src/github-type-container.js` and only instantiated when `githubTypeContainer` is true; block rule registered before `blockquote` but delegates actual parsing to the built-in blockquote rule.
     - The block rule only gates on the first line and then calls the core blockquote rule to preserve native Markdown structures (lists, headings, nested quotes, fences).
     - Core conversion trims the `[!TYPE]` marker from the first paragraph, removes leading breaks, and ensures inserted label paragraph tokens are block-level for renderer line breaks; label paragraph map is inherited from the original paragraph for editor jump accuracy.
     - GitHub alert range detection accounts for nested blockquotes by tracking depth.
     - End `map` is resolved from the nearest mapped token within the blockquote, because `blockquote_close` has no map.

4) **Initialization**
   - `createSemanticEngine` wires the factories: builds regexes, picks the checker, builds the setter and walker, and returns `semanticContainer`.
   - `mditSemanticContainer` sets defaults, builds semantics/helpers, optionally registers the GitHub alert block rule, and adds the core ruler (`semantic_container`) after the latest available safe anchor (inline/text_join/footnote/etc.) to avoid index shifts from other plugins.

5) **Data layout**
   - Locale data: `semantics/en.json` (canonical entries with tags/attrs/aliases), `semantics/ja.json` (label map). Additional locales can be added similarly and passed via `languages`.

Performance considerations:
- Regexes and helpers are built once per init; helpers are only created for enabled features.
- Hot paths avoid extra allocations and repeated scans; the walker uses a Set for checked positions.
- GitHub/bracket/standard label checks use fast leading-char guards to reduce regex work on non-candidates.
- Standard/bracket/GitHub label matchers keep small bounded match caches to reduce repeated regex scans for identical leading content.
- Matchers also pre-bucket semantics by detectable leading label character and only scan candidate subsets (with safe fallback for regex-like alias patterns).
- Match caches are always enabled; this favors preview workflows (repeated renders of largely similar content), which are the primary target usage for this plugin.
- Benchmarking guidance: use deterministic corpus + median-per-render (`npm run performance:ab`) for reliable before/after comparisons; avoid random-input benchmarks when evaluating optimizer impact.
- Case-insensitive matching is not full Unicode case folding; for locales with special rules (e.g., German `ß`/`ẞ`/`SS`), register explicit aliases.

Testing notes:
- The test loader supports multiple expected HTML blocks per case via `[HTML:<label>]` headers.
- Default assertions use `[HTML]` (or the first HTML block if unlabeled); labeled assertions are selected explicitly from `test/test.js`.
