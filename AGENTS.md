# Architecture Notes for Agents

This plugin converts paragraph groups into semantic containers in markdown-it. Key flow (defined in `index.js`):

1) **Options & data**
   - Options: `requireHrAtOneParagraph`, `removeJointAtLineEnd`, `allowBracketJoint`, `githubTypeContainer`, `languages` (English always included, defaults to `["ja"]` for extra labels).
   - Semantics are built via `buildSemantics(languages)` (see `src/semantics.js`), then regexes are generated once per init.

2) **Helper factories**
   - `buildSemanticsReg(semantics)`: builds regexes for the standard joint formats (`.` `:` `。` `：` etc.).
   - `createLabelMatcher(...)`: checks the current token group for a semantic label and closing hr/paragraph.
   - `pickActiveCheck(...)`: chooses the checker (GitHub alerts, bracket format, or core) based on options and available helpers.
   - `createContainerRangeChecker(...)`: walks forward to find continued containers.
   - `createContainerApplier(...)`: rewrites tokens to wrap the semantic container and fix labels/joints/aria-label.
   - `createContainerWalker(...)`: main token walker; skips non-target tokens and applies setters.
   - `createContainerRunner(...)`: runs the walker over all tokens.

3) **Feature helpers**
   - Bracket format helpers are built in `src/bracket-format.js` and only instantiated when `allowBracketJoint` is true.
   - GitHub alert helpers are built in `src/github-type-container.js` and only instantiated when `githubTypeContainer` is true; block rule registered before `blockquote`.

4) **Initialization**
   - `createSemanticEngine` wires the factories: builds regexes, picks the checker, builds the setter and walker, and returns `semanticContainer`.
   - `mditSemanticContainer` sets defaults, builds semantics/helpers, optionally registers the GitHub alert block rule, and adds the core ruler (`semantic_container`) after `text_join`.

5) **Data layout**
   - Locale data: `semantics/en.json` (canonical entries with tags/attrs/aliases), `semantics/ja.json` (label map). Additional locales can be added similarly and passed via `languages`.

Performance considerations:
- Regexes and helpers are built once per init; helpers are only created for enabled features.
- Hot paths avoid extra allocations (escaped regex parts reused; single jump tracking in walkers).
