import semantics from '../semantics.json' with {type: 'json'};

const sNumber = '[0-9A-Z]{1,6}([.-][0-9A-Z]{1,6}){0,6}';

let output = '';
for (let s of semantics) {
  output += s.name + ' (' + s.as + ')\n';
}

console.log(output);