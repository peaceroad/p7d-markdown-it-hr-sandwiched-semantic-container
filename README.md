# p7d-markdown-it-hr-sandwiched-semantic-container

This is a markdown-it plugin that turns selected paragraph groups into semantic HTML containers.
When a group is sandwiched between two horizontal rules made from the same marker type (`-`, `*`, or `_`), and the first block starts with a registered semantic label, the plugin replaces the surrounding `hr` tokens with a semantic container such as `<section>` or `<aside>`.

For example, this Markdown:

```md
A paragraph 1.

---

Notice. A paragraph 2.

---

A paragraph 3.
```

is rendered as:

```html
<p>A paragraph 1.</p>
<section class="sc-notice" role="doc-notice">
<p><span class="sc-notice-label">Notice<span class="sc-notice-label-joint">.</span></span> A paragraph 2.</p>
</section>
<p>A paragraph 3.</p>
```

Representative built-in labels include `Notice`, `Information`, and `Column`;
familiar callouts such as `Note`, `Tip`, `Important`, `Warning`, and `Caution`;
and document-oriented labels such as `Summary`, `Requirements`, and
`Procedure`. The complete catalog is linked below.

## Install

```bash
npm install @peaceroad/markdown-it-hr-sandwiched-semantic-container
```

## Quick start

```js
import mdit from 'markdown-it'
import mditSemanticContainer from '@peaceroad/markdown-it-hr-sandwiched-semantic-container'

const md = mdit().use(mditSemanticContainer)
const source = '...'
const html = md.render(source)
```

Call `.use(mditSemanticContainer, options)` only once per `markdown-it` instance. If the same instance receives the plugin again, the later call is ignored so non-idempotent token transforms are not registered twice.

## Runtime compatibility

This package is ESM-only and uses JSON import attributes for the built-in semantic catalogs.
Use Node.js `>=20.18.3` or a bundler/runtime that supports ESM plus JSON import attributes.

## Syntax

The notation is as follows:

1. Sandwich paragraphs with two horizontal rules made from the same marker type: `*`, `-`, or `_`.
2. Put a registered semantic label at the beginning of the first paragraph or heading in the group.
3. Put one of the supported joints immediately after the label, such as `.`, `:`, `。`, `．`, `：`, or an ideographic space.

Half-width joints such as `.` and `:` require a following space.

```md
---

Notice. A paragraph inside the container.

A paragraph inside the container.

---
```

Semantic labels are matched case-insensitively and are defined by [`semantics/en.json`](https://github.com/peaceroad/p7d-markdown-it-hr-sandwiched-semantic-container/blob/main/semantics/en.json) plus optional locale files such as [`semantics/ja.json`](https://github.com/peaceroad/p7d-markdown-it-hr-sandwiched-semantic-container/blob/main/semantics/ja.json). English is always loaded; Japanese labels are loaded by default and can be toggled with the `languages` option.

### Semantic labels and catalog

The built-in catalog is maintained separately from this usage guide. See the
[English semantic catalog](https://github.com/peaceroad/p7d-markdown-it-hr-sandwiched-semantic-container/blob/main/docs/semantic-catalog.md)
or [Japanese semantic catalog](https://github.com/peaceroad/p7d-markdown-it-hr-sandwiched-semantic-container/blob/main/docs/semantic-catalog_ja.md)
for the authoritative entry-by-entry meanings, output tags, roles, alias
boundaries, and omitted ambiguous labels.

Canonical names, output tags, `sc-*` classes, and documented attributes are
public output contracts. Removing a canonical, changing its output, removing an
alias, or otherwise making existing Markdown stop matching is treated as a
breaking change. Alias recognition is semantic classification: every alias
inherits its canonical tag, classes, label behavior, and default attributes,
including `role`. Runtime `semanticContainerSc` aliases are literal strings;
regex-capable aliases are limited to the built-in locale catalogs.

Default `role="doc-*"` attributes are emitted only for exact or close
DPUB-ARIA matches; otherwise the plugin keeps the semantic class without
forcing a role. Ambiguous headings are kept unregistered rather than assigned a
misleading output contract. The plugin does not emit `epub:type`, and delegates
content structures outside semantic containers, such as figure-like examples,
to specialized tooling. Release-specific changes and migration notes are in
[`CHANGELOG.md`](./CHANGELOG.md).

The semantic label can also be written as strong text. The joint may appear
inside or immediately after the strong text; the rendered label remains a
`<strong>` element instead of becoming a `<span>`.

```md
---

**Notice.** A paragraph inside the container.

A paragraph inside the container.

---
```

or:

```md
---

**Notice**. A paragraph inside the container.

A paragraph inside the container.

---
```

The first block inside a semantic container may also be a heading:

```md
---

### Notice. The container title.

A paragraph inside the container.

A paragraph inside the container.

---
```

### Nested containers

Semantic containers can be nested up to three levels by using different horizontal-rule marker types.
A practical convention is to reserve `*` for ordinary thematic breaks, `-` for
outer semantic containers, and `_` for nested semantic containers.

### Adjacent containers

When semantic containers are adjacent, the closing horizontal rule of one container can also serve as the opening horizontal rule of the next container.

For example, the following description:

```md
A paragraph 1.

---

Notice. A paragraph 2.

---

---

Notice. A paragraph 3.

---

A paragraph 4.
```

is the same as below.

```md
A paragraph 1.

---

Notice. A paragraph 2.

---

Notice. A paragraph 3.

---

A paragraph 4.
```

### One-paragraph shorthand

By default, a one-paragraph semantic container can omit the surrounding horizontal rules:

```md
A paragraph.

Notice. A notice.

A paragraph.
```

Use `requireHrAtOneParagraph: true` to require horizontal rules even for one-paragraph containers.
See [requireHrAtOneParagraph](#requirehratoneparagraph) for details.

## Extended examples

<details>
<summary>Show Markdown and rendered HTML examples</summary>

~~~
[Markdown]
A paragraph.

---

Notice. A notice.

---

A paragraph.
[HTML]
<p>A paragraph.</p>
<section class="sc-notice" role="doc-notice">
<p><span class="sc-notice-label">Notice<span class="sc-notice-label-joint">.</span></span> A notice.</p>
</section>
<p>A paragraph.</p>


[Markdown]
A paragraph.

---

Notice 1. A notice.

---

A paragraph.
[HTML]
<p>A paragraph.</p>
<section class="sc-notice" role="doc-notice">
<p><span class="sc-notice-label">Notice 1<span class="sc-notice-label-joint">.</span></span> A notice.</p>
</section>
<p>A paragraph.</p>


[Markdown]
A paragraph.

---

**Notice.** A notice.

---

A paragraph.
[HTML]
<p>A paragraph.</p>
<section class="sc-notice" role="doc-notice">
<p><strong class="sc-notice-label">Notice<span class="sc-notice-label-joint">.</span></strong> A notice.</p>
</section>
<p>A paragraph.</p>


[Markdown]
# Title

A paragraph.

- - -

## Column: Title

A column.

- - -

A paragraph.
[HTML]
<h1>Title</h1>
<p>A paragraph.</p>
<aside class="sc-column">
<h2><span class="sc-column-label">Column<span class="sc-column-label-joint">:</span></span> Title</h2>
<p>A column.</p>
</aside>
<p>A paragraph.</p>



[Markdown]
# A heading.

---

Lead. A lead.

---

A paragraph.
[HTML]
<h1>A heading.</h1>
<div class="sc-lead">
<p>A lead.</p>
</div>
<p>A paragraph.</p>


[Markdown]
# Title

A paragraph.

- - -

## Column: Title

A column.

___

Notice. A column notice.

___

A column.

- - -

A paragraph.
[HTML]
<h1>Title</h1>
<p>A paragraph.</p>
<aside class="sc-column">
<h2><span class="sc-column-label">Column<span class="sc-column-label-joint">:</span></span> Title</h2>
<p>A column.</p>
<section class="sc-notice" role="doc-notice">
<p><span class="sc-notice-label">Notice<span class="sc-notice-label-joint">.</span></span> A column notice.</p>
</section>
<p>A column.</p>
</aside>
<p>A paragraph.</p>


[Markdown]
A paragraph.

---

Notice. A notice.

---

Notice. A notice.

---

A paragraph.
[HTML]
<p>A paragraph.</p>
<section class="sc-notice" role="doc-notice">
<p><span class="sc-notice-label">Notice<span class="sc-notice-label-joint">.</span></span> A notice.</p>
</section>
<section class="sc-notice" role="doc-notice">
<p><span class="sc-notice-label">Notice<span class="sc-notice-label-joint">.</span></span> A notice.</p>
</section>
<p>A paragraph.</p>


[Markdown]
A paragraph.

---

Notice. A notice.

---

---

Notice. A notice.

---

A paragraph.
[HTML]
<p>A paragraph.</p>
<section class="sc-notice" role="doc-notice">
<p><span class="sc-notice-label">Notice<span class="sc-notice-label-joint">.</span></span> A notice.</p>
</section>
<section class="sc-notice" role="doc-notice">
<p><span class="sc-notice-label">Notice<span class="sc-notice-label-joint">.</span></span> A notice.</p>
</section>
<p>A paragraph.</p>


[Markdown]
A paragraph.

---

Notice 1. A notice.

---

A paragraph.
[HTML]
<p>A paragraph.</p>
<section class="sc-notice" role="doc-notice">
<p><span class="sc-notice-label">Notice 1<span class="sc-notice-label-joint">.</span></span> A notice.</p>
</section>
<p>A paragraph.</p>
~~~

</details>


## Output contract

The plugin emits structural HTML only; it does not ship or inject CSS.
Consumers can style the generated containers with these stable selectors:

- Container class: `sc-${semanticName}` (for example, `sc-notice`)
- Label class: `sc-${semanticName}-label`
- Label joint class: `sc-${semanticName}-label-joint`
- Heading titlepage part classes: `sc-${semanticName}-label`, `sc-${semanticName}-number`, `sc-${semanticName}-label-joint`, `sc-${semanticName}-title`, and, for Japanese `第...章/部` labels, `sc-${semanticName}-label-prefix`

The canonical semantic name, output tag, and default attributes come from [`semantics/en.json`](https://github.com/peaceroad/p7d-markdown-it-hr-sandwiched-semantic-container/blob/main/semantics/en.json).
For example, a semantic may render as `<section class="sc-notice" role="doc-notice">` or `<aside class="sc-column">`.
DPUB-ARIA roles are emitted only for close matches; otherwise the semantic class remains the styling and integration contract.
Alias classification follows the catalog contract above. For semantic-specific
output and DPUB-ARIA boundary decisions, see the linked English or Japanese
semantic catalog instead of inferring behavior from an alias alone.
The plugin does not generate IDs or `aria-labelledby` relationships for visible
labels. If the same DPUB landmark role occurs more than once, downstream HTML
or EPUB tooling must provide unique accessible names. Footnote/endnote tooling
should own the note lists, references, and backlinks required by
`doc-endnotes`; this plugin only recognizes an explicitly authored section
label. Downstream tooling must also provide a descendant entry list for
`doc-bibliography` and real navigation links for `doc-index` and `doc-toc`.
When a label is hidden by `labelControl` or `semanticContainerSc`, the container receives an `aria-label` fallback when the semantic does not already define one.
Roleless `div` containers are the exception: they keep only the `sc-*` class because generic containers should not be named with `aria-label`.

## Options and configuration

| Option | Default | Purpose |
| --- | --- | --- |
| `languages` | `["ja"]` | Adds locale-specific recognition labels on top of English. |
| `requireHrAtOneParagraph` | `false` | Requires horizontal rules for one-paragraph containers. |
| `requireHeadingLabelJoint` | `false` | Requires `:` / `：` / similar joints for hr-sandwiched heading labels. |
| `headingLabelWithoutJointDenySemantics` | `[]` | Disables jointless heading-label matching for canonical semantic names. |
| `headingSectionContainer` | `false` | Allows semantic headings to open heading-scoped containers without `hr`. |
| `removeJointAtLineEnd` | `false` | Removes the label joint when the label is the whole line. |
| `allowBracketJoint` | `false` | Enables `[Label] body` / `［Label］body` syntax. |
| `bracketLabelJointMode` | `"keep"` | Controls bracket label rendering: `"keep"`, `"remove"`, or `"auto"`. |
| `githubTypeContainer` | `false` | Enables GitHub-style `> [!TYPE]` alert containers. |
| `githubTypeInlineLabel` | `false` | Renders GitHub alert labels inline in the first paragraph. |
| `githubTypeInlineLabelHeadingMixin` | `false` | Allows GitHub inline labels to mix into a following heading. |
| `githubTypeInlineLabelJoint` | `"none"` | Controls custom-label suffixes in GitHub inline mode: `"none"` or `"auto"`. |
| `labelControl` | `false` | Enables `label` override/hide handling. |
| `labelControlInlineFallback` | `"auto"` | Parses trailing `{label=...}` without `markdown-it-attrs` when enabled. |

Boolean feature options require actual JavaScript booleans. Invalid truthy values such as `"false"` are treated as disabled; invalid enum and locale values fall back to their safe defaults.

### languages

Specify additional locale label files to load in addition to English. English is always included. Default: `["ja"]`.

```js
// English + Japanese (default)
mdit().use(mditSemanticContainer, { languages: ["ja"] })

// English only
mdit().use(mditSemanticContainer, { languages: [] })
```

### Runtime and frontmatter `sc` input

This plugin does not parse frontmatter text by itself.
It reads already-parsed `sc` data and titlepage control data from these sources.
For semantic alias/hide configuration, `sc` data is read in priority order:

1. `state.env.semanticContainerSc`
2. `state.env.frontmatter.sc`
3. `state.env.meta.sc`
4. `md.frontmatter.sc` (`markdown-it-front-matter` style)
5. `md.meta.sc` (`markdown-it-meta` style)

For `md.frontmatter.sc` / `md.meta.sc`, this plugin only consumes values from the current render context (front matter token present) or when object reference changed, to avoid leaking stale metadata across renders.
The reserved `sc.titlepage` key is a plugin control flag, not a semantic alias entry, so it is ignored by the alias/hide normalizer.
For titlepage control, `state.env.semanticContainerSc.titlepage` has the highest priority, followed by parsed frontmatter/meta keys such as `sc.titlepage` and nested `sc.titlepage`.
This control is honored by default when already-parsed frontmatter/meta is supplied; no plugin option is required.

Recommended explicit input:

```js
const env = {
  semanticContainerSc: {
    notice: "特別通知",  // project-local consequence-oriented alias
    warning: "",         // default hide label
    note: null           // default hide label
  }
}
md.render(markdownCont, env)
```

`markdown-it-meta` example (no manual env bridge):

```js
import mdit from 'markdown-it'
import mditMeta from 'markdown-it-meta'
import mditSemanticContainer from '@peaceroad/markdown-it-hr-sandwiched-semantic-container'

const md = mdit()
  .use(mditMeta)
  .use(mditSemanticContainer)
```

`markdown-it-front-matter` example (bring your own parser):

```js
import mdit from 'markdown-it'
import mditFrontMatter from 'markdown-it-front-matter'
import mditSemanticContainer from '@peaceroad/markdown-it-hr-sandwiched-semantic-container'

const md = mdit()
md.use(mditFrontMatter, (raw) => {
  // Parse `raw` with your preferred parser, then expose { sc: ... }.
  md.frontmatter = parseFrontMatter(raw)
})
md.use(mditSemanticContainer)
```

Behavior:
- Non-empty string or string-array `sc.<semantic>` values extend aliases for semantic detection.
- `sc.titlepage` controls frontmatter titlepage inference and is not treated as a semantic name.
- Runtime `sc` aliases are treated as literal strings, not regex patterns. If you need regex-capable aliases, define them in locale data (`semantics/*.json`).
- A runtime alias inherits the selected canonical semantic's output tag, classes, and default attributes, including any DPUB-ARIA `role`; adding `特別通知` to `notice`, for example, explicitly opts that local heading into `doc-notice`.
- `""` / `null` in `sc.<semantic>` hides the label by default and keeps `aria-label` fallback behavior, except for roleless `div` containers.
- `labelControl` inline `label="..."` takes precedence over `sc` default hide.
- Alias conflicts are ignored deterministically and warnings are collected in `env.semanticContainerWarnings`. Conflict checks include labels matched by regex-capable built-in aliases, not only identical catalog strings.

Example frontmatter shape (from your own frontmatter parser):

```yaml
---
sc:
  notice: "特別通知"
  warning: ""
  titlepage: true
---
```

Here `特別通知` explicitly opts that project-local heading into the canonical
`notice` output contract.

If you want a one-line frontmatter flag for titlepage inference, use `sc.titlepage: true`.
Top-level `titlepage: true` is intentionally not recognized, because that name is too likely to collide with book-level metadata owned by another tool.

```yaml
---
sc.titlepage: true
---
```

### labelControl

Enable label override/hide via `label` attribute on the first paragraph or heading in a semantic container.
Works with `markdown-it-attrs`, and can also work without it via inline-tail fallback.

```bash
npm install markdown-it-attrs
```

```js
import mdit from 'markdown-it'
import mditAttrs from 'markdown-it-attrs'
import mditSemanticContainer from '@peaceroad/markdown-it-hr-sandwiched-semantic-container'

const md = mdit()
  .use(mditAttrs)
  .use(mditSemanticContainer, { labelControl: true })
```

Without `markdown-it-attrs`, you can still enable label parsing from trailing inline text:

```js
const md = mdit().use(mditSemanticContainer, {
  labelControl: true,
  labelControlInlineFallback: true
})
```

Examples:

```markdown
[Markdown]
---

Notice. A notice body. {label="重要なお知らせ"}

---
[HTML]
<section class="sc-notice" role="doc-notice">
<p><span class="sc-notice-label">重要なお知らせ</span> A notice body.</p>
</section>
```

```markdown
[Markdown]
---

Notice. A notice body. {label=""}

---
[HTML]
<section class="sc-notice" role="doc-notice" aria-label="Notice">
<p>A notice body.</p>
</section>
```

Notes:
- `label="..."` replaces only the displayed label text.
- `label=""` hides the label and sets `aria-label` on the container with the actual keyword written in Markdown, except for roleless `div` containers.
- This applies to standard labels, bracket format (`allowBracketJoint`), and GitHub alert format (`githubTypeContainer`).
- Strong-label forms are also supported, including both `**Notice**。 body` and `**Notice。** body`.
- If `labelControl` is disabled (or `label` is not parsed by another plugin), behavior is unchanged.
- `labelControlInlineFallback` controls attrs-less parsing of trailing `{label=...}`:
  - `true`: always enable fallback parser
  - `false`: attrs-only mode
  - `"auto"` (default): enable fallback when `curly_attributes` rule is not registered
- With `markdown-it-attrs` and `labelControl: false`, `{label="..."}` is passed through as a raw HTML `label` attribute on the original element; if HTML validity is important, prefer `data-*` attributes when not using label control.

### removeJointAtLineEnd

When the semantic label occupies the whole paragraph or heading, this option
omits the trailing joint from the rendered label.

```
mdit().use(mditSemanticContainer, {"removeJointAtLineEnd": true})
```

Using this option will result in the following:

~~~
[Markdown]
A paragraph.

---

Column.

A column paragraph.

---

A paragraph.
[HTML]
<p>A paragraph.</p>
<aside class="sc-column">
<p><span class="sc-column-label">Column</span></p>
<p>A column paragraph.</p>
</aside>
<p>A paragraph.</p>


[Markdown]
A paragraph.

---

### Column.

A column paragraph.

---

A paragraph.
[HTML]
<p>A paragraph.</p>
<aside class="sc-column">
<h3><span class="sc-column-label">Column</span></h3>
<p>A column paragraph.</p>
</aside>
<p>A paragraph.</p>
~~~

### requireHeadingLabelJoint

By default, an `hr`-sandwiched heading can match a semantic label even when the heading has no trailing label joint.
This keeps the Markdown heading natural without requiring a marker-like `:` or `：` that later needs to be removed from the rendered output.

```md
---

## 動作環境

本文

---
```

```html
<section class="sc-requirements">
<h2><span class="sc-requirements-label">動作環境</span></h2>
<p>本文</p>
</section>
```

Jointless heading matching is intentionally narrow:

- It only applies inside `hr`-sandwiched containers.
- It only applies to headings, not paragraphs.
- The heading text must exactly match a semantic label or alias.
- Partial headings such as `## 動作環境について` are not matched.

Set `requireHeadingLabelJoint: true` to require the traditional label joint for headings too.

```js
mdit().use(mditSemanticContainer, { requireHeadingLabelJoint: true })
```

When this option is enabled, write a heading label with a joint:

```md
---

## 動作環境：

本文

---
```

Use `headingLabelWithoutJointDenySemantics` to keep the default behavior but disable jointless heading matching for selected canonical semantic names.

```js
mdit().use(mditSemanticContainer, {
  headingLabelWithoutJointDenySemantics: ["summary", "introduction"]
})
```

### allowBracketJoint

Enable bracket format for semantic containers. This allows using square brackets `[Semantics] Content` or full-width brackets `［Semantics］Content` instead of traditional format.

```js
mdit().use(mditSemanticContainer, {"allowBracketJoint": true})
```

Example usage:

```markdown
[Markdown]
A paragraph.

---

[Notice] A notice message.

---

A paragraph.
[HTML]
<p>A paragraph.</p>
<section class="sc-notice" role="doc-notice">
<p><span class="sc-notice-label"><span class="sc-notice-label-joint">[</span>Notice<span class="sc-notice-label-joint">]</span></span> A notice message.</p>
</section>
<p>A paragraph.</p>
```

### bracketLabelJointMode

Controls how bracket labels are rendered when `allowBracketJoint: true`.

- `keep` (default): keep bracket joints (`[]` / `［］`).
- `remove`: remove bracket joints and insert half-width space after label.
- `auto`: remove bracket joints and infer joint style from label text.
  - Japanese labels: `：` (no extra space)
  - Non-Japanese labels: `.` + half-width space

```js
mdit().use(mditSemanticContainer, {
  allowBracketJoint: true,
  bracketLabelJointMode: "auto"
})
```

Examples:

```markdown
[Markdown]
---

[Notice] A notice body.

---
[HTML:keep]
<section class="sc-notice" role="doc-notice">
<p><span class="sc-notice-label"><span class="sc-notice-label-joint">[</span>Notice<span class="sc-notice-label-joint">]</span></span> A notice body.</p>
</section>
[HTML:remove]
<section class="sc-notice" role="doc-notice">
<p><span class="sc-notice-label">Notice</span> A notice body.</p>
</section>
[HTML:auto]
<section class="sc-notice" role="doc-notice">
<p><span class="sc-notice-label">Notice<span class="sc-notice-label-joint">.</span></span> A notice body.</p>
</section>
```

`labelControl: true` also follows this mode for bracket label rendering.

### githubTypeContainer

Enable GitHub-style alert containers using `> [!TYPE]` syntax or full-width `> ［！TYPE］` syntax.

```js
mdit().use(mditSemanticContainer, {"githubTypeContainer": true})
```

Default rendering keeps a GitHub-like title paragraph layout:

```markdown
[Markdown]
> [!NOTE]
> This is a helpful note.

> [!WARNING]
> This is a warning message.
[HTML]
<section class="sc-note">
<p><strong class="sc-note-label"><span class="sc-note-label-joint">[</span>NOTE<span class="sc-note-label-joint">]</span></strong></p>
<p>This is a helpful note.</p>
</section>
<section class="sc-warning" role="doc-notice">
<p><strong class="sc-warning-label"><span class="sc-warning-label-joint">[</span>WARNING<span class="sc-warning-label-joint">]</span></strong></p>
<p>This is a warning message.</p>
</section>
```

To use the plugin's inline-label style instead, enable:

```js
mdit().use(mditSemanticContainer, {
  githubTypeContainer: true,
  githubTypeInlineLabel: true
})
```

This produces:

```html
<section class="sc-note">
<p><strong class="sc-note-label"><span class="sc-note-label-joint">[</span>NOTE<span class="sc-note-label-joint">]</span></strong> This is a helpful note.</p>
</section>
```

`githubTypeInlineLabelJoint` controls suffix behavior for custom labels (when `labelControl: true` in inline mode):

- `none` (default): no suffix. A separator space is inserted between label and content.
  - Half-width space ` ` is used.
- `auto`: suffix and spacing are inferred from label text.
  - Japanese labels: `：` (no extra space)
  - Non-Japanese labels: `.` + half-width space

```js
mdit().use(mditSemanticContainer, {
  githubTypeContainer: true,
  githubTypeInlineLabel: true,
  githubTypeInlineLabelJoint: "auto"
})
```

By default, inline mode does not merge the label into a following heading.
To merge label + heading text into one heading element, enable `githubTypeInlineLabelHeadingMixin: true`.

```js
mdit().use(mditSemanticContainer, {
  githubTypeContainer: true,
  githubTypeInlineLabel: true,
  githubTypeInlineLabelHeadingMixin: true
})
```

When using heading mixin, put `label` on the heading line (not on `[!TYPE]` line):

```markdown
> [!NOTE]
> ## Heading {label="重要メモ"}
> Content
```

GitHub canonical alert types are `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`.
This plugin also accepts any registered semantic label/alias as `TYPE`.

### Titlepage inference

The plugin includes ebook-oriented titlepage inference for chapter/appendix/part opening material.
It converts conservative numbered or lettered `h1` patterns inside an `hr` sandwich into `chapter-titlepage`, `appendix-titlepage`, or `part-titlepage` containers.
This is built into the titlepage semantics rather than controlled by a separate feature option.

```md
---

# Chapter 1. A Title

Lead text.

---
```

This renders the hr-sandwiched range as a `div.sc-chapter-titlepage` and wraps heading parts with stable inline classes:

```html
<div class="sc-chapter-titlepage">
<h1><span class="sc-chapter-titlepage-label">Chapter</span> <span class="sc-chapter-titlepage-number">1</span><span class="sc-chapter-titlepage-label-joint">.</span> <span class="sc-chapter-titlepage-title">A Title</span></h1>
<p>Lead text.</p>
</div>
```

Supported implicit heading shapes are deliberately conservative:

- English: `Chapter 1`, `Chapter A. Title`, `Appendix A`, `Appendix A. Reference Data`, `Part 1`, `Part 1. Title`
- Japanese: `第1章`, `第II章`, `第1章 はじめに`, `1章 はじめに`, `付録A`, `付録A 参考データ`, `付属A`, `付属A 参考データ`, `附属A`, `附属A 参考データ`, `第1部`, `第1部 扉タイトル`

Implicit hr-sandwich detection only applies when the first block after the opening `hr` is an `h1`.
It does not turn ordinary later headings or `### Column: ...` blocks into titlepages.
`Prologue`, `Epilogue`, `Introduction`, `Conclusion`, `序章`, `終章`, `プロローグ`, and `エピローグ` are intentionally not inferred as titlepages from `h1` headings.
Use their explicit semantic labels when you want those DPUB section semantics; whole-document wrapping belongs to EPUB-level structuring tools rather than this local container plugin.

Explicit titlepage labels such as `Chapter titlepage.` / `Appendix titlepage.` / `章扉。` / `付録扉。` / `付属扉。` are available for direct label-driven conversion, but they follow the normal semantic-label flow: the label text remains visible unless hidden with `labelControl` or `semanticContainerSc`.
For ebook title pages, prefer the `h1` titlepage inference above or parsed frontmatter/meta `sc.titlepage: true`, because those routes avoid adding marker-like control text to the Markdown body.
When an explicit titlepage label is hidden with `label=""`, the roleless `div` container does not receive an `aria-label` fallback; titlepage is treated as a page-like design block unless a separate role-bearing wrapper is introduced by another tool.
If a workflow needs titlepages to be exposed as accessible named groups, add an explicit role-bearing wrapper such as `role="group"` in that workflow instead of relying on the default roleless `div`.

For files with parsed frontmatter, you can omit the extra opening body `hr` and ask the plugin to wrap from the first content `h1` to before the first `h2` or next `h1`:

```yaml
---
sc.titlepage: true
---

# Chapter 1. A Title

Lead text.

## 1.1 A Heading
```

This form avoids a visually noisy `---` immediately after frontmatter.
The frontmatter delimiter itself is not treated as an `hr`; if you prefer the explicit hr-sandwich form after frontmatter, keep the separate `---` line in the Markdown body.

### headingSectionContainer

Allow a semantic container to start from a semantic heading without surrounding `hr` lines.
This mode is opt-in because it expands detection scope from paragraph-only no-`hr` cases to heading-scoped sections.

```js
mdit().use(mditSemanticContainer, { headingSectionContainer: true })
```

The container starts at the matched heading and continues until the next heading of the same level or a higher level.
Smaller headings stay inside the container.

```md
## Notice. Heading

Body paragraph.

### Sub heading

More body.

## Next section
```

### requireHrAtOneParagraph

Force the use of horizontal rules even for single-paragraph containers. By default, single-paragraph semantic containers don't require surrounding `---` lines.

`headingSectionContainer` is a separate mode. When enabled, heading-start section containers can still work without `hr` even if `requireHrAtOneParagraph` is `true`.

```js
mdit().use(mditSemanticContainer, {"requireHrAtOneParagraph": true})
```

With this option enabled, the following Markdown is not converted to a semantic container:

```md
A paragraph.

Notice. This paragraph will not be converted to a Notice semantic container.

A paragraph.
```

## Audit helper

Use the included audit script to find repeated inline labels, built-in catalog drift or exact alias ownership conflicts, and `sc` alias conflicts in Markdown files.

```bash
npm run labels:audit
npm run labels:audit:strict
```

## Development checks

Recommended checks before publishing or opening a pull request:

```bash
npm test
npm run labels:audit:strict
```

Use the deterministic benchmark when a change touches parser phases, hot paths, rule ordering, or candidate planning:

```bash
npm run performance:ab
```
