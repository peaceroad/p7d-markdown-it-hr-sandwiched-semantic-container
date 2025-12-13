import enSemantics from '../semantics/en.json' with { type: 'json' }
import jaLabels from '../semantics/ja.json' with { type: 'json' }

const localeLabels = {
  ja: jaLabels,
}

const uniq = (arr) => {
  const seen = new Set()
  const result = []
  for (const item of arr) {
    if (seen.has(item)) continue
    seen.add(item)
    result.push(item)
  }
  return result
}

export const buildSemantics = (languages = ['ja']) => {
  const includeLocales = new Set(languages.filter(Boolean))
  const semantics = enSemantics.map((entry) => ({
    name: entry.name,
    tag: entry.tag,
    attrs: entry.attrs,
    aliases: entry.aliases ? [...entry.aliases] : [],
  }))

  for (const lang of includeLocales) {
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

  semantics.forEach((sem) => {
    sem.aliases = uniq(sem.aliases)
  })

  return semantics
}
