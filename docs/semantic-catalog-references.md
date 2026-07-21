# Semantic catalog references

This note records the main references used when reviewing the built-in semantic
catalog, especially the default HTML roles/classes in `semantics/en.json` and
the Japanese aliases in `semantics/ja.json`.

The package does not try to implement EPUB output directly. The current policy
is:

- Prefer native HTML elements and stable `sc-*` classes.
- This plugin handles semantics that wrap content as `section`, `aside`, `div`,
  or `nav`. Figure-like examples are intentionally delegated to figure/caption
  plugins such as
  [`p7d-markdown-it-figure-with-p-caption`](https://github.com/peaceroad/p7d-markdown-it-figure-with-p-caption).
- Inline/reference semantics whose natural carrier is `a` or phrasing content,
  such as `backlink`, `biblioref`, `glossref`, and singular `credit`, are
  intentionally outside this container catalog. `credit` and the section-level
  `credits` are distinct concepts, not singular/plural aliases.
- This plugin does not infer wrappers for the entire rendered document from a
  top-level heading. Whole-document EPUB structures such as chapter,
  prologue, epilogue, introduction, or conclusion pages should be owned by the
  EPUB-level structuring tool unless the author uses explicit local semantic
  markup.
- Choose HTML elements before ARIA roles: use `section` for standalone document
  sections, `aside` for tangential or sidebar-like material, `nav` for
  navigation such as tables of contents, and `div` only when a more specific
  HTML element would overstate the structure.
- Add `role="doc-*"` only when the semantic has a close DPUB-ARIA match.
- Treat EPUB Structural Semantics Vocabulary (`epub:type`) terms as vocabulary
  guidance, not as default emitted attributes.
- Do not emit a default `role` for ambiguous or workflow-oriented terms.
- Treat alias recognition as semantic classification. Built-in and runtime
  aliases inherit the canonical tag, classes, and default attributes, including
  `role`; an ambiguous alias must not be made "safe" with a per-alias role
  exception.

## Core EPUB / DPUB references

- [Digital Publishing WAI-ARIA Module 1.1](https://www.w3.org/TR/dpub-aria-1.1/)
  - Primary reference for `role="doc-*"` values.
  - The 12 June 2025 Recommendation and the
    [official Editor's Draft](https://w3c.github.io/dpub-aria/) were both
    checked. The role names and definitions used by this catalog are unchanged
    between them.
  - The catalog follows DPUB-ARIA 1.1 definitions for roles such as `doc-toc`,
    `doc-errata`, `doc-glossary`,
    `doc-tip`, and `doc-pullquote`.
  - `doc-notice` has superclass `note`, not `alert`. Pop-up presentation,
    focus changes, and live-region announcements are not implied by the role.
  - `doc-endnotes` requires a descendant note list and must not be applied to
    the list itself. Note collection, references, and backlinks are delegated
    to footnote/endnote or downstream EPUB tooling rather than inferred here.
  - The specification states that DPUB-ARIA roles are structural semantic extensions for
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
  - A visible heading is the normal way to identify a section, but an explicitly
    designated thematic region can use an accessible name when no visible
    heading is available.
  - `aside` is used when content is tangentially related and could be considered
    separate from the surrounding content.
  - `nav` is used for table-of-contents-like navigation aids.
- [HTML Standard: `div`](https://html.spec.whatwg.org/multipage/grouping-content.html#the-div-element)
  - `div` has no special meaning and is treated as a last-resort grouping
    element.
  - The package uses it for `question`, where forcing an HTML section would
    make the output structure stronger than the source label; for `lead`, which
    is opening prose rather than a separately navigable document section; and
    for titlepage wrappers that represent page-like opening material rather
    than a standalone section.
  - `note`, `memo`, and `information` intentionally remain `section` rather
    than `aside` or `div`: in technical documents, office documents, and
    manuals, these labels often mark document-flow blocks rather than
    tangential sidebars.
- [EPUB Type to ARIA Role Authoring Guide 1.1](https://www.w3.org/TR/epub-aria-authoring-11/)
  - Primary reference for the package policy that `epub:type` and ARIA `role`
    are not interchangeable.
  - Important catalog implications:
    - `epub:type` is liberal and workflow-oriented.
    - ARIA roles are accessibility-facing and can harm the reading experience
      when over-applied.
  - Some EPUB terms intentionally have "No Role" mappings, including
    `answer`, `answers`, `assessment`, `assessments`, `feedback`,
    `question`, and many educational/problem-type terms.
  - Some educational/problem terms in that mapping table are deprecated
    EDUPUB-era vocabulary rather than active terms in the current EPUB
    Structural Semantics Vocabulary. The package keeps local `problem` and
    `question` canonicals without treating them as current EPUB terms or
    inventing DPUB roles.
  - The
    [current Editor's Draft](https://w3c.github.io/epub-specs/wg-notes/epub-aria-authoring/)
    still contains historical EDUPUB rows that the current SSV has removed.
    The guide is therefore used for role-application guidance, not as the
    authoritative registry of current `epub:type` terms.
  - This is why the package keeps `answer`, `problem`, `question`, `assessment`,
    `feedback`, `keywords`, and similar entries without default `role`
    attributes.
  - The guide recommends `aria-labelledby` when visible label text exists and
    permits `aria-label` when no label is available in the text. It also shows
    that a named `section` creates a landmark without requiring a generic
    `region` role; a `div` would need that role for the same effect.
- [EPUB 3 Structural Semantics Vocabulary 1.1](https://www.w3.org/TR/epub-ssv-11/)
  - Primary reference for EPUB vocabulary names and their publication semantics.
  - The 28 May 2026 Group Note and the
    [official Editor's Draft](https://w3c.github.io/epub-specs/wg-notes/ssv/)
    were both checked. The active terms and mappings relevant to this catalog
    are aligned.
  - The current vocabulary uses singular `assessment` and singular
    `learning-objective`. The package follows those forms for its corresponding
    canonical names and keeps natural plural headings as aliases.
  - The current vocabulary also uses `pullquote` and `qna`. `problem` and
    `question` are not active current terms, so the package treats those as
    local document-recognition canonicals.
  - Used to decide whether a catalog name is a recognizable publishing concept
    even when no ARIA role is emitted.
  - The vocabulary explains that `epub:type` refines the meaning of existing
    elements, provides hints for reading systems and workflows, and does not by
    itself improve accessibility.
- [EPUB 3.4 Working Draft](https://www.w3.org/TR/epub-34/)
  - The 23 June 2026 draft keeps `epub:type` and ARIA `role` as separate layers.
    It states explicitly that `epub:type` values do not map to accessibility
    APIs, do not make neutral `div`/`span` elements accessible, and are intended
    for publishing semantics and reading-system enhancements.
  - The default vocabulary remains the EPUB 3 Structural Semantics Vocabulary.
    Custom terms are possible, but prefixed vocabularies are preferred; this is
    another reason not to infer `epub:type` mechanically from every `sc-*`
    class.
- [ARIA in HTML](https://www.w3.org/TR/html-aria/)
  - The 15 April 2026 Recommendation remains the authoritative source for which
    explicit roles are allowed on each HTML element.
  - The catalog's role-bearing wrappers follow the allowed carriers used by the
    current EPUB-to-ARIA guide: `section` for section roles, `aside` for
    `doc-tip` and `doc-pullquote`, and `nav` for `doc-toc`.
- [NCR 2018, Chapter 1 (Japan Library Association)](https://www.jla.or.jp/Portals/0/data/iinkai/mokuroku/ncr2018/ncr2018_c1_202405.pdf)
  - Used as a Japanese documentation and bibliographic terminology reference.
  - It distinguishes `付録` (appendix), `補遺` (supplement), and `追補`
    (addenda). The catalog therefore keeps `補遺` under `supplement`, does not
    force `追補` into either `appendix` or `supplement`, and leaves room for a
    future addendum semantic if real document headings justify one.
- [JISC FAQ: JIS附属書（規定）とは何ですか](https://www.jisc.go.jp/qa/)
  - Confirms `附属書` as a formal structure separated from the main body and
    distinguishes normative and informative annexes. Government documents also
    use the modern `付属書` spelling. The catalog recognizes both spellings,
    while bare `付属` / `附属` remains too broad for `doc-appendix`.
- [DPUB-ARIA 1.1 Japanese translation](https://momdo.github.io/dpub-aria-1.1/)
  - Non-normative terminology cross-check. Its `doc-notice` translation uses
    `通知する` as the verb in the definition and gives `警告`, `注意`, and `危険`
    as examples. This supports `通知` as the direct Japanese heading for the
    author-selected `notice` semantic, while the content still has to fit the
    consequence-oriented definition.
- [Digital Daijisen: 通知](https://kotobank.jp/word/%E9%80%9A%E7%9F%A5-98983)
  and [通告](https://kotobank.jp/word/%E9%80%9A%E5%91%8A-570497)
  - Japanese `通知` is the act or message of informing, while `通告` is a more
    formal or directive notice. Both are natural headings for selecting
    `notice`; `通告` is narrower in register, but neither removes the author's
    responsibility to use the role only for consequence-oriented content.
- [Nihon Kokugo Daijiten: 注意書](https://kotobank.jp/word/%E6%B3%A8%E6%84%8F%E6%9B%B8-2061884)
  - Defines the term as writing that records matters another person should take
    care about and calls for caution. Both the dictionary form `注意書` and the
    common written form `注意書き` are therefore natural `caution` headings,
    not direct translations of the notify-oriented `notice` semantic.
- [EDINET taxonomy authoring guide](https://disclosure2dl.edinet-fsa.go.jp/guide/static/submit/download/ESE140110.pdf)
  - Its concrete technical use of `参照情報` contains only the information
    needed to locate the governing document, not that document's content. This
    supports treating `参照情報` as lookup/reference information rather than a
    generic information block.
- [PMDA: 調査計画を検討するための参考情報](https://www.pmda.go.jp/safety/mid-net/0004.html)
  - Uses `参考情報` for substantive basic and detailed information supplied to
    help readers understand and plan use. This supports keeping the phrase under
    `information` rather than treating the `参考` modifier as a reference target.
- Cambridge Dictionary entries for
  [outline](https://dictionary.cambridge.org/dictionary/english/outline),
  [overview](https://dictionary.cambridge.org/dictionary/english/overview),
  [abstract](https://dictionary.cambridge.org/dictionary/english/abstract), and
  [summary](https://dictionary.cambridge.org/dictionary/english/summary)
  - Used to cross-check the working boundary: structure or main-point skeleton
    (`outline`), broad orientation (`overview`), concise representation of a
    larger work (`abstract`), and general condensation or recap (`summary`).

## DPUB/EPUB mapping notes used by this package

These are intentionally conservative rules for default output:

- Exact DPUB-ARIA matches can emit roles:
  - `abstract` -> `role="doc-abstract"`
  - `acknowledgments` -> `role="doc-acknowledgments"`
  - `afterword` -> `role="doc-afterword"`
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
  - `qna` -> `role="doc-qna"`
  - `foreword` -> `role="doc-foreword"`
  - `glossary` -> `role="doc-glossary"`
  - `index` -> `role="doc-index"`
  - `introduction` -> `role="doc-introduction"`
  - `notice` -> `role="doc-notice"`
  - `preface` -> `role="doc-preface"`
  - `prologue` -> `role="doc-prologue"`
  - `pullquote` -> `role="doc-pullquote"`
  - `tip` -> `role="doc-tip"`
  - `toc` -> `role="doc-toc"`
- Close mappings can emit roles when the catalog meaning is deliberately
  constrained to the DPUB-ARIA concept:
  - `faq` -> `role="doc-qna"`
  - `alert`, `caution`, `danger`, `warning` -> `role="doc-notice"`
  - `hint` -> `role="doc-tip"`
  - `chapter-toc` -> `role="doc-toc"`
  - `important` is intentionally excluded: priority or emphasis alone does not
    imply the consequences arising from an action or event that `doc-notice`
    describes.
- `doc-notice` remains a structural DPUB-ARIA document role. It is not the
  WAI-ARIA live-region `role="alert"`; its superclass is `note`, and it does not
  imply a pop-up, move focus, or by itself request immediate announcement by
  assistive technology.
- `doc-notice` is nevertheless semantically narrow: it identifies consequences
  that might arise from an action or event. Generic notifications and
  announcements are not automatically valid merely because the English word
  "notice" can also be used more broadly.
- The plugin does not synthesize IDs or `aria-labelledby` relationships for
  visible labels. When the same landmark role occurs more than once, downstream
  authoring must provide unique accessible names. Footnote/endnote tooling owns
  the note lists, noteref/backlink relationships, and validation required by
  `doc-endnotes`. Downstream tooling likewise owns the descendant entry list for
  `doc-bibliography` and actual navigation links for `doc-index` and `doc-toc`.
- Educational catalog terms without a close current DPUB-ARIA role do not emit
  default `role` attributes. Some follow active EPUB vocabulary names; others
  are local recognition concepts or retain deprecated-era terminology only as
  background:
  - `answer`
  - `assessment`
  - `feedback`
  - `keywords`
  - `learning-objective`
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
  - `evaluation`
  - `explanation`
  - `information`
  - `important`
  - `interview`
  - `issue`
  - `limitations`
  - `memo`
  - `minutes`
  - `next-steps`
  - `note`
  - `opinion`
  - `outline`
  - `overview`
  - `planning`
  - `point`
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

`interview` is intentionally roleless. DPUB-ARIA `doc-qna` applies to content
structured as a series of questions and answers; an interview may instead mix
narrative, profile, or conversational material. Authors can select `qna` when
the question-and-answer structure is explicit.

`pullquote` follows the current EPUB spelling, while `pull quote` and former
canonical `pull-quote` remain input aliases. Output and canonical-name settings
use `sc-pullquote` / `pullquote`. DPUB-ARIA requires a duplicated presentational
pullquote to be hidden from assistive technologies, but the parser cannot know
whether the marked occurrence is the source quotation or a duplicate. It
therefore does not emit `aria-hidden` automatically; downstream output that
duplicates text must add it.

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

Built-in label-presentation notes:

- `lead` is the only built-in semantic with `hideLabel: true`. Its matched
  marker is hidden by default in standard, bracket, and GitHub alert flows. It
  uses a roleless `div`: ordinary publishing usage treats a lead/lede as
  opening prose rather than a separately navigable document section, and it is
  absent from both the current EPUB and DPUB-ARIA vocabularies. Hiding the
  control marker therefore does not create a named `region` landmark. Exact
  jointless headings skip every hidden-by-default semantic so removing the
  marker cannot leave an empty heading; this is not a name-based `lead` branch.
- Other semantics keep their matched labels visible unless `labelControl` or
  `semanticContainerSc` explicitly hides them. A non-empty inline label control
  can also override `lead`'s default and show a replacement label.

## Japanese alias policy notes

- Japanese aliases are package-maintained recognition terms, not normative
  translations of EPUB/DPUB vocabularies.
- `notice` recognizes `通知` and the more formal `通告`. Current EPUB and DPUB
  define the canonical as notifying users of consequences that might arise from
  an action or event, and the catalog emits `doc-notice`. The label is an
  explicit author selection, as English `Notice` is; it does not excuse content
  that fails the role definition. `注意書` and `注意書き` map to `caution`.
- Generic announcement headings `お知らせ` and `告知` map to roleless
  `information` because they commonly lack the consequence-oriented function;
  bare `掲示` remains unregistered.
- A separate `announcement` semantic is still not added: its boundary with
  generic notifications is unstable and it has no distinct native HTML or
  DPUB output contract. Projects that intentionally use one of these headings
  for consequence-oriented notices can opt in with a literal
  `semanticContainerSc` alias.
- `information` recognizes `お知らせ`, `告知`, `情報`, `参考情報`, and
  `インフォメーション`. The announcement labels are broad, but the canonical
  is roleless and accurately avoids a `doc-notice` claim. Bare `案内` and
  `ご案内` remain unregistered because they can identify information,
  procedures, events, products, facilities, or navigation; projects can add a
  local literal alias when one function is established by convention.
- `参考情報` and `参照情報` can overlap in ordinary prose, but the built-in
  heading boundary follows their dominant document function. `参考情報` presents
  useful facts or guidance for understanding or judgment and maps to
  `information`; `参照情報` identifies what or where to consult or compare and
  maps to `reference`. `参考資料` supplies supporting documents or assets and
  remains under `resources`.
- Canonical semantics name stable concepts; aliases name natural document
  headings. An alias may therefore be a multiword phrase when a shorter word
  would be broad, grammatically incomplete, or semantically misleading.
- Make the "natural heading" test operational rather than taxonomic. Register
  an alias only when all of the following are defensible:
  1. It can plausibly stand alone as a heading in the target document types.
  2. Its boundary from neighboring semantics is stable enough to explain.
  3. The resulting tag, role, class, and label behavior fit that document
     function.
  4. Positive examples and likely false positives can be locked in tests.
  Dictionary correspondence alone is not enough. Conversely, a rare but
  established and precise heading can be safer than a frequent ambiguous word.
- A Japanese alias need not be a native-Japanese paraphrase. Established
  loanwords such as `コラム`, `クレジット`, `フィードバック`, `ヒント`,
  `インタビュー`, `メモ`, and `プルクオート` can be the most natural document
  labels. Do not add a broader or narrower calque merely to avoid katakana;
  add a Japanese alternative only when it independently passes the same heading
  and output-contract tests.
- Canonical grammatical number follows an intentionally corresponding external
  vocabulary when one exists. Otherwise, singular names are preferred for one
  conceptual type, while lexicalized or deliberately aggregate concepts may
  remain plural. Natural alternate-number headings belong in aliases. Existing
  canonical names are not renamed solely to make the list look uniform.
- Prefer terms that can stand alone as document labels:
  - Good examples: `概要`, `注記`, `備考`, `文献表`, `付属書`, `附属書`,
    `付属資料`, `附属資料`, `編集注`,
    `重要事項`, `注意事項`, `計画案`, `提案書`, `推奨事項`, `用語集`,
    `要件`, `要求事項`, `手順`, `参考資料`, `解説`, `制限事項`,
    `決定事項`, `もくじ`, `豆知識`.
- Avoid overly broad single words unless they are established labels:
  - `注` is accepted for `note` because it is a common note label.
  - `案` is not accepted for `planning` because it is too broad.
  - Bare `付属` / `附属` is not accepted for `appendix`; `付属書` / `附属書`,
    `付属資料` / `附属資料`, and compact numbered or lettered forms such as
    `付録A`, `付属A`, and `附属A` are accepted.
  - `注目` is not accepted for `notice`; it reads more like emphasis than a
    document section label.
  - `出来事`, `警報`, `採点`, `序`, bare `手がかり`, bare `導入`, bare
    `関連`, bare `作業`, and bare `課題` are not accepted because they are too
    broad or imply a neighboring semantic.
- Keep decision boundaries explicit when nearby terms are recognized:
  - `提案書` / `企画案` / `企画書` -> `proposal`; bare `提案` ->
    `suggestion`; `提言` -> `recommendation`.
  - `参考情報` -> `information`; `参照` / `参照先` / `参照情報` ->
    `reference`; `参考資料` -> `resources`.
  - Bare `案内` / `ご案内` remain unregistered; use a more specific built-in
    label or a project-local alias when the intended function is stable.
  - `推奨事項` -> `recommendation`; `推奨環境` -> `requirements`.
  - `前文` -> `preamble`; authorial `前書き` -> `preface`; main-text
    `はじめに` -> `introduction`.
  - `要点` -> `point`; this is a central takeaway in a roleless main-flow
    section, not advice in a `doc-tip` aside.
  - `関連情報` / `関連資料` -> `related`; bare `関連` remains unregistered.
  - `タスク` / `宿題` / `アクションアイテム` -> `task`; bare `作業` and
    bare `課題` remain unregistered because they cross procedure and issue or
    assignment boundaries.
  - `付録` -> `appendix`; `補遺` -> `supplement`; `追記` -> `postscript`.
    `追補` is closer to addendum and remains unregistered rather than being
    forced into either neighboring semantic.

Remaining low-risk, deliberately pragmatic boundaries:

- `はじめに` maps to `introduction`, but can function like authorial front
  matter in some books. Explicit `前書き`/`まえがき` remains the safer
  `preface` label when that distinction matters.
- `おわりに`/`終わりに` maps to `conclusion`, but can sit near an authorial
  afterword in some books. Explicit `あとがき`/`後書き` remains the safer
  `afterword` label.
- `序章` and `終章` remain `prologue` and `epilogue` recognition labels. In
  nonfiction they can also name an opening or closing numbered chapter, so
  whole-document EPUB tooling should prefer explicit structural knowledge over
  inferring document partitions from these words alone.
- `概略` remains under `outline` because it is used for a high-level structure,
  but it can overlap a prose `overview`. Both outputs are roleless `section`
  containers; projects that require a stricter distinction should prefer
  `アウトライン` for structure and `概要` for an overview.
- Bare `案内` / `ご案内` remain unregistered because even a roleless
  `information` section would fix a class and tag for headings that can instead
  introduce procedures, events, products, facilities, or navigation.
- Bare `問題` remains under roleless `problem` for common problem and exercise
  headings; `問題点` and `既知の問題` provide the bounded `issue` forms.
- `まとめ` remains under roleless `summary`; authors can use `結論` or
  `おわりに` when the stronger `doc-conclusion` meaning is intended.
- `概要` remains under roleless `overview`; authors can use `要旨` or `抄録`
  when the publication-specific `doc-abstract` meaning is intended.
- `評価`, `評価結果`, and `総合評価` map to roleless `evaluation`. They are
  natural standalone headings, and the output does not assert an assessment or
  grading role. More specific judgment-oriented aliases are `製品評価`,
  `品質評価`, `性能評価`, and `パフォーマンス評価`. Assessment-like
  `リスク評価` and grading-like `成績評価` remain unregistered, while
  `評価基準` maps to `rubric`.
- English `product evaluation(s)`, `quality evaluation(s)`, and `performance
  evaluation(s)` map to `evaluation`. They are natural judgment-oriented
  headings and do not weaken the boundary with measurement-oriented
  `assessment` or criteria-oriented `rubric`.
- Keep question/answer aliases bounded:
  - `問題1`, `演習問題2`, `練習問題A`, `問1`, `問いA`, `設問３`, `小問2`,
    `発問1`, `主発問`, `中心発問`, `回答1`, and `答えA` are accepted.
  - Bare `問` and bare `答` are not accepted, to avoid short-label false
    positives.
  - Numbered `主発問1` / `中心発問1` and broader specialist forms such as
    `基本発問` / `補助発問` remain unregistered until real heading usage
    justifies widening the defaults.

## Alias ownership when a phrase names multiple concepts

A multiword label can contain another canonical name without belonging to that
head noun automatically. Choose the canonical whose observable output best
matches the whole heading, not merely the first or last word.

Review these dimensions in order:

1. Prefer an exact composite canonical when one exists. For example, `related
   link` maps to `related-link`, not generic `related` or an imagined `link`
   semantic.
2. Identify which word changes the document function rather than only scoping
   the subject. A priority modifier can determine a callout type, and a
   relationship modifier can determine whether content is tangential.
3. Compare the observable output contracts: tag, role, class, label behavior,
   and likely styling. If choosing one semantic would unexpectedly change a
   main-flow `section` into an `aside`, that choice needs an explicit rationale.
4. Prefer the more specific conventional heading meaning when the other
   candidate is generic. Do not use grammatical head-noun ownership as a
   universal shortcut.
5. If two specific semantics remain equally plausible and their output
   contracts differ, leave the phrase unregistered until real documents and
   negative collision tests establish a stable boundary.

Current decisions:

- `important notice` and `important information` -> `important`: importance is
  the callout intent, while `notice` and `information` are generic content
  heads. The canonical class records the intended priority, but `important`
  stays roleless because that priority alone does not satisfy `doc-notice`.
- `related information` and `related resources` -> `related`: the relationship
  makes the block tangential and therefore supports the `aside` contract;
  unmodified `information` and `resources` remain main-flow sections.
- `system requirements` -> `requirements`: `system` scopes the subject but does
  not change the requirement function.
- `publication information` -> `book`: the phrase names information about a
  publication rather than a generic information block; `book` is the catalog's
  canonical name for that broader concept and emits `sc-book`.

Record decisions of this kind in generated catalog notes and direct positive
and negative tests. This makes later reconsideration possible without relying
on alias order or undocumented parser behavior.

## Date checked

These references were checked on 2026-07-21. The review covered both the
current W3C publications and their official Editor's Draft links for the EPUB
Structural Semantics Vocabulary 1.1, EPUB Type to ARIA Role Authoring Guide
1.1, and DPUB-ARIA 1.1, together with the current EPUB 3.4 Working Draft and
ARIA in HTML Recommendation.
