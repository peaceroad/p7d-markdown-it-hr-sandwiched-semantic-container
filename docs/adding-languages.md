# Adding Languages to Semantic Labels

This plugin always ships English semantics (`semantics/en.json`). Additional languages are merged at init via the `languages` option (default: `["ja"]`).

## File layout

- `semantics/en.json`: canonical list, with `name`, `aliases`, `tag`, `attrs`.
- `semantics/<lang>.json`: object mapping canonical names to an array of labels in that locale.

Example `semantics/es.json`:

```json
{
  "note": ["nota", "apunte"],
  "warning": ["advertencia", "precaución"]
}
```

## Steps to add a locale

1) Create `semantics/<lang>.json` with label arrays keyed by the canonical `name` values used in `en.json`.
2) Register the locale in `src/semantics.js`:
   - Import it at the top (`import xxLabels from '../semantics/xx.json' with { type: 'json' }`).
   - Add to the `localeLabels` map: `xx: xxLabels`.
3) Use the new locale:
   ```js
   mdit().use(mditSemanticContainer, { languages: ["ja", "<lang>"] })
   // or English + new locale only
   mdit().use(mditSemanticContainer, { languages: ["<lang>"] })
   ```
   English is always included.

## Notes

- Regexes are built once at init using the selected locales; unused locales do not impact runtime.
- Keep canonical names stable; only labels vary per locale.
- Avoid duplicating `tag`/`attrs` in locale files; those live only in `en.json`.
- Unknown locale codes in `languages` are ignored safely.
- Duplicate labels are de-duplicated when semantics are built.
- Regex-like aliases are supported, but aliases with a clear literal leading character are faster in hot paths.
- Matching is case-insensitive, but it does not perform full Unicode case folding.
  For example, German `ß` is not treated the same as `ẞ` or `SS` automatically.
- For languages with such special case rules, add explicit aliases for each expected variant.
  (For typical Spanish labels, standard case-insensitive matching is usually sufficient.)
