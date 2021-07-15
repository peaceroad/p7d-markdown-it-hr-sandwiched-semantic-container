'use strict';

const semantics = require('../semantics.json');
const num = '[0-9A-Z]{1,6}([.-][0-9A-Z]{1,6}){0,6}';

let output = '';
for (let s of semantics) {
  output += s.name + ' (' + s.as + ')\n';
}

console.log(output);