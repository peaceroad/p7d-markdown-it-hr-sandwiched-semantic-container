'use strict';

module.exports = function semantic_container_plugin(md, option) {

  let opt = {
    requireHrAtOneParagraph: false,
  };
  if (option !== undefined) {
    if (option.requireHrAtOneParagraph !== undefined) {
      opt.requireHrAtOneParagraph = option.requireHrAtOneParagraph;
    }
  }

  const semantics = require('./semantics.json');
  const semanticsHalfJoint = '[:.]';
  const semanticsFullJoint = '[　：。．]';
  const sNumber = '(?:[ 　](?:[0-9]{1,6}|[A-Z]{1,2})(?:[.-](?:[0-9]{1,6}|[A-Z]{1,2})){0,6})?';
  const strongMark = '[*_]{2}';

  const checkSematicContainerCore = (state, n, hrType, sc, checked) => {

    const nextToken = state.tokens[n+1];
    //console.log('Token: ' + n + ', type: ' + nextToken.type, ', content: ' + nextToken.content);

    let sn = 0;
    let actualName = null;

    while (sn < semantics.length) {
      let semanticsAltRegStr = '';
      if(semantics[sn].as) {
        const ts = semantics[sn].as.split(',');
        ts.forEach(x => {
          x = x.replace(/\((.*?)\)/g, '(?:$1)')
          semanticsAltRegStr += '|' + x.trim();
        });
      }
      actualName = nextToken.content.match(new RegExp(
        '^(?:' + strongMark +')?((?:' + semantics[sn].name + semanticsAltRegStr + ')' + sNumber + ')'
          + '(?:'
          + '(' + semanticsHalfJoint + ')(?: *?' + strongMark + ')? '
          + '|(?: *?' + strongMark + ' *?)?(' + semanticsHalfJoint + ') '
          + '|(' + semanticsFullJoint + ')(?: *?' + strongMark + ')?'
          + '|(?: *?' + strongMark + ' *?)?(' + semanticsFullJoint + ')'
          + ' *?)', 'i'));
      //console.log(semantics[sn].name + ' ,nextToken.content: ' + nextToken.content, ' ,actualName: ' + actualName);
      if(actualName) break;
      sn++;
    }
    if(!actualName) { return false; }


    let actualNameJoint = '';
    let hasLastJoint = false;
    let hasHalfJoint = false;

    if (actualName[2]) {
      hasHalfJoint = true
      actualNameJoint = actualName[2]
    } else if (actualName[3]) {
      hasHalfJoint = true
      hasLastJoint = true
      actualNameJoint = actualName[3]
    } else if (actualName[4]) {
      actualNameJoint = actualName[4]
    } else if (actualName[5]) {
      hasLastJoint = true
      actualNameJoint = actualName[5]
    }
    //console.log('actualName[0]: "' + actualName[0] + '", actualName[1]: "' + actualName[1] + '", actualNameJoint: "' + actualNameJoint +'" , hasLastJoint: ' + hasLastJoint)

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
      range: [n, en],
      continued: checked,
      sn: sn,
      hrType: hrType,
      actualCont: actualName[0],
      actualContNoStrong: actualName[0].replace(/[*_]{2}/g, ''),
      actualName: actualName[1],
      actualNameJoint: actualNameJoint,
      hasLastJoint: hasLastJoint,
      hasHalfJoint: hasHalfJoint,
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
    //console.log(nextToken.type);

    const sToken = new state.Token('html_block', '', 0);
    sToken.content = '<' + semantics[sn].tag;
    sToken.content += ' class="sc-' + semantics[sn].name + '"';
    if (semantics[sn].attrs.length > 0) {
      let ai = 0;
      while (ai < semantics[sn].attrs.length) {
        if(!moveToAriaLabel) {
          moveToAriaLabel = semantics[sn].attrs[ai][0] === "aria-label";
          if(moveToAriaLabel) {
            // semantics[sn].attrs[ai][1] = sc.actualName.replace(new RegExp('\\' + sc.actualNameJoint + '$'), '');
            semantics[sn].attrs[ai][1] = sc.actualName
            // moveToAriaLabel = true;
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

    //console.log('moveToAriaLabel: ' + moveToAriaLabel)
    if(moveToAriaLabel) {
      nextToken.content = nextToken.content.replace(new RegExp('^' + sc.actualContNoStrong), '');
      nextToken.children[0].content = nextToken.children[0].content.replace(new RegExp('^' + sc.actualContNoStrong + ' *'), '');
      nextToken.content = nextToken.content.replace(new RegExp('^ *'), '');
      return nJump;
    }
    //console.log('Set(' + n + '): actualName: "' + sc.actualName + '", actualNameJoint: "' + sc.actualNameJoint +'" , hasLastJoint: ' + sc.hasLastJoint)

    if (/^#+/.test(nextToken.content)) {
      //console.log('processingheading):')
      nJump += 2;
    }
    if (/^[*_]{2}/.test(nextToken.content) ) {
      //console.log('processing(strong):')
      if (nextToken.children[1]) {
        if (nextToken.children[1].type === 'strong_open') {
          //console.log('nextToken.children[1].type: ' + nextToken.children[1].type)
          nextToken.children[1].attrJoin('class', 'sc-' + semantics[sn].name + '-label');
          if (sc.hasLastJoint) {
            if (sc.hasHalfJoint) {
              nextToken.children[4].content = ' ' + nextToken.children[4].content.replace(new RegExp('^\\' + sc.actualNameJoint + ' *'), '')
            } else {
              nextToken.children[4].content = nextToken.children[4].content.replace(new RegExp('^\\' + sc.actualNameJoint + ' *'), '')
            }
          } else {
            nextToken.children[2].content = nextToken.children[2].content.replace(new RegExp('\\' + sc.actualNameJoint + '$'), '')
          }
        } else {
          //console.log('nextToken.children[1].type: ' + nextToken.children[1].type)
          const strongBefore = new state.Token('text', '', 0);
          const strongOpen = new state.Token('strong_oepn', 'strong', 1);
          const strongContent = new state.Token('text', '', 0);
          strongContent.content =sc.actualName;
          const strongClose = new state.Token('strong_close', 'strong', -1);
          strongOpen.attrJoin('class', 'sc-' + semantics[sn].name + '-label');
  
          nextToken.children[0].content = nextToken.children[0].content.replace(new RegExp('[*_]{2} *?' + sc.actualName + ' *[*_]{2}'), '');

          if (sc.hasLastSpace || sc.hasHalfJoint) {
            nextToken.children[0].content = ' ' + nextToken.children[0].content.replace(new RegExp('^' + sc.actualCont.replace(/\*/g, '\\*')), '');
          } else {
            nextToken.children[0].content = nextToken.children[0].content.replace(new RegExp('^' + sc.actualCont.replace(/\*/g, '\\*')), '');
          }
          nextToken.content = nextToken.content.replace(new RegExp('^' + sc.actualCont.replace(/\*/g, '\\*')), '');

          nextToken.children.unshift(strongClose);
          nextToken.children.unshift(strongContent);
          nextToken.children.unshift(strongOpen);
          nextToken.children.unshift(strongBefore);
        }
        nJump += 3;
      } else {
        //console.log('nextToken.children.length: ' + nextToken.children.length)

        const strongBefore = new state.Token('text', '', 0);
        const strongOpen = new state.Token('strong_oepn', 'strong', 1);
        const strongContent = new state.Token('text', '', 0);
        strongContent.content =sc.actualName;
        const strongClose = new state.Token('strong_close', 'strong', -1);
        strongOpen.attrJoin('class', 'sc-' + semantics[sn].name + '-label');

        nextToken.children[0].content = nextToken.children[0].content.replace(new RegExp('[*_]{2} *?' + sc.actualName + ' *[*_]{2}'), '');

        nextToken.children[0].content = nextToken.children[0].content.replace(new RegExp('^' + sc.actualCont.replace(/\*/g, '\\*')), '');
        nextToken.content = nextToken.content.replace(new RegExp('^' + sc.actualCont.replace(/\*/g, '\\*')), '');

        nextToken.children.unshift(strongClose);
        nextToken.children.unshift(strongContent);
        nextToken.children.unshift(strongOpen);
        nextToken.children.unshift(strongBefore);
      }
    } else {
      //console.log('Processing(normal):: actualContNoStrong:' +  sc.actualContNoStrong + ', actualNameJoint: ' + sc.actualNameJoint)
      const lt_first = new state.Token('text', '', 0);
      const lt_span_open = new state.Token('span_open', 'span', 1);
      lt_span_open.attrJoin("class", "sc-" + semantics[sn].name + "-label");
      const lt_span_content = new state.Token('text', '', 0);
      lt_span_content.content = sc.actualName;
      const lt_span_close = new state.Token('span_close', 'span', -1);

      //console.log(nextToken.children[0].content + ', ac: "' + sc.actualContNoStrong + '"')
      if (sc.hasHalfJoint) {
        nextToken.children[0].content = ' ' + nextToken.children[0].content.replace(new RegExp('^' + sc.actualContNoStrong), '');
      } else {
        nextToken.children[0].content = nextToken.children[0].content.replace(new RegExp('^' + sc.actualContNoStrong), '');
      }

      nextToken.children.unshift(lt_span_close);
      nextToken.children.unshift(lt_span_content);
      nextToken.children.unshift(lt_span_open);
      nextToken.children.unshift(lt_first);
      nJump += 3;
    }


    // Add label joint span.
    const ljt_span_open = new state.Token('span_open', 'span', 1);
    ljt_span_open.attrJoin("class", "sc-" + semantics[sn].name + "-label-joint");
    const ljt_span_content = new state.Token('text', sc.actualNameJoint, 0);
    ljt_span_content.content = sc.actualNameJoint;
    const ljt_span_close = new state.Token('span_close', 'span', -1);

    nextToken.children.splice(3, 0, ljt_span_close);
    nextToken.children.splice(3, 0, ljt_span_content);
    nextToken.children.splice(3, 0, ljt_span_open);

    return nJump;
  };


  function semanticContainer (state, startLine, endLine, silent) {
    let n = 0;
    let cn = [];

    while (n < state.tokens.length) {
      //console.log(n + ', type:' + state.tokens[n].type + '", requireHrAtOneParagraph: ' + opt.requireHrAtOneParagraph + ' ==============');
      let sc = [];
      let sci = 0;
      let hrType = '';
      let alreadyChecked = false;
      let nJumps = [];

      const prevToken = state.tokens[n-1];
      const token = state.tokens[n];

      if (n === 0 || n === state.tokens.length -1) {
        if (!opt.requireHrAtOneParagraph && token.type === 'paragraph_open') {
          if(checkSematicContainerCore(state, n, hrType, sc, false)) {
            //console.log('set sc(n): '+ JSON.stringify(sc));
            nJumps.push(setSemanticContainer(state, n, hrType, sc[0], -1));
            n += nJumps[0];
            continue;
          }
        }
        n++;
        continue;
       }
      if (prevToken.type !== 'hr') {
        if (!opt.requireHrAtOneParagraph && token.type === 'paragraph_open') {
          cn.forEach(cni => {
            if (n === cni + 1) { alreadyChecked = true; }
          });
          if (alreadyChecked) { n++; continue; }
          //console.log('n:' + n + ', cn: ' + cn);

          if (state.tokens[n - 1].type === 'list_item_open') { n++; continue; }

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