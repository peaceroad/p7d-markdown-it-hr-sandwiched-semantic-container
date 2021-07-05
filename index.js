'use strict';

module.exports = function semantic_container_plugin(md) {

  const semantics = require('./semantics.json');
  const semanticsJoint = '[:.　：。．]';

  function semantic_container (state, startLine, endLine, silent) {
    let n = 1;
    while (n < state.tokens.length -2) {
      const token = state.tokens[n];
      const prevToken = state.tokens[n-1];
      const nextToken = state.tokens[n+1];

      if (prevToken.type !== 'hr') { n++; continue; }
      let hrMarkup = '';
      if(/\*/.test(prevToken.markup)) hrMarkup = '*';
      if(/-/.test(prevToken.markup)) hrMarkup = '-';
      if(/_/.test(prevToken.markup)) hrMarkup = '_';

      let sn = 0;
      let hasSemantics = false;
      let actualSemantics = null;
      while (sn < semantics.length) {
        let semanticsAltRegStr = '';
        if(semantics[sn].translation) {
          const ts = semantics[sn].translation.split(',');
          ts.forEach(x => {
            semanticsAltRegStr += '|' + x.trim();
          });
        }
        if(semantics[sn].alias.length > 0) {
          for(let ai in semantics[sn].alias) {
            semanticsAltRegStr += '|' + semantics[sn].alias[ai].name.trim();
            const ts = semantics[sn].alias[ai].translation.trim().split(',');
            ts.forEach(x => {
              semanticsAltRegStr += '|' + x.trim();
            });
          }
        }
        actualSemantics = nextToken.content.match(new RegExp('(?:' + semantics[sn].name + semanticsAltRegStr + ')' + semanticsJoint, 'i'));
        if(actualSemantics) break;
        sn++;
      }
      if(!actualSemantics) { n++; continue; }

      let en = n;
      let hasEndSemanticsHr = false;
      while (en < state.tokens.length) {
        const eToken = state.tokens[en];
        if (eToken.type !== 'hr') { en++; continue; }
        if (new RegExp('\\' + hrMarkup).test(eToken.markup)) {
          hasEndSemanticsHr = true;
          break;
        }
        en++;
      }
      if(!hasEndSemanticsHr) { n++; continue; }


      const t_start = new state.Token('html_block', '', 0);
      t_start.content = '<' + semantics[sn].tag.trim();
      t_start.content += ' class="' + semantics[sn].name + '"';
      if (semantics[sn].attrs.length > 0) {
        let ai = 0;
        while (ai < semantics[sn].attrs.length) {
          t_start.content += ' ' + semantics[sn].attrs[ai][0] + '="' + semantics[sn].attrs[ai][1] + '"';
          ai++;
        }
      }
      t_start.content += '>\n';
      t_start.block = true;
      state.tokens.splice(n, 0, t_start);

      const t_end = new state.Token('html_block', '', 0);
      t_end.content = '</' + semantics[sn].tag.trim() + '>\n';
      t_end.block = true;
      state.tokens.splice(en+1, 1, t_end); // ending hr delete too.

      state.tokens.splice(n-1, 1)// starting hr delete.


      if (/^[*_]{1,2}/.test(nextToken.content)) {
        nextToken.children[1].attrJoin("class", semantics[sn].name + '-label');
      } else {
        const lt_first = {
          type: 'text',
          tag: '',
          attrs: null,
          map: null,
          nesting: 0,
          level: 0,
          children: null,
          content: '',
          markup: '',
          info: '',
          meta: null,
          block: false,
          hidden: false
        };
        const lt_span_open = {
          type: 'span_open',
          tag: 'span',
          attrs: [["class", semantics[sn].name + "-label"]],
          map: null,
          nesting: 1,
          level: 0,
          children: null,
          content: '',
          markup: '',
          info: '',
          meta: null,
          block: false,
          hidden: false
        };
        const lt_span_content = {
          type: 'text',
          tag: '',
          attrs: null,
          map: null,
          nesting: 0,
          level: 1,
          children: null,
          content: actualSemantics[0],
          markup: '',
          info: '',
          meta: null,
          block: false,
          hidden: false
        };
        const lt_span_close = {
          type: 'span_close',
          tag: 'span',
          attrs: null,
          map: null,
          nesting: -1,
          level: 0,
          children: null,
          content: '',
          markup: '',
          info: '',
          meta: null,
          block: false,
          hidden: false
        };
        nextToken.children[0].content = nextToken.children[0].content.replace(actualSemantics[0], '');
        nextToken.children.unshift(lt_span_close);
        nextToken.children.unshift(lt_span_content);
        nextToken.children.unshift(lt_span_open);
        nextToken.children.unshift(lt_first);
      }

      // Add label joint span.
      const actualSemanticsJoint = actualSemantics[0].match(new RegExp(semanticsJoint + '$'));
      nextToken.children[2].content = nextToken.children[2].content.replace(new RegExp(actualSemanticsJoint[0] + '$'), '');

      const ljt_span_open = {
        type: 'span_open',
        tag: 'span',
        attrs: [["class", semantics[sn].name + "-label-joint"]],
        map: null,
        nesting: 1,
        level: 0,
        children: null,
        content: '',
        markup: '',
        info: '',
        meta: null,
        block: false,
        hidden: false
      };
      const ljt_span_content = {
        type: 'text',
        tag: '',
        attrs: null,
        map: null,
        nesting: 0,
        level: 1,
        children: null,
        content: actualSemanticsJoint[0],
        markup: '',
        info: '',
        meta: null,
        block: false,
        hidden: false
      };
      const ljt_span_close = {
        type: 'span_close',
        tag: 'span',
        attrs: null,
        map: null,
        nesting: -1,
        level: 0,
        children: null,
        content: '',
        markup: '',
        info: '',
        meta: null,
        block: false,
        hidden: false
      };
      nextToken.children.splice(3, 0, ljt_span_close);
      nextToken.children.splice(3, 0, ljt_span_content);
      nextToken.children.splice(3, 0, ljt_span_open);

       n++;
    }
    return true;
  }

  md.core.ruler.after('inline', 'semantic_container', semantic_container);
};