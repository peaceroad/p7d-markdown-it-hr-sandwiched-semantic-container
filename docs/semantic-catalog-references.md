# Semantic catalog references

This note records the main references used when reviewing the built-in semantic
catalog, especially the default HTML roles/classes in `semantics/en.json` and
the Japanese aliases in `semantics/ja.json`.

The package does not try to implement EPUB output directly. The current policy
is:

- Prefer native HTML elements and stable `sc-*` classes.
- This plugin handles semantics that wrap content as `section`, `aside`, or
  `div`. Figure-like examples are intentionally delegated to figure/caption
  plugins such as
  [`p7d-markdown-it-figure-with-p-caption`](https://github.com/peaceroad/p7d-markdown-it-figure-with-p-caption).
- This plugin does not infer wrappers for the entire rendered document from a
  top-level heading. Whole-document EPUB structures such as chapter,
  prologue, epilogue, introduction, or conclusion pages should be owned by the
  EPUB-level structuring tool unless the author uses explicit local semantic
  markup.
- Choose HTML elements before ARIA roles: use `section` for standalone document
  sections, `aside` for tangential or sidebar-like material, and `div` only
  when a more specific HTML element would overstate the structure.
- Add `role="doc-*"` only when the semantic has a close DPUB-ARIA match.
- Treat EPUB Structural Semantics Vocabulary (`epub:type`) terms as vocabulary
  guidance, not as default emitted attributes.
- Do not emit a default `role` for ambiguous or workflow-oriented terms.

## Core EPUB / DPUB references

- [Digital Publishing WAI-ARIA Module 1.1, Editor's Draft](https://w3c.github.io/dpub-aria/)
  - Primary reference for `role="doc-*"` values.
  - The catalog intentionally follows the current DPUB-ARIA 1.1 editor's draft
    direction for roles such as `doc-toc`, `doc-errata`, `doc-glossary`,
    `doc-tip`, and `doc-pullquote`.
  - The draft states that DPUB-ARIA roles are structural semantic extensions for
    digital publishing and that the roles are derived from the EPUB Structural
    Semantics Vocabulary.
  - DPUB-ARIA 1.1 treats `doc-example` as figure-like. This plugin therefore
    does not include `example` as a built-in semantic. Figure-specific
    `role="doc-example"` output is delegated to figure/caption tooling such as
    [`p7d-markdown-it-figure-with-p-caption`](https://github.com/peaceroad/p7d-markdown-it-figure-with-p-caption)
    when its `roleDocExample` option is enabled.
- [HTML Standard: sections, `nav`, and `aside`](https://html.spec.whatwg.org/multipage/sections.html)
  - Primary reference for native sectioning elements.
  - `section` is used for standalone document sections when no more specific
    HTML element fits.
  - `aside` is used when content is tangentially related and could be considered
    separate from the surrounding content.
  - `nav` is used for table-of-contents-like navigation aids.
- [HTML Standard: `div`](https://html.spec.whatwg.org/multipage/grouping-content.html#the-div-element)
  - `div` has no special meaning and is treated as a last-resort grouping
    element.
  - The package uses it for `question`, where forcing an HTML section would
    make the output structure stronger than the source label.
  - `note`, `memo`, and `information` intentionally remain `section` rather
    than `aside` or `div`: in technical documents, office documents, and
    manuals, these labels often mark document-flow blocks rather than
    tangential sidebars.
- [EPUB Type to ARIA Role Authoring Guide 1.1, Editor's Draft](https://w3c.github.io/epub-specs/wg-notes/epub-aria-authoring/)
  - Primary reference for the package policy that `epub:type` and ARIA `role`
    are not interchangeable.
  - Important catalog implications:
    - `epub:type` is liberal and workflow-oriented.
    - ARIA roles are accessibility-facing and can harm the reading experience
      when over-applied.
    - Some EPUB terms intentionally have "No Role" mappings, including
      `answer`, `answers`, `assessment`, `assessments`, `feedback`,
      `question`, and many educational/problem-type terms.
  - This is why the package keeps `answer`, `problem`, `question`,
    `assessments`, `feedback`, `keywords`, and similar entries without default
    `role` attributes.
- [EPUB 3 Structural Semantics Vocabulary 1.1, Editor's Draft](https://w3c.github.io/epub-specs/wg-notes/ssv/)
  - Primary reference for EPUB vocabulary names and their publication semantics.
  - Used to decide whether a catalog name is a recognizable publishing concept
    even when no ARIA role is emitted.
  - The vocabulary explains that `epub:type` refines the meaning of existing
    elements, provides hints for reading systems and workflows, and does not by
    itself improve accessibility.

## DPUB/EPUB mapping notes used by this package

These are intentionally conservative rules for default output:

- Close DPUB-ARIA matches can emit roles:
  - `abstract` -> `role="doc-abstract"`
  - `acknowledgments` -> `role="doc-acknowledgments"`
  - `appendix` -> `role="doc-appendix"`
  - `bibliography` -> `role="doc-bibliography"`
  - `colophon` -> `role="doc-colophon"`
  - `conclusion` -> `role="doc-conclusion"`
  - `credits` -> `role="doc-credits"`
  - `dedication` -> `role="doc-dedication"`
  - `endnotes` -> `role="doc-endnotes"`
  - `epigraph` -> `role="doc-epigraph"`
  - `epilogue` -> `role="doc-epilogue"`
  - `errata` -> `role="doc-errata"`
  - `faq`, `interview`, `qna` -> `role="doc-qna"`
  - `foreword` -> `role="doc-foreword"`
  - `glossary` -> `role="doc-glossary"`
  - `index` -> `role="doc-index"`
  - `introduction` -> `role="doc-introduction"`
  - `notice`, `alert`, `caution`, `danger`, `important`, `warning` ->
    `role="doc-notice"`
  - `preface` -> `role="doc-preface"`
  - `prologue` -> `role="doc-prologue"`
  - `pull-quote` -> `role="doc-pullquote"`
  - `tip`, `hint`, `point` -> `role="doc-tip"`
  - `toc`, `chapter-toc` -> `role="doc-toc"`
- EPUB vocabulary terms with no ARIA role do not emit default `role`
  attributes:
  - `answer`
  - `assessments`
  - `feedback`
  - `keywords`
  - `problem`
  - `question`
- Broad editorial or site-local categories do not emit default `role`
  attributes unless DPUB-ARIA has a close match:
  - `agenda`
  - `annotation`
  - `book`
  - `check`
  - `column`
  - `decision`
  - `event`
  - `explanation`
  - `information`
  - `issue`
  - `learning-objectives`
  - `limitations`
  - `memo`
  - `minutes`
  - `next-steps`
  - `note`
  - `opinion`
  - `outline`
  - `overview`
  - `planning`
  - `prerequisites`
  - `procedure`
  - `profile`
  - `proposal`
  - `reference`
  - `related-*`
  - `recommendation`
  - `requirements`
  - `resources`
  - `rubric`
  - `solution`
  - `suggestion`
  - `summary`
  - `task`
  - `troubleshooting`
  - `topic`
  - `updates`

Titlepage inference notes:

- `chapter-titlepage`, `appendix-titlepage`, and `part-titlepage` are roleless
  `div` containers for page-like opening material, not DPUB document section
  roles.
- Built-in h1 titlepage inference is limited to conservative numbered,
  lettered, or Roman-numeral chapter/appendix/part openings.
- Explicit titlepage labels such as `Chapter titlepage.` and `章扉。` remain
  available as direct semantic labels, but they are marker-like compared with
  natural document labels. Prefer h1 titlepage inference or parsed
  frontmatter/meta `sc.titlepage: true` for ebook title pages.
- Because explicit titlepage labels use the same semantic-label flow as
  `Note.` or `Warning.`, their label text remains visible unless hidden with
  `labelControl` or `semanticContainerSc`.
- `Prologue`, `Epilogue`, `Introduction`, `Conclusion`, `序章`, `終章`,
  `プロローグ`, and `エピローグ` remain explicit semantic labels for their
  existing DPUB section roles where applicable, but are intentionally not
  inferred as h1 titlepages by default.

## Japanese alias policy notes

- Japanese aliases are package-maintained recognition terms, not normative
  translations of EPUB/DPUB vocabularies.
- Prefer terms that can stand alone as document labels:
  - Good examples: `概要`, `注記`, `備考`, `文献表`, `付属資料`, `編集注`,
    `重要事項`, `注意事項`, `計画案`, `推奨`, `用語集`, `要件`,
    `手順`, `資料`, `解説`, `制限事項`, `決定事項`, `もくじ`, `豆知識`.
- Avoid overly broad single words unless they are established labels:
  - `注` is accepted for `note` because it is a common note label.
  - `案` is not accepted for `planning` because it is too broad.
  - `付属` is not accepted for `appendix`; `付属資料` is accepted.
  - `注目` is not accepted for `notice`; it reads more like emphasis than a
    document section label.
- Keep question/answer aliases bounded:
  - `問題1`, `問1`, `問いA`, `設問３`, `回答1`, and `答えA` are accepted.
  - Bare `問` and bare `答` are not accepted, to avoid short-label false
    positives.

## Date checked

These references were checked against the editor's drafts on 2026-07-04.
