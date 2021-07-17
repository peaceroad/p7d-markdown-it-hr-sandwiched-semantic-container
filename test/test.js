const assert = require('assert');
const fs = require('fs');
const md = require('markdown-it')();
const sc = require('../index.js');
md.use(sc);

const exampleCont = fs.readFileSync(__dirname + '/examples.txt', 'utf-8').trim();
let ms = [];
let ms0 = exampleCont.split(/\n*\[Markdown\]\n/);
let n = 1;
while(n < ms0.length) {
  const mh = ms0[n].split(/\n+\[HTML\]\n/);
  ms[n] = {
    "markdown": mh[0],
    "html": mh[1].replace(/$/,'\n')
  };
  n++;
}

n = 1;
while(n < ms.length) {
  if (n !== 8) { n++; continue };
  const h = md.render(ms[n].markdown);
  try {
    assert.strictEqual(h, ms[n].html);
  } catch(e) {
    console.log('Incorrect: ');
    console.log('M: ' + ms[n].markdown + '\nH: ' + h +'C: ' + ms[n].html);
  };
  n++;
}