const assert = require('assert');
const fs = require('fs');
const md = require('markdown-it')();
const mdNoHassle = require('markdown-it')();
const sc = require('../index.js');
md.use(sc);
mdNoHassle.use(sc, {"hassleHrIfOneLine": false});

const exampleCont = fs.readFileSync(__dirname + '/examples.txt', 'utf-8').trim();
let ms = [];
let ms0 = exampleCont.split(/\n*\[Markdown\]\n/);
let n = 1;
while(n < ms0.length) {
  const mh = ms0[n].split(/\n+\[HTML[^\]]*?\]\n/);
  let mh2 = '';
  if (mh[2] !== undefined) {
     mh2 = mh[2].replace(/$/,'\n');
  }
  ms[n] = {
    "markdown": mh[0],
    "html": mh[1].replace(/$/,'\n'),
    "htmlNoHassle": mh2
  };
  n++;
}

n = 1;
while(n < ms.length) {
  // if (n !==7) { n++; continue };
  console.log('Test: ' + n + ' >>>');
 // console.log(ms[n].markdown);
  const h = md.render(ms[n].markdown);
  const hNoHassle = mdNoHassle.render(ms[n].markdown);
  try {
    assert.strictEqual(h, ms[n].html);
  } catch(e) {
    console.log(' incorrect: ');
    console.log('H: ' + h +'C: ' + ms[n].html);
  };
  if (ms[n].htmlNoHassle === '') { n++; continue; }

  try {
    assert.strictEqual(hNoHassle, ms[n].htmlNoHassle);
  } catch(e) {
    console.log(' incorrect(noHassle): ');
    console.log('H: ' + hNoHassle +'C: ' + ms[n].htmlNoHassle);
  };
  n++;
}