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

## Install

```bash
npm install @peaceroad/markdown-it-hr-sandwiched-semantic-container
```

## Quick start

```js
import mdit from 'markdown-it'
import mditSemanticContainer from '@peaceroad/markdown-it-hr-sandwiched-semantic-container'

const md = mdit().use(mditSemanticContainer)
const markdownCont = '...'
md.render(markdownCont)
```

Call `.use(mditSemanticContainer, options)` only once per `markdown-it` instance. If the same instance receives the plugin again, the later call is ignored so non-idempotent token transforms are not registered twice.

## Runtime compatibility

This package is ESM-only and uses JSON import attributes for the built-in semantic catalogs.
Use Node.js `>=20.18.3` or a bundler/runtime that supports ESM plus JSON import attributes.

## Rule

The notation is as follows:

1. Sandwich paragraphs with two horizontal rules made from the same marker type: `*`, `-`, or `_`.
2. Put a registered semantic label at the beginning of the first paragraph or heading in the group.
3. Put one of the supported joints immediately after the label, such as `.`, `:`, `。`, `．`, `：`, or an ideographic space.

Half-width joints such as `.` and `:` require a following space. [ver.0.3+]

```md
---

Semantics. A paragraph inside the container.

A paragraph inside the container.

---
```

Semantic labels are matched case-insensitively and are defined by [`semantics/en.json`](https://github.com/peaceroad/p7d-markdown-it-hr-sandwiched-semantic-container/blob/main/semantics/en.json) plus optional locale files such as [`semantics/ja.json`](https://github.com/peaceroad/p7d-markdown-it-hr-sandwiched-semantic-container/blob/main/semantics/ja.json). English is always loaded; Japanese labels are loaded by default and can be toggled with the `languages` option.

```plain
abstract (要旨,抄録)
acknowledgments (謝辞)
afterword (後書き,あとがき,跋文)
agenda (議題,検討課題,アジェンダ)
alert (警報,アラート)
annotation (注釈)
answer (answers,回答,答え?)
appendix ((付録|付属))
assessments (評価,採点)
author (著者)
bibliography ((参考)?文献(一覧)?)
book (magazine,(書籍|雑誌)(情報|案内)?,書誌(情報)?)
caution (注意)
chapter-toc (chapter toc,章目次)
check (チェック,確認事項)
colophon (奥付)
column (コラム)
conclusion (終わりに,おわりに,結び,結論)
credits (クレジット)
danger (危険)
dedication (献呈)
editornote (editor('s)? note,編注)
endnotes (後注,章末注,巻末注)
epigraph (題辞,題句,題言)
epilogue (エピローグ,終幕,終章)
errata (正誤表)
event (イベント(情報|案内)?,行事(情報|案内)?,催し物(情報|案内)?,出来事)
example (例)
faq (ＦＡＱ,よくある(質問|問い合わせ))
feedback (フィードバック)
first-published (first (published|publication),初出)
foreword (((本書|日本語版)?の)?(刊行|発行|発刊)に寄せて)
hint (ヒント)
importance (important, (重要|重大)(情報|なこと)?)
information (info,案内,(参考)?情報,インフォメーション)
index (索引)
interview (インタビュー)
introduction (序論,序説,はじめに,始めに)
issue (問題点,争点,論点,イシュー)
keywords (キーワード,手がかり(語)?)
lead (リード(文)?,導入(文)?)
lesson (レッスン,教訓)
memo (メモ)
note (ノート)
notice (通知,通告,告知,掲示,注目,(お)?(し|知)らせ)
opinion (意見,見解,オピニオン)
outline (概略,アウトライン)
overview (概観,大要,あらまし)
planning (plan,計画,案)
point (ポイント,要点)
postscript ((([0-9]+年)?[0-9]+月[0-9]+日)?追記)
preamble (序,序文)
preface (前書き,まえがき)
problem (問[い題]?)
profile (プロフィール,人物紹介)
prologue (プロローグ,序幕,序章)
proposal (プロポーザル,提言)
pull-quote (pull quote, プル(・)?ク[オォ]ート,抜粋)
qna (Q&A,Ｑ＆Ａ,質疑応答,一問一答,(問(題)?|質問)と(回答|答え))
question (質問,問(題)?)
reference ([レリ]ファレンス,参照,参考)
related-book (related (book|magazine),関連(した)?(本|書籍|雑誌))
related-article (related article,関連(した)?記事)
related-link (related link,関連(した)?リンク)
relation (related,関連)
recommendation (recommend(ed)?,勧告,勧め,推薦,リコメンド)
supplement (supplements,補足(情報)?)
solution (解答,解決(方法)?,解法)
suggestion (suggest,提案,サジェスト)
summary (要約,まとめ,あらすじ)
task (課題,作業,タスク)
tip (tips,コツ,秘訣,助言)
toc (目次)
topic (トピック,話題)
warning (warn,警告)
```

### Semantic catalog stability

Canonical semantic names, output tags, output classes, and documented attributes are part of the public output contract.
Removing a canonical semantic, changing its tag/attrs, or changing generated class names is treated as a breaking change.
Aliases may be expanded in minor releases, but alias removal or a change that causes existing Markdown to stop matching is also treated as breaking.
Runtime `semanticContainerSc` aliases are always literal strings; regex-capable aliases are limited to built-in locale catalog files.

The semantic label can also be written as strong text. In that case, the rendered label remains a `<strong>` element instead of becoming a `<span>`.

```md
---

**Semantics.** A paragraph inside the container.

A paragraph inside the container.

---
```

or (ver. 0.3+):

```md
---

**Semantics**. A paragraph inside the container.

A paragraph inside the container.

---
```

The first block inside a semantic container may also be a heading:

```md
---

### Semantics. The container title.

A paragraph inside the container.

A paragraph inside the container.

---
```

------

Semantic containers can be nested up to three levels by using different horizontal-rule marker types.

I think it would be better to use the symbols themselves for different purposes, with `*` as the horizontal line, `-` as the semantic container, and `_` as the semantic container inside the semantic container.

------

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

[Version 0.2+]

If a semantic container consists of one paragraph, the surrounding horizontal rules can be omitted by default.

```md
A paragraph.

---

Notice. A notice.

---


A paragraph.

```

is the same as below.

```md
A paragraph.

Notice. A notice.

A paragraph.
```

## One-paragraph shorthand

By default, a one-paragraph semantic container can omit the surrounding horizontal rules:

```md
A paragraph.

Notice. A notice.

A paragraph.
```

Use `requireHrAtOneParagraph: true` to require horizontal rules even for one-paragraph containers.
See [requireHrAtOneParagraph](#requirehratoneparagraph) for details.

## Example

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
<section class="sc-lead" aria-label="Lead">
<p>A lead.</p>
</section>
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


## Output contract

The plugin emits structural HTML only; it does not ship or inject CSS.
Consumers can style the generated containers with these stable selectors:

- Container class: `sc-${semanticName}` (for example, `sc-notice`)
- Label class: `sc-${semanticName}-label`
- Label joint class: `sc-${semanticName}-label-joint`

The canonical semantic name, output tag, and default attributes come from [`semantics/en.json`](https://github.com/peaceroad/p7d-markdown-it-hr-sandwiched-semantic-container/blob/main/semantics/en.json).
For example, a semantic may render as `<section class="sc-notice" role="doc-notice">` or `<aside class="sc-column">`.
When a label is hidden by `labelControl` or `semanticContainerSc`, the container receives an `aria-label` fallback when the semantic does not already define one.

## Option

| Option | Default | Purpose |
| --- | --- | --- |
| `languages` | `["ja"]` | Adds locale-specific recognition labels on top of English. |
| `requireHrAtOneParagraph` | `false` | Requires horizontal rules for one-paragraph containers. |
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

### languages

Specify additional locale label files to load in addition to English. English is always included. Default: `["ja"]`.

```js
// English + Japanese (default)
mdit().use(mditSemanticContainer, { languages: ["ja"] })

// English only
mdit().use(mditSemanticContainer, { languages: [] })
```

### frontmatter `sc` input sources

This plugin does not parse frontmatter text by itself.
It reads already-parsed `sc` data from these sources (in priority order):

1. `state.env.semanticContainerSc`
2. `state.env.frontmatter.sc`
3. `state.env.meta.sc`
4. `md.frontmatter.sc` (`markdown-it-front-matter` style)
5. `md.meta.sc` (`markdown-it-meta` style)

For `md.frontmatter.sc` / `md.meta.sc`, this plugin only consumes values from the current render context (front matter token present) or when object reference changed, to avoid leaking stale metadata across renders.

Recommended explicit input:

```js
const env = {
  semanticContainerSc: {
    notice: "お知らせ",  // alias extension
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
- Non-empty `sc.<semantic>` values extend aliases for semantic detection.
- Runtime `sc` aliases are treated as literal strings, not regex patterns. If you need regex-capable aliases, define them in locale data (`semantics/*.json`).
- `""` / `null` in `sc.<semantic>` hides the label by default and keeps `aria-label` fallback behavior.
- `labelControl` inline `label="..."` takes precedence over `sc` default hide.
- Alias conflicts are ignored deterministically and warnings are collected in `env.semanticContainerWarnings`.

Example frontmatter shape (from your own frontmatter parser):

```yaml
---
sc:
  notice: "お知らせ"
  warning: ""
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
- `label=""` hides the label and sets `aria-label` on the container with the actual keyword written in Markdown.
- This applies to standard labels, bracket format (`allowBracketJoint`), and GitHub alert format (`githubTypeContainer`).
- Strong-label forms are also supported, including both `**Notice**。 body` and `**Notice。** body`.
- If `labelControl` is disabled (or `label` is not parsed by another plugin), behavior is unchanged.
- `labelControlInlineFallback` controls attrs-less parsing of trailing `{label=...}`:
  - `true`: always enable fallback parser
  - `false`: attrs-only mode
  - `"auto"` (default): enable fallback when `curly_attributes` rule is not registered
- With `markdown-it-attrs` and `labelControl: false`, `{label="..."}` is passed through as a raw HTML `label` attribute on the original element; if HTML validity is important, prefer `data-*` attributes when not using label control.

### removeJointAtLineEnd

If the semantic label is a line and there is nothing after the label joint, remove the label joint and output it.

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
<section class="sc-note" role="doc-notice">
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
<section class="sc-note" role="doc-notice">
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

Use the included audit script to find repeated inline labels and `sc` alias conflicts in Markdown files.

```bash
npm run labels:audit
npm run labels:audit:strict
```

## Development checks

Recommended checks before publishing or opening a pull request:

```bash
npm test
npm run labels:audit:strict
npm run smoke:pack
```

Use the deterministic benchmark when a change touches parser phases, hot paths, rule ordering, or candidate planning:

```bash
npm run performance:ab
```
