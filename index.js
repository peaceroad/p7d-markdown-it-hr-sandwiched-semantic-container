'use strict';

module.exports = function semantic_container_plugin(md) {

  const semantics = require('./semantics.json');
  const semanticsJoint = '[:.　：。．]';
  const sNumber = '(?: *?[0-9A-Z]{1,6}(?:[.-][0-9A-Z]{1,6}){0,6})?';

  const checkSematicContainerCore = (state, n, hrType, sc, checked) => {

    const nextToken = state.tokens[n+1];

    let sn = 0;
    let actualName = null;
    while (sn < semantics.length) {
      let semanticsAltRegStr = '';
      if(semantics[sn].as) {
        const ts = semantics[sn].as.split(',');
        ts.forEach(x => {
          semanticsAltRegStr += '|' + x.trim();
        });
      }
      actualName = nextToken.content.match(new RegExp('(?:(?:^|[*_]{1,2})' + semantics[sn].name + semanticsAltRegStr + ')' + sNumber + semanticsJoint, 'i'));
      //console.log(semantics[sn].name + ' /nextToken.content: ' + nextToken.content, ' /actualName: ' + actualName);
      if(actualName) break;
      sn++;
    }
    if(!actualName) { return false; }

    const actualNameJoint = actualName[0].match(new RegExp(semanticsJoint + '$'));

    let en = n;
    let hasEndSemanticsHr = false;
    while (en < state.tokens.length) {
      const eToken = state.tokens[en];
      if (eToken.type !== 'hr') { en++; continue; }
      if (new RegExp('\\' + hrType).test(eToken.markup)) {
        hasEndSemanticsHr = true;
        break;
      }
      en++;
    }
    if(!hasEndSemanticsHr) { return false; }

    sc.push({
      "range": [n, en],
      "continued": checked,
      "sn": sn,
      "actualName": actualName[0],
      "actualNameJoint": actualNameJoint[0]
    });


    return true;
  };


  const checkSemanticContainer = (state, n, hrType, sc) => {
    let continued = false;
    if (!checkSematicContainerCore(state, n, hrType, sc, continued)) { 
      return false;
    }
    //console.log(sc[sc.length - 1].range[1] + 1);
    let cn = sc[sc.length - 1].range[1] + 1; // <hr>:2, </p>:1
    while (cn < state.tokens.length -1) {
      //console.log('next cn: ' + cn);
      continued = true;
      if (!checkSematicContainerCore(state, cn, hrType, sc, continued)) {
        return true;
      }
      cn = sc[sc.length - 1].range[1];
    }

    return true;
  };


  const setSemanticContainer = (state, n, hrType, sc) => {
    let moveToAriaLabel = false;
    const rs = sc.range[0];
    const re = sc.range[1];
    const sn = sc.sn;
    const nextToken = state.tokens[rs+1];

    const sToken = new state.Token('html_block', '', 0);
    sToken.content = '<' + semantics[sn].tag;
    sToken.content += ' class="' + semantics[sn].name + '"';
    if (semantics[sn].attrs.length > 0) {
      let ai = 0;
      while (ai < semantics[sn].attrs.length) {
        if( semantics[sn].attrs[ai][0]=== "aria-label" && semantics[sn].attrs[ai][1]=== "NAME") {
          semantics[sn].attrs[ai][1] = sc.actualName.replace(new RegExp('\\' + sc.actualNameJoint + '$'), '');
          moveToAriaLabel = true;
        }
        sToken.content += ' ' + semantics[sn].attrs[ai][0] + '="' + semantics[sn].attrs[ai][1] + '"';
        ai++;
      }
    }
    sToken.content += '>\n';
    sToken.block = true;
    state.tokens.splice(rs, 0, sToken);

    const eToken = new state.Token('html_block', '', 0);
    eToken.content = '</' + semantics[sn].tag + '>\n';
    eToken.block = true;
    state.tokens.splice(re+1, 1, eToken); // ending hr delete too.
    if (!sc.continued) {
      state.tokens.splice(rs-1, 1)// starting hr delete.
    }


    if(moveToAriaLabel) {
      //sn++;
      nextToken.content = nextToken.content.replace(new RegExp('^' + sc.actualName + ' *'), '');
      nextToken.children[0].content = nextToken.children[0].content.replace(new RegExp('^' + sc.actualName + ' *'), '');
      return;
    }


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
        content: sc.actualName,
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
      nextToken.children[0].content = nextToken.children[0].content.replace(sc.actualName, '');
      nextToken.children.unshift(lt_span_close);
      nextToken.children.unshift(lt_span_content);
      nextToken.children.unshift(lt_span_open);
      nextToken.children.unshift(lt_first);
    }


    // Add label joint span.
    nextToken.children[2].content = nextToken.children[2].content.replace(new RegExp(sc.actualNameJoint + '$'), '');

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
      content: sc.actualNameJoint,
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

    return;
  };


  function semanticContainer (state, startLine, endLine, silent) {
    let n = 1;
    while (n < state.tokens.length -1) {
      //console.log(n + ": " + state.tokens[n].type + ": ==================================");
      let sc = [];
      let hrType = '';

      const prevToken = state.tokens[n-1];

      if (prevToken.type !== 'hr') { n++; continue; }
      if(/\*/.test(prevToken.markup)) hrType = '*';
      if(/-/.test(prevToken.markup)) hrType = '-';
      if(/_/.test(prevToken.markup)) hrType = '_';

      if (!checkSemanticContainer(state, n, hrType, sc)) { n++; continue; }
      //console.log('set sc: '+ JSON.stringify(sc));

      let sci = 0;
      while (sci < sc.length) {
        setSemanticContainer(state, n, hrType, sc[sci]);
        sci++;
      }
      n++; //if "n = sc[sc.length - 1].range[1] + 1;", the inner semantic container is not processed.
    }
    return true;
  }

  md.core.ruler.after('inline', 'semantic_container', semanticContainer);
};