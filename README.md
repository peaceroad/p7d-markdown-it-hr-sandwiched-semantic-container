# p7d-markdown-it-hr-sandwiched-semantic-container

This is a markdown-it plugin. In markdown specifications, there are three types of Markdown symbols used to generate hr element. Suppose a paragraph group is sandwiched between two hr elements of the same symbol type. Then, if the first word of the paragraph group has a semantic meaning, the paragraph group is changed into a block element as a semantic container.

For example, suppose you write the following Markdown:

```md
A paragraph 1.

---

Notice. A paragraph 2.

---

A paragraph 3.
```

Then it will be converted to the following HTML.

```html
<p>A paragraph 1.</p>
<section class="sc-notice" role="doc-notice">
<p><span class="sc-notice-label">Notice<span class="sc-notice-label-joint">.</span></span> A paragraph 2.</p>
</section>
<p>A paragraph 3.</p>
```

## Rule

The notation is as follows:

1. Sandwich paragraphs with two horizontal lines of the same symbol type. The symbol type is either `*` or `-` or`_`.
2. Write the word (`Semantics` in the example below) that means a semantic container in the string at the beginning of the first paragraph of this group of paragraphs.
3. Immediately after the Semantics word, write one of the letters `.:。．：　`, which is a separator with the normal paragraph.

Notice: In addition, half-width symbols required a space after them. [ver.0.3+] 

```md
---

Semantics. A paragraph inside the container.

A paragraph inside the container.

---
```

The Semantics words are defined as follows. (This word can be in uppercase or lowercase.) You can infer which tag is used for the container by referring to [semantics.json](https://github.com/peaceroad/p7d-markdown-it-hr-sandwiched-semantic-container/blob/main/semantics.json).

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

---

Notice. Currently, this semantics words are unstable.

---

As a notation, the Semantics word itself may be made into a strong element as follows. In the first example, Semantics converted to a span element, but in this example it is, of course, converted to a strong element.

```md
---

**Semantics.** A paragraph inside the container.

A paragraph inside the container.

---
```

,or (ver: 0.3+)

```md
---

**Semantics**. A paragraph inside the container.

A paragraph inside the container.

---
```

Also, there are times when you want to add a heading in a column or the like. Therefore, the following description is also acceptable.

```md
---

### Semantics. The container title.

A paragraph inside the container.

A paragraph inside the container.

---
```

------

Notice. This semantic containers can be nested up to three by using different horizontal line symbol types.

I think it would be better to use the symbols themselves for different purposes, with `*` as the horizontal line, `-` as the semantic container, and `_` as the semantic container inside the semantic container.

------

Also, when the semantic containers are continuous, you may have one of the front end horizon marks and the back start horizon mark between the two semantic containers.

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

If the semantics container consists of one paragraph, are you cumbersome to sandwich with two hr elements?
Yes, you can omit them. (There is also an option that cannot be omitted.)

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

## Use

```js
import mdit from 'markdown-it'
import mditSemanticContainer from '@peaceroad/markdown-it-hr-sandwiched-semantic-container'
const md = mdit().use(mditSemanticContainer);
const markdownCont = '...'
md.render(markdowonCont)
```

The hr element can be omitted in a one-paragraph semantics container, but if not, specify the following option.

```js
import mdit from 'markdown-it'
import mditSemanticContainer from '@peaceroad/markdown-it-hr-sandwiched-semantic-container'
const md = mdit().use(mditSemanticContainer, {"requireHrAtOneParagraph": true});
const markdownCont = '...'
md.render(markdowonCont)
```

Other options are explained under headings towards the end of the document.

## Install

```bash
npm install @peaceroad/markdown-it-hr-sandwiched-semantic-container
```

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


## Option

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

[Notice] A notice message.

A paragraph.
[HTML]
<p>A paragraph.</p>
<section class="sc-notice" role="doc-notice">
<p><strong class="sc-notice-label"><span class="sc-notice-label-joint">[</span>Notice<span class="sc-notice-label-joint">]</span></strong> A notice message.</p>
</section>
<p>A paragraph.</p>
```

### githubTypeContainer

Enable GitHub-style alert containers using `> [!TYPE]` syntax or full-width `> ［！TYPE］` syntax.

```js
mdit().use(mditSemanticContainer, {"githubTypeContainer": true})
```

Example usage:

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

Supported GitHub alert types: `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`, and their Japanese equivalents.

### requireHrAtOneParagraph

Force the use of horizontal rules even for single-paragraph containers. By default, single-paragraph semantic containers don't require surrounding `---` lines.

```js
mdit().use(mditSemanticContainer, {"requireHrAtOneParagraph": true})
```

With this option enabled, the following would NOT be converted to a semantic container:

```md
Notice. A single paragraph notice.
```

But this would still work:

```md
---
Notice. A single paragraph notice.
---
```