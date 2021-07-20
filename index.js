'use strict';

module.exports = function semantic_container_plugin(md, option) {

  let opt = {
    'hassleHrIfOneLine': true
  };
  if (option !== undefined) {
    if (option.hassleHrIfOneLine !== undefined) {
      opt.hassleHrIfOneLine = option.hassleHrIfOneLine;
    }
  }

  const semantics = require('./semantics.json');
  const semanticsJoint = '[:.　：。．]';
  const sNumber = '(?:[ 　](?:[0-9]{1,6}|[A-Z]{1,2})(?:[.-](?:[0-9]{1,6}|[A-Z]{1,2})){0,6})?';

  const checkSematicContainerCore = (state, n, hrType, sc, checked) => {

    const nextToken = state.tokens[n+1];
    //console.log(n + ', type: ' + nextToken.type, ', content: ' + nextToken.content);

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
      actualName = nextToken.content.match(new RegExp('^(?:(?:[*_]{1,2})?' + semantics[sn].name + semanticsAltRegStr + ')' + sNumber + semanticsJoint, 'i'));
      //console.log(semantics[sn].name + ' /nextToken.content: ' + nextToken.content, ' /actualName: ' + actualName);
      if(actualName) break;
      sn++;
    }
    if(!actualName) { return false; }

    const actualNameJoint = actualName[0].match(new RegExp(semanticsJoint + '$'));

    let en = n;
    let hasEndSemanticsHr = false;
    let pCloseN = -1;
    while (en < state.tokens.length) {
      const eToken = state.tokens[en];
      if (eToken.type !== 'hr') {
        if (eToken.type === 'paragraph_close' && pCloseN == -1) {
          pCloseN = en;
        }
        en++;
        continue;
      }

      if(hrType !== '') {
        if (new RegExp('\\' + hrType).test(eToken.markup)) {
          hasEndSemanticsHr = true;
          break;
        }
      }
      en++;
    }
    if (hrType !== '' && !hasEndSemanticsHr) { return false; }

    sc.push({
      "range": [n, en],
      "continued": checked,
      "sn": sn,
      "hrType": hrType,
      "actualName": actualName[0],
      "actualNameJoint": actualNameJoint[0]
    });
    if(hrType === '' && pCloseN !== -1) {
      sc[sc.length - 1].range[1] = pCloseN + 1;
    }

    return true;
  };


  const checkSemanticContainer = (state, n, hrType, sc) => {
    let continued = 0;
    if (!checkSematicContainerCore(state, n, hrType, sc, continued)) { 
      return false;
    }
    let cn = sc[sc.length - 1].range[1] + 1;
    while (cn < state.tokens.length -1) {
      //console.log('next cn: ' + cn);
      continued = true;
      if (!checkSematicContainerCore(state, cn, hrType, sc, continued)) {
        return true;
      }
      cn = sc[sc.length - 1].range[1] + 1;
      continued++;
    }
    return true;
  };


  const setSemanticContainer = (state, n, hrType, sc, sci) => {
    let nJump = 0;
    let moveToAriaLabel = false;
    let rs = sc.range[0];
    let re = sc.range[1];
    const sn = sc.sn;

    // for continued semantic container.
    if(sci > 1) {
      let s = 1;
      while (s < sci) {
        rs++;
        re++;
        s++;
      }
    }
    const nextToken = state.tokens[rs+1];
    //console.log(nextToken.type,);

    const sToken = new state.Token('html_block', '', 0);
    sToken.content = '<' + semantics[sn].tag;
    sToken.content += ' class="sc-' + semantics[sn].name + '"';
    if (semantics[sn].attrs.length > 0) {
      let ai = 0;
      while (ai < semantics[sn].attrs.length) {
        if(!moveToAriaLabel) {
          moveToAriaLabel = semantics[sn].attrs[ai][0]=== "aria-label";
          if(moveToAriaLabel) {
            semantics[sn].attrs[ai][1] = sc.actualName.replace(new RegExp('\\' + sc.actualNameJoint + '$'), '');
            moveToAriaLabel = true;
          }
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


    if(sci !== -1) {
      state.tokens.splice(re+1, 1, eToken); // ending hr delete too.
      if (!sc.continued) {
        state.tokens.splice(rs-1, 1)// starting hr delete.
      }
    } else {
      state.tokens.splice(re+1, 0, eToken);
    }



    if(moveToAriaLabel) {
      nextToken.content = nextToken.content.replace(new RegExp('^' + sc.actualName + ' *'), '');
      nextToken.children[0].content = nextToken.children[0].content.replace(new RegExp('^' + sc.actualName + ' *'), '');
      return nJump;
    }

    if (/^#+/.test(nextToken.content)) {
      nJump += 2;
    }
    if (/^[*_]{1,2}/.test(nextToken.content)) {
      nextToken.children[1].attrJoin("class", "sc-" + semantics[sn].name + '-label');
      nJump += 3;
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
        attrs: [["class", "sc-" + semantics[sn].name + "-label"]],
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
      nJump += 3;
    }


    // Add label joint span.
    nextToken.children[2].content = nextToken.children[2].content.replace(new RegExp(sc.actualNameJoint + '$'), '');

    const ljt_span_open = {
      type: 'span_open',
      tag: 'span',
      attrs: [["class", "sc-" + semantics[sn].name + "-label-joint"]],
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

    return nJump;
  };


  function semanticContainer (state, startLine, endLine, silent) {
    let n = 0;
    let cn = [];

    while (n < state.tokens.length) {
      //console.log(n + ": " + state.tokens[n].type + ": ==========");
      let sc = [];
      let sci = 0;
      let hrType = '';
      let alreadyChecked = false;
      let nJumps = [];

      const prevToken = state.tokens[n-1];
      const token = state.tokens[n];

      if (n === 0 || n === state.tokens.length -1) {
        if (opt.hassleHrIfOneLine && token.type === 'paragraph_open') {
          if(checkSematicContainerCore(state, n, hrType, sc, false)) {
            nJumps.push(setSemanticContainer(state, n, hrType, sc[0], -1));
            n += nJumps[0];
            continue;
          }
        }
        n++;
        continue;
       }
      if (prevToken.type !== 'hr') {
        if (opt.hassleHrIfOneLine && token.type === 'paragraph_open') {
          cn.forEach(cni => {
            if (n === cni + 1) { alreadyChecked = true; }
          });
          if (alreadyChecked) { n++; continue; }
        //console.log('n:' + n + ', cn: ' + cn);

          if(checkSematicContainerCore(state, n, hrType, sc, false)) {
            //console.log('set sc(noHr): '+ JSON.stringify(sc));
            nJumps.push(setSemanticContainer(state, n, hrType, sc[0], -1));
            n += nJumps[0];
            continue;
          }
        }

        n++;
        continue;
      }

      if(/\*/.test(prevToken.markup)) hrType = '*';
      if(/-/.test(prevToken.markup)) hrType = '-';
      if(/_/.test(prevToken.markup)) hrType = '_';

      if (!checkSemanticContainer(state, n, hrType, sc)) { n++; continue; }
      //console.log('set sc: '+ JSON.stringify(sc));

      sci = 0;
      while (sci < sc.length) {
        //console.log('sci: ' + sci + ' ---------');
        nJumps.push(setSemanticContainer(state, n, hrType, sc[sci], sci));
        cn.push(sc[sci].range[1] + sci + 1);
        sci++;
      }
      n = n + nJumps[0];
    }
    return true;
  }

  md.core.ruler.after('inline', 'semantic_container', semanticContainer);
};