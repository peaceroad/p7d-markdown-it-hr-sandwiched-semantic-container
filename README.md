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
<section class="notice" role="doc-notice">
<p><span class="notice-label">Notice<span class="notice-label-joint">.</span></span> A paragraph 2.</p>
</section>
<p>A paragraph 3.</p>
```

## Rule

The notation is as follows:

1. Sandwich paragraphs with two horizontal lines of the same symbol type. The symbol type is either `*` or `-` or`_`.
2. Write the word (`Semantics` in the example below) that means a semantic container in the string at the beginning of the first paragraph of this group of paragraphs.
3. Immediately after the Semantics word, write one of the letters `.:。．：　`, which is a separator with the normal paragraph.

```md
---

Semantics. A paragraph inside the container.

A paragraph inside the container.

---
```

The Semantics words are defined as follows. (This word can be in uppercase or lowercase.) You can infer which tag is used for the container by referring to [settings.json](https://github.com/peaceroad/p7d-markdown-it-hr-sandwiched-semantic-container/blob/main/semantics.json).

```plain
abstract (要旨,抄録), acknowledgments (謝辞), afterword (後書き,あとがき,跋文), annotation (注釈), answers (回答,答え), appendix ((付録|付属)[0-9A-Z]{1,2}), assessments (評価,採点), bibliography ((参考)?文献(一覧)?), chapter-toc (chapter toc,章目次), caution (注意(事項)?), colophon (奥付), column (コラム), conclusion (終わりに,おわりに,結び,結論), credits (帰属), danger (危険), dedication (献呈), endnotes (後注,章末注,巻末注), epigraph (題辞,題句,題言), epilogue (エピローグ,終幕,終章), errata (正誤表), example (例), faq (ＦＡＱ,よくある(質問|問い合わせ)), feedback (フィードバック), foreword ((本書|日本語版)?(の)?(刊行|発行|発刊)?に 寄せて), hint (ヒント), index (索引), interview (インタビュー), introduction (序論,序説,はじめに,始めに), keywords (キーワード,手がかり語), lead (リード(文)?,導 入(文)?), memo (メモ), note (ノート), notice (通知,お知らせ), outline (アウトライン), overview (概観,大要,あらまし), point (ポイント), preamble (序,序文), preface (前書き,まえがき), problem (問(題)?[0-1A-Z]{0,6}), prologue (プロローグ,序幕,序章), pullquote (プル(・)?ク[オォ]ート,抜粋), qna (Q&A,Ｑ＆Ａ,質疑応答,一問一答,(問(題)?|質問)と(回答|答え)), summary (要約,要点,まとめ), tip (コツ), toc (目次), warning (警告)
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

## Use

```js
const md = require('markdown-it')()
            .use(require('@peaceroad/markdown-it-hr-sandwiched-semantic-container'));

md.render(/*...*/) // See examples above
```

## Install

```bash
npm install @peaceroad/markdown-it-hr-sandwiched-semantic-container
```