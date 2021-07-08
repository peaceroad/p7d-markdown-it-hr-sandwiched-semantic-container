const assert = require('assert');
const md = require('markdown-it')();
const sc = require('../index.js');
md.use(sc);

const ms = [
  [
    'A paragraph.\n\n* * *\n\nNotice. A notice.\n\n* * *\n\nA paragraph.',
    '<p>A paragraph.</p>\n<section class="notice" role="doc-notice">\n<p><span class="notice-label">Notice<span class="notice-label-joint">.</span></span> A notice.</p>\n</section>\n<p>A paragraph.</p>\n'
  ], [
    'A paragraph.\n\n* * *\n\n**Notice.** A notice.\n\n* * *\n\nA paragraph.',
    '<p>A paragraph.</p>\n<section class="notice" role="doc-notice">\n<p><strong class="notice-label">Notice<span class="notice-label-joint">.</span></strong> A notice.</p>\n</section>\n<p>A paragraph.</p>\n'
  ], [
    '# Title\n\nA paragraph.\n\n- - -\n\n## Column: Title\n\nA column.\n\n- - -\n\nA paragraph.',
    '<h1>Title</h1>\n<p>A paragraph.</p>\n<aside class="column">\n<h2><span class="column-label">Column<span class="column-label-joint">:</span></span> Title</h2>\n<p>A column.</p>\n</aside>\n<p>A paragraph.</p>\n'
  ], [
    '# A heading.\n\n* * *\n\nLead. A lead.\n\n* * *\n\nA paragraph.',
    '<h1>A heading.</h1>\n<section class="lead" aria-label="Lead">\n<p>A lead.</p>\n</section>\n<p>A paragraph.</p>\n'
  ]
];


let n = 0;
while(n < ms.length) {
  const h = md.render(ms[n][0]);
  try {
    assert.strictEqual(h, ms[n][1]);
  } catch(e) {
    console.log('Incorrect: ')
    console.log('M: ' + ms[n][0] + '\nH: ' + h +'C: ' + ms[n][1]);
  };
  n++;
}