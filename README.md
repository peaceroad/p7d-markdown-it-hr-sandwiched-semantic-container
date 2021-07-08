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
<section>
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

The Semantics words are defined as follows. (This word can be in uppercase or lowercase.) See settings.json for details.

| Semantics |           |
|-----------|-----------|
| **abstract**, 摘要,要旨,要約,概要
| **conclusion**, 
| **summary**
| **notice**
| **column**

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

In addition, there are times when you want to add a heading in a column or the like. Therefore, the following description is also acceptable.

```md
---

### Semantics. The container title.

A paragraph inside the container.

A paragraph inside the container.

---
```

This semantic containers can be nested up to three by using different horizontal line symbol types.

I think it would be better to use the symbols themselves for different purposes, with `*` as the horizontal line, `-` as the semantic container, and `_` as the semantic container inside the semantic container.
