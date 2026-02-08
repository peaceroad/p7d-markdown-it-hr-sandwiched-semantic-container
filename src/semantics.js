import enSemantics from '../semantics/en.json' with { type: 'json' }
import jaLabels from '../semantics/ja.json' with { type: 'json' }

const localeLabels = {
  ja: jaLabels,
}

const dedupeAliases = (aliases) => {
  if (!aliases || aliases.length < 2) return aliases || []
  const seen = new Set()
  let result = null
  for (const item of aliases) {
    if (seen.has(item)) {
      if (!result) {
        // Allocate only when duplicates are actually found.
        result = Array.from(seen)
      }
      continue
    }
    seen.add(item)
    if (result) result.push(item)
  }
  return result || aliases
}

export const buildSemantics = (languages = ['ja']) => {
  const includeLocales = Array.isArray(languages) ? languages : [languages]
  const semantics = enSemantics.map((entry) => ({
    name: entry.name,
    tag: entry.tag,
    attrs: entry.attrs,
    aliases: entry.aliases ? [...entry.aliases] : [],
  }))

  const seenLangs = new Set()
  for (let i = 0; i < includeLocales.length; i++) {
    const lang = includeLocales[i]
    if (!lang) continue
    if (seenLangs.has(lang)) continue
    seenLangs.add(lang)
    if (lang === 'en') continue
    const labels = localeLabels[lang]
    if (!labels) continue
    for (const sem of semantics) {
      const extras = labels[sem.name]
      if (extras && extras.length) {
        sem.aliases.push(...extras)
      }
    }
  }

  for (let i = 0; i < semantics.length; i++) {
    semantics[i].aliases = dedupeAliases(semantics[i].aliases)
  }

  return semantics
}
