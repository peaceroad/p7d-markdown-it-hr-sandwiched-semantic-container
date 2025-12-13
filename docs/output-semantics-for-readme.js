import { buildSemantics } from '../src/semantics.js'

// Default includes English + Japanese labels; adjust languages as needed.
const semantics = buildSemantics(['ja'])

let output = ''
for (const s of semantics) {
  const aliases = s.aliases.join(',')
  output += s.name + ' (' + aliases + ')\n'
}

console.log(output)
